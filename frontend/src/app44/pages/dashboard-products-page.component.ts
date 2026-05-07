import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService } from '../shared/api.service';
import { Category, Product, ProductsPayload } from '../shared/api.types';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="panel-card">
      <div class="d-flex flex-column flex-xl-row justify-content-between gap-3 align-items-xl-center mb-4">
        <div>
          <p class="eyebrow mb-1">Products</p>
          <h2 class="mb-1">Edit inventory</h2>
          <p class="text-secondary mb-0">Search products, filter by category, then update or delete them with the product CRUD endpoints.</p>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <a class="btn btn-dark rounded-pill px-4" routerLink="/dashboard/products/new">Add product</a>
          <button class="btn btn-outline-dark rounded-pill px-4" (click)="loadProducts()">Refresh</button>
        </div>
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
          <article class="metric-card"><span>Active</span><strong>{{ stats.active }}</strong></article>
          <article class="metric-card"><span>Low stock</span><strong>{{ stats.lowStock }}</strong></article>
          <article class="metric-card accent"><span>Out of stock</span><strong>{{ stats.outOfStock }}</strong></article>
        </div>
      }

      <div class="filter-grid mb-4">
        <input class="form-control" [(ngModel)]="filters.search" placeholder="Search by product name" (keyup.enter)="loadProducts()" />
        <select class="form-select" [(ngModel)]="filters.category" (change)="loadProducts()">
          <option value="">All categories</option>
          @for (category of categories(); track category._id) {
            <option [value]="category.slug">{{ category.name }}</option>
          }
        </select>
        <select class="form-select" [(ngModel)]="filters.status" (change)="loadProducts()">
          <option value="">All states</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="low-stock">Low stock</option>
          <option value="out-of-stock">Out of stock</option>
        </select>
        <select class="form-select" [(ngModel)]="pageSize" (change)="loadProducts()">
          <option [ngValue]="10">10 per page</option>
          <option [ngValue]="20">20 per page</option>
          <option [ngValue]="50">50 per page</option>
        </select>
        <button class="btn btn-outline-dark rounded-pill" (click)="loadProducts()">Apply</button>
      </div>

      @if (loading()) {
        <p class="text-secondary mb-0">Loading products...</p>
      } @else {
        <div class="table-responsive">
          <table class="table align-middle mb-0">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Price</th>
                <th>Old price</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (product of products(); track product._id) {
                <tr>
                  <td style="min-width: 210px;">
                    <img [src]="product.imageUrl" [alt]="product.name" class="thumb mb-2" />
                    <input class="form-control form-control-sm" type="file" accept="image/png,image/jpeg,image/jpg,image/webp" (change)="replaceMainImage(product, $event)" />
                    <div class="d-flex flex-wrap gap-1 mt-2">
                      @for (img of product.gallery; track img) {
                        <button type="button" class="btn btn-sm btn-outline-danger" (click)="removeImage(product, img)">Remove gallery image</button>
                      }
                    </div>
                  </td>
                  <td>
                    <input class="form-control form-control-sm mb-1" [(ngModel)]="product.name" />
                    <textarea class="form-control form-control-sm" rows="2" [(ngModel)]="product.description"></textarea>
                  </td>
                  <td><input class="form-control form-control-sm" [(ngModel)]="product.category" /></td>
                  <td>
                    <input class="form-control form-control-sm" type="number" [(ngModel)]="product.stock" />
                    <div class="small mt-1" [class.text-danger]="product.stock <= 5" [class.text-secondary]="product.stock > 5">
                      {{ product.stock <= 0 ? 'Out of stock' : product.stock <= 10 ? 'Low stock' : 'Healthy stock' }}
                    </div>
                  </td>
                  <td><input class="form-control form-control-sm" type="number" [(ngModel)]="product.price" /></td>
                  <td><input class="form-control form-control-sm" type="number" [(ngModel)]="product.oldPrice" /></td>
                  <td>
                    <select class="form-select form-select-sm" [(ngModel)]="product.isActive">
                      <option [ngValue]="true">Active</option>
                      <option [ngValue]="false">Inactive</option>
                    </select>
                  </td>
                  <td class="text-end action-cell">
                    <button class="btn btn-sm btn-outline-dark rounded-pill px-3" (click)="saveProduct(product)">Save</button>
                    <button class="btn btn-sm btn-outline-danger rounded-pill px-3" (click)="removeProduct(product)">Delete</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="d-flex justify-content-between align-items-center gap-3 mt-4 flex-wrap">
          <span class="text-secondary small">Page {{ page() }} of {{ totalPages() }}</span>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-dark rounded-pill px-4" [disabled]="page() <= 1" (click)="setPage(page() - 1)">Previous</button>
            <button class="btn btn-dark rounded-pill px-4" [disabled]="page() >= totalPages()" (click)="setPage(page() + 1)">Next</button>
          </div>
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
    .filter-grid { display: grid; grid-template-columns: 1.6fr 1fr 1fr auto auto; gap: 12px; }
    .action-cell { display: flex; justify-content: flex-end; gap: 8px; }
    .table { --bs-table-bg: transparent; }
    .thumb { width: 84px; height: 84px; border-radius: 10px; object-fit: cover; border: 1px solid #e2d5c4; display: block; }
    @media (max-width: 960px) { .filter-grid, .metric-grid { grid-template-columns: 1fr; } }
  `
})
export class DashboardProductsPageComponent {
  private readonly api = inject(ApiService);

  protected readonly loading = signal(true);
  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly summary = signal<ProductsPayload['summary'] | null>(null);
  protected readonly page = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly message = signal('');
  protected readonly error = signal('');
  protected pageSize = 10;
  protected filters = { search: '', category: '', status: '' };

  constructor() {
    this.loadCategories();
    this.loadProducts();
  }

  protected loadProducts(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getAdminProducts({
      page: this.page(),
      limit: this.pageSize,
      search: this.filters.search,
      category: this.filters.category,
      status: this.filters.status
    }).subscribe({
      next: (payload) => {
        this.products.set(payload.items);
        this.totalPages.set(payload.totalPages || 1);
        this.summary.set(payload.summary || null);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Unable to load products.');
      }
    });
  }

  protected setPage(page: number): void {
    this.page.set(page);
    this.loadProducts();
  }

  protected saveProduct(product: Product): void {
    this.api.updateProduct(product._id, {
      name: product.name,
      category: product.category,
      description: product.description,
      imageUrl: product.imageUrl,
      gallery: product.gallery,
      price: Number(product.price),
      oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
      stock: Number(product.stock),
      tags: product.tags,
      colors: product.colors,
      sizes: product.sizes,
      isActive: product.isActive
    }).subscribe({
      next: (updated) => {
        this.products.update((products) => products.map((item) => (item._id === updated._id ? updated : item)));
        this.message.set(`Updated ${updated.name}.`);
        this.error.set('');
        this.loadProducts();
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Unable to update product.');
        this.message.set('');
      }
    });
  }

  protected removeProduct(product: Product): void {
    this.api.deleteProduct(product._id).subscribe({
      next: () => {
        this.products.update((products) => products.filter((item) => item._id !== product._id));
        this.message.set(`Deleted ${product.name}.`);
        this.error.set('');
        this.loadProducts();
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Unable to delete product.');
        this.message.set('');
      }
    });
  }

  protected replaceMainImage(product: Product, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.api.replaceProductMainImage(product._id, file).subscribe({
      next: (updated) => {
        this.products.update((products) => products.map((item) => (item._id === updated._id ? updated : item)));
        this.message.set(`Updated image for ${updated.name}.`);
        this.error.set('');
        this.loadProducts();
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Unable to upload product image.');
        this.message.set('');
      }
    });
  }

  protected removeImage(product: Product, imageUrl: string): void {
    this.api.deleteProductImage(product._id, imageUrl).subscribe({
      next: (updated) => {
        this.products.update((products) => products.map((item) => (item._id === updated._id ? updated : item)));
        this.message.set(`Removed image from ${updated.name}.`);
        this.error.set('');
        this.loadProducts();
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Unable to remove product image.');
        this.message.set('');
      }
    });
  }

  private loadCategories(): void {
    this.api.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.categories.set([])
    });
  }
}
