import { Routes } from '@angular/router';

import { VideoDownload } from './video-download/video-download';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'video-download',
        pathMatch: 'full'
    },
   
    {
        path: 'video-download',
        component: VideoDownload
    },
  
];