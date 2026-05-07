import { Component, signal } from '@angular/core';
import { VideoDownload } from './video-download/video-download';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [VideoDownload],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('StyleShop');
}
