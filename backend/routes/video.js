const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const { randomUUID } = require('crypto');
const { PassThrough } = require('stream');
const YTDlpWrap = require('yt-dlp-wrap').default;
const ffmpegPath = require('ffmpeg-static');

const router = express.Router();

// Binary stored in backend/bin/yt-dlp.exe
const BIN_DIR = path.join(__dirname, '..', 'bin');
const BIN_PATH = path.join(BIN_DIR, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

let ytDlp = null;
const downloadJobs = new Map();

const DOWNLOAD_JOB_TTL_MS = 15 * 60 * 1000;
const DOWNLOAD_PROGRESS_RE = /\[download\]\s+(\d+(?:\.\d+)?)%/i;
const YTDLP_COOKIE_FILE = String(process.env.YTDLP_COOKIE_FILE || '').trim();
const YTDLP_COOKIES_B64 = String(process.env.YTDLP_COOKIES_B64 || '').trim();
const YTDLP_COOKIES_TXT = String(process.env.YTDLP_COOKIES_TXT || '').trim();
const YTDLP_PLAYER_CLIENTS = String(process.env.YTDLP_PLAYER_CLIENTS || 'android,web').trim();

const YTDLP_COOKIE_TMP_FILE = path.join(os.tmpdir(), 'yt-dlp-cookies.txt');

const resolveYtDlpCookieFile = () => {
  if (YTDLP_COOKIE_FILE) {
    return YTDLP_COOKIE_FILE;
  }

  let cookieText = '';

  if (YTDLP_COOKIES_B64) {
    try {
      cookieText = Buffer.from(YTDLP_COOKIES_B64, 'base64').toString('utf8').trim();
    } catch (error) {
      console.error('[yt-dlp] invalid YTDLP_COOKIES_B64 value:', error.message);
    }
  }

  if (!cookieText && YTDLP_COOKIES_TXT) {
    cookieText = YTDLP_COOKIES_TXT.trim();
  }

  if (!cookieText) {
    return '';
  }

  try {
    fs.writeFileSync(YTDLP_COOKIE_TMP_FILE, cookieText, { encoding: 'utf8', mode: 0o600 });
    return YTDLP_COOKIE_TMP_FILE;
  } catch (error) {
    console.error('[yt-dlp] failed to write cookies file:', error.message);
    return '';
  }
};

const EFFECTIVE_YTDLP_COOKIE_FILE = resolveYtDlpCookieFile();

const isYoutubeBotCheckError = (value) => {
  const text = String(value || '').toLowerCase();
  return text.includes('sign in to confirm you') || text.includes('not a bot');
};

const withYtDlpRuntimeArgs = (args, { includeNoPlaylist = true } = {}) => {
  const finalArgs = Array.isArray(args) ? [...args] : [];

  if (includeNoPlaylist && !finalArgs.includes('--no-playlist')) {
    finalArgs.push('--no-playlist');
  }

  finalArgs.push('--extractor-args', `youtube:player_client=${YTDLP_PLAYER_CLIENTS}`);
  finalArgs.push('--js-runtimes', 'node');

  if (EFFECTIVE_YTDLP_COOKIE_FILE) {
    finalArgs.push('--cookies', EFFECTIVE_YTDLP_COOKIE_FILE);
  }

  return finalArgs;
};

async function getYtDlp() {
  if (ytDlp) return ytDlp;

  if (!fs.existsSync(BIN_DIR)) {
    fs.mkdirSync(BIN_DIR, { recursive: true });
  }

  if (!fs.existsSync(BIN_PATH)) {
    console.log('[yt-dlp] Downloading yt-dlp binary...');
    await YTDlpWrap.downloadFromGithub(BIN_PATH);
    console.log('[yt-dlp] Binary downloaded to', BIN_PATH);
  }

  ytDlp = new YTDlpWrap(BIN_PATH);
  return ytDlp;
}

const sanitizeFileName = (name) =>
  String(name || '')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const isValidYoutubeUrl = (url) =>
  /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(url);

/**
 * Remove playlist/index params so yt-dlp always receives a plain video URL.
 * Keeps: v, t (timestamp), start, end.
 * Strips: list, index, start_radio, ab_channel, feature, si, pp, etc.
 */
const KEEP_YT_PARAMS = new Set(['v', 't', 'start', 'end']);

const stripPlaylistParams = (rawUrl) => {
  try {
    const parsed = new URL(rawUrl);
    const toDelete = [];
    for (const key of parsed.searchParams.keys()) {
      if (!KEEP_YT_PARAMS.has(key)) {
        toDelete.push(key);
      }
    }
    for (const key of toDelete) {
      parsed.searchParams.delete(key);
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
};

// Map frontend format keys -> yt-dlp format strings
const FORMAT_MAP = {
  // Select best video (any container) + best m4a audio; ffmpeg merges into MP4.
  // Do NOT filter [ext=mp4] on the video stream – YouTube's highest-quality
  // streams are often VP9/WebM; restricting to mp4 silently picks a lower
  // resolution or lower-bitrate stream, causing the size mismatch in the UI.
  'mp4-best': 'bestvideo+bestaudio[ext=m4a]/bestvideo+bestaudio/best[vcodec!=none][acodec!=none]',
  mp3: 'bestaudio[ext=m4a]/bestaudio'
};

const getFormatExpression = (formatKey) => {
  if (FORMAT_MAP[formatKey]) {
    return FORMAT_MAP[formatKey];
  }

  const qualityMatch = /^mp4-(\d{3,4})$/i.exec(String(formatKey || '').trim());
  if (qualityMatch) {
    const height = Number(qualityMatch[1]);
    if (height > 0) {
      // Use exact height first so yt-dlp downloads the same stream whose
      // size is shown in the UI. [height<=N] can silently pick a lower
      // resolution stream with higher bitrate, causing the size mismatch.
      return [
        `bestvideo[height=${height}]+bestaudio[ext=m4a]`,
        `bestvideo[height=${height}]+bestaudio`,
        `bestvideo[height<=${height}]+bestaudio[ext=m4a]`,
        `bestvideo[height<=${height}]+bestaudio`,
        `best[height<=${height}][vcodec!=none][acodec!=none]`
      ].join('/');
    }
  }

  return FORMAT_MAP['mp4-best'];
};

const getStreamingFormatExpression = (formatKey) => {
  const normalized = String(formatKey || '').trim();

  if (normalized === 'mp3') {
    return FORMAT_MAP.mp3;
  }

  const qualityMatch = /^mp4-(\d{3,4})$/i.exec(normalized);
  if (qualityMatch) {
    const height = Number(qualityMatch[1]);
    if (height > 0) {
      return `best[height=${height}][acodec!=none]/best[height<=${height}][acodec!=none]/best[height<=${height}][vcodec!=none][acodec!=none]`;
    }
  }

  return 'best[vcodec!=none][acodec!=none]';
};

const parseInfoJson = (rawInfo) => {
  try {
    return JSON.parse(String(rawInfo || '{}'));
  } catch (_error) {
    return {};
  }
};

const getFormatSizeBytes = (format) => {
  const size = Number(format?.filesize || format?.filesize_approx || 0);
  return Number.isFinite(size) && size > 0 ? size : null;
};

/**
 * Mimic yt-dlp's built-in codec quality rank used by `bestvideo`.
 * Higher value = preferred by yt-dlp (AV1 > VP9 > H.264 etc.).
 */
const videoCodecQuality = (vcodec) => {
  const c = String(vcodec || '').toLowerCase();
  if (c.startsWith('av01') || c.startsWith('av1')) return 7;   // AV1
  if (c.startsWith('vp9') || c.startsWith('vp09')) return 5;   // VP9
  if (c.startsWith('vp8')) return 3;                            // VP8
  if (c.includes('hevc') || c.startsWith('hvc1') || c.startsWith('hev1')) return 4; // H.265
  if (c.startsWith('avc') || c.includes('h264') || c.startsWith('h.264')) return 2; // H.264
  return 1;                                                     // unknown
};

const TEMP_DOWNLOAD_DIR = path.join(os.tmpdir(), 'node-video-downloads');

const ensureTempDownloadDir = () => {
  if (!fs.existsSync(TEMP_DOWNLOAD_DIR)) {
    fs.mkdirSync(TEMP_DOWNLOAD_DIR, { recursive: true });
  }
};

const removeFileIfExists = (filePath) => {
  if (!filePath) {
    return;
  }

  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, () => undefined);
  }
};

const scheduleJobCleanup = (jobId, delayMs = DOWNLOAD_JOB_TTL_MS) => {
  const job = downloadJobs.get(jobId);
  if (!job) {
    return;
  }

  if (job.cleanupTimer) {
    clearTimeout(job.cleanupTimer);
  }

  job.cleanupTimer = setTimeout(() => {
    const latestJob = downloadJobs.get(jobId);
    if (!latestJob) {
      return;
    }

    if (latestJob.process && !latestJob.process.killed) {
      latestJob.process.kill();
    }

    removeFileIfExists(latestJob.filePath);
    downloadJobs.delete(jobId);
  }, delayMs);
};

const publicJobState = (job) => ({
  jobId: job.id,
  status: job.status,
  stage: job.stage,
  progressPercent: job.progressPercent,
  downloadedBytes: job.downloadedBytes,
  totalBytes: job.totalBytes,
  fileName: job.fileName,
  contentType: job.contentType,
  errorMessage: job.errorMessage || ''
});

const getJobById = (jobId) => downloadJobs.get(String(jobId || '').trim()) || null;

const findExistingJobFile = (job) => {
  if (job.filePath && fs.existsSync(job.filePath)) {
    return job.filePath;
  }

  return findDownloadedFile(job.downloadId, job.outputExt);
};

const updateJobStage = (job, nextStage) => {
  if (nextStage) {
    job.stage = nextStage;
  }
};

const updateJobProgressFromLine = (job, rawLine) => {
  const line = String(rawLine || '').trim();
  if (!line) {
    return;
  }

  job.lastOutputLine = line;

  const match = DOWNLOAD_PROGRESS_RE.exec(line);
  if (match) {
    const parsed = Number(match[1]);
    if (Number.isFinite(parsed)) {
      job.status = 'preparing';
      job.stage = 'Downloading from YouTube';
      job.progressPercent = Math.max(0, Math.min(99, Math.round(parsed)));

      if (job.totalBytes && job.totalBytes > 0) {
        job.downloadedBytes = Math.round((job.totalBytes * job.progressPercent) / 100);
      }
    }
    return;
  }

  if (/Destination:/i.test(line)) {
    updateJobStage(job, 'Preparing temporary file');
    return;
  }

  if (/Merging formats/i.test(line)) {
    job.progressPercent = Math.max(job.progressPercent, 99);
    updateJobStage(job, 'Merging audio and video');
    return;
  }

  if (/Extracting audio/i.test(line) || /Post-process/i.test(line)) {
    job.progressPercent = Math.max(job.progressPercent, 99);
    updateJobStage(job, 'Converting audio');
  }
};

const readProcessOutput = (stream, job) => {
  let pending = '';

  stream.on('data', (chunk) => {
    pending += String(chunk || '');
    const lines = pending.split(/\r?\n/);
    pending = lines.pop() || '';

    for (const line of lines) {
      updateJobProgressFromLine(job, line);
    }
  });

  stream.on('end', () => {
    if (pending) {
      updateJobProgressFromLine(job, pending);
    }
  });
};

const getRequestedFormatSize = (rawUrl, formatExpression) => {
  return getYtDlp().then((wrapper) =>
    wrapper.execPromise(
      withYtDlpRuntimeArgs([rawUrl, '--print', 'filesize_approx', '--no-playlist', '-f', formatExpression])
    )
  ).then((value) => {
    const parsed = Number.parseInt(String(value || '').trim(), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }).catch(() => null);
};

const resolveDownloadTitle = async (rawUrl, requestedName) => {
  if (requestedName) {
    return requestedName;
  }

  try {
    const wrapper = await getYtDlp();
    const titleResult = await wrapper.execPromise(
      withYtDlpRuntimeArgs([rawUrl, '--print', 'title', '--no-playlist'])
    );
    const clean = sanitizeFileName(String(titleResult || '').trim());
    return clean || 'youtube-video';
  } catch {
    return 'youtube-video';
  }
};

const createDownloadJob = async ({ rawUrl, requestedName, formatKey }) => {
  const cleanUrl = stripPlaylistParams(rawUrl);
  const formatExpression = getFormatExpression(formatKey);
  const isAudio = formatKey === 'mp3';
  const outputExt = isAudio ? 'mp3' : 'mp4';
  const contentType = isAudio ? 'audio/mpeg' : 'video/mp4';
  const title = await resolveDownloadTitle(cleanUrl, requestedName);
  const fileName = `${title}.${outputExt}`;
  const downloadId = randomUUID();
  const outputTemplate = path.join(TEMP_DOWNLOAD_DIR, `${downloadId}.%(ext)s`);
  const totalBytes = await getRequestedFormatSize(cleanUrl, formatExpression);

  ensureTempDownloadDir();

  const ytdlpArgs = isAudio
    ? [
        cleanUrl,
        '-f', formatExpression,
        '--no-playlist',
        '--newline',
        '-x',
        '--audio-format', 'mp3',
        '--ffmpeg-location', ffmpegPath,
        '-o', outputTemplate
      ]
    : [
        cleanUrl,
        '-f', formatExpression,
        '--no-playlist',
        '--newline',
        '--merge-output-format', 'mp4',
        '--ffmpeg-location', ffmpegPath,
        '-o', outputTemplate
      ];

  const job = {
    id: downloadId,
    downloadId,
    status: 'queued',
    stage: 'Queued',
    progressPercent: 0,
    downloadedBytes: 0,
    totalBytes,
    fileName,
    contentType,
    outputExt,
    filePath: '',
    errorMessage: '',
    cleanupTimer: null,
    process: null,
    lastOutputLine: ''
  };

  downloadJobs.set(job.id, job);
  scheduleJobCleanup(job.id);

  const child = spawn(BIN_PATH, withYtDlpRuntimeArgs(ytdlpArgs), {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  job.process = child;
  job.status = 'preparing';
  job.stage = 'Starting download';

  readProcessOutput(child.stdout, job);
  readProcessOutput(child.stderr, job);

  child.on('error', (error) => {
    job.status = 'failed';
    job.stage = 'Failed';
    job.errorMessage = error.message || 'Failed to start yt-dlp';
    scheduleJobCleanup(job.id, 5 * 60 * 1000);
  });

  child.on('close', (code) => {
    job.process = null;

    if (code !== 0) {
      job.status = 'failed';
      job.stage = 'Failed';
      job.errorMessage = job.lastOutputLine || 'yt-dlp failed to download the file';
      scheduleJobCleanup(job.id, 5 * 60 * 1000);
      return;
    }

    const downloadedFile = findExistingJobFile(job);
    if (!downloadedFile) {
      job.status = 'failed';
      job.stage = 'Failed';
      job.errorMessage = 'Download finished, but no output file was created';
      scheduleJobCleanup(job.id, 5 * 60 * 1000);
      return;
    }

    const stats = fs.statSync(downloadedFile);
    if (!stats.size) {
      job.status = 'failed';
      job.stage = 'Failed';
      job.errorMessage = 'Downloaded file is empty';
      removeFileIfExists(downloadedFile);
      scheduleJobCleanup(job.id, 5 * 60 * 1000);
      return;
    }

    job.filePath = downloadedFile;
    job.totalBytes = stats.size;
    job.downloadedBytes = stats.size;
    job.progressPercent = 100;
    job.status = 'ready';
    job.stage = 'Ready to save';
    scheduleJobCleanup(job.id);
  });

  return job;
};

const findDownloadedFile = (baseName, outputExt) => {
  ensureTempDownloadDir();

  const prefix = `${baseName}.`;
  const matches = fs
    .readdirSync(TEMP_DOWNLOAD_DIR)
    .filter((entry) => entry.startsWith(prefix))
    .sort((left, right) => {
      const leftPath = path.join(TEMP_DOWNLOAD_DIR, left);
      const rightPath = path.join(TEMP_DOWNLOAD_DIR, right);
      return fs.statSync(rightPath).mtimeMs - fs.statSync(leftPath).mtimeMs;
    });

  if (!matches.length) {
    return null;
  }

  const expected = matches.find((entry) => entry.toLowerCase().endsWith(`.${outputExt}`));
  return path.join(TEMP_DOWNLOAD_DIR, expected || matches[0]);
};

const getQualityOptions = (info) => {
  const formats = Array.isArray(info?.formats) ? info.formats : [];

  // Video-only adaptive streams — acodec must be 'none' (or absent) so we
  // mirror exactly what yt-dlp's `bestvideo` operator considers. Progressive
  // streams (acodec != 'none') are excluded because their filesize includes
  // embedded audio, which would inflate the size estimate vs. actual downloads.
  const videoFormats = formats.filter(
    (item) =>
      item &&
      item.vcodec &&
      item.vcodec !== 'none' &&
      Number(item.height || 0) > 0 &&
      (!item.acodec || item.acodec === 'none')
  );

  const audioFormats = formats.filter(
    (item) => item && item.acodec && item.acodec !== 'none' && (!item.vcodec || item.vcodec === 'none')
  );

  // Best standalone audio stream (m4a preferred, matches download selector).
  const bestAudio = audioFormats.length > 0
    ? [...audioFormats]
        .sort((a, b) => {
          const aIsM4a = String(a.ext || '').toLowerCase() === 'm4a' ? 1 : 0;
          const bIsM4a = String(b.ext || '').toLowerCase() === 'm4a' ? 1 : 0;
          return bIsM4a - aIsM4a || Number(b.abr || b.tbr || 0) - Number(a.abr || a.tbr || 0);
        })[0]
    : null;
  const bestAudioBytes = getFormatSizeBytes(bestAudio);

  // Combine video + audio bytes for a realistic total size.
  const combinedBytes = (videoBytes) => {
    const v = Number(videoBytes || 0);
    const a = Number(bestAudioBytes || 0);
    return v > 0 || a > 0 ? v + a : null;
  };

  const heights = Array.from(
    new Set(
      videoFormats
        .map((item) => Number(item.height || 0))
        .filter((height) => Number.isFinite(height) && height >= 144 && height <= 1080)
    )
  ).sort((a, b) => b - a);

  const qualityOptions = [];

  if (videoFormats.length > 0) {
    // Best overall: highest codec-quality rank, then highest bitrate.
    // This mirrors yt-dlp's `bestvideo` selection (AV1 > VP9 > H.264).
    const bestVideo = [...videoFormats].sort(
      (a, b) =>
        Number(b.height || 0) - Number(a.height || 0) ||
        videoCodecQuality(b.vcodec) - videoCodecQuality(a.vcodec) ||
        Number(b.tbr || b.vbr || 0) - Number(a.tbr || a.vbr || 0)
    )[0];

    qualityOptions.push({
      key: 'mp4-best',
      label: 'Best Quality',
      group: 'video',
      sizeBytes: combinedBytes(getFormatSizeBytes(bestVideo))
    });

    for (const height of heights) {
      // Best video at this exact height: codec-quality rank first, then bitrate.
      const bestAtHeight = videoFormats
        .filter((item) => Number(item.height || 0) === height)
        .sort(
          (a, b) =>
            videoCodecQuality(b.vcodec) - videoCodecQuality(a.vcodec) ||
            Number(b.tbr || b.vbr || 0) - Number(a.tbr || a.vbr || 0)
        )[0];

      qualityOptions.push({
        key: `mp4-${height}`,
        label: `${height}p`,
        group: 'video',
        sizeBytes: combinedBytes(getFormatSizeBytes(bestAtHeight))
      });
    }
  }

  if (audioFormats.length > 0) {
    const bestAudio = [...audioFormats].sort((a, b) => Number(b.abr || 0) - Number(a.abr || 0))[0];
    qualityOptions.push({
      key: 'mp3',
      label: 'MP3 Audio',
      group: 'audio',
      sizeBytes: getFormatSizeBytes(bestAudio)
    });
  }

  return qualityOptions;
};

router.get('/info', async (req, res) => {
  const rawUrl = String(req.query.url || '').trim();

  if (!rawUrl) {
    return res.status(400).json({ message: 'Query param "url" is required' });
  }

  if (!isValidYoutubeUrl(rawUrl)) {
    return res.status(400).json({ message: 'Please provide a valid YouTube URL' });
  }

  const cleanUrl = stripPlaylistParams(rawUrl);

  try {
    const wrapper = await getYtDlp();
    const rawInfo = await wrapper.execPromise(
      withYtDlpRuntimeArgs([cleanUrl, '--dump-single-json', '--no-playlist'])
    );
    const info = parseInfoJson(rawInfo);

    const title = sanitizeFileName(info.title || 'youtube-video') || 'youtube-video';
    const thumbnail = String(info.thumbnail || '');
    const durationSeconds = Number(info.duration || 0);
    const qualityOptions = getQualityOptions(info);

    if (!qualityOptions.length) {
      return res.status(422).json({ message: 'No downloadable formats available for this video' });
    }

    return res.json({
      title,
      thumbnail,
      durationSeconds,
      qualityOptions,
      availableFormats: qualityOptions.map((item) => item.key)
    });
  } catch (error) {
    const msg = (error instanceof Error ? error.message : String(error || '')) || 'Failed to fetch video info';
    console.error('[yt-dlp] info error:', msg);
    if (!res.headersSent) {
      if (isYoutubeBotCheckError(msg)) {
        return res.status(503).json({
          message: 'YouTube is rate-limiting this server. Add YTDLP_COOKIES_B64 (or YTDLP_COOKIES_TXT) on Render and redeploy.'
        });
      }
      return res.status(422).json({ message: msg });
    }
  }
});

router.post('/download-jobs', async (req, res) => {
  const rawUrl = String(req.body?.url || '').trim();
  const requestedName = sanitizeFileName(req.body?.filename || '');
  const formatKey = String(req.body?.format || 'mp4-best').trim();

  if (!rawUrl) {
    return res.status(400).json({ message: 'Body field "url" is required' });
  }

  if (!isValidYoutubeUrl(rawUrl)) {
    return res.status(400).json({ message: 'Please provide a valid YouTube URL' });
  }

  try {
    const job = await createDownloadJob({ rawUrl, requestedName, formatKey });
    return res.status(202).json(publicJobState(job));
  } catch (error) {
    const msg = error?.message || 'Failed to start download job';
    console.error('[yt-dlp] job create error:', msg);
    if (isYoutubeBotCheckError(msg)) {
      return res.status(503).json({
        message: 'YouTube is rate-limiting this server. Add YTDLP_COOKIES_B64 (or YTDLP_COOKIES_TXT) on Render and redeploy.'
      });
    }
    return res.status(422).json({ message: msg });
  }
});

router.get('/download-jobs/:jobId', (req, res) => {
  const job = getJobById(req.params.jobId);
  if (!job) {
    return res.status(404).json({ message: 'Download job not found' });
  }

  return res.json(publicJobState(job));
});

router.get('/download-jobs/:jobId/file', (req, res) => {
  const job = getJobById(req.params.jobId);
  if (!job) {
    return res.status(404).json({ message: 'Download job not found' });
  }

  if (job.status !== 'ready') {
    return res.status(409).json({ message: 'Download is not ready yet' });
  }

  const downloadedFile = findExistingJobFile(job);
  if (!downloadedFile) {
    job.status = 'failed';
    job.stage = 'Failed';
    job.errorMessage = 'Prepared file could not be found';
    return res.status(410).json({ message: job.errorMessage });
  }

  const stats = fs.statSync(downloadedFile);
  if (!stats.size) {
    job.status = 'failed';
    job.stage = 'Failed';
    job.errorMessage = 'Prepared file is empty';
    removeFileIfExists(downloadedFile);
    return res.status(410).json({ message: job.errorMessage });
  }

  job.filePath = downloadedFile;
  res.setHeader('Content-Type', job.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${job.fileName}"`);
  res.setHeader('Content-Length', stats.size);
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, Content-Length');

  const fileStream = fs.createReadStream(downloadedFile);
  let cleanedUp = false;

  const cleanup = () => {
    if (cleanedUp) {
      return;
    }

    cleanedUp = true;
    removeFileIfExists(downloadedFile);
    downloadJobs.delete(job.id);
  };

  fileStream.on('error', (error) => {
    console.error('[yt-dlp] stream error:', error.message);
    if (!res.headersSent) {
      res.status(422).json({ message: error.message || 'Unable to stream this file' });
    } else {
      res.end();
    }

    cleanup();
  });

  req.on('close', cleanup);
  res.on('finish', cleanup);
  res.on('close', cleanup);

  fileStream.pipe(res);
  return undefined;
});

router.get('/download', async (req, res) => {
  const rawUrl = String(req.query.url || '').trim();
  const requestedName = sanitizeFileName(req.query.filename || 'youtube-video');
  const formatKey = String(req.query.format || 'mp4-best').trim();

  if (!rawUrl) {
    return res.status(400).json({ message: 'Query param "url" is required' });
  }

  if (!isValidYoutubeUrl(rawUrl)) {
    return res.status(400).json({ message: 'Please provide a valid YouTube URL' });
  }

  const cleanUrl = stripPlaylistParams(rawUrl);

  const FORMAT = getFormatExpression(formatKey);
  const STREAM_FORMAT = getStreamingFormatExpression(formatKey);
  const isAudio = formatKey === 'mp3';
  const outputExt = isAudio ? 'mp3' : 'mp4';
  const contentType = isAudio ? 'audio/mpeg' : 'video/mp4';

  try {
    const wrapper = await getYtDlp();

    const [titleResult] = await Promise.allSettled([
      wrapper.execPromise(withYtDlpRuntimeArgs([cleanUrl, '--print', 'title', '--no-playlist']))
    ]);

    let title = requestedName;
    if (!title && titleResult.status === 'fulfilled') {
      const clean = sanitizeFileName(titleResult.value.trim());
      if (clean) title = clean;
    }
    title = title || 'youtube-video';

    const finalFileName = `${title}.${outputExt}`;
    const estimatedSize = await getRequestedFormatSize(cleanUrl, isAudio ? FORMAT : STREAM_FORMAT);
    const allowDirectStream = !isAudio && formatKey === 'mp4-best';

    if (allowDirectStream) {
      const ytdlpArgs = [
        cleanUrl,
        '-f', STREAM_FORMAT,
        '--no-playlist',
        '--newline',
        '-o', '-'
      ];

      const child = spawn(BIN_PATH, withYtDlpRuntimeArgs(ytdlpArgs), {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      const passThrough = new PassThrough();
      let started = false;
      let lastLine = '';

      const sendHeadersIfNeeded = () => {
        if (started) {
          return;
        }

        started = true;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${finalFileName}"`);
        if (estimatedSize) {
          res.setHeader('X-Estimated-Size', String(estimatedSize));
        }
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, Content-Length, X-Estimated-Size');
        passThrough.pipe(res);
      };

      readProcessOutput(child.stderr, {
        status: 'preparing',
        stage: 'Downloading from YouTube',
        progressPercent: 0,
        downloadedBytes: 0,
        totalBytes: estimatedSize,
        lastOutputLine: '',
        set lastOutputLine(value) {
          lastLine = value;
        },
        get lastOutputLine() {
          return lastLine;
        }
      });

      child.stdout.on('data', (chunk) => {
        sendHeadersIfNeeded();
        passThrough.write(chunk);
      });

      child.stdout.on('end', () => {
        sendHeadersIfNeeded();
        passThrough.end();
      });

      child.on('error', (error) => {
        console.error('[yt-dlp] stream start error:', error.message);
        if (!res.headersSent) {
          res.status(422).json({ message: error.message || 'Unable to start video stream' });
          return;
        }
        passThrough.destroy(error);
      });

      child.on('close', (code) => {
        if (code === 0) {
          return;
        }

        const errorMessage = lastLine || 'Failed to stream this video';
        console.error('[yt-dlp] stream close error:', errorMessage);

        if (!started && !res.headersSent) {
          res.status(422).json({ message: errorMessage });
          return;
        }

        passThrough.destroy(new Error(errorMessage));
      });

      req.on('close', () => {
        if (!child.killed) {
          child.kill();
        }
      });

      res.on('close', () => {
        if (!child.killed) {
          child.kill();
        }
      });

      return undefined;
    }

    const downloadId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const outputTemplate = path.join(TEMP_DOWNLOAD_DIR, `${downloadId}.%(ext)s`);

    ensureTempDownloadDir();

    const ytdlpArgs = isAudio
      ? [
          cleanUrl,
          '-f', FORMAT,
          '--no-playlist',
          '-x',
          '--audio-format', 'mp3',
          '--ffmpeg-location', ffmpegPath,
          '-o', outputTemplate
        ]
      : [
          cleanUrl,
          '-f', FORMAT,
          '--no-playlist',
          '--merge-output-format', 'mp4',
          '--ffmpeg-location', ffmpegPath,
          '-o', outputTemplate
        ];

    await wrapper.execPromise(withYtDlpRuntimeArgs(ytdlpArgs));

    const downloadedFile = findDownloadedFile(downloadId, outputExt);
    if (!downloadedFile) {
      return res.status(500).json({ message: 'Download finished, but no output file was created' });
    }

    const stats = fs.statSync(downloadedFile);
    const contentLength = stats.size > 0 ? stats.size : null;
    if (!contentLength) {
      return res.status(500).json({ message: 'Downloaded file is empty' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${finalFileName}"`);
    res.setHeader('Content-Length', contentLength);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, Content-Length');

    const fileStream = fs.createReadStream(downloadedFile);
    let cleanedUp = false;

    const cleanup = () => {
      if (cleanedUp) {
        return;
      }

      cleanedUp = true;
      removeFileIfExists(downloadedFile);
    };

    req.on('close', cleanup);

    fileStream.on('error', (error) => {
      console.error('[yt-dlp] stream error:', error.message);
      if (!res.headersSent) {
        res.status(422).json({ message: error.message || 'Unable to download this video' });
      } else {
        res.end();
      }

      cleanup();
    });

    res.on('finish', cleanup);
    res.on('close', cleanup);

    fileStream.pipe(res);
    return undefined;
  } catch (error) {
    console.error('[yt-dlp] error:', error.message);
    if (!res.headersSent) {
      return res.status(422).json({ message: error.message || 'Failed to download video' });
    }
  }
});

module.exports = router;