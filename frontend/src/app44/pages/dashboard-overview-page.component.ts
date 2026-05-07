import { CurrencyPipe, DatePipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { Chart, registerables } from 'chart.js';

import { ApiService } from '../shared/api.service';
import { AdminDashboardPayload, UserOrder } from '../shared/api.types';

Chart.register(...registerables);

@Component({
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  template: `
    @if (loading()) {
      <div class="panel-card">Loading dashboard metrics...</div>
    } @else {
      @if (error()) {
        <div class="alert alert-danger rounded-4 mb-4">{{ error() }}</div>
      }

      @if (summary(); as data) {
        <div class="metric-grid mb-4">
          <article class="metric-card">
            <span>Revenue</span>
            <strong>{{ data.totals.revenue | currency }}</strong>
          </article>
          <article class="metric-card">
            <span>Orders</span>
            <strong>{{ data.totals.orders }}</strong>
          </article>
          <article class="metric-card">
            <span>Users</span>
            <strong>{{ data.totals.users }}</strong>
          </article>
          <article class="metric-card accent">
            <span>Products</span>
            <strong>{{ data.totals.products }}</strong>
          </article>
        </div>

        <div class="row g-4 mb-4">
          <div class="col-xl-8">
            <section class="panel-card h-100">
              <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
                <div>
                  <p class="eyebrow mb-1">Analytics</p>
                  <h3 class="mb-0">Monthly sales trend</h3>
                </div>
                <span class="pill">Live admin metrics</span>
              </div>
              <canvas #salesCanvas></canvas>
            </section>
          </div>
          <div class="col-xl-4">
            <section class="panel-card h-100">
              <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
                <div>
                  <p class="eyebrow mb-1">Ranking</p>
                  <h3 class="mb-0">Top product score</h3>
                </div>
                <span class="pill">Top {{ data.topSellingProducts.length }}</span>
              </div>
              <canvas #scoreCanvas></canvas>
            </section>
          </div>
        </div>

        <div class="row g-4 mb-4">
          <div class="col-xl-6">
            <section class="panel-card h-100">
              <div class="d-flex justify-content-between align-items-center gap-3 mb-3">
                <div>
                  <p class="eyebrow mb-1">Fulfillment</p>
                  <h3 class="mb-0">Order status mix</h3>
                </div>
                <span class="pill">{{ data.orderStatusBreakdown.length }} states</span>
              </div>
              <div class="stack-list">
                @for (item of data.orderStatusBreakdown; track item.status) {
                  <div class="stack-row">
                    <span class="text-capitalize">{{ item.status }}</span>
                    <strong>{{ item.count }}</strong>
                  </div>
                }
              </div>
            </section>
          </div>
          <div class="col-xl-6">
            <section class="panel-card h-100">
              <div class="d-flex justify-content-between align-items-center gap-3 mb-3">
                <div>
                  <p class="eyebrow mb-1">Attention</p>
                  <h3 class="mb-0">Low-stock products</h3>
                </div>
                <span class="pill">{{ data.lowStockProducts.length }} items</span>
              </div>
              @if (!data.lowStockProducts.length) {
                <p class="text-secondary mb-0">No low-stock products right now.</p>
              } @else {
                <div class="stack-list">
                  @for (product of data.lowStockProducts; track product.id) {
                    <div class="stack-row">
                      <span>{{ product.name }}</span>
                      <strong>{{ product.stock }} left</strong>
                    </div>
                  }
                </div>
              }
            </section>
          </div>
        </div>
      }

      <div class="row g-4">
        <div class="col-xl-7">
          <section class="panel-card h-100">
            <div class="d-flex justify-content-between align-items-center gap-3 mb-3">
              <div>
                <p class="eyebrow mb-1">Orders</p>
                <h3 class="mb-0">Recent activity</h3>
              </div>
              <span class="pill">{{ recentOrders().length }} orders</span>
            </div>

            @if (!recentOrders().length) {
              <p class="text-secondary mb-0">No admin orders found.</p>
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
                    @for (order of recentOrders(); track order._id) {
                      <tr>
                        <td>#{{ order._id.slice(-6).toUpperCase() }}</td>
                        <td>{{ order.customerName }}</td>
                        <td><span class="table-pill">{{ order.status }}</span></td>
                        <td>{{ order.paymentStatus || order.paymentMethod || 'pending' }}</td>
                        <td>{{ order.createdAt | date: 'MMM d, y' }}</td>
                        <td class="text-end">{{ order.total | currency }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </section>
        </div>
        <div class="col-xl-5">
          <section class="panel-card h-100">
            <div class="d-flex justify-content-between align-items-center gap-3 mb-3">
              <div>
                <p class="eyebrow mb-1">Customers</p>
                <h3 class="mb-0">Newest signups</h3>
              </div>
              <span class="pill">{{ summary()?.newestUsers?.length || 0 }} users</span>
            </div>
            @if (!(summary()?.newestUsers?.length)) {
              <p class="text-secondary mb-0">No recent users yet.</p>
            } @else {
              <div class="stack-list">
                @for (user of (summary()?.newestUsers || []); track user.id) {
                  <div class="stack-row stack-row-column">
                    <div>
                      <strong>{{ user.name }}</strong>
                      <div class="small text-secondary">{{ user.email }}</div>
                    </div>
                    <span class="table-pill">{{ user.role }}</span>
                  </div>
                }
              </div>
            }
          </section>
        </div>
      </div>
    }
  `,
  styles: `
    .metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
    .metric-card, .panel-card {
      border: 1px solid #e5ded3;
      border-radius: 28px;
      background: linear-gradient(180deg, #fffdf8 0%, #f9f2e8 100%);
      box-shadow: 0 18px 40px rgba(88, 59, 28, 0.08);
    }
    .metric-card { padding: 22px; display: grid; gap: 8px; }
    .metric-card span, .eyebrow { color: #7f6d58; font-size: 12px; letter-spacing: .14em; text-transform: uppercase; }
    .metric-card strong { font-size: clamp(28px, 3vw, 40px); line-height: 1; color: #23170b; }
    .metric-card.accent { background: linear-gradient(135deg, #2b2117 0%, #5a3820 100%); }
    .metric-card.accent span, .metric-card.accent strong { color: #fff7ea; }
    .panel-card { padding: 24px; }
    .pill, .table-pill {
      border-radius: 999px;
      background: #efe2d1;
      color: #5b3e1f;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .stack-list { display: grid; gap: 12px; }
    .stack-row {
      border: 1px solid #eadfce;
      border-radius: 18px;
      padding: 14px 16px;
      background: rgba(255, 255, 255, 0.6);
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: center;
    }
    .stack-row-column { align-items: flex-start; }
    h3 { color: #23170b; font-size: 28px; font-weight: 800; }
    @media (max-width: 1100px) { .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 640px) { .metric-grid { grid-template-columns: 1fr; } }
  `
})
export class DashboardOverviewPageComponent implements AfterViewInit {
  private readonly api = inject(ApiService);
  private salesChart?: Chart;
  private scoreChart?: Chart;
  private viewReady = false;

  @ViewChild('salesCanvas') private readonly salesCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('scoreCanvas') private readonly scoreCanvas?: ElementRef<HTMLCanvasElement>;

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly summary = signal<AdminDashboardPayload | null>(null);
  protected readonly recentOrders = signal<UserOrder[]>([]);

  constructor() {
    this.loadSummary();
    this.loadOrders();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    const data = this.summary();
    if (data) {
      this.renderCharts(data);
    }
  }

  private loadSummary(): void {
    this.api.getAdminDashboard().subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.loading.set(false);
        if (this.viewReady) {
          this.renderCharts(summary);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Unable to load admin dashboard data.');
      }
    });
  }

  private loadOrders(): void {
    this.api.getAdminOrders().subscribe({
      next: (payload) => this.recentOrders.set(payload.items.slice(0, 8)),
      error: () => this.recentOrders.set([])
    });
  }

  private renderCharts(summary: AdminDashboardPayload): void {
    if (!this.salesCanvas || !this.scoreCanvas) {
      return;
    }

    this.salesChart?.destroy();
    this.scoreChart?.destroy();

    this.salesChart = new Chart(this.salesCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: summary.monthlySales.labels,
        datasets: [
          {
            label: 'Revenue',
            data: summary.monthlySales.values,
            borderColor: '#8a4b18',
            backgroundColor: 'rgba(138, 75, 24, 0.14)',
            fill: true,
            tension: 0.35
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

    this.scoreChart = new Chart(this.scoreCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: summary.topSellingProducts.map((item) => item.name),
        datasets: [
          {
            label: 'Sales score',
            data: summary.topSellingProducts.map((item) => item.salesScore),
            backgroundColor: '#2b2117',
            borderRadius: 12
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y' }
    });
  }
}
