import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ApiService } from '../shared/api.service';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="row justify-content-center mt-5">
      <div class="col-md-7 col-lg-5">
        <div class="card rounded-4 p-4 shadow-sm border-0">
          <p class="text-uppercase small text-secondary mb-2">Reset Password</p>
          <h2 class="fw-black mb-3">Choose a new password</h2>
          <label class="form-label">Reset token</label>
          <input class="form-control mb-3" [(ngModel)]="token" placeholder="Paste token from email or dev response" />
          <label class="form-label">New password</label>
          <input class="form-control mb-3" type="password" [(ngModel)]="password" placeholder="At least 8 characters" />
          <button class="btn btn-dark w-100" [disabled]="loading()" (click)="submit()">
            {{ loading() ? 'Updating...' : 'Update password' }}
          </button>
          @if (message()) {
            <p class="text-success mt-3 mb-0">{{ message() }}</p>
          }
          @if (error()) {
            <p class="text-danger mt-3 mb-0">{{ error() }}</p>
          }
          <div class="small mt-3">
            <a routerLink="/login">Return to login</a>
          </div>
        </div>
      </div>
    </section>
  `
})
export class ResetPasswordPageComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected token = this.route.snapshot.queryParamMap.get('token') || '';
  protected password = '';
  protected readonly loading = signal(false);
  protected readonly message = signal('');
  protected readonly error = signal('');

  protected submit(): void {
    this.loading.set(true);
    this.error.set('');
    this.message.set('');

    this.api.resetPassword(this.token, this.password).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.message.set(response.message || 'Password updated successfully. Redirecting to login...');
        setTimeout(() => this.router.navigateByUrl('/login'), 900);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Unable to reset password.');
      }
    });
  }
}
