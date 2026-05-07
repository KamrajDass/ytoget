import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../auth/auth.service';

@Component({
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <section class="dashboard-shell py-4">
      <div class="hero-card mb-4">
        <div>
          <p class="eyebrow mb-2">Admin workspace</p>
          <h1 class="mb-2">Control the store from live backend data</h1>
          <p class="text-secondary mb-0">Products, categories, users, and reporting are now split into focused screens backed by your API.</p>
        </div>
        <div class="identity-chip">
          <span>{{ auth.user()?.name }}</span>
          <strong>{{ auth.user()?.email }}</strong>
        </div>
      </div>

      <nav class="dashboard-nav mb-4">
        <a routerLink="/dashboard/overview" routerLinkActive="active" class="nav-pill">Overview</a>
        <a routerLink="/dashboard/users" routerLinkActive="active" class="nav-pill">Users</a>
        <a routerLink="/dashboard/categories" routerLinkActive="active" class="nav-pill">Categories</a>
        <a routerLink="/dashboard/orders" routerLinkActive="active" class="nav-pill">Orders</a>
        <a routerLink="/dashboard/products" routerLinkActive="active" class="nav-pill">Products</a>
        <a routerLink="/dashboard/products/new" routerLinkActive="active" class="nav-pill accent">Add Product</a>
      </nav>

      <router-outlet />
    </section>
  `,
  styles: `
    .hero-card {
      background: radial-gradient(circle at top right, rgba(224, 153, 68, 0.22), transparent 28%), linear-gradient(135deg, #fff6ea 0%, #f4eadf 58%, #e8d3bc 100%);
      border: 1px solid #e7d2ba;
      border-radius: 34px;
      padding: 28px;
      display: flex;
      justify-content: space-between;
      gap: 20px;
      align-items: end;
    }
    .eyebrow { color: #7f6d58; font-size: 12px; letter-spacing: .16em; text-transform: uppercase; }
    h1 { color: #23170b; font-size: clamp(34px, 5vw, 56px); line-height: .96; font-weight: 900; max-width: 640px; }
    .identity-chip {
      min-width: 240px;
      border-radius: 24px;
      background: #2c2116;
      color: #fff7ea;
      padding: 16px 18px;
      display: grid;
      gap: 4px;
      align-self: stretch;
    }
    .identity-chip span { font-size: 13px; opacity: .75; text-transform: uppercase; letter-spacing: .12em; }
    .identity-chip strong { font-size: 16px; word-break: break-word; }
    .dashboard-nav { display: flex; gap: 10px; flex-wrap: wrap; }
    .nav-pill {
      text-decoration: none;
      border-radius: 999px;
      padding: 12px 18px;
      background: #f3e4d2;
      color: #5b3e1f;
      font-weight: 600;
      transition: transform .2s ease, background-color .2s ease, color .2s ease;
    }
    .nav-pill:hover, .nav-pill.active { background: #2c2116; color: #fff7ea; transform: translateY(-1px); }
    .nav-pill.accent { background: #d78533; color: #fffaf2; }
    @media (max-width: 900px) {
      .hero-card { flex-direction: column; align-items: start; }
      .identity-chip { min-width: 0; width: 100%; }
    }
  `
})
export class DashboardPageComponent {
  protected readonly auth = inject(AuthService);
}
