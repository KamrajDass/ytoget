import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { ApiService } from '../shared/api.service';
import { UserCart } from '../shared/api.types';
import { SiteFooterComponent } from '../shared/site-footer.component';

@Component({
  standalone: true,
  imports: [FormsModule, CurrencyPipe, RouterLink, SiteFooterComponent],
  template: `
    <section class="cart-page">
      <div class="crumb">Home <span>›</span> Cart</div>
      <h1>YOUR CART</h1>
      @if (!auth.isLoggedIn()) {
        <div class="empty-card">
          <h4>Sign in to manage your cart</h4>
          <p>Your cart is stored on your account so checkout, orders, and dashboard data stay consistent.</p>
          <a class="btn btn-dark rounded-pill px-4" routerLink="/login">Login</a>
        </div>
      } @else if (cart(); as data) {
        <div class="cart-layout">
          <div class="left-card">
            @if (!data.items.length) {
              <div class="empty-card inside">
                <h4>Your cart is empty</h4>
                <p>Browse products and add items before checkout.</p>
                <a class="btn btn-dark rounded-pill px-4" routerLink="/shop">Go shopping</a>
              </div>
            }
            @for (item of data.items; track item.productId) {
              <article class="cart-item">
                <div class="item-img"></div>
                <div class="item-info">
                  <h6>{{ item.name }}</h6>
                  <p>Item ID: {{ item.productId.slice(-6).toUpperCase() }}</p>
                  <strong>{{ item.price | currency }}</strong>
                </div>
                <div class="item-actions">
                  <button class="trash-btn" (click)="removeItem(item.productId)"><i class="bi bi-trash text-danger"></i></button>
                  <div class="qty"><button (click)="changeQuantity(item.productId, item.quantity - 1)">-</button><span>{{ item.quantity }}</span><button (click)="changeQuantity(item.productId, item.quantity + 1)">+</button></div>
                  <span class="line-total">{{ item.lineTotal | currency }}</span>
                </div>
              </article>
            }
          </div>

          <div class="summary-card">
            <h5>Order Summary</h5>
            <p><span>Subtotal</span><strong>{{ data.subtotal | currency }}</strong></p>
            <p class="discount"><span>Discount</span><strong>{{ discount | currency }}</strong></p>
            <p><span>Delivery Fee</span><strong>{{ deliveryFee | currency }}</strong></p>
            <hr />
            <p class="total"><span>Total</span><strong>{{ data.subtotal - discount + deliveryFee | currency }}</strong></p>
            <div class="promo-row"><input [(ngModel)]="promoCode" placeholder="Add promo code" /><button (click)="applyPromo()">Apply</button></div>
            <button class="checkout" [disabled]="!data.items.length" (click)="goToCheckout()">Go to Checkout <span>→</span></button>
            @if (message()) {
              <p class="text-success mt-3 mb-0">{{ message() }}</p>
            }
            @if (error()) {
              <p class="text-danger mt-3 mb-0">{{ error() }}</p>
            }
          </div>
        </div>

        <app-site-footer />
      }
    </section>
  `,
  styles: `
    .cart-page { background: #fff; border-radius: 0 0 12px 12px; padding: 16px 14px 10px; }
    .crumb { color: #8a8a8a; font-size: 12px; }
    .crumb span { margin: 0 8px; }
    h1 { margin: 10px 0 12px; font-size: clamp(40px, 4.4vw, 64px); line-height: 1; font-weight: 900; }
    .cart-layout { display: grid; grid-template-columns: 1.5fr 1fr; gap: 14px; margin-bottom: 24px; }
    .left-card, .summary-card, .empty-card { border: 1px solid #e2e2e2; border-radius: 18px; padding: 14px; }
    .inside { min-height: 240px; display: grid; place-items: center; text-align: center; }
    .empty-card p { color: #666; max-width: 420px; }
    .cart-item { display: grid; grid-template-columns: 100px 1fr auto; gap: 12px; padding: 10px 0; border-bottom: 1px solid #ececec; }
    .cart-item:last-child { border-bottom: 0; }
    .item-img { background: linear-gradient(135deg, #f5f5f5, #ececec); border-radius: 10px; min-height: 92px; }
    .item-info h6 { margin: 0 0 6px; font-size: 25px; font-weight: 700; }
    .item-info p { color: #777; margin: 0; font-size: 12px; }
    .item-info strong { display: block; margin-top: 6px; font-size: 24px; line-height: 1; }
    .item-actions { display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; gap: 10px; }
    .trash-btn { border: 0; background: transparent; }
    .qty { background: #f2f2f2; border-radius: 999px; min-width: 110px; padding: 5px 10px; display: flex; align-items: center; justify-content: space-between; }
    .qty button { border: 0; background: transparent; }
    .line-total { font-weight: 700; }
    .summary-card h5 { font-size: 30px; font-weight: 700; margin: 0 0 10px; }
    .summary-card p { display: flex; justify-content: space-between; margin: 8px 0; color: #646464; }
    .summary-card p strong { color: #111; }
    .discount strong { color: #d64c66 !important; }
    .total { font-size: 24px; color: #111 !important; font-weight: 600; }
    .promo-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; margin: 10px 0; }
    .promo-row input { border: 0; border-radius: 999px; background: #f2f2f2; padding: 10px 14px; }
    .promo-row button { border: 0; border-radius: 999px; background: #000; color: #fff; padding: 8px 20px; }
    .checkout { width: 100%; border: 0; border-radius: 999px; background: #000; color: #fff; font-weight: 600; padding: 12px; margin-top: 6px; }
    @media (max-width: 980px) { .cart-layout { grid-template-columns: 1fr; } .cart-item { grid-template-columns: 1fr; } }
  `
})
export class CartPageComponent {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly cart = signal<UserCart | null>(null);
  protected readonly message = signal('');
  protected readonly error = signal('');
  protected promoCode = '';
  protected discount = 0;
  protected readonly deliveryFee = 15;

  constructor() {
    if (this.auth.isLoggedIn()) {
      this.loadCart();
    }
  }

  protected changeQuantity(productId: string, quantity: number): void {
    if (quantity < 1) {
      this.removeItem(productId);
      return;
    }

    this.api.updateCartItem(productId, quantity).subscribe({
      next: (cart) => {
        this.cart.set(cart);
        this.message.set('Cart updated.');
        this.error.set('');
      },
      error: (err) => this.error.set(err?.error?.message || 'Unable to update cart item.')
    });
  }

  protected removeItem(productId: string): void {
    this.api.removeFromCart(productId).subscribe({
      next: (cart) => {
        this.cart.set(cart);
        this.message.set('Item removed from cart.');
        this.error.set('');
      },
      error: (err) => this.error.set(err?.error?.message || 'Unable to remove item.')
    });
  }

  protected applyPromo(): void {
    this.discount = this.promoCode.trim().toUpperCase() === 'SHOP20' ? 20 : 0;
    this.message.set(this.discount ? 'Promo code applied.' : 'Promo code not recognized.');
    this.error.set('');
  }

  protected goToCheckout(): void {
    this.router.navigateByUrl('/checkout');
  }

  private loadCart(): void {
    this.api.getCart().subscribe({
      next: (cart) => this.cart.set(cart),
      error: (err) => this.error.set(err?.error?.message || 'Unable to load cart.')
    });
  }
}
