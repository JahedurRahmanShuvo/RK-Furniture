export interface Product {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  isTrending?: boolean;
  image: string;
  images: string[];
  category: string;
  description?: string;
  discountPercent?: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'completed';

export interface OrderProduct {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string; // e.g. "20260524-11275833"
  orderNumber: string;
  date: string; // e.g. "May 24, 2026 at 11:27 AM"
  customerName: string;
  customerMobile: string;
  deliveryAddress: string;
  shippingArea: string;
  shippingCharge: number;
  paymentMethod: string;
  subtotal: number;
  total: number;
  status: OrderStatus;
  products: OrderProduct[];
  note?: string;
}

export interface WishlistItem {
  productId: string;
}

export interface ShippingAddress {
  id: string;
  name: string;
  mobile: string;
  email: string;
  address: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  isLoggedIn: boolean;
}

export interface ShippingArea {
  id: string;
  name: string;
  charge: number;
}
