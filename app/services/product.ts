import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Product {

  private baseUrl = 'http://localhost:4000/api';

  constructor(private http: HttpClient) { }
  getProducts(page: number = 2, limit: number = 10) {
    return this.http.get(
      `http://localhost:4000/api/products?page=${page}&limit=${limit}`
    );
  }

  getProductDetails(slug: string) {
    return this.http.get(`http://localhost:4000/api/products/${slug}`);
  }

  getProductReviews(slug: string) {
    return this.http.get(`http://localhost:4000/api/products/${slug}/reviews`);
  }
  // products.service.ts
  getProductsByCategory(categorySlug: string, page: number = 1, limit: number = 10) {
    return this.http.get(`http://localhost:4000/api/products`, {
      params: { category: categorySlug, page: page.toString(), limit: limit.toString() }
    });
  }

  // data.service.ts mein
  getProductById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/products/${id}`);
  }


  addProduct(data: any) {
    return this.http.post(
      `${this.baseUrl}/products`,
      data,
      {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      }
    );
  }

  updateProduct(id: string, data: any) {
    return this.http.put(`${this.baseUrl}/products/${id}`, data, {
      headers: {
        Authorization: `Bearer ${this.getToken()}`
      }
    });
  }

  deleteProduct(id: string) {
    return this.http.delete(`${this.baseUrl}/products/${id}`, {
      headers: {
        Authorization: `Bearer ${this.getToken()}`
      }
    });
  }


  getToken() {
    return localStorage.getItem('token');
  }
}
