import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-dropdown',
  imports: [FormsModule, CommonModule],
  templateUrl: './search-dropdown.html',
  styleUrls: ['./search-dropdown.css'],
})
export class SearchDropdown {
  searchQuery: string = '';
  filteredProducts: any[] = [];
  showModal: boolean = false; // toggle full-screen modal

  products: any[] = [
    { name: 'Red T-Shirt', price: '$25', image: 'https://via.placeholder.com/50/FF0000/FFFFFF?text=R' },
    { name: 'Blue Jeans', price: '$40', image: 'https://via.placeholder.com/50/0000FF/FFFFFF?text=B' },
    { name: 'Leather Jacket', price: '$120', image: 'https://via.placeholder.com/50/333333/FFFFFF?text=LJ' },
    { name: 'White Sneakers', price: '$60', image: 'https://via.placeholder.com/50/FFFFFF/000000?text=WS' },
    { name: 'Black Hat', price: '$15', image: 'https://via.placeholder.com/50/000000/FFFFFF?text=BH' },
    { name: 'Summer Dress', price: '$50', image: 'https://via.placeholder.com/50/FFD700/000000?text=SD' },
    { name: 'Sports Shoes', price: '$70', image: 'https://via.placeholder.com/50/008000/FFFFFF?text=SS' },
    { name: 'Wool Sweater', price: '$45', image: 'https://via.placeholder.com/50/964B00/FFFFFF?text=WS' }
  ];

  // Open modal when input clicked
  openModal() {
    this.showModal = true;
    this.filteredProducts = [];
    this.searchQuery = '';
  }

  onInputChange() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredProducts = [];
      return;
    }

    this.filteredProducts = this.products.filter(p =>
      p.name.toLowerCase().includes(query)
    );
  }

  selectProduct(product: any) {
    this.searchQuery = product.name;
    this.showModal = false;
    this.filteredProducts = [];
  }

  closeModal() {
    this.showModal = false;
    this.searchQuery = '';
    this.filteredProducts = [];
  }

  // Component class ke andar
  handleSearch(value: string) {
    if (value.trim()) {
      console.log("Searching for:", value);
      // Yahan search results page par navigate karein
      // Close modal manually if needed:
      // bootstrap.Modal.getInstance(document.getElementById('searchModal')).hide();
    }
  }
}