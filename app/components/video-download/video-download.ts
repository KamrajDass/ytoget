import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse, HttpEventType, HttpResponse } from '@angular/common/http';
import { VideoDownloadService } from '../../services/video-download';

export interface FormatOption {
  key: string;
  label: string;
  icon: string;
  group: 'video' | 'audio';
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
  isDownloading = false;
  errorMessage = '';
  successMessage = '';
  selectedFormat = 'mp4-best';

  readonly formatOptions: FormatOption[] = [
    { key: 'mp4-best', label: 'Best Quality', icon: '🎬', group: 'video' },
    { key: 'mp4-1080', label: '1080p HD',     icon: '🔵', group: 'video' },
    { key: 'mp4-720',  label: '720p HD',      icon: '🟢', group: 'video' },
    { key: 'mp4-480',  label: '480p SD',      icon: '🟡', group: 'video' },
    { key: 'mp3',      label: 'MP3 Audio',    icon: '🎵', group: 'audio' },
  ];

  /** 0–100 when total size is known, null when streaming without Content-Length */
  progressPercent: number | null = null;
  downloadedBytes = 0;
  totalBytes: number | null = null;

  constructor(private videoDownloadService: VideoDownloadService) {}

  get downloadedMB(): string {
    return (this.downloadedBytes / (1024 * 1024)).toFixed(1);
  }

  get totalMB(): string {
    return this.totalBytes ? (this.totalBytes / (1024 * 1024)).toFixed(1) : '';
  }

  submit(): void {
    const trimmedUrl = this.videoUrl.trim();

    if (!trimmedUrl) {
      this.errorMessage = 'Please enter a YouTube video URL.';
      return;
    }

    this.isDownloading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.progressPercent = null;
    this.downloadedBytes = 0;
    this.totalBytes = null;

    this.videoDownloadService.downloadVideo(trimmedUrl, this.fileName, this.selectedFormat).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.DownloadProgress) {
          this.downloadedBytes = event.loaded;
          if (event.total) {
            this.totalBytes = event.total;
            this.progressPercent = Math.round((event.loaded / event.total) * 100);
          } else {
            this.progressPercent = null;
          }
        } else if (event.type === HttpEventType.Response) {
          const response = event as HttpResponse<Blob>;
          const blob = response.body;

          if (!blob) {
            this.errorMessage = 'No video data returned from server.';
            this.isDownloading = false;
            return;
          }

          const fileNameFromHeader = this.getFileNameFromHeader(
            response.headers.get('Content-Disposition')
          );
          const finalName = fileNameFromHeader || `${this.fileName || 'youtube-video'}.mp4`;

          const url = window.URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = finalName;
          anchor.click();
          anchor.remove();
          window.URL.revokeObjectURL(url);

          this.progressPercent = 100;
          this.successMessage = `"${finalName}" downloaded successfully!`;
          this.isDownloading = false;
        }
      },
      error: (error: HttpErrorResponse) => {
        if (error.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const json = JSON.parse(reader.result as string);
              this.errorMessage = json.message || 'Unable to download video.';
            } catch {
              this.errorMessage = 'Unable to download video. Please try another YouTube URL.';
            }
            this.isDownloading = false;
          };
          reader.readAsText(error.error);
        } else {
          this.errorMessage =
            typeof error.error?.message === 'string'
              ? error.error.message
              : 'Unable to download video. Please try another YouTube URL.';
          this.isDownloading = false;
        }
      }
    });
  }

  private getFileNameFromHeader(contentDisposition: string | null): string | null {
    if (!contentDisposition) return null;
    const match = /filename="?([^";]+)"?/i.exec(contentDisposition);
    return match?.[1] || null;
  }
}
