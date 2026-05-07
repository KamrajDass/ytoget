import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiService } from '../shared/api.service';
import { HomePayload } from '../shared/api.types';
import { SiteFooterComponent } from '../shared/site-footer.component';

@Component({
  standalone: true,
  imports: [RouterLink, SiteFooterComponent],
  template: `
    @if (loading()) {
      <p class="text-center py-5">Loading...</p>
    } @else if (data(); as vm) {
      <section class="hero-wrap">
        <div class="hero-content">
          <h1>{{ vm.hero.heading }}</h1>
          <p>{{ vm.hero.description }}</p>
          <a routerLink="/shop" class="btn btn-dark rounded-pill shop-btn">{{ vm.hero.ctaLabel }}</a>
          <div class="stats-row">
            @for (stat of vm.stats; track stat.label) {
              <div class="stat-box">
                <h3>{{ stat.value }}</h3>
                <span>{{ stat.label }}</span>
              </div>
            }
          </div>
        </div>
        <div class="hero-image">
          <img [src]="vm.hero.imageUrl" [alt]="vm.hero.heading" />
          <span class="spark spark-one">✦</span>
          <span class="spark spark-two">✦</span>
        </div>
      </section>

      <section class="brand-strip">
        @for (brand of vm.brands; track brand) {
          <strong>{{ brand }}</strong>
        }
      </section>

      <section class="product-section">
        <h2>NEW ARRIVALS</h2>
        <div class="product-grid">
          @for (item of vm.newArrivals; track item.slug) {
            <article class="product-card">
              <div class="thumb"><img [src]="item.imageUrl" [alt]="item.name" /></div>
              <a [routerLink]="['/product', item.slug]">{{ item.name }}</a>
              <p class="rating">{{ getStars(item.rating) }} <span>{{ item.rating.toFixed(1) }}/5</span></p>
              <p class="price">&#36;{{ item.price }}
                @if (item.oldPrice) { <del>&#36;{{ item.oldPrice }}</del> }
                @if (item.discount) { <em>{{ item.discount }}</em> }
              </p>
            </article>
          }
        </div>
        <button class="view-all">View All</button>
      </section>

      <section class="product-section top-selling">
        <h2>TOP SELLING</h2>
        <div class="product-grid">
          @for (item of vm.topSelling; track item.slug) {
            <article class="product-card">
              <div class="thumb"><img [src]="item.imageUrl" [alt]="item.name" /></div>
              <a [routerLink]="['/product', item.slug]">{{ item.name }}</a>
              <p class="rating">{{ getStars(item.rating) }} <span>{{ item.rating.toFixed(1) }}/5</span></p>
              <p class="price">&#36;{{ item.price }}
                @if (item.oldPrice) { <del>&#36;{{ item.oldPrice }}</del> }
                @if (item.discount) { <em>{{ item.discount }}</em> }
              </p>
            </article>
          }
        </div>
        <button class="view-all">View All</button>
      </section>

      <section class="style-section">
        <h2>BROWSE BY DRESS STYLE</h2>
        <div class="style-grid">
          @for (style of vm.dressStyles; track style.id; let i = $index) {
            <article class="style-card" [class.wide]="i === 1 || i === 2">
              <h3>{{ style.title }}</h3>
              <img [src]="style.imageUrl" [alt]="style.title" />
            </article>
          }
        </div>
      </section>

      <section class="customer-section">
        <div class="head-row">
          <h2>OUR HAPPY CUSTOMERS</h2>
          <div class="arrows"><span>←</span><span>→</span></div>
        </div>
        <div class="customer-grid">
          @for (item of vm.happyCustomers; track item.customerName) {
            <article class="customer-card">
              <p class="stars">★★★★★</p>
              <h6>{{ item.customerName }} <span class="ok">●</span></h6>
              <p>{{ item.comment }}</p>
            </article>
          }
        </div>
      </section>

      <div class="mt-5"><app-site-footer /></div>
    }
  `,
  styles: `
    :host {
      display: block;
      background: #fff;
      border-radius: 0 0 16px 16px;
    }

    .hero-wrap {
      display: grid;
      grid-template-columns: 1fr 0.92fr;
      gap: 16px;
      background: #f2f2f2;
      padding: 52px 42px 0;
      border-radius: 0 0 6px 6px;
    }

    .hero-content h1 {
      margin: 0;
      max-width: 560px;
      font-size: clamp(44px, 5.5vw, 88px);
      line-height: 0.95;
      text-transform: uppercase;
      font-weight: 900;
      letter-spacing: -2px;
    }

    .hero-content p {
      color: #666;
      max-width: 560px;
      font-size: 14px;
      line-height: 1.6;
      margin: 20px 0;
    }

    .shop-btn {
      min-width: 156px;
      font-weight: 600;
    }

    .stats-row {
      display: flex;
      gap: 20px;
      margin-top: 34px;
      padding-bottom: 30px;
      flex-wrap: wrap;
    }

    .stat-box {
      border-left: 1px solid #ddd;
      padding-left: 20px;

      &:first-child {
        border-left: 0;
        padding-left: 0;
      }

      h3 {
        margin: 0;
        font-size: 42px;
        font-weight: 700;
      }

      span {
        color: #7f7f7f;
        font-size: 13px;
      }
    }

    .hero-image {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: flex-end;

      img {
        width: 100%;
        height: 100%;
        max-height: 620px;
        object-fit: cover;
        object-position: top;
      }
    }

    .spark {
      position: absolute;
      font-size: 42px;
      font-weight: 700;
    }

    .spark-one {
      top: 88px;
      right: 28px;
    }

    .spark-two {
      top: 270px;
      left: -6px;
      font-size: 32px;
    }

    .brand-strip {
      background: #000;
      color: #fff;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      text-align: center;
      align-items: center;
      min-height: 112px;
      font-size: clamp(22px, 2.2vw, 44px);
      letter-spacing: -0.4px;
      font-weight: 600;
    }

    .product-section {
      padding: 52px 42px 10px;
      text-align: center;

      h2 {
        font-size: clamp(38px, 4.3vw, 62px);
        margin: 0 0 28px;
        font-weight: 900;
      }
    }

    .top-selling {
      border-top: 1px solid #ebebeb;
      margin-top: 12px;
      padding-top: 36px;
    }

    .product-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 22px;
      text-align: left;
    }

    .product-card .thumb {
      background: #f2f2f2;
      border-radius: 18px;
      height: 260px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .product-card a {
      margin-top: 12px;
      display: block;
      text-decoration: none;
      color: #111;
      font-size: 22px;
      line-height: 1.2;
      font-weight: 600;
    }

    .rating {
      margin: 8px 0;
      color: #f2ac00;
      font-size: 16px;
      letter-spacing: 0.4px;

      span {
        color: #676767;
        margin-left: 8px;
        letter-spacing: 0;
      }
    }

    .price {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 9px;
      font-size: 34px;
      font-weight: 700;

      del {
        color: #9a9a9a;
        font-size: 30px;
      }

      em {
        border-radius: 999px;
        background: #ffe8ec;
        color: #d94768;
        font-size: 12px;
        font-style: normal;
        font-weight: 700;
        padding: 4px 10px;
      }
    }

    .view-all {
      border: 1px solid #dedede;
      background: #fff;
      border-radius: 999px;
      min-width: 170px;
      margin-top: 30px;
      padding: 10px 22px;
    }

    .style-section {
      margin: 34px 42px 0;
      background: #f2f2f2;
      border-radius: 36px;
      padding: 40px 32px 28px;

      h2 {
        margin: 0 0 24px;
        text-align: center;
        font-size: clamp(34px, 4vw, 56px);
        font-weight: 900;
      }
    }

    .style-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      grid-template-rows: repeat(2, 210px);
      gap: 14px;
    }

    .style-card {
      position: relative;
      border-radius: 18px;
      overflow: hidden;
      background: #fff;

      h3 {
        position: absolute;
        top: 14px;
        left: 16px;
        margin: 0;
        font-size: 38px;
        font-weight: 700;
        z-index: 1;
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center top;
      }

      &.wide {
        grid-column: span 2;
      }
    }

    .customer-section {
      padding: 52px 42px 0;
    }

    .head-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h2 {
        margin: 0;
        font-size: clamp(36px, 4.4vw, 62px);
        font-weight: 900;
      }
    }

    .arrows {
      display: flex;
      gap: 18px;
      font-size: 24px;
      font-weight: 700;
    }

    .customer-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    .customer-card {
      border: 1px solid #dfdfdf;
      border-radius: 16px;
      padding: 20px;

      .stars {
        margin: 0;
        color: #f2ac00;
      }

      h6 {
        font-size: 20px;
        margin: 12px 0;
      }

      .ok {
        color: #0c9f4f;
        font-size: 14px;
      }

      p {
        color: #666;
        margin: 0;
      }
    }

    @media (max-width: 1100px) {
      .hero-wrap {
        grid-template-columns: 1fr;
        padding: 36px 18px 0;
      }

      .brand-strip {
        grid-template-columns: 1fr;
        gap: 10px;
        padding: 20px 0;
      }

      .product-section {
        padding: 38px 18px 10px;
      }

      .product-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .style-section {
        margin: 24px 18px 0;
      }

      .style-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .style-card.wide {
        grid-column: span 1;
      }

      .customer-section {
        padding: 38px 18px 0;
      }

      .customer-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 650px) {
      .product-grid,
      .style-grid {
        grid-template-columns: 1fr;
      }

      .style-card {
        min-height: 180px;
      }
    }
  `
})
export class HomePageComponent implements OnInit {
  private readonly api = inject(ApiService);

  protected readonly data = signal<HomePayload | null>(null);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.api.getHome().subscribe({
      next: (response) => {
        this.data.set(response);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  protected getStars(rating: number): string {
    const rounded = Math.round(rating);
    return '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
  }
}
