import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  AdminCategoryListPayload,
  AdminDashboardPayload,
  AdminOrderListPayload,
  AdminUserListPayload,
  AuthResponse,
  AuthUser,
  CartPayload,
  Category,
  DashboardPayload,
  HomePayload,
  PlaceOrderPayload,
  PlaceOrderResponse,
  Product,
  ProductDetailPayload,
  ProductUpsertPayload,
  ProductsPayload,
  UserCart,
  UserOrder
} from './api.types';
import { environment } from '../../enviroments/enviroment';

type ProductImageUploadResponse = {
  message: string;
  fileName: string;
  url: string;
};

const resolveApiOrigin = (): string => {
  const configured = String(environment.apiUrl || '').trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  if (typeof window === 'undefined') {
    return '';
  }
  if (window.location.port === '4200') {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }
  return window.location.origin;
};

const normalizeUser = (user: Partial<AuthUser> & { _id?: string } | null | undefined): AuthUser => ({
  id: user?.id || user?._id || '',
  name: user?.name || '',
  email: user?.email || '',
  role: (user?.role as 'customer' | 'admin') || 'customer',
  isEmailVerified: user?.isEmailVerified,
  createdAt: user?.createdAt
});

const normalizeProduct = (product: Partial<Product> | null | undefined): Product => ({
  _id: product?._id || '',
  name: product?.name || '',
  slug: product?.slug || '',
  category: product?.category || '',
  categoryId: product?.categoryId || null,
  tags: product?.tags || [],
  imageUrl: resolveAssetUrl(product?.imageUrl || ''),
  gallery: (product?.gallery?.length ? product.gallery : product?.imageUrl ? [product.imageUrl] : []).map((url) => resolveAssetUrl(url)),
  description: product?.description || '',
  price: Number(product?.price || 0),
  oldPrice: product?.oldPrice ?? null,
  discount: product?.discount ?? null,
  rating: Number(product?.rating || 0),
  reviewsCount: Number(product?.reviewsCount || 0),
  colors: product?.colors || [],
  sizes: product?.sizes || [],
  stock: Number(product?.stock || 0),
  isActive: product?.isActive,
  createdAt: product?.createdAt,
  updatedAt: product?.updatedAt
});

const resolveAssetUrl = (url: string): string => {
  const value = String(url || '').trim();
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  const origin = resolveApiOrigin();
  if (!origin) return value;
  return `${origin}${value.startsWith('/') ? '' : '/'}${value}`;
};

const toApiPathUrl = (url: string): string => {
  const value = String(url || '').trim();
  if (!value) return '';
  const marker = '/uploads/';
  const index = value.indexOf(marker);
  if (index >= 0) {
    return value.slice(index);
  }
  return value;
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  private get baseUrl(): string {
    return `${resolveApiOrigin()}/api`;
  }

  getHome(): Observable<HomePayload> {
    return this.http.get<HomePayload>(`${this.baseUrl}/home`).pipe(
      map((payload) => ({
        ...payload,
        newArrivals: (payload.newArrivals || []).map(normalizeProduct),
        topSelling: (payload.topSelling || []).map(normalizeProduct),
        featured: (payload.featured || []).map(normalizeProduct)
      }))
    );
  }

  getProducts(filters: Record<string, string | number> = {}): Observable<ProductsPayload> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<ProductsPayload>(`${this.baseUrl}/products`, { params }).pipe(
      map((payload) => ({
        ...payload,
        items: (payload.items || []).map(normalizeProduct)
      }))
    );
  }

  getProduct(slug: string): Observable<ProductDetailPayload> {
    return this.http.get<Partial<ProductDetailPayload>>(`${this.baseUrl}/products/${slug}`).pipe(
      map((payload) => ({
        product: normalizeProduct(payload.product),
        reviews: payload.reviews || [],
        recommendations: (payload.recommendations || []).map(normalizeProduct)
      }))
    );
  }

  getCartSummary(): Observable<CartPayload> {
    return this.http.get<CartPayload>(`${this.baseUrl}/cart/summary`);
  }

  getCart(): Observable<UserCart> {
    return this.http.get<UserCart>(`${this.baseUrl}/cart`);
  }

  addToCart(productId: string, quantity: number): Observable<UserCart> {
    return this.http.post<UserCart>(`${this.baseUrl}/cart/add`, { productId, quantity });
  }

  updateCartItem(productId: string, quantity: number): Observable<UserCart> {
    return this.http.put<UserCart>(`${this.baseUrl}/cart/update`, { productId, quantity });
  }

  removeFromCart(productId: string): Observable<UserCart> {
    return this.http.delete<UserCart>(`${this.baseUrl}/cart/remove`, { body: { productId } });
  }

  getDashboardOverview(): Observable<DashboardPayload> {
    return this.http.get<DashboardPayload>(`${this.baseUrl}/dashboard/overview`);
  }

  subscribe(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/newsletter/subscribe`, { email });
  }

  signup(payload: { name: string; email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/signup`, payload).pipe(
      map((response) => ({ ...response, user: normalizeUser(response.user) }))
    );
  }

  login(payload: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, payload).pipe(
      map((response) => ({ ...response, user: normalizeUser(response.user) }))
    );
  }

  getMe(): Observable<{ user: AuthUser }> {
    return this.http.get<{ user: AuthUser }>(`${this.baseUrl}/auth/me`).pipe(
      map((response) => ({ user: normalizeUser(response.user) }))
    );
  }

  verifyEmail(token: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/auth/verify-email`, { token });
  }

  forgotPassword(email: string): Observable<{ message: string; resetToken?: string }> {
    return this.http.post<{ message: string; resetToken?: string }>(`${this.baseUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/auth/reset-password`, { token, newPassword });
  }

  getUserProfile(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.baseUrl}/users/profile`).pipe(map(normalizeUser));
  }

  updateUserProfile(payload: { name: string; email: string }): Observable<AuthUser> {
    return this.http.put<AuthUser>(`${this.baseUrl}/users/profile`, payload).pipe(map(normalizeUser));
  }

  getUserOrders(): Observable<UserOrder[]> {
    return this.http.get<UserOrder[]>(`${this.baseUrl}/users/orders`);
  }

  placeOrder(payload: PlaceOrderPayload): Observable<PlaceOrderResponse> {
    return this.http.post<PlaceOrderResponse>(`${this.baseUrl}/orders`, payload);
  }

  cancelOrder(orderId: string): Observable<{ message: string; order: UserOrder }> {
    return this.http.put<{ message: string; order: UserOrder }>(`${this.baseUrl}/orders/${orderId}/cancel`, {});
  }

  getAdminDashboard(): Observable<AdminDashboardPayload> {
    return this.http.get<AdminDashboardPayload>(`${this.baseUrl}/admin/dashboard`);
  }

  getAdminOrders(filters: Record<string, string> = {}): Observable<AdminOrderListPayload> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });
    return this.http.get<AdminOrderListPayload>(`${this.baseUrl}/admin/orders`, { params });
  }

  getAdminUsers(filters: Record<string, string> = {}): Observable<AdminUserListPayload> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });
    return this.http.get<AdminUserListPayload>(`${this.baseUrl}/admin/users`, { params });
  }

  getAdminCategories(): Observable<AdminCategoryListPayload> {
    return this.http.get<AdminCategoryListPayload>(`${this.baseUrl}/admin/categories`);
  }

  getAdminProducts(filters: Record<string, string | number> = {}): Observable<ProductsPayload> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<ProductsPayload>(`${this.baseUrl}/admin/products`, { params }).pipe(
      map((payload) => ({
        ...payload,
        items: (payload.items || []).map(normalizeProduct)
      }))
    );
  }

  updateOrderStatus(orderId: string, status: string): Observable<UserOrder> {
    return this.http.put<UserOrder>(`${this.baseUrl}/orders/${orderId}/status`, { status });
  }

  updateOrderPaymentStatus(orderId: string, paymentStatus: string, paymentTransactionId?: string): Observable<UserOrder> {
    return this.http.put<UserOrder>(`${this.baseUrl}/orders/${orderId}/payment-status`, { paymentStatus, paymentTransactionId });
  }

  getUsers(): Observable<AuthUser[]> {
    return this.http.get<Array<AuthUser & { _id?: string }>>(`${this.baseUrl}/users`).pipe(
      map((users) => users.map(normalizeUser))
    );
  }

  updateUserRole(userId: string, role: 'admin' | 'customer'): Observable<AuthUser> {
    return this.http.put<AuthUser>(`${this.baseUrl}/users/${userId}/role`, { role }).pipe(map(normalizeUser));
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${userId}`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }

  createCategory(payload: { name: string; description: string; isActive?: boolean }): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/categories`, payload);
  }

  updateCategory(categoryId: string, payload: { name: string; description: string; isActive?: boolean }): Observable<Category> {
    return this.http.put<Category>(`${this.baseUrl}/categories/${categoryId}`, payload);
  }

  deleteCategory(categoryId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/categories/${categoryId}`);
  }

  createProduct(payload: ProductUpsertPayload): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/products`, payload).pipe(map(normalizeProduct));
  }

  uploadProductImage(file: File): Observable<ProductImageUploadResponse> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<ProductImageUploadResponse>(`${this.baseUrl}/products/upload`, formData).pipe(
      map((response) => ({ ...response, url: resolveAssetUrl(response.url) }))
    );
  }

  replaceProductMainImage(productId: string, file: File): Observable<Product> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.put<{ product: Product }>(`${this.baseUrl}/products/${productId}/image`, formData).pipe(
      map((response) => normalizeProduct(response.product))
    );
  }

  deleteProductImage(productId: string, imageUrl: string): Observable<Product> {
    return this.http.delete<{ product: Product }>(`${this.baseUrl}/products/${productId}/image`, {
      body: { url: toApiPathUrl(imageUrl) }
    }).pipe(
      map((response) => normalizeProduct(response.product))
    );
  }

  updateProduct(productId: string, payload: Partial<ProductUpsertPayload>): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/products/${productId}`, payload).pipe(map(normalizeProduct));
  }

  deleteProduct(productId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/products/${productId}`);
  }
}
