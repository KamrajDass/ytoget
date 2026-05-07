import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Data } from '../../../services/data';
import { Auth } from '../../../services/auth';

@Component({
  selector: 'app-verify-email',
  imports: [],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css',
})
export class VerifyEmail {
  // Signals for state management
  status = signal<'loading' | 'success' | 'error'>('loading');
  errorMessage = signal<string>('');

  constructor(private route: ActivatedRoute, private authSer: Auth, private router: Router) {

  }
  ngOnInit() {
    // URL se token lena: /verify-email?token=xyz
    const token = this.route.snapshot.queryParamMap.get('token');

    if (token) {
      this.authSer.verifyEmail(token).subscribe({
        next: () => {
          this.status.set('success');
          // 5 seconds baad auto-redirect
          setTimeout(() => this.router.navigate(['/login']), 5000);
        },
        error: (err) => {
          this.status.set('error');
          this.errorMessage.set(err.error?.message || 'Verification link invalid ya expire ho chuka hai.');
        }
      });
    } else {
      this.status.set('error');
      this.errorMessage.set('Security token missing hai.');
    }
  }
}
