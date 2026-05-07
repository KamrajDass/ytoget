import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../shared/api.service';
import { AdminCategory, AdminCategoryListPayload } from '../shared/api.types';

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="panel-card">
      <div class="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-center mb-4">
        <div>
          <p class="eyebrow mb-1">Categories</p>
          <h2 class="mb-1">Create and edit categories</h2>
          <p class="text-secondary mb-0">This screen uses the category list, create, update, and delete endpoints directly.</p>
        </div>
        <button class="btn btn-outline-dark rounded-pill px-4" (click)="loadCategories()">Refresh</button>
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
          <article class="metric-card accent"><span>Assigned products</span><strong>{{ stats.assignedProducts }}</strong></article>
        </div>
      }

      <div class="create-grid mb-4">
        <input class="form-control" [(ngModel)]="draft.name" placeholder="Category name" />
        <input class="form-control" [(ngModel)]="draft.description" placeholder="Description" />
        <label class="status-toggle"><input type="checkbox" [(ngModel)]="draft.isActive" /> Active</label>
        <button class="btn btn-dark rounded-pill" (click)="createCategory()">Create category</button>
      </div>

      @if (loading()) {
        <p class="text-secondary mb-0">Loading categories...</p>
      } @else {
        <div class="table-responsive">
          <table class="table align-middle mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Products</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (category of categories(); track category._id) {
                <tr>
                  <td><input class="form-control form-control-sm" [(ngModel)]="category.name" /></td>
                  <td>{{ category.slug }}</td>
                  <td><input class="form-control form-control-sm" [(ngModel)]="category.description" /></td>
                  <td>{{ category.productsCount }}</td>
                  <td><label class="status-toggle"><input type="checkbox" [(ngModel)]="category.isActive" /> {{ category.isActive === false ? 'Inactive' : 'Active' }}</label></td>
                  <td class="text-end action-cell">
                    <button class="btn btn-sm btn-outline-dark rounded-pill px-3" (click)="saveCategory(category)">Save</button>
                    <button class="btn btn-sm btn-outline-danger rounded-pill px-3" (click)="removeCategory(category)">Delete</button>
                  </td>
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
    .metric-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
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
    .create-grid { display: grid; grid-template-columns: 1fr 1fr auto auto; gap: 12px; }
    .action-cell { display: flex; justify-content: flex-end; gap: 8px; }
    .table { --bs-table-bg: transparent; }
    .status-toggle { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; color: #5b3e1f; }
    @media (max-width: 900px) { .metric-grid, .create-grid { grid-template-columns: 1fr; } }
  `
})
export class DashboardCategoriesPageComponent {
  private readonly api = inject(ApiService);

  protected readonly loading = signal(true);
  protected readonly categories = signal<AdminCategory[]>([]);
  protected readonly summary = signal<AdminCategoryListPayload['summary'] | null>(null);
  protected readonly message = signal('');
  protected readonly error = signal('');
  protected draft = { name: '', description: '', isActive: true };

  constructor() {
    this.loadCategories();
  }

  protected loadCategories(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getAdminCategories().subscribe({
      next: (payload) => {
        this.categories.set(payload.items);
        this.summary.set(payload.summary);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Unable to load categories.');
      }
    });
  }

  protected createCategory(): void {
    this.api.createCategory(this.draft).subscribe({
      next: (category) => {
        this.categories.update((categories) => [{ ...category, productsCount: 0 }, ...categories]);
        this.draft = { name: '', description: '', isActive: true };
        this.message.set(`Created ${category.name}.`);
        this.error.set('');
        this.loadCategories();
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Unable to create category.');
        this.message.set('');
      }
    });
  }

  protected saveCategory(category: AdminCategory): void {
    this.api.updateCategory(category._id, { name: category.name, description: category.description, isActive: category.isActive }).subscribe({
      next: (updated) => {
        this.categories.update((categories) => categories.map((item) => (item._id === updated._id ? { ...item, ...updated } : item)));
        this.message.set(`Updated ${updated.name}.`);
        this.error.set('');
        this.loadCategories();
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Unable to update category.');
        this.message.set('');
      }
    });
  }

  protected removeCategory(category: AdminCategory): void {
    this.api.deleteCategory(category._id).subscribe({
      next: () => {
        this.categories.update((categories) => categories.filter((item) => item._id !== category._id));
        this.message.set(`Deleted ${category.name}.`);
        this.error.set('');
        this.loadCategories();
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Unable to delete category.');
        this.message.set('');
      }
    });
  }
}
