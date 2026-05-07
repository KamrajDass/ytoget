import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface VideoInfoResponse {
  title: string;
  thumbnail: string;
  durationSeconds: number;
  qualityOptions: Array<{
    key: string;
    label: string;
    group: 'video' | 'audio';
    sizeBytes?: number | null;
  }>;
  availableFormats: string[];
}

export interface DownloadJobResponse {
  jobId: string;
  status: 'queued' | 'preparing' | 'ready' | 'failed';
  stage: string;
  progressPercent: number | null;
  downloadedBytes: number;
  totalBytes: number | null;
  fileName: string;
  contentType: string;
  errorMessage: string;
}

export interface CreateDownloadJobPayload {
  url: string;
  filename?: string;
  format?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VideoDownloadService {
  private readonly baseUrl = '/api/video';

  constructor(private http: HttpClient) {}

  getVideoInfo(url: string): Observable<VideoInfoResponse> {
    const params = new HttpParams().set('url', url);
    return this.http.get<VideoInfoResponse>(`${this.baseUrl}/info`, { params });
  }

  createDownloadJob(payload: CreateDownloadJobPayload): Observable<DownloadJobResponse> {
    return this.http.post<DownloadJobResponse>(`${this.baseUrl}/download-jobs`, payload);
  }

  getDownloadJob(jobId: string): Observable<DownloadJobResponse> {
    return this.http.get<DownloadJobResponse>(`${this.baseUrl}/download-jobs/${encodeURIComponent(jobId)}`);
  }

  buildDownloadJobFileUrl(jobId: string): string {
    return `${this.baseUrl}/download-jobs/${encodeURIComponent(jobId)}/file`;
  }

  buildDirectDownloadUrl(url: string, fileName?: string, format = 'mp4-best'): string {
    let params = new HttpParams()
      .set('url', url)
      .set('format', format);

    const trimmedFileName = fileName?.trim();
    if (trimmedFileName) {
      params = params.set('filename', trimmedFileName);
    }

    return `${this.baseUrl}/download?${params.toString()}`;
  }
}
