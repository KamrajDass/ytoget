import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../auth/auth.service';

@Component({
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <section class="account-shell py-4">
      <div class="hero-card mb-4">
        <div>
          <p class="eyebrow mb-2">Account center</p>
          <h1 class="mb-2">Profile and orders</h1>
          <p class="text-secondary mb-0">Your account area now uses live profile and order endpoints instead of one mixed page.</p>
        </div>
        <div class="identity-chip">
          <span>{{ auth.user()?.role || 'customer' }}</span>
          <strong>{{ auth.user()?.email }}</strong>
        </div>
      </div>

      <nav class="account-nav mb-4">
        <a routerLink="/account/profile" routerLinkActive="active" class="nav-pill">Profile details</a>
        <a routerLink="/account/orders" routerLinkActive="active" class="nav-pill">My orders</a>
      </nav>

      <router-outlet />
    </section>
  `,
  styles: `
    .hero-card {
      background: radial-gradient(circle at top right, rgba(74, 151, 92, 0.18), transparent 28%), linear-gradient(135deg, #f7fffa 0%, #eef8f0 55%, #d8eadb 100%);
      border: 1px solid #d4e6d8;
      border-radius: 34px;
      padding: 28px;
      display: flex;
      justify-content: space-between;
      gap: 20px;
      align-items: end;
    }
    .eyebrow { color: #587564; font-size: 12px; letter-spacing: .16em; text-transform: uppercase; }
    h1 { color: #16251c; font-size: clamp(34px, 5vw, 56px); line-height: .96; font-weight: 900; }
    .identity-chip {
      min-width: 220px;
      border-radius: 24px;
      background: #1b3f2b;
      color: #f4fbf6;
      padding: 16px 18px;
      display: grid;
      gap: 4px;
      align-self: stretch;
    }
    .identity-chip span { font-size: 13px; opacity: .78; text-transform: uppercase; letter-spacing: .12em; }
    .account-nav { display: flex; gap: 10px; flex-wrap: wrap; }
    .nav-pill {
      text-decoration: none;
      border-radius: 999px;
      padding: 12px 18px;
      background: #dfece4;
      color: #1b3f2b;
      font-weight: 600;
      transition: transform .2s ease, background-color .2s ease, color .2s ease;
    }
    .nav-pill:hover, .nav-pill.active { background: #1b3f2b; color: #f4fbf6; transform: translateY(-1px); }
    @media (max-width: 900px) {
      .hero-card { flex-direction: column; align-items: start; }
      .identity-chip { min-width: 0; width: 100%; }
    }
  `
})
export class AccountPageComponent {
  protected readonly auth = inject(AuthService);
}
