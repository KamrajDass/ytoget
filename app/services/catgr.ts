import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from '../models/category';

@Injectable({
  providedIn: 'root',
})
export class Catgr {

  private baseUrl = 'http://localhost:4000/api';

  constructor(private http: HttpClient) { }

  getToken() {
    return localStorage.getItem('token');
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }

  // Admin
  addCategory(data: any) {
    return this.http.post(
      `${this.baseUrl}/categories`,
      data,
      {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      }
    );
  }

  updateCategory(id: string, data: any) {
    return this.http.put(`${this.baseUrl}/categories/${id}`, data, {
      headers: {
        Authorization: `Bearer ${this.getToken()}`
      }
    });
  }

  deleteCategory(id: string) {
    return this.http.delete(
      `${this.baseUrl}/categories/${id}`,
      {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      }
    );
  }

}