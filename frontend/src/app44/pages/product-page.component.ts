import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { ApiService } from '../shared/api.service';
import { ProductDetailPayload } from '../shared/api.types';
import { SiteFooterComponent } from '../shared/site-footer.component';

@Component({
  standalone: true,
  imports: [DecimalPipe, DatePipe, RouterLink, SiteFooterComponent],
  template: `
    @if (vm(); as data) {
      <section class="product-page">
        <div class="crumb">Home <span>›</span> Shop <span>›</span> {{ data.product.category }}</div>
        <div class="main-row">
          <div class="gallery-col">
            <div class="thumbs">
              @for (img of data.product.gallery; track img) {
                <img [src]="img" class="thumb" [alt]="data.product.name" />
              }
            </div>
            <div class="main-image">
              <img [src]="data.product.imageUrl" [alt]="data.product.name" />
            </div>
          </div>

          <div class="detail-col">
            <h1>{{ data.product.name.toUpperCase() }}</h1>
            <p class="rating">{{ stars(data.product.rating) }} <span>{{ data.product.rating | number: '1.1-1' }}/5</span></p>
            <p class="price">&#36;{{ data.product.price }}
              @if (data.product.oldPrice) {
                <del>&#36;{{ data.product.oldPrice }}</del>
              }
              @if (data.product.discount) {
                <em>{{ data.product.discount }}</em>
              }
            </p>
            <p class="desc">{{ data.product.description }}</p>
            <div class="meta-row">
              <span>Stock: <strong>{{ data.product.stock }}</strong></span>
              <span>Reviews: <strong>{{ data.product.reviewsCount }}</strong></span>
            </div>
            <hr />
            <h6>Choose Size</h6>
            <div class="sizes">
              @for (s of data.product.sizes; track s) {
                <button type="button" [class.active]="selectedSize() === s" (click)="selectedSize.set(s)">{{ s }}</button>
              }
            </div>
            <hr />
            <div class="action-row">
              <div class="qty"><button type="button" (click)="changeQuantity(-1)">-</button><span>{{ quantity() }}</span><button type="button" (click)="changeQuantity(1)">+</button></div>
              <button type="button" class="add-cart" [disabled]="adding() || data.product.stock < 1" (click)="addToCart(data.product._id)">
                {{ adding() ? 'Adding...' : 'Add to Cart' }}
              </button>
            </div>
            @if (message()) {
              <p class="text-success mt-3 mb-0">{{ message() }}</p>
            }
            @if (error()) {
              <p class="text-danger mt-3 mb-0">{{ error() }}</p>
            }
          </div>
        </div>
      </section>

      <section class="review-tabs">
        <button type="button">Product Details</button>
        <button type="button" class="active">Rating & Reviews</button>
        <button type="button">FAQs</button>
      </section>

      <section class="reviews-wrap">
        <div class="review-head">
          <h3>All Reviews <span>({{ data.reviews.length }})</span></h3>
          <div><button type="button" class="sort-btn">Latest</button><button type="button" class="dark-btn">Verified buyers</button></div>
        </div>
        <div class="review-grid">
          @for (review of data.reviews; track review._id) {
            <article class="review-card">
              <p class="stars">{{ stars(review.rating) }}</p>
              <h6>{{ review.customerName }} <span>●</span></h6>
              <p>{{ review.comment }}</p>
              <small>Posted on {{ review.postedAt | date: 'MMM d, y' }}</small>
            </article>
          }
        </div>
      </section>

      <section class="recommend-wrap">
        <h3>YOU MIGHT ALSO LIKE</h3>
        <div class="recommend-grid">
          @for (item of data.recommendations; track item.slug) {
            <article class="rec-card" [routerLink]="['/product', item.slug]">
              <img [src]="item.imageUrl" [alt]="item.name" />
              <h6>{{ item.name }}</h6>
              <p class="rating">{{ stars(item.rating) }} <span>{{ item.rating | number: '1.1-1' }}/5</span></p>
              <p class="price small-price">&#36;{{ item.price }}
                @if (item.oldPrice) { <del>&#36;{{ item.oldPrice }}</del> }
                @if (item.discount) { <em>{{ item.discount }}</em> }
              </p>
            </article>
          }
        </div>
      </section>

      <div class="mt-5"><app-site-footer /></div>
    }
  `,
  styles: `
    .product-page { background: #fff; padding: 18px 14px 0; border-radius: 0 0 12px 12px; }
    .crumb { color: #8a8a8a; font-size: 12px; margin-bottom: 16px; }
    .crumb span { margin: 0 8px; }
    .main-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    .gallery-col { display: grid; grid-template-columns: 110px 1fr; gap: 12px; }
    .thumbs { display: grid; gap: 10px; }
    .thumb { width: 100%; height: 120px; object-fit: cover; border-radius: 16px; border: 1px solid #ddd; background: #f2f2f2; }
    .main-image { background: #f2f2f2; border-radius: 16px; min-height: 500px; }
    .main-image img { width: 100%; height: 100%; object-fit: cover; }
    .detail-col h1 { margin: 2px 0 8px; font-size: clamp(34px, 4vw, 56px); font-weight: 900; line-height: 1; }
    .detail-col h6 { font-size: 14px; color: #666; margin: 0 0 8px; font-weight: 500; }
    .rating { color: #f2ac00; margin: 0; }
    .rating span { color: #666; margin-left: 8px; }
    .price { font-size: 44px; margin: 6px 0; font-weight: 700; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .price del { color: #a3a3a3; font-size: 34px; }
    .price em { font-style: normal; font-size: 12px; background: #ffe8ec; color: #d94768; border-radius: 999px; padding: 4px 10px; }
    .small-price { font-size: 22px; }
    .small-price del { font-size: 18px; }
    .desc { color: #666; margin-bottom: 10px; }
    .meta-row { display: flex; gap: 20px; color: #666; margin-bottom: 8px; font-size: 14px; }
    .sizes { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
    .sizes button { border: 0; border-radius: 999px; background: #f2f2f2; font-size: 12px; padding: 8px 14px; }
    .sizes button.active { background: #000; color: #fff; }
    .action-row { display: grid; grid-template-columns: 140px 1fr; gap: 10px; margin-top: 10px; }
    .qty { background: #f2f2f2; border-radius: 999px; display: flex; align-items: center; justify-content: space-around; }
    .qty button { border: 0; background: transparent; font-size: 18px; }
    .add-cart { border: 0; border-radius: 999px; background: #000; color: #fff; font-weight: 600; padding: 12px; }
    .review-tabs { display: grid; grid-template-columns: repeat(3, 1fr); margin: 22px 14px 8px; background: #fff; border-bottom: 1px solid #ddd; }
    .review-tabs button { border: 0; background: transparent; padding: 14px; color: #777; }
    .review-tabs .active { color: #111; border-bottom: 2px solid #111; }
    .reviews-wrap { background: #fff; margin: 0 14px; padding: 10px 0; }
    .review-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .review-head h3 { margin: 0; font-size: 30px; font-weight: 700; }
    .review-head h3 span { color: #888; font-size: 15px; font-weight: 500; }
    .review-head div { display: flex; gap: 8px; }
    .sort-btn, .dark-btn { border: 0; border-radius: 999px; padding: 9px 16px; background: #f2f2f2; font-size: 12px; }
    .dark-btn { background: #000; color: #fff; }
    .review-grid { margin-top: 12px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .review-card { border: 1px solid #dfdfdf; border-radius: 16px; padding: 16px; }
    .review-card .stars { margin: 0; color: #f2ac00; }
    .review-card h6 { margin: 8px 0; font-size: 20px; }
    .review-card h6 span { color: #0c9f4f; font-size: 13px; }
    .review-card p { color: #666; margin: 0 0 8px; }
    .review-card small { color: #888; }
    .recommend-wrap { padding: 34px 14px 0; background: #fff; }
    .recommend-wrap h3 { text-align: center; margin: 0 0 20px; font-size: clamp(36px, 4.3vw, 58px); font-weight: 900; }
    .recommend-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
    .rec-card { cursor: pointer; }
    .rec-card img { width: 100%; height: 230px; object-fit: cover; border-radius: 16px; background: #f2f2f2; }
    .rec-card h6 { margin: 10px 0 6px; font-size: 22px; font-weight: 600; }
    @media (max-width: 1100px) { .main-row { grid-template-columns: 1fr; } .recommend-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 700px) { .gallery-col { grid-template-columns: 1fr; } .thumbs { grid-template-columns: repeat(3, 1fr); } .review-head { flex-direction: column; align-items: flex-start; } .review-grid, .recommend-grid { grid-template-columns: 1fr; } .action-row { grid-template-columns: 1fr; } }
  `
})
export class ProductPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly vm = signal<ProductDetailPayload | null>(null);
  protected readonly quantity = signal(1);
  protected readonly selectedSize = signal('Large');
  protected readonly adding = signal(false);
  protected readonly message = signal('');
  protected readonly error = signal('');

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.api.getProduct(params['slug']).subscribe((response) => {
        this.vm.set(response);
        this.selectedSize.set(response.product.sizes[0] || 'Large');
        this.quantity.set(1);
        this.message.set('');
        this.error.set('');
      });
    });
  }

  protected changeQuantity(delta: number): void {
    this.quantity.update((current) => Math.max(1, current + delta));
  }

  protected addToCart(productId: string): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.adding.set(true);
    this.message.set('');
    this.error.set('');

    this.api.addToCart(productId, this.quantity()).subscribe({
      next: () => {
        this.adding.set(false);
        this.message.set('Added to cart successfully.');
      },
      error: (err) => {
        this.adding.set(false);
        this.error.set(err?.error?.message || 'Unable to add product to cart.');
      }
    });
  }

  protected stars(value: number): string {
    const rounded = Math.max(1, Math.round(value));
    return '★'.repeat(rounded) + '☆'.repeat(Math.max(0, 5 - rounded));
  }
}
