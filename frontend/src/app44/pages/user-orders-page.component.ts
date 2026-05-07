import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';

import { ApiService } from '../shared/api.service';
import { UserOrder } from '../shared/api.types';

@Component({
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  template: `
    <section class="panel-card">
      <div class="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-center mb-4">
        <div>
          <p class="eyebrow mb-1">Orders</p>
          <h2 class="mb-1">My orders</h2>
          <p class="text-secondary mb-0">Track every order from the backend order history endpoint and cancel pending orders in place.</p>
        </div>
        <button class="btn btn-outline-dark rounded-pill px-4" (click)="loadOrders()">Refresh</button>
      </div>

      @if (message()) {
        <div class="alert alert-success rounded-4">{{ message() }}</div>
      }
      @if (error()) {
        <div class="alert alert-danger rounded-4">{{ error() }}</div>
      }

      @if (loading()) {
        <p class="text-secondary mb-0">Loading orders...</p>
      } @else if (!orders().length) {
        <p class="text-secondary mb-0">No orders found yet.</p>
      } @else {
        <div class="order-grid">
          @for (order of orders(); track order._id) {
            <article class="order-card">
              <div class="d-flex flex-column flex-md-row justify-content-between gap-3 mb-3">
                <div>
                  <h4 class="mb-1">Order #{{ order._id.slice(-6).toUpperCase() }}</h4>
                  <p class="text-secondary mb-0">Placed on {{ order.createdAt | date: 'MMM d, y, h:mm a' }}</p>
                </div>
                <div class="text-md-end">
                  <span class="status-pill me-2">{{ order.status }}</span>
                  <span class="status-pill dark">{{ order.paymentStatus || order.paymentMethod || 'pending' }}</span>
                  <div class="fw-semibold fs-5 mt-2">{{ order.total | currency }}</div>
                </div>
              </div>

              @if (order.items?.length) {
                <div class="item-list mb-3">
                  @for (item of order.items || []; track item.productSlug + item.productName) {
                    <div class="d-flex justify-content-between gap-3 py-2 small">
                      <span>{{ item.productName }} x{{ item.quantity }}</span>
                      <span>{{ item.price * item.quantity | currency }}</span>
                    </div>
                  }
                </div>
              }

              <div class="d-flex flex-wrap justify-content-between gap-3 align-items-center small text-secondary">
                <span>Delivery {{ order.deliveryFee || 0 | currency }} | Discount {{ order.discount || 0 | currency }}</span>
                @if (order.status === 'pending') {
                  <button class="btn btn-sm btn-outline-danger rounded-pill px-3" (click)="cancelOrder(order)">Cancel order</button>
                }
              </div>
            </article>
          }
        </div>
      }
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
    .order-grid { display: grid; gap: 16px; }
    .order-card { border: 1px solid #dbe8df; border-radius: 24px; padding: 18px; background: #ffffff; }
    .item-list { border-top: 1px solid #e7efea; border-bottom: 1px solid #e7efea; padding: 8px 0; }
    .status-pill { border-radius: 999px; background: #dfece4; color: #1b3f2b; padding: 6px 12px; font-size: 12px; font-weight: 600; }
    .status-pill.dark { background: #1b3f2b; color: #f4fbf6; }
  `
})
export class UserOrdersPageComponent {
  private readonly api = inject(ApiService);

  protected readonly loading = signal(true);
  protected readonly orders = signal<UserOrder[]>([]);
  protected readonly message = signal('');
  protected readonly error = signal('');

  constructor() {
    this.loadOrders();
  }

  protected loadOrders(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getUserOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Unable to load user orders.');
      }
    });
  }

  protected cancelOrder(order: UserOrder): void {
    this.api.cancelOrder(order._id).subscribe({
      next: (result) => {
        this.orders.update((orders) => orders.map((item) => (item._id === result.order._id ? result.order : item)));
        this.message.set(result.message);
        this.error.set('');
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Unable to cancel order.');
        this.message.set('');
      }
    });
  }
}
