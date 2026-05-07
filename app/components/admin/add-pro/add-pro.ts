import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Data } from '../../../services/data';
import { Product } from '../../../services/product';

@Component({
  selector: 'app-add-pro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-pro.html',
  styleUrl: './add-pro.css',
})// ... baki imports same rahenge

export class AddPro implements OnInit {
  productForm!: FormGroup;
  selectedColors: string[] = [];
  gallery: string[] = []; // Gallery array for multiple image URLs

  private sizeMapping: { [key: string]: string } = {
    'S': 'Small', 'M': 'Medium', 'L': 'Large', 'XL': 'Extra Large', 'XXL': 'Double Extra Large'
  };

  constructor(private fb: FormBuilder, private dataSer: Data, private proSer : Product) { }

  ngOnInit(): void {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(0)]],
      oldPrice: [null],
      stock: [100, Validators.required],
      imageUrl: ['', Validators.required], // Thumbnail
      tempGalleryUrl: [''], // Temporary field for gallery input
      isActive: [true],
      tags: [''],
      tempColor: ['#000000'],
      sizes: [''],
      description: ['', Validators.required]
    });
  }

  // Gallery Functions
  addToGallery() {
    const url = this.productForm.get('tempGalleryUrl')?.value;
    if (url && !this.gallery.includes(url)) {
      this.gallery.push(url);
      this.productForm.get('tempGalleryUrl')?.reset(); // Input clear karne ke liye
    }
  }

  removeFromGallery(index: number) {
    this.gallery.splice(index, 1);
  }

  // Color Functions (Same as before)
  addColor() {
    const color = this.productForm.get('tempColor')?.value;
    if (color && !this.selectedColors.includes(color)) {
      this.selectedColors.push(color);
    }
  }

  removeColor(index: number) {
    this.selectedColors.splice(index, 1);
  }

  submitProduct() {
    if (this.productForm.valid) {
      const rawData = this.productForm.value;

      const fullSizeNames = rawData.sizes
        ? rawData.sizes.split(',').map((s: string) => {
          const key = s.trim().toUpperCase();
          return this.sizeMapping[key] || key;
        }) : [];

      const finalProductData = {
        name: rawData.name,
        slug: rawData.name.toLowerCase().replace(/ /g, '-'),
        category: rawData.category,
        categoryId: null,
        tags: rawData.tags ? rawData.tags.split(',').map((t: string) => t.trim()) : [],
        imageUrl: rawData.imageUrl,
        gallery: this.gallery, // Final gallery array
        description: rawData.description,
        price: rawData.price,
        oldPrice: rawData.oldPrice,
        discount: rawData.oldPrice ? Math.round(((rawData.oldPrice - rawData.price) / rawData.oldPrice) * 100) : null,
        rating: 0,
        reviewsCount: 0,
        colors: this.selectedColors,
        sizes: fullSizeNames,
        stock: rawData.stock,
        isActive: rawData.isActive
      };

      this.proSer.addProduct(finalProductData).subscribe((res: any) => {
        alert('Product added with Gallery!');
        this.productForm.reset();
        this.selectedColors = [];
        this.gallery = [];
      });
    }
  }
}