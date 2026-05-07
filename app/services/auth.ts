import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {


  private baseUrl = 'http://localhost:4000/api';

  constructor(private http: HttpClient) { }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, credentials).pipe(
      tap((res: any) => {
        // Jab API response sahi aaye, tab user data save karein
        if (res && res.user) {
          localStorage.setItem('user', JSON.stringify(res.user));
          localStorage.setItem('token', res.token); // Token alag save karein
        }
      })
    );
  }
  // Register User
  signup(userData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register`, userData).pipe(
      tap((res: any) => {
        if (res && res.user) {
          localStorage.setItem('user', JSON.stringify(res.user));
          localStorage.setItem('token', res.token); // Token alag save karein
        }
      })
    )
  }

  register(user: { fname: string; lname: string; email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/users/register`, user);
  }

  // data.ts ke andar
  verifyEmail(token: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/auth/verify-email?token=${token}`);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('user');
  }


  Logout() {
    localStorage.removeItem('user')
    localStorage.removeItem('shop_token')
    localStorage.removeItem('token')
    window.location.reload();
  }

  getCurrentUser() {
    return JSON.parse(localStorage.getItem("user") || '{}')
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user.role === 'admin'; // Returns true or false
  }

  getToken() {
    return localStorage.getItem('token');
  }


  deleteUser(id: string) {
    const token = localStorage.getItem('token');

    return this.http.delete(
      `${this.baseUrl}/users/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }


  changeRoleUser(id: string, role: string) {
    const token = localStorage.getItem('token');

    return this.http.put(
      `${this.baseUrl}/users/${id}/role`,
      { role },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }

  updateProfile(data: any) {
    return this.http.put('/users/profile', data, {
      headers: {
        Authorization: `Bearer TOKEN`
      }
    });
  }



  getAllUsers(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    return this.http.get(`${this.baseUrl}/users`, { headers });
  }

}
