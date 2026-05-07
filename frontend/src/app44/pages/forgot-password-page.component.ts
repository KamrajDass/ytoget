import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService } from '../shared/api.service';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="row justify-content-center mt-5">
      <div class="col-md-7 col-lg-5">
        <div class="card rounded-4 p-4 shadow-sm border-0">
          <p class="text-uppercase small text-secondary mb-2">Account Recovery</p>
          <h2 class="fw-black mb-3">Forgot your password?</h2>
          <p class="text-secondary mb-4">Enter your email address and the backend will generate a reset token for you.</p>
          <label class="form-label">Email</label>
          <input class="form-control mb-3" [(ngModel)]="email" placeholder="you@example.com" />
          <button class="btn btn-dark w-100" [disabled]="loading()" (click)="submit()">
            {{ loading() ? 'Sending...' : 'Send reset link' }}
          </button>
          @if (message()) {
            <div class="alert alert-success mt-3 mb-0">
              <div>{{ message() }}</div>
              @if (token()) {
                <div class="small mt-2">Development reset token: {{ token() }}</div>
              }
            </div>
          }
          @if (error()) {
            <p class="text-danger mt-3 mb-0">{{ error() }}</p>
          }
          <div class="d-flex justify-content-between small mt-3">
            <a routerLink="/login">Back to login</a>
            <a routerLink="/signup">Create account</a>
          </div>
        </div>
      </div>
    </section>
  `
})
export class ForgotPasswordPageComponent {
  private readonly api = inject(ApiService);

  protected email = '';
  protected readonly loading = signal(false);
  protected readonly message = signal('');
  protected readonly token = signal('');
  protected readonly error = signal('');

  protected submit(): void {
    this.loading.set(true);
    this.error.set('');
    this.message.set('');
    this.token.set('');

    this.api.forgotPassword(this.email).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.message.set(response.message || 'Reset instructions sent.');
        this.token.set(response.resetToken || '');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Unable to send reset instructions.');
      }
    });
  }
}
