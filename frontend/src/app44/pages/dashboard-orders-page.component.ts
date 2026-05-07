import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../shared/api.service';
import { AdminOrderListPayload, UserOrder } from '../shared/api.types';

@Component({
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe],
  template: `
    <section class="panel-card">
      <div class="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-center mb-4">
        <div>
          <p class="eyebrow mb-1">Orders</p>
          <h2 class="mb-1">Manage fulfillment and payments</h2>
          <p class="text-secondary mb-0">This screen uses the admin orders, order status, and payment status endpoints directly.</p>
        </div>
        <button class="btn btn-outline-dark rounded-pill px-4" (click)="loadOrders()">Refresh</button>
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
          <article class="metric-card"><span>Pending</span><strong>{{ stats.pending }}</strong></article>
          <article class="metric-card"><span>Paid</span><strong>{{ stats.paid }}</strong></article>
          <article class="metric-card accent"><span>Revenue</span><strong>{{ stats.revenue | currency }}</strong></article>
        </div>
      }

      <div class="filter-grid mb-4">
        <input class="form-control" [(ngModel)]="filters.search" placeholder="Search by order id or customer" (keyup.enter)="loadOrders()" />
        <select class="form-select" [(ngModel)]="filters.status" (change)="loadOrders()">
          <option value="">All statuses</option>
          <option value="pending">pending</option>
          <option value="processing">processing</option>
          <option value="shipped">shipped</option>
          <option value="delivered">delivered</option>
          <option value="cancelled">cancelled</option>
        </select>
        <select class="form-select" [(ngModel)]="filters.paymentStatus" (change)="loadOrders()">
          <option value="">All payments</option>
          <option value="pending">pending</option>
          <option value="paid">paid</option>
          <option value="failed">failed</option>
        </select>
        <button class="btn btn-outline-dark rounded-pill" (click)="loadOrders()">Apply</button>
      </div>

      @if (loading()) {
        <p class="text-secondary mb-0">Loading orders...</p>
      } @else {
        <div class="table-responsive">
          <table class="table align-middle mb-0">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Date</th>
                <th class="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              @for (order of orders(); track order._id) {
                <tr>
                  <td>
                    <div class="fw-semibold">#{{ order._id.slice(-6).toUpperCase() }}</div>
                    <div class="small text-secondary">{{ order.paymentMethod || 'cod' }}</div>
                  </td>
                  <td>{{ order.customerName }}</td>
                  <td>
                    <select class="form-select form-select-sm" [(ngModel)]="order.status" (ngModelChange)="saveOrderStatus(order)">
                      <option value="pending">pending</option>
                      <option value="processing">processing</option>
                      <option value="shipped">shipped</option>
                      <option value="delivered">delivered</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </td>
                  <td>
                    <select class="form-select form-select-sm" [(ngModel)]="order.paymentStatus" (ngModelChange)="savePaymentStatus(order)">
                      <option value="pending">pending</option>
                      <option value="paid">paid</option>
                      <option value="failed">failed</option>
                    </select>
                  </td>
                  <td>{{ order.createdAt | date: 'MMM d, y' }}</td>
                  <td class="text-end">{{ order.total | currency }}</td>
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
    .filter-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr auto; gap: 12px; }
    .table { --bs-table-bg: transparent; }
    @media (max-width: 960px) { .metric-grid, .filter-grid { grid-template-columns: 1fr; } }
  `
})
export class DashboardOrdersPageComponent {
  private readonly api = inject(ApiService);

  protected readonly loading = signal(true);
  protected readonly orders = signal<UserOrder[]>([]);
  protected readonly summary = signal<AdminOrderListPayload['summary'] | null>(null);
  protected readonly message = signal('');
  protected readonly error = signal('');
  protected filters = { search: '', status: '', paymentStatus: '' };

  constructor() {
    this.loadOrders();
  }

  protected loadOrders(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getAdminOrders(this.filters).subscribe({
      next: (payload) => {
        this.orders.set(payload.items);
        this.summary.set(payload.summary);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Unable to load admin orders.');
      }
    });
  }

  protected saveOrderStatus(order: UserOrder): void {
    this.api.updateOrderStatus(order._id, order.status).subscribe({
      next: (updatedOrder) => {
        this.orders.update((orders) => orders.map((item) => (item._id === updatedOrder._id ? updatedOrder : item)));
        this.message.set(`Updated order ${updatedOrder._id.slice(-6).toUpperCase()} status.`);
        this.error.set('');
        this.loadOrders();
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Unable to update order status.');
        this.message.set('');
      }
    });
  }

  protected savePaymentStatus(order: UserOrder): void {
    this.api.updateOrderPaymentStatus(order._id, order.paymentStatus || 'pending', order.paymentTransactionId || undefined).subscribe({
      next: (updatedOrder) => {
        this.orders.update((orders) => orders.map((item) => (item._id === updatedOrder._id ? updatedOrder : item)));
        this.message.set(`Updated payment for order ${updatedOrder._id.slice(-6).toUpperCase()}.`);
        this.error.set('');
        this.loadOrders();
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Unable to update payment status.');
        this.message.set('');
      }
    });
  }
}
