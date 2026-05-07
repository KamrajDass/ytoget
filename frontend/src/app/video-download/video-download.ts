import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  VideoDownloadService,
  VideoInfoResponse,
  DownloadJobResponse
} from '../services/video-download';

export interface FormatOption {
  key: string;
  label: string;
  icon: string;
  group: 'video' | 'audio';
  sizeBytes?: number | null;
}

@Component({
  selector: 'app-video-download',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './video-download.html',
  styleUrl: './video-download.css'
})
export class VideoDownload {
  videoUrl = '';
  fileName = 'youtube-video';
  lastFetchedUrl = '';
  isFetchingInfo = false;
  isDownloading = false;
  errorMessage = '';
  successMessage = '';
  selectedFormat = 'mp4-best';
  thumbnailUrl = '';
  videoTitle = '';
  durationSeconds = 0;
  infoLoaded = false;
  availableFormatKeys: string[] = [];
  formatOptions: FormatOption[] = [];

  /** 0–100 when total size is known, null when streaming without Content-Length */
  progressPercent: number | null = null;
  downloadedBytes = 0;
  totalBytes: number | null = null;
  progressStage = '';
  private destroyRequested = false;

  constructor(
    private videoDownloadService: VideoDownloadService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnDestroy(): void {
    this.destroyRequested = true;
  }

  get downloadedSizeLabel(): string {
    return this.formatBytes(this.downloadedBytes);
  }

  get totalSizeLabel(): string {
    return this.totalBytes ? this.formatBytes(this.totalBytes) : '';
  }

  get hasReceivedDownloadData(): boolean {
    return this.downloadedBytes > 0;
  }

  get showDeterminateProgress(): boolean {
    return this.progressPercent !== null;
  }

  get progressHeaderLabel(): string {
    return 'Starting download';
  }

  get progressTransferLabel(): string {
    if (this.totalBytes && this.hasReceivedDownloadData) {
      return `Downloading... ${this.downloadedSizeLabel} / ${this.totalSizeLabel} received`;
    }

    if (this.hasReceivedDownloadData) {
      return `Downloading... ${this.downloadedSizeLabel} received`;
    }

    return 'Preparing download stream... 0 B received';
  }

  get progressStatusLabel(): string {
    if (this.progressStage === 'Completed') {
      return 'Download completed';
    }

    if (this.progressStage) {
      return this.progressStage;
    }

    return 'Preparing download...';
  }

  get durationLabel(): string {
    const total = Math.max(0, Number(this.durationSeconds || 0));
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  get videoFormatOptions(): FormatOption[] {
    const source = this.formatOptions.length > 0
      ? this.formatOptions
      : this.availableFormatKeys.map((key) => this.toFormatOption(key));
    return source.filter((opt) => opt.group === 'video');
  }

  get audioFormatOptions(): FormatOption[] {
    const source = this.formatOptions.length > 0
      ? this.formatOptions
      : this.availableFormatKeys.map((key) => this.toFormatOption(key));
    return source.filter((opt) => opt.group === 'audio');
  }

  get selectedFileExtension(): string {
    return this.selectedFormat === 'mp3' ? 'mp3' : 'mp4';
  }

  get selectedFormatOption(): FormatOption | null {
    return this.formatOptions.find((option) => option.key === this.selectedFormat) || null;
  }

  formatSizeLabel(sizeBytes?: number | null): string {
    const size = Number(sizeBytes || 0);
    if (!Number.isFinite(size) || size <= 0) {
      return '';
    }

    const mb = size / (1024 * 1024);
    if (mb < 1024) {
      return `${mb.toFixed(1)} MB`;
    }

    return `${(mb / 1024).toFixed(2)} GB`;
  }

  isFormatAvailable(formatKey: string): boolean {
    return this.availableFormatKeys.includes(formatKey);
  }

  onUrlChange(): void {
    this.infoLoaded = false;
    this.lastFetchedUrl = '';
    this.thumbnailUrl = '';
    this.videoTitle = '';
    this.durationSeconds = 0;
    this.availableFormatKeys = [];
    this.formatOptions = [];
    this.successMessage = '';
    this.errorMessage = '';
    this.progressStage = '';
  }

  private normalizeYoutubeUrl(rawValue: string): string {
    const input = String(rawValue || '').trim();
    if (!input) {
      return '';
    }

    try {
      const parsed = new URL(input);
      const host = parsed.hostname.toLowerCase();
      const isYoutubeHost =
        host === 'youtube.com' ||
        host === 'www.youtube.com' ||
        host === 'm.youtube.com' ||
        host === 'youtu.be';

      if (!isYoutubeHost) {
        return input;
      }

      // Keep only video-specific params and drop playlist/marketing params.
      const keepParams = new Set(['v', 't', 'start', 'end']);
      const nextParams = new URLSearchParams();
      const videoId = host === 'youtu.be'
        ? parsed.pathname.replace(/^\/+/, '').split('/')[0]
        : parsed.searchParams.get('v') || '';

      if (videoId) {
        nextParams.set('v', videoId);
      }

      for (const key of keepParams) {
        if (key === 'v') {
          continue;
        }

        const value = parsed.searchParams.get(key);
        if (value) {
          nextParams.set(key, value);
        }
      }

      return `https://www.youtube.com/watch?${nextParams.toString()}`;
    } catch {
      return input;
    }
  }

  fetchVideoInfo(): void {
    const normalizedUrl = this.normalizeYoutubeUrl(this.videoUrl);
    if (!normalizedUrl) {
      this.errorMessage = 'Please enter a YouTube video URL.';
      return;
    }

    this.videoUrl = normalizedUrl;

    this.isFetchingInfo = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.videoDownloadService.getVideoInfo(normalizedUrl).subscribe({
      next: (info: VideoInfoResponse) => {
        this.thumbnailUrl = info.thumbnail || '';
        this.videoTitle = info.title || 'youtube-video';
        this.durationSeconds = Number(info.durationSeconds || 0);
        this.formatOptions = this.buildFormatOptions(info);
        this.availableFormatKeys = Array.isArray(info.availableFormats) ? info.availableFormats : [];
        this.infoLoaded = this.availableFormatKeys.length > 0;
        this.lastFetchedUrl = normalizedUrl;

        // Keep file name in sync only when user still uses default
        if (!this.fileName || this.fileName === 'youtube-video') {
          this.fileName = this.videoTitle || 'youtube-video';
        }

        if (!this.isFormatAvailable(this.selectedFormat)) {
          this.selectedFormat = this.availableFormatKeys[0] || 'mp4-best';
        }

        if (!this.infoLoaded) {
          this.errorMessage = 'No downloadable formats found for this video.';
        }

        this.isFetchingInfo = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage =
          typeof error.error?.message === 'string'
            ? error.error.message
            : 'Unable to fetch video info. Please check the URL and try again.';
        this.infoLoaded = false;
        this.isFetchingInfo = false;
      }
    });
  }

  private buildFormatOptions(info: VideoInfoResponse): FormatOption[] {
    const fromQualityOptions: FormatOption[] = Array.isArray(info.qualityOptions)
      ? info.qualityOptions
          .map<FormatOption>((item) => ({
            key: String(item?.key || ''),
            label: String(item?.label || ''),
            icon: item?.group === 'audio' ? 'A' : 'V',
            group: item?.group === 'audio' ? 'audio' : 'video',
            sizeBytes: Number(item?.sizeBytes || 0) || null
          }))
          .filter((item) => item.key && item.label)
      : [];

    if (fromQualityOptions.length > 0) {
      return fromQualityOptions;
    }

    // Backward-compat fallback for older backend response that only has availableFormats.
    const keys = Array.isArray(info.availableFormats) ? info.availableFormats : [];
    return keys.map((key) => this.toFormatOption(key));
  }

  private toFormatOption(key: string): FormatOption {
    const formatKey = String(key || '').trim();
    if (formatKey === 'mp4-best') {
      return { key: formatKey, label: 'Best Quality', icon: 'V', group: 'video', sizeBytes: null };
    }
    if (formatKey === 'mp3') {
      return { key: formatKey, label: 'MP3 Audio', icon: 'A', group: 'audio', sizeBytes: null };
    }

    const match = /^mp4-(\d{3,4})$/i.exec(formatKey);
    if (match) {
      return { key: formatKey, label: `${match[1]}p`, icon: 'V', group: 'video', sizeBytes: null };
    }

    return { key: formatKey, label: formatKey, icon: 'V', group: 'video', sizeBytes: null };
  }

  async submit(): Promise<void> {
    const trimmedUrl = this.normalizeYoutubeUrl(this.videoUrl);

    if (!trimmedUrl) {
      this.errorMessage = 'Please enter a YouTube video URL.';
      return;
    }

    this.videoUrl = trimmedUrl;

    if (!this.infoLoaded || this.lastFetchedUrl !== trimmedUrl) {
      this.errorMessage = 'Please fetch video info first, then download.';
      return;
    }

    if (!this.isFormatAvailable(this.selectedFormat)) {
      this.errorMessage = 'Selected format is not available for this video.';
      return;
    }

    this.isDownloading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.progressPercent = null;
    this.downloadedBytes = 0;
    this.totalBytes = null;
    this.progressStage = 'Preparing download...';

    const finalName = `${this.fileName || 'youtube-video'}.${this.selectedFileExtension}`;

    try {
      this.successMessage = 'Starting download...';
      this.cdr.markForCheck();
      const initialJob = await firstValueFrom(
        this.videoDownloadService.createDownloadJob({
          url: trimmedUrl,
          filename: this.fileName,
          format: this.selectedFormat
        })
      );

      this.applyJobProgress(initialJob);
      const readyJob = await this.waitForJobReady(initialJob.jobId);
      await this.downloadPreparedFile(readyJob.jobId, finalName);
      this.progressPercent = 100;
      this.progressStage = 'Completed';
      this.successMessage = `"${finalName}" downloaded successfully!`;
      this.cdr.markForCheck();
    } catch (error) {
      this.errorMessage = this.toDownloadErrorMessage(error);
      this.cdr.markForCheck();
    } finally {
      this.isDownloading = false;
      this.cdr.markForCheck();
    }
  }

  private applyJobProgress(job: DownloadJobResponse): void {
    this.runUiUpdate(() => {
      this.progressStage = job.stage || 'Preparing download...';
      this.progressPercent = typeof job.progressPercent === 'number'
        ? Math.max(0, Math.min(100, Math.round(job.progressPercent)))
        : null;
      this.downloadedBytes = Number(job.downloadedBytes || 0);

      const parsedTotal = Number(job.totalBytes || 0);
      this.totalBytes = Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : null;

      if (this.totalBytes && this.progressPercent !== null) {
        const inferredBytes = Math.round((this.totalBytes * this.progressPercent) / 100);
        if (inferredBytes > this.downloadedBytes) {
          this.downloadedBytes = inferredBytes;
        }
      }
    });
  }

  private async waitForJobReady(jobId: string): Promise<DownloadJobResponse> {
    while (!this.destroyRequested) {
      const job = await firstValueFrom(this.videoDownloadService.getDownloadJob(jobId));
      this.applyJobProgress(job);

      if (job.status === 'failed') {
        throw new Error(job.errorMessage || 'Video preparation failed. Please try another URL.');
      }

      if (job.status === 'ready') {
        return job;
      }

      await this.waitMs(700);
    }

    throw new Error('Download cancelled because the page was closed.');
  }

  private waitMs(ms: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  private async downloadPreparedFile(jobId: string, suggestedFileName: string): Promise<void> {
    const downloadUrl = this.videoDownloadService.buildDownloadJobFileUrl(jobId);

    try {
      const response = await fetch(downloadUrl, {
        method: 'GET',
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(await this.readErrorResponse(response));
      }

      this.runUiUpdate(() => {
        this.progressStage = 'Saving file to your device...';
      });
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Browser could not read the download stream.');
      }

      const headerFileName = this.getFileNameFromHeader(response.headers.get('Content-Disposition'));
      const finalFileName = headerFileName || suggestedFileName;
      const totalHeader = response.headers.get('Content-Length');
      const estimatedHeader = response.headers.get('X-Estimated-Size');
      const parsedTotal = totalHeader ? Number(totalHeader) : 0;
      const parsedEstimated = estimatedHeader ? Number(estimatedHeader) : 0;
      this.runUiUpdate(() => {
        this.totalBytes = Number.isFinite(parsedTotal) && parsedTotal > 0
          ? parsedTotal
          : Number.isFinite(parsedEstimated) && parsedEstimated > 0
            ? parsedEstimated
            : null;
        this.downloadedBytes = 0;
        this.progressPercent = this.totalBytes ? 0 : null;
      });

      const chunks: ArrayBuffer[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        if (!value) {
          continue;
        }

        this.runUiUpdate(() => {
          this.downloadedBytes += value.byteLength;
          if (this.totalBytes) {
            const savePercent = Math.round((this.downloadedBytes / this.totalBytes) * 100);
            this.progressPercent = Math.max(0, Math.min(100, savePercent));
          } else {
            this.progressPercent = null;
          }
        });

        const chunkBuffer = new ArrayBuffer(value.byteLength);
        new Uint8Array(chunkBuffer).set(value);
        chunks.push(chunkBuffer);
      }

      const blob = new Blob(chunks, {
        type: response.headers.get('Content-Type') || 'application/octet-stream'
      });
      this.saveBlobToDisk(blob, finalFileName);
    } catch (error) {
      throw error;
    }
  }

  private saveBlobToDisk(blob: Blob, fileName: string): void {
    const objectUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    window.setTimeout(() => {
      window.URL.revokeObjectURL(objectUrl);
    }, 30000);
  }

  private getFileNameFromHeader(contentDisposition: string | null): string | null {
    if (!contentDisposition) {
      return null;
    }

    const match = /filename="?([^";]+)"?/i.exec(contentDisposition);
    return match?.[1] || null;
  }

  private async readErrorResponse(response: Response): Promise<string> {
    const rawText = await response.text();

    try {
      const parsed = JSON.parse(rawText) as { message?: string };
      if (typeof parsed.message === 'string' && parsed.message) {
        return parsed.message;
      }
    } catch {
      // Ignore JSON parse failures and fall back to raw text.
    }

    return rawText || 'Unable to download video. Please try another YouTube URL.';
  }

  private toDownloadErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'Unable to download video. Please try another YouTube URL.';
  }

  private formatBytes(bytes: number | null | undefined): string {
    const size = Number(bytes || 0);
    if (!Number.isFinite(size) || size <= 0) {
      return '0 B';
    }

    if (size < 1024) {
      return `${Math.round(size)} B`;
    }

    const kb = size / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }

    const mb = kb / 1024;
    if (mb < 1024) {
      return `${mb.toFixed(2)} MB`;
    }

    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  }

  private runUiUpdate(update: () => void): void {
    this.ngZone.run(() => {
      update();
      this.cdr.detectChanges();
    });
  }
}
