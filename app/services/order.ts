import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable,  } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Order {

  private baseUrl = 'http://localhost:4000/api';

  constructor(private http: HttpClient) { }


  // 1. Pehle ye method create karein
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // data.service.ts mein
  orders(orderData: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post('http://localhost:4000/api/orders', orderData, { headers });
  }

  // Service mein check karein
  getMyOrders(): Observable<any> {
    return this.http.get(`${this.baseUrl}/orders/my`, {
      headers: this.getHeaders() // Is headers mein valid JWT token hona chahiye
    });
  }

  getOrderDetail(orderId: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get(`${this.baseUrl}/orders/${orderId}`, { headers });
  }

  // Admin specific orders fetch karne ke liye
  getAdminOrders(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get(`${this.baseUrl}/admin/orders`, { headers });
  }



  updateOrderStatus(orderId: string, status: string) {
    const token = localStorage.getItem('token');

    return this.http.put(
      `${this.baseUrl}/orders/${orderId}/status`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    }
    );
  }

  updatePaymentStatus(orderId: string, paymentStatus: string) {
    const token = localStorage.getItem('token');

    return this.http.put(
      `${this.baseUrl}/orders/${orderId}/payment-status`, { paymentStatus }, {
      headers: { Authorization: `Bearer ${token}` }
    }
    );
  }


  cancelOrder(orderId: string) {
    const token = localStorage.getItem('token');

    return this.http.put(
      `${this.baseUrl}/orders/${orderId}/cancel`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
  }

}
