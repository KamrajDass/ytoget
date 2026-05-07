import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class Data {

  private baseUrl = 'http://localhost:4000/api';

  // Signal to store API data
  homeData = signal<any>(null);
  // Service class ke andar


  constructor(private http: HttpClient) { }

  // API call
  fetchHome() {
    this.http.get(`${this.baseUrl}/home`).subscribe({
      next: (data) => {
        this.homeData.set(data);
      }
    });
  }



  getDashboardData() {
    const token = localStorage.getItem('token'); // Ya jahan bhi aapne token save kiya hai

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.baseUrl}/admin/dashboard`, { headers });
  }

  getToken() {
    return localStorage.getItem('token');
  }

}