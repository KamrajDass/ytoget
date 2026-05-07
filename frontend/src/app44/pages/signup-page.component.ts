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
          <h2 class="fw-black mb-3">Sign Up</h2>
          <label class="form-label">Name</label>
          <input class="form-control mb-3" [(ngModel)]="name" />
          <label class="form-label">Email</label>
          <input class="form-control mb-3" [(ngModel)]="email" />
          <label class="form-label">Password</label>
          <input class="form-control mb-3" type="password" [(ngModel)]="password" />
          <button class="btn btn-dark w-100" (click)="submit()">Create Account</button>
          <p class="small text-secondary mt-3 mb-1">A verification link is generated for new accounts.</p>
          <a class="small" routerLink="/login">Already have an account?</a>
          @if (error()) {
            <p class="text-danger mt-2 mb-0">{{ error() }}</p>
          }
        </div>
      </div>
    </section>
  `
})
export class SignupPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected name = '';
  protected email = '';
  protected password = '';
  protected readonly error = signal('');

  protected submit(): void {
    this.auth.signup({ name: this.name, email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.auth.setSession(res);
        this.router.navigateByUrl(res.verificationToken ? `/verify-email?token=${res.verificationToken}` : '/account');
      },
      error: (err) => this.error.set(err?.error?.message || 'Signup failed')
    });
  }
}
