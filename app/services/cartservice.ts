import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Cartservice {

  private baseUrl = 'http://localhost:4000/api';

  private cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSubject.asObservable(); // Isko components watch karenge
  constructor(private http: HttpClient) { }

  getCart(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cart`, { headers: this.getHeaders() })
      .pipe(
        tap((res: any) => {
          // Jab bhi data aaye, count ko update kar do
          const count = res.items?.length || 0;
          this.cartCountSubject.next(count);
        })
      );
  }
  // 2. Add to Cart
  addToCart(productId: string, quantity: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/cart/add`, { productId, quantity }, { headers: this.getHeaders() })
      .pipe(
        tap(() => {
          this.getCart().subscribe();
          console.log("Cart refreshed after adding item");
        })
      );
  }

  // 3. Update Quantity
  updateQuantity(productId: string, quantity: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/cart/update`, { productId, quantity }, { headers: this.getHeaders() });
  }

  // 4. Remove Item
  removeItem(productId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/cart/remove`, {
      headers: this.getHeaders(),
      body: { productId }
    });
  }

  // 1. Pehle ye method create karein
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
}
