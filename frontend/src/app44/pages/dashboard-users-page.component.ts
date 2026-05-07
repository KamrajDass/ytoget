import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../shared/api.service';
import { AdminUserListPayload, AuthUser } from '../shared/api.types';

@Component({
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <section class="panel-card">
      <div class="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-center mb-4">
        <div>
          <p class="eyebrow mb-1">Users</p>
          <h2 class="mb-1">Manage accounts</h2>
          <p class="text-secondary mb-0">Review roles, verification state, and remove users directly from live backend data.</p>
        </div>
        <button class="btn btn-outline-dark rounded-pill px-4" (click)="loadUsers()">Refresh</button>
      </div>

      @if (message()) {
        <div class="alert alert-success rounded-4">{{ message() }}</div>
      }
      @if (error()) {
        <div class="alert alert-danger rounded-4">{{ error() }}</div>
      }

      @if (summary(); as stats) {
        <div class="metric-grid mb-4">
          <article class="metric-card"><span>Total</span><strong>{{ stats.total }}</strong></article>
          <article class="metric-card"><span>Admins</span><strong>{{ stats.admins }}</strong></article>
          <article class="metric-card"><span>Customers</span><strong>{{ stats.customers }}</strong></article>
          <article class="metric-card accent"><span>Unverified</span><strong>{{ stats.unverified }}</strong></article>
        </div>
      }

      <div class="filter-grid mb-4">
        <input class="form-control" [(ngModel)]="filters.search" placeholder="Search by name or email" (keyup.enter)="loadUsers()" />
        <select class="form-select" [(ngModel)]="filters.role" (change)="loadUsers()">
          <option value="">All roles</option>
          <option value="admin">admin</option>
          <option value="customer">customer</option>
        </select>
        <button class="btn btn-outline-dark rounded-pill" (click)="loadUsers()">Apply</button>
      </div>

      @if (loading()) {
        <p class="text-secondary mb-0">Loading users...</p>
      } @else {
        <div class="table-responsive">
          <table class="table align-middle mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Verified</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr>
                  <td>
                    <div class="fw-semibold">{{ user.name }}</div>
                    <div class="small text-secondary">ID {{ user.id.slice(-6).toUpperCase() }}</div>
                  </td>
                  <td>{{ user.email }}</td>
                  <td>
                    <select class="form-select form-select-sm" [ngModel]="user.role" (ngModelChange)="changeRole(user, $event)">
                      <option value="customer">customer</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>{{ user.isEmailVerified ? 'Yes' : 'No' }}</td>
                  <td>{{ user.createdAt ? (user.createdAt | date: 'MMM d, y') : 'N/A' }}</td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger rounded-pill px-3" (click)="removeUser(user)">Delete</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  styles: `
    .panel-card {
      border: 1px solid #e5ded3;
      border-radius: 28px;
      background: linear-gradient(180deg, #fffdf8 0%, #f9f2e8 100%);
      box-shadow: 0 18px 40px rgba(88, 59, 28, 0.08);
      padding: 24px;
    }
    .eyebrow { color: #7f6d58; font-size: 12px; letter-spacing: .14em; text-transform: uppercase; }
    h2 { color: #23170b; font-size: 28px; font-weight: 800; }
    .metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .metric-card {
      border: 1px solid #eadfce;
      border-radius: 20px;
      padding: 16px 18px;
      background: rgba(255, 255, 255, 0.7);
      display: grid;
      gap: 6px;
    }
    .metric-card span { color: #7f6d58; font-size: 12px; letter-spacing: .14em; text-transform: uppercase; }
    .metric-card strong { font-size: 30px; color: #23170b; line-height: 1; }
    .metric-card.accent { background: #2c2116; }
    .metric-card.accent span, .metric-card.accent strong { color: #fff7ea; }
    .filter-grid { display: grid; grid-template-columns: 1.5fr 1fr auto; gap: 12px; }
    .table { --bs-table-bg: transparent; }
    @media (max-width: 960px) { .metric-grid, .filter-grid { grid-template-columns: 1fr; } }
  `
})
export class DashboardUsersPageComponent {
  private readonly api = inject(ApiService);

  protected readonly loading = signal(true);
  protected readonly users = signal<AuthUser[]>([]);
  protected readonly summary = signal<AdminUserListPayload['summary'] | null>(null);
  protected readonly message = signal('');
  protected readonly error = signal('');
  protected filters = { search: '', role: '' };

  constructor() {
    this.loadUsers();
  }

  protected loadUsers(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getAdminUsers(this.filters).subscribe({
      next: (payload) => {
        this.users.set(payload.items);
        this.summary.set(payload.summary);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Unable to load users.');
      }
    });
  }

  protected changeRole(user: AuthUser, role: 'admin' | 'customer'): void {
    this.api.updateUserRole(user.id, role).subscribe({
      next: (updatedUser) => {
        this.users.update((users) => users.map((item) => (item.id === updatedUser.id ? updatedUser : item)));
        this.message.set(`Updated ${updatedUser.name} to ${updatedUser.role}.`);
        this.error.set('');
        this.loadUsers();
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Unable to update user role.');
        this.message.set('');
      }
    });
  }

  protected removeUser(user: AuthUser): void {
    this.api.deleteUser(user.id).subscribe({
      next: () => {
        this.users.update((users) => users.filter((item) => item.id !== user.id));
        this.message.set(`Deleted ${user.email}.`);
        this.error.set('');
        this.loadUsers();
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Unable to delete user.');
        this.message.set('');
      }
    });
  }
}
