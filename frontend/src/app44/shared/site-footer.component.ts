import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from './api.service';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="newsletter-panel">
      <div class="row align-items-center g-3">
        <div class="col-md-7">
          <h2>STAY UPTO DATE ABOUT OUR LATEST OFFERS</h2>
        </div>
        <div class="col-md-5">
          <div class="mail-input">
            <i class="bi bi-envelope"></i>
            <input class="form-control rounded-pill mb-2" placeholder="Enter your email address" [(ngModel)]="email" />
          </div>
          <button class="btn btn-light rounded-pill w-100 fw-semibold" (click)="subscribe()">Subscribe to Newsletter</button>
        </div>
      </div>
      @if (message()) {
        <p class="mt-2 mb-0 small text-white-50">{{ message() }}</p>
      }
    </section>

    <footer class="site-footer">
      <div class="row g-4">
        <div class="col-lg-3 col-md-4">
          <h3>SHOP.CO</h3>
          <p>We have clothes that suits your style and which you're proud to wear. From women to men.</p>
          <div class="socials">
            <span><i class="bi bi-twitter"></i></span>
            <span><i class="bi bi-facebook"></i></span>
            <span><i class="bi bi-instagram"></i></span>
            <span><i class="bi bi-github"></i></span>
          </div>
        </div>
        <div class="col-lg-9 col-md-8">
          <div class="row row-cols-2 row-cols-md-4 g-3">
            <div>
              <h6>COMPANY</h6>
              <p class="mb-1">About</p><p class="mb-1">Features</p><p class="mb-1">Works</p><p class="mb-1">Career</p>
            </div>
            <div>
              <h6>HELP</h6>
              <p class="mb-1">Customer Support</p><p class="mb-1">Delivery Details</p><p class="mb-1">Terms & Conditions</p><p class="mb-1">Privacy Policy</p>
            </div>
            <div>
              <h6>FAQ</h6>
              <p class="mb-1">Account</p><p class="mb-1">Manage Deliveries</p><p class="mb-1">Orders</p><p class="mb-1">Payments</p>
            </div>
            <div>
              <h6>RESOURCES</h6>
              <p class="mb-1">Free eBooks</p><p class="mb-1">Development Tutorial</p><p class="mb-1">How to - Blog</p><p class="mb-1">Youtube Playlist</p>
            </div>
          </div>
        </div>
      </div>
      <hr />
      <div class="d-flex justify-content-between flex-wrap gap-2">
        <span class="copy">Shop.co © 2000-2023, All Rights Reserved</span>
        <div class="payments">
          <span>VISA</span><span>MasterCard</span><span>PayPal</span><span>Apple Pay</span>
        </div>
      </div>
    </footer>
  `,
  styles: `
    .newsletter-panel {
      background: #000;
      color: #fff;
      border-radius: 18px;
      padding: 28px;
      margin-top: 40px;

      h2 {
        font-size: clamp(28px, 3vw, 42px);
        line-height: 1;
        margin: 0;
        font-weight: 900;
      }
    }

    .mail-input {
      position: relative;

      i {
        position: absolute;
        top: 50%;
        left: 14px;
        transform: translateY(-50%);
        color: #8f8f8f;
      }

      input {
        padding-left: 36px;
      }
    }

    .site-footer {
      padding: 44px 0 10px;
      color: #6c6c6c;
      font-size: 13px;

      h3 {
        color: #111;
        font-size: 40px;
        margin: 0 0 12px;
        font-weight: 900;
      }

      h6 {
        letter-spacing: 1.5px;
        font-size: 12px;
        font-weight: 600;
        color: #111;
      }
    }

    .socials {
      display: flex;
      gap: 8px;
      margin-top: 14px;

      span {
        width: 26px;
        height: 26px;
        border: 1px solid #d0d0d0;
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: #111;
      }
    }

    .copy {
      font-size: 12px;
    }

    .payments {
      display: flex;
      gap: 8px;

      span {
        border: 1px solid #dfdfdf;
        border-radius: 6px;
        background: #fff;
        color: #111;
        font-size: 10px;
        font-weight: 700;
        padding: 2px 8px;
      }
    }
  `
})
export class SiteFooterComponent {
  private readonly api = inject(ApiService);

  protected email = '';
  protected readonly message = signal('');

  protected subscribe(): void {
    if (!this.email) {
      this.message.set('Please provide an email address.');
      return;
    }

    this.api.subscribe(this.email).subscribe({
      next: (res) => this.message.set(res.message),
      error: () => this.message.set('Could not subscribe right now.')
    });
  }
}
