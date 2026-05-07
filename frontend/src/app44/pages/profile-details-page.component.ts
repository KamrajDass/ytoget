import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../auth/auth.service';
import { ApiService } from '../shared/api.service';
import { AuthUser } from '../shared/api.types';

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="panel-card">
      <div class="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-center mb-4">
        <div>
          <p class="eyebrow mb-1">Profile</p>
          <h2 class="mb-1">Personal details</h2>
          <p class="text-secondary mb-0">Your profile screen now reads and updates data through the backend profile endpoints.</p>
        </div>
        <button class="btn btn-outline-dark rounded-pill px-4" (click)="loadProfile()">Refresh</button>
      </div>

      @if (message()) {
        <div class="alert alert-success rounded-4">{{ message() }}</div>
      }
      @if (error()) {
        <div class="alert alert-danger rounded-4">{{ error() }}</div>
      }

      <div class="form-grid">
        <div>
          <label class="form-label">Name</label>
          <input class="form-control" [(ngModel)]="form.name" />
        </div>
        <div>
          <label class="form-label">Email</label>
          <input class="form-control" [(ngModel)]="form.email" />
        </div>
      </div>

      <div class="meta-grid my-4">
        <article>
          <span>Email verified</span>
          <strong>{{ form.isEmailVerified ? 'Yes' : 'No' }}</strong>
        </article>
        <article>
          <span>Role</span>
          <strong>{{ form.role }}</strong>
        </article>
        <article>
          <span>User ID</span>
          <strong>{{ form.id.slice(-6).toUpperCase() || 'N/A' }}</strong>
        </article>
      </div>

      <div class="d-flex justify-content-end">
        <button class="btn btn-dark rounded-pill px-4" [disabled]="saving()" (click)="saveProfile()">
          {{ saving() ? 'Saving...' : 'Save profile' }}
        </button>
      </div>
    </section>
  `,
  styles: `
    .panel-card {
      border: 1px solid #d8e2db;
      border-radius: 28px;
      background: linear-gradient(180deg, #fbfffc 0%, #eff6f1 100%);
      box-shadow: 0 18px 40px rgba(30, 66, 47, 0.08);
      padding: 24px;
    }
    .eyebrow { color: #587564; font-size: 12px; letter-spacing: .14em; text-transform: uppercase; }
    h2 { color: #16251c; font-size: 28px; font-weight: 800; }
    .form-grid, .meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    .meta-grid article { border-radius: 22px; background: #ffffff; border: 1px solid #dbe8df; padding: 16px; display: grid; gap: 6px; }
    .meta-grid span { color: #5d7567; font-size: 12px; text-transform: uppercase; letter-spacing: .12em; }
    .meta-grid strong { color: #16251c; }
    @media (max-width: 900px) { .form-grid, .meta-grid { grid-template-columns: 1fr; } }
  `
})
export class ProfileDetailsPageComponent {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);

  protected readonly saving = signal(false);
  protected readonly message = signal('');
  protected readonly error = signal('');
  protected form: AuthUser = { id: '', name: '', email: '', role: 'customer', isEmailVerified: false };

  constructor() {
    this.loadProfile();
  }

  protected loadProfile(): void {
    this.api.getUserProfile().subscribe({
      next: (profile) => {
        this.form = profile;
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Unable to load profile.');
      }
    });
  }

  protected saveProfile(): void {
    this.saving.set(true);
    this.message.set('');
    this.error.set('');

    this.api.updateUserProfile({ name: this.form.name, email: this.form.email }).subscribe({
      next: (profile) => {
        this.form = profile;
        this.auth.syncUser(profile);
        this.saving.set(false);
        this.message.set('Profile updated successfully.');
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'Unable to update profile.');
      }
    });
  }
}
