import { Component, computed, effect, OnInit, signal } from '@angular/core';
import { Data } from '../../services/data';
import { Card } from "../card/card";
import { Footer } from "../footer/footer";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Product } from '../../services/product';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.html',
  styleUrls: ['./categories.css'],
  imports: [Card, FormsModule, CommonModule, Footer],
})
export class Categories implements OnInit {

  isFilterOpen = signal(false);
  products = signal<any[]>([]);
  Math = Math;
  // --- UI Data ---
  maxPriceLimit = 0;
  uniqueColors: string[] = [];
  uniqueSizes: string[] = [];
  categories = ['T-shirts', 'Shorts', 'Shirts', 'Hoodie', 'Jeans'];
  dressStyles = ['Casual', 'Formal', 'Party', 'Gym'];

  // --- Draft Signals (UI inputs) ---
  tempMaxPrice = signal(0);
  tempSelectedColor = signal('');
  tempSelectedSize = signal('');
  tempSelectedCategory = signal('');
  tempSelectedDressStyle = signal('Casual');

  // --- Applied Signals (Filter Logic) ---
  appliedMaxPrice = signal(0);
  appliedSelectedColor = signal('');
  appliedSelectedSize = signal('');
  appliedSelectedCategory = signal('');
  appliedSelectedDressStyle = signal('Casual');

  dressOpen = signal(true);

  // --- Pagination Signals ---
  currentPage = signal(1);
  itemsPerPage = signal(9); // Ek page par kitne products dikhane hain

  // 1. Pehle filter karein
  filteredProducts = computed(() => {
    const allProducts = this.products();
    return allProducts.filter(p => {
      const matchesCategory = this.appliedSelectedCategory() ? p.category === this.appliedSelectedCategory() : true;
      const matchesColor = this.appliedSelectedColor() ? (p.colors || []).includes(this.appliedSelectedColor()) : true;
      const matchesSize = this.appliedSelectedSize() ? (p.sizes || []).includes(this.appliedSelectedSize()) : true;
      const matchesPrice = p.price <= Number(this.appliedMaxPrice());
      const matchesDress = p.dressStyle ? p.dressStyle === this.appliedSelectedDressStyle() : true;
      return matchesCategory && matchesColor && matchesSize && matchesPrice && matchesDress;
    });
  });

  // 2. Filtered list ko pages mein divide karein
  paginatedProducts = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
    const endIndex = startIndex + this.itemsPerPage();
    return this.filteredProducts().slice(startIndex, endIndex);
  });

  // 3. Total pages calculate karein
  totalPages = computed(() => {
    return Math.ceil(this.filteredProducts().length / this.itemsPerPage()) || 1;
  });

  constructor(private proSer: Product) {
    effect(() => {
      document.body.classList.toggle('no-scroll', this.isFilterOpen());
    });
  }

  ngOnInit() {
    this.proSer.getProductsByCategory('casual').subscribe((res: any) => {
      if (res && res.items) {
        this.products.set(res.items);
        const prices = res.items.map((p: any) => p.price);
        this.maxPriceLimit = prices.length ? Math.max(...prices) : 1000;

        this.tempMaxPrice.set(this.maxPriceLimit);
        this.appliedMaxPrice.set(this.maxPriceLimit);

        this.uniqueColors = Array.from(new Set(res.items.flatMap((p: any) => p.colors || [])));
        this.uniqueSizes = Array.from(new Set(res.items.flatMap((p: any) => p.sizes || [])));
      }
    });
  }

  // --- Methods ---
  applyFilters() {
    this.appliedMaxPrice.set(this.tempMaxPrice());
    this.appliedSelectedColor.set(this.tempSelectedColor());
    this.appliedSelectedSize.set(this.tempSelectedSize());
    this.appliedSelectedCategory.set(this.tempSelectedCategory());
    this.appliedSelectedDressStyle.set(this.tempSelectedDressStyle());

    this.currentPage.set(1); // Filter apply hote hi page 1 par wapas jayein
    this.isFilterOpen.set(false);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  toggleDress() { this.dressOpen.set(!this.dressOpen()); }
  toggleFilters() { this.isFilterOpen.update(v => !v); }
}