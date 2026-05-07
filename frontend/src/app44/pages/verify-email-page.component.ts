import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApiService } from '../shared/api.service';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="row justify-content-center mt-5">
      <div class="col-md-7 col-lg-5">
        <div class="card rounded-4 p-4 shadow-sm border-0 text-center">
          <p class="text-uppercase small text-secondary mb-2">Email Verification</p>
          <h2 class="fw-black mb-3">Verify your email</h2>
          @if (loading()) {
            <p class="text-secondary mb-0">Checking your verification token...</p>
          } @else if (error()) {
            <p class="text-danger mb-3">{{ error() }}</p>
            <a class="btn btn-outline-dark" routerLink="/signup">Create a new account</a>
          } @else {
            <p class="text-success mb-3">{{ message() }}</p>
            <a class="btn btn-dark" routerLink="/login">Continue to login</a>
          }
        </div>
      </div>
    </section>
  `
})
export class VerifyEmailPageComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(true);
  protected readonly message = signal('');
  protected readonly error = signal('');

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!token) {
      this.loading.set(false);
      this.error.set('Verification token is missing.');
      return;
    }

    this.api.verifyEmail(token).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.message.set(response.message || 'Email verified successfully.');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Unable to verify email.');
      }
    });
  }
}
