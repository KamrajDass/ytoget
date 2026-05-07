export type Product = {
  _id: string;
  name: string;
  slug: string;
  category: string;
  categoryId?: string | null;
  tags: string[];
  imageUrl: string;
  gallery: string[];
  description: string;
  price: number;
  oldPrice: number | null;
  discount: string | null;
  rating: number;
  reviewsCount: number;
  colors: string[];
  sizes: string[];
  stock: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductUpsertPayload = {
  name: string;
  category: string;
  categoryId?: string | null;
  tags?: string[];
  imageUrl: string;
  gallery?: string[];
  description?: string;
  price: number;
  oldPrice?: number | null;
  discount?: string | null;
  colors?: string[];
  sizes?: string[];
  stock: number;
  isActive?: boolean;
};

export type Review = {
  _id: string;
  productSlug: string;
  customerName: string;
  verified: boolean;
  rating: number;
  comment: string;
  postedAt: string;
};

export type HomePayload = {
  announcement: string;
  navLinks: string[];
  hero: {
    heading: string;
    description: string;
    ctaLabel: string;
    imageUrl: string;
  };
  stats: Array<{ value: string; label: string }>;
  brands: string[];
  newArrivals: Product[];
  topSelling: Product[];
  dressStyles: Array<{ id: number; title: string; imageUrl: string }>;
  happyCustomers: Array<{ customerName: string; verified: boolean; rating: number; comment: string }>;
  featured: Product[];
};

export type ProductsPayload = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: Product[];
  summary?: {
    total: number;
    active: number;
    inactive: number;
    lowStock: number;
    outOfStock: number;
  };
};

export type ProductDetailPayload = {
  product: Product;
  reviews: Review[];
  recommendations: Product[];
};

export type CartPayload = {
  _id: string;
  customerName: string;
  status: string;
  items: Array<{ productSlug: string; productName: string; quantity: number; price: number }>;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
};

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
};

export type UserCart = {
  items: CartItem[];
  subtotal: number;
  total: number;
};

export type DashboardPayload = {
  stats: {
    productsCount: number;
    ordersCount: number;
    completedOrders: number;
    revenue: number;
  };
  revenueTrend: { labels: string[]; values: number[] };
  topProducts: Array<{ name: string; salesScore: number }>;
  recentOrders: Array<{ _id: string; customerName: string; total: number; status: string; createdAt: string }>;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  isEmailVerified?: boolean;
  createdAt?: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
  verificationToken?: string;
};

export type UserOrder = {
  _id: string;
  user?: string | null;
  customerName: string;
  status: string;
  items?: Array<{ productSlug: string; productName: string; quantity: number; price: number }>;
  subtotal: number;
  total: number;
  discount?: number;
  deliveryFee?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentTransactionId?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type DeliveryAddressPayload = {
  fullName: string;
  street: string;
  city: string;
  state?: string;
  zip?: string;
  country?: string;
  phone: string;
};

export type PlaceOrderPayload = {
  paymentMethod: 'cod' | 'stripe' | 'razorpay';
  discount?: number;
  deliveryFee?: number;
  deliveryAddress?: DeliveryAddressPayload;
};

export type PlaceOrderResponse = {
  message: string;
  order: UserOrder;
  payment: null | {
    provider: string;
    mode: string;
    clientSecret?: string;
    transactionId?: string;
    orderId?: string;
    amount?: number;
    currency?: string;
  };
};

export type Category = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminDashboardPayload = {
  totals: {
    users: number;
    products: number;
    orders: number;
    revenue: number;
  };
  monthlySales: { labels: string[]; values: number[] };
  topSellingProducts: Array<{ id: string; name: string; stock: number; salesScore: number }>;
  orderStatusBreakdown: Array<{ status: string; count: number }>;
  lowStockProducts: Array<{ id: string; name: string; stock: number }>;
  newestUsers: AuthUser[];
};

export type AdminOrderListPayload = {
  items: UserOrder[];
  summary: {
    total: number;
    pending: number;
    processing: number;
    paid: number;
    revenue: number;
  };
};

export type AdminUserListPayload = {
  items: AuthUser[];
  summary: {
    total: number;
    admins: number;
    customers: number;
    unverified: number;
  };
};

export type AdminCategory = Category & {
  productsCount: number;
};

export type AdminCategoryListPayload = {
  items: AdminCategory[];
  summary: {
    total: number;
    active: number;
    assignedProducts: number;
  };
};
