import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiService } from '../shared/api.service';
import { PlaceOrderResponse, UserCart } from '../shared/api.types';

@Component({
  standalone: true,
  imports: [FormsModule, CurrencyPipe, RouterLink],
  template: `
    <section class="checkout-page py-4">
      <div class="crumb mb-3">Home <span>›</span> Cart <span>›</span> Checkout</div>
      <div class="row g-4">
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm rounded-4 p-4">
            <p class="text-uppercase small text-secondary mb-2">Secure Checkout</p>
            <h1 class="fw-black mb-3">Complete your order</h1>
            <div class="row g-3">
              <div class="col-md-6"><label class="form-label">Full name</label><input class="form-control" [(ngModel)]="form.fullName" /></div>
              <div class="col-md-6"><label class="form-label">Phone</label><input class="form-control" [(ngModel)]="form.phone" /></div>
              <div class="col-12"><label class="form-label">Address</label><input class="form-control" [(ngModel)]="form.address" /></div>
              <div class="col-md-6"><label class="form-label">City</label><input class="form-control" [(ngModel)]="form.city" /></div>
              <div class="col-md-6"><label class="form-label">Postal code</label><input class="form-control" [(ngModel)]="form.postalCode" /></div>
            </div>

            <hr class="my-4" />

            <h4 class="fw-bold mb-3">Payment Method</h4>
            <div class="payment-grid">
              <button type="button" class="payment-card" [class.active]="paymentMethod() === 'cod'" (click)="paymentMethod.set('cod')">
                <strong>Cash on delivery</strong>
                <span>Simple checkout for local testing and delivery orders.</span>
              </button>
              <button type="button" class="payment-card" [class.active]="paymentMethod() === 'stripe'" (click)="paymentMethod.set('stripe')">
                <strong>Stripe</strong>
                <span>Creates a payment intent and returns a mock or live client secret.</span>
              </button>
              <button type="button" class="payment-card" [class.active]="paymentMethod() === 'razorpay'" (click)="paymentMethod.set('razorpay')">
                <strong>Razorpay</strong>
                <span>Creates a Razorpay order for INR-based checkout.</span>
              </button>
            </div>

            @if (error()) {
              <div class="alert alert-danger rounded-4 mt-4 mb-0">{{ error() }}</div>
            }
          </div>
        </div>

        <div class="col-lg-5">
          <div class="card border-0 shadow-sm rounded-4 p-4 sticky-lg-top summary-card">
            <h3 class="fw-bold mb-3">Order summary</h3>
            @if (cart(); as data) {
              @for (item of data.items; track item.productId) {
                <div class="d-flex justify-content-between gap-3 mb-3">
                  <div>
                    <div class="fw-semibold">{{ item.name }}</div>
                    <div class="small text-secondary">Qty {{ item.quantity }}</div>
                  </div>
                  <div class="fw-semibold">{{ item.lineTotal | currency }}</div>
                </div>
              }
              <hr />
              <div class="d-flex justify-content-between mb-2"><span class="text-secondary">Subtotal</span><strong>{{ data.subtotal | currency }}</strong></div>
              <div class="d-flex justify-content-between mb-2"><span class="text-secondary">Delivery</span><strong>{{ deliveryFee | currency }}</strong></div>
              <div class="d-flex justify-content-between fs-5"><span>Total</span><strong>{{ data.subtotal + deliveryFee | currency }}</strong></div>
            }
            <button class="btn btn-dark w-100 rounded-pill py-3 mt-4" [disabled]="placing() || !cart()?.items?.length" (click)="placeOrder()">
              {{ placing() ? 'Placing order...' : 'Place order' }}
            </button>
            @if (success(); as result) {
              <div class="alert alert-success rounded-4 mt-3 mb-0">
                <div class="fw-semibold mb-1">{{ result.message }}</div>
                <div class="small">Order #{{ result.order._id.slice(-6).toUpperCase() }} created with {{ result.order.paymentMethod }}.</div>
                @if (result.payment) {
                  <div class="small mt-2">{{ paymentDescription(result) }}</div>
                }
              </div>
            }
            <a class="small d-inline-block mt-3" routerLink="/cart">Back to cart</a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .crumb { color: #8a8a8a; font-size: 12px; }
    .crumb span { margin: 0 8px; }
    .payment-grid { display: grid; gap: 12px; }
    .payment-card {
      border: 1px solid #dedede;
      border-radius: 20px;
      padding: 16px;
      background: #fff;
      text-align: left;
      display: grid;
      gap: 6px;
      transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;
    }
    .payment-card.active {
      border-color: #111;
      box-shadow: 0 14px 30px rgba(17,17,17,.08);
      transform: translateY(-1px);
    }
    .payment-card span { color: #666; font-size: 13px; }
    .summary-card { top: 96px; }
  `
})
export class CheckoutPageComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly cart = signal<UserCart | null>(null);
  protected readonly paymentMethod = signal<'cod' | 'stripe' | 'razorpay'>('cod');
  protected readonly placing = signal(false);
  protected readonly success = signal<PlaceOrderResponse | null>(null);
  protected readonly error = signal('');
  protected readonly deliveryFee = 15;
  protected form = {
    fullName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  };

  constructor() {
    this.api.getCart().subscribe({
      next: (cart) => this.cart.set(cart),
      error: (err) => this.error.set(err?.error?.message || 'Unable to load cart for checkout.')
    });
  }

  protected placeOrder(): void {
    this.placing.set(true);
    this.error.set('');
    this.success.set(null);

    this.api.placeOrder({
      paymentMethod: this.paymentMethod(),
      deliveryFee: this.deliveryFee,
      deliveryAddress: {
        fullName: this.form.fullName,
        street: this.form.address,
        city: this.form.city,
        zip: this.form.postalCode,
        phone: this.form.phone,
        country: 'US'
      }
    }).subscribe({
      next: (result) => {
        this.placing.set(false);
        this.success.set(result);
        this.cart.set({ items: [], subtotal: 0, total: 0 });
        setTimeout(() => this.router.navigateByUrl('/account/orders'), 1200);
      },
      error: (err) => {
        this.placing.set(false);
        this.error.set(err?.error?.message || 'Unable to place order.');
      }
    });
  }

  protected paymentDescription(result: PlaceOrderResponse): string {
    if (result.payment?.clientSecret) {
      return `Client secret: ${result.payment.clientSecret}`;
    }
    if (result.payment?.orderId) {
      return `Razorpay order: ${result.payment.orderId}`;
    }
    if (result.payment?.transactionId) {
      return `Transaction: ${result.payment.transactionId}`;
    }
    return 'Payment initialized.';
  }
}
