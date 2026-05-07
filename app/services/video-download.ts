import { HttpClient, HttpEvent, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VideoDownloadService {
  private readonly baseUrl = 'http://localhost:4000/api/video';

  constructor(private http: HttpClient) {}

  downloadVideo(url: string, fileName?: string, format = 'mp4-best'): Observable<HttpEvent<Blob>> {
    let params = new HttpParams().set('url', url).set('format', format);

    if (fileName?.trim()) {
      params = params.set('filename', fileName.trim());
    }

    return this.http.get(`${this.baseUrl}/download`, {
      params,
      observe: 'events',
      responseType: 'blob',
      reportProgress: true
    });
  }
}
