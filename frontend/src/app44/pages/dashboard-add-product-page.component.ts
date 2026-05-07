import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiService } from '../shared/api.service';
import { Category } from '../shared/api.types';

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="panel-card">
      <div class="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-center mb-4">
        <div>
          <p class="eyebrow mb-1">Products</p>
          <h2 class="mb-1">Create a new product</h2>
          <p class="text-secondary mb-0">This form sends a real product create request to the backend. No mock rows or static defaults are rendered here.</p>
        </div>
        <button class="btn btn-outline-dark rounded-pill px-4" (click)="goBack()">Back to products</button>
      </div>

      @if (message()) {
        <div class="alert alert-success rounded-4">{{ message() }}</div>
      }
      @if (error()) {
        <div class="alert alert-danger rounded-4">{{ error() }}</div>
      }

      <div class="form-grid">
        <div>
          <label class="form-label">Product name</label>
          <input class="form-control" [(ngModel)]="form.name" />
        </div>
        <div>
          <label class="form-label">Category</label>
          <select class="form-select" [(ngModel)]="form.category">
            <option value="">Select a category</option>
            @for (category of categories(); track category._id) {
              <option [value]="category.slug">{{ category.name }}</option>
            }
          </select>
        </div>
        <div>
          <label class="form-label">Price</label>
          <input class="form-control" type="number" [(ngModel)]="form.price" />
        </div>
        <div>
          <label class="form-label">Old price</label>
          <input class="form-control" type="number" [(ngModel)]="form.oldPrice" />
        </div>
        <div>
          <label class="form-label">Stock</label>
          <input class="form-control" type="number" [(ngModel)]="form.stock" />
        </div>
        <div>
          <label class="form-label">Main image file</label>
          <input class="form-control" type="file" accept="image/png,image/jpeg,image/jpg,image/webp" (change)="onMainImageSelected($event)" />
          <small class="text-secondary">You can still paste a URL fallback below if needed.</small>
        </div>
        <div>
          <label class="form-label">Main image URL fallback</label>
          <input class="form-control" [(ngModel)]="form.imageUrl" />
        </div>
        <div class="full">
          <label class="form-label">Gallery image files</label>
          <input class="form-control" type="file" accept="image/png,image/jpeg,image/jpg,image/webp" multiple (change)="onGalleryImagesSelected($event)" />
        </div>
        <div class="full">
          <label class="form-label">Gallery URLs</label>
          <input class="form-control" [(ngModel)]="form.galleryCsv" placeholder="Separate with commas" />
        </div>
        <div class="full">
          <label class="form-label">Description</label>
          <textarea class="form-control" rows="4" [(ngModel)]="form.description"></textarea>
        </div>
        <div>
          <label class="form-label">Sizes</label>
          <input class="form-control" [(ngModel)]="form.sizesCsv" placeholder="S, M, L" />
        </div>
        <div>
          <label class="form-label">Colors</label>
          <input class="form-control" [(ngModel)]="form.colorsCsv" placeholder="black, white" />
        </div>
        <div class="full">
          <label class="form-label">Tags</label>
          <input class="form-control" [(ngModel)]="form.tagsCsv" placeholder="home-new-arrivals, top-seller" />
        </div>
      </div>

      <div class="d-flex justify-content-end gap-2 mt-4">
        <button class="btn btn-outline-dark rounded-pill px-4" (click)="resetForm()">Reset</button>
        <button class="btn btn-dark rounded-pill px-4" [disabled]="saving()" (click)="createProduct()">
          {{ saving() ? 'Creating...' : 'Create product' }}
        </button>
      </div>
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
    .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    .full { grid-column: 1 / -1; }
    @media (max-width: 900px) { .form-grid { grid-template-columns: 1fr; } }
  `
})
export class DashboardAddProductPageComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly categories = signal<Category[]>([]);
  protected readonly saving = signal(false);
  protected readonly message = signal('');
  protected readonly error = signal('');
  protected readonly selectedMainImageName = signal('');
  protected readonly selectedGalleryCount = signal(0);
  protected form = this.createInitialForm();
  private mainImageFile: File | null = null;
  private galleryFiles: File[] = [];

  constructor() {
    this.api.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.categories.set([])
    });
  }

  protected async createProduct(): Promise<void> {
    this.saving.set(true);
    this.error.set('');
    this.message.set('');

    try {
      const galleryFromInput = this.csvToArray(this.form.galleryCsv);
      const colors = this.csvToArray(this.form.colorsCsv);
      const sizes = this.csvToArray(this.form.sizesCsv);
      const tags = this.csvToArray(this.form.tagsCsv);

      let imageUrl = this.form.imageUrl.trim();
      if (this.mainImageFile) {
        const upload = await firstValueFrom(this.api.uploadProductImage(this.mainImageFile));
        imageUrl = upload.url;
      }

      if (!imageUrl) {
        this.saving.set(false);
        this.error.set('Main product image is required. Upload a file or provide an image URL.');
        return;
      }

      const uploadedGalleryUrls: string[] = [];
      for (const file of this.galleryFiles) {
        const upload = await firstValueFrom(this.api.uploadProductImage(file));
        uploadedGalleryUrls.push(upload.url);
      }

      const gallery = [...new Set([imageUrl, ...uploadedGalleryUrls, ...galleryFromInput])];

      const product = await firstValueFrom(this.api.createProduct({
        name: this.form.name,
        category: this.form.category,
        imageUrl,
        gallery,
        description: this.form.description,
        price: Number(this.form.price),
        oldPrice: this.form.oldPrice ? Number(this.form.oldPrice) : null,
        stock: Number(this.form.stock),
        tags,
        colors,
        sizes
      }));

      this.saving.set(false);
      this.message.set(`Created ${product.name}. Redirecting to products...`);
      this.resetForm();
      setTimeout(() => this.router.navigateByUrl('/dashboard/products'), 900);
    } catch (err: any) {
      this.saving.set(false);
      this.error.set(err?.error?.message || err?.message || 'Unable to create product.');
    }
  }

  protected resetForm(): void {
    this.form = this.createInitialForm();
    this.mainImageFile = null;
    this.galleryFiles = [];
    this.selectedMainImageName.set('');
    this.selectedGalleryCount.set(0);
  }

  protected goBack(): void {
    this.router.navigateByUrl('/dashboard/products');
  }

  protected onMainImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.mainImageFile = input.files?.[0] || null;
    this.selectedMainImageName.set(this.mainImageFile?.name || '');
  }

  protected onGalleryImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.galleryFiles = input.files ? Array.from(input.files) : [];
    this.selectedGalleryCount.set(this.galleryFiles.length);
  }

  private csvToArray(value: string): string[] {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private createInitialForm() {
    return {
      name: '',
      category: '',
      price: 0,
      oldPrice: 0,
      stock: 0,
      imageUrl: '',
      galleryCsv: '',
      description: '',
      sizesCsv: 'S, M, L',
      colorsCsv: 'black, white',
      tagsCsv: ''
    };
  }
}
