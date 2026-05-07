import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../auth/auth.service';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="row justify-content-center mt-5">
      <div class="col-md-6 col-lg-4">
        <div class="card rounded-4 p-4">
          <h2 class="fw-black mb-3">Login</h2>
          <label class="form-label">Email</label>
          <input class="form-control mb-3" [(ngModel)]="email" />
          <label class="form-label">Password</label>
          <input class="form-control mb-3" type="password" [(ngModel)]="password" />
          <div class="d-flex justify-content-between align-items-center mb-3 small">
            <a routerLink="/forgot-password">Forgot password?</a>
            <a routerLink="/signup">Create account</a>
          </div>
          <button class="btn btn-dark w-100" (click)="submit()">Login</button>
          @if (error()) {
            <p class="text-danger mt-2 mb-0">{{ error() }}</p>
          }
        </div>
      </div>
    </section>
  `
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected email = 'admin@shop.co';
  protected password = 'Admin@123';
  protected readonly error = signal('');

  protected submit(): void {
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.auth.setSession(res);
        this.router.navigateByUrl(res.user.role === 'admin' ? '/dashboard' : '/account');
      },
      error: (err) => this.error.set(err?.error?.message || 'Login failed')
    });
  }
}
