import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../shared/api.service';
import { ProductsPayload } from '../shared/api.types';

@Component({
  standalone: true,
  imports: [DecimalPipe, FormsModule],
  template: `
    <div class="shop-shell">
      <div class="crumb">Home <span>�</span> Casual</div>
      <div class="layout-row">
        <aside class="filter-card">
          <div class="head"><h5>Filters</h5><i class="bi bi-sliders"></i></div>
          <hr />
          <ul class="menu">
            <li>T-shirts <span>�</span></li>
            <li>Shorts <span>�</span></li>
            <li>Shirts <span>�</span></li>
            <li>Hoodie <span>�</span></li>
            <li>Jeans <span>�</span></li>
          </ul>
          <hr />
          <h6>Price</h6>
          <div class="range-row">
            <input type="range" min="10" max="500" [(ngModel)]="minPrice" />
            <input type="range" min="10" max="500" [(ngModel)]="maxPrice" />
          </div>
          <div class="range-labels"><span>&#36;{{ minPrice }}</span><span>&#36;{{ maxPrice }}</span></div>
          <hr />
          <h6>Colors</h6>
          <div class="color-row">
            @for (c of colors; track c) {
              <button [style.background]="c" (click)="selectedColor = c"></button>
            }
          </div>
          <hr />
          <h6>Size</h6>
          <div class="size-row">
            @for (item of sizes; track item) {
              <button [class.active]="size === item" (click)="size = item">{{ item }}</button>
            }
          </div>
          <hr />
          <h6>Dress Style</h6>
          <ul class="menu small-menu">
            <li>Casual <span>�</span></li>
            <li>Formal <span>�</span></li>
            <li>Party <span>�</span></li>
            <li>Gym <span>�</span></li>
          </ul>
          <button class="btn btn-dark rounded-pill w-100 mt-2" (click)="applyFilter()">Apply Filter</button>
        </aside>

        <main class="content">
          <div class="top-row">
            <h2>Casual</h2>
            <small>Showing 1-{{ products()?.items?.length || 0 }} of {{ products()?.total || 0 }} Products</small>
            <p>Sort by: <strong>Most Popular</strong></p>
          </div>

          <div class="products">
            @for (item of products()?.items || []; track item.slug) {
              <article class="prod-card">
                <img [src]="item.imageUrl" [alt]="item.name" />
                <h6>{{ item.name }}</h6>
                <p class="rating">{{ stars(item.rating) }} <span>{{ item.rating | number: '1.1-1' }}/5</span></p>
                <p class="price">&#36;{{ item.price }}
                  @if (item.oldPrice) { <del>&#36;{{ item.oldPrice }}</del> }
                  @if (item.discount) { <em>{{ item.discount }}</em> }
                </p>
              </article>
            }
          </div>

          <div class="pager">
            <button>? Previous</button>
            <div class="nums"><span class="active">1</span><span>2</span><span>3</span><span>...</span><span>10</span></div>
            <button>Next ?</button>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: `
    .shop-shell {
      background: #fff;
      padding: 18px 14px 18px;
      border-radius: 0 0 12px 12px;
    }

    .crumb {
      color: #8a8a8a;
      font-size: 12px;
      margin: 4px 0 12px;

      span {
        margin: 0 8px;
      }
    }

    .layout-row {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 16px;
    }

    .filter-card {
      border: 1px solid #e6e6e6;
      border-radius: 18px;
      padding: 16px;
      align-self: start;

      hr {
        margin: 14px 0;
      }

      h6 {
        margin: 0 0 10px;
        font-weight: 700;
      }
    }

    .head {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h5 {
        margin: 0;
        font-size: 22px;
        font-weight: 700;
      }
    }

    .menu {
      list-style: none;
      margin: 0;
      padding: 0;

      li {
        display: flex;
        justify-content: space-between;
        color: #676767;
        margin: 8px 0;
      }
    }

    .range-row {
      display: grid;
      gap: 8px;
    }

    .range-labels {
      display: flex;
      justify-content: space-between;
      color: #666;
      font-size: 12px;
    }

    .color-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      button {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border: 1px solid #d8d8d8;
      }
    }

    .size-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      button {
        border: 0;
        border-radius: 999px;
        background: #f2f2f2;
        padding: 6px 12px;
        font-size: 12px;
      }

      .active {
        background: #000;
        color: #fff;
      }
    }

    .content {
      border: 1px solid #ececec;
      border-radius: 18px;
      padding: 12px;
    }

    .top-row {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;

      h2 {
        margin: 0;
        font-size: 44px;
        font-weight: 800;
      }

      small,
      p {
        color: #777;
        margin: 0;
      }
    }

    .products {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
    }

    .prod-card {
      img {
        width: 100%;
        height: 280px;
        object-fit: cover;
        border-radius: 18px;
        background: #f2f2f2;
      }

      h6 {
        margin: 10px 0 6px;
        font-size: 24px;
        font-weight: 600;
      }

      .rating {
        margin: 0;
        color: #f2ac00;

        span {
          color: #666;
          margin-left: 8px;
        }
      }

      .price {
        margin: 4px 0 0;
        font-size: 34px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 8px;

        del {
          color: #a3a3a3;
          font-size: 28px;
        }

        em {
          background: #ffe8ec;
          color: #d94768;
          border-radius: 999px;
          font-size: 11px;
          font-style: normal;
          padding: 4px 8px;
          font-weight: 700;
        }
      }
    }

    .pager {
      border-top: 1px solid #ececec;
      margin-top: 12px;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      button {
        border: 1px solid #ddd;
        background: #fff;
        border-radius: 999px;
        padding: 8px 14px;
      }
    }

    .nums {
      display: flex;
      gap: 10px;
      color: #777;

      .active {
        color: #111;
        font-weight: 700;
      }
    }

    @media (max-width: 1100px) {
      .layout-row {
        grid-template-columns: 1fr;
      }

      .products {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 700px) {
      .products {
        grid-template-columns: 1fr;
      }

      .top-row {
        grid-template-columns: 1fr;
      }
    }
  `
})
export class ShopPageComponent implements OnInit {
  private readonly api = inject(ApiService);

  protected readonly products = signal<ProductsPayload | null>(null);
  protected minPrice = 50;
  protected maxPrice = 300;
  protected size = 'Large';
  protected selectedColor = '';
  protected readonly sizes = ['XX-Small', 'X-Small', 'Small', 'Medium', 'Large', 'X-Large', 'XX-Large'];
  protected readonly colors = ['#00C12B', '#F50606', '#F5DD06', '#F57906', '#06CAF5', '#063AF5', '#7D06F5', '#F506A4', '#FFFFFF', '#000000'];

  ngOnInit(): void {
    this.applyFilter();
  }

  protected applyFilter(): void {
    this.api
      .getProducts({
        page: 1,
        limit: 9,
        category: 'casual',
        minPrice: this.minPrice,
        maxPrice: this.maxPrice,
        size: this.size,
        color: this.selectedColor,
        sort: 'popular'
      })
      .subscribe((response) => this.products.set(response));
  }

  protected stars(rating: number): string {
    const rounded = Math.round(rating);
    return '?'.repeat(rounded) + '?'.repeat(5 - rounded);
  }
}
