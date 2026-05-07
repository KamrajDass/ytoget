import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../services/product';

@Component({
  selector: 'app-products',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  products: any[] = [];
  filteredProducts: any[] = [];
  searchTerm = '';
  currentPage = 1;
  pageSize = 9;
  totalPages = 1;
  editingId: string | null = null;
  tempData: any = {};

  constructor(private proSer: Product) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts() {
    this.proSer.getProducts().subscribe((res: any) => {
      this.products = res.items;
      this.applyFilter();
    });
  }

  applyFilter() {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredProducts = term
      ? this.products.filter((product: any) =>
          (product.name || '').toLowerCase().includes(term) ||
          (product.description || '').toLowerCase().includes(term)
        )
      : [...this.products];

    this.totalPages = Math.max(1, Math.ceil(this.filteredProducts.length / this.pageSize));
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
  }

  get pagedProducts() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  get pageNumbers() {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  searchProducts() {
    this.currentPage = 1;
    this.applyFilter();
  }

  setPage(page: number) {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
  }

  startEdit(product: any) {
    this.editingId = product._id;
    this.tempData = { ...product };
  }

  cancelEdit() {
    this.editingId = null;
    this.tempData = {};
  }

  saveEdit() {
   this.proSer.updateProduct(this.editingId!, this.tempData).subscribe(() => {     
    this.loadProducts();    
    this.cancelEdit();
   });
  }

  deleteProduct(id: string) {
    if (confirm('Delete this product?')) {
      console.log(id);
      
      this.proSer.deleteProduct(id).subscribe(() => this.loadProducts());
    }
  }

  
}