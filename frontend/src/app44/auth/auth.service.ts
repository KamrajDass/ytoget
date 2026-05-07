import { Injectable, computed, signal } from '@angular/core';

import { ApiService } from '../shared/api.service';
import { AuthResponse, AuthUser } from '../shared/api.types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'shopco_token';
  private readonly userSignal = signal<AuthUser | null>(null);

  readonly user = this.userSignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.userSignal());

  constructor(private readonly api: ApiService) {
    const token = this.getToken();
    if (token) {
      this.api.getMe().subscribe({
        next: (response) => this.userSignal.set(response.user),
        error: () => this.logout()
      });
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  signup(payload: { name: string; email: string; password: string }) {
    return this.api.signup(payload);
  }

  login(payload: { email: string; password: string }) {
    return this.api.login(payload);
  }

  setSession(response: AuthResponse): void {
    localStorage.setItem(this.tokenKey, response.token);
    this.userSignal.set(response.user);
  }

  syncUser(user: AuthUser): void {
    this.userSignal.set(user);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.userSignal.set(null);
  }
}
