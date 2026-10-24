import { getCustomerToken } from './customer-token';
import type { Order } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class CustomerAuthError extends Error {}

// Used for protected endpoints (profile, orders, reviews) — a 401 here means
// the stored session token is invalid/expired.
async function customerRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getCustomerToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    cache: 'no-store',
  });

  if (res.status === 401) {
    throw new CustomerAuthError('نشست شما منقضی شده، دوباره وارد شوید');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `درخواست با خطا مواجه شد (${res.status})`);
  }
  return res.json();
}

// Used for register/login — these are public endpoints, so a 401/400 here
// means "wrong password" or similar, never "session expired".
async function publicCustomerRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `درخواست با خطا مواجه شد (${res.status})`);
  }
  return res.json();
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

export interface Captcha {
  question: string;
  token: string;
}

export const customerApi = {
  getCaptcha: () => publicCustomerRequest<Captcha>('/captcha'),

  register: (name: string, phone: string, password: string, confirmPassword: string) =>
    publicCustomerRequest<{ token: string; name: string }>('/customers/register', {
      method: 'POST',
      body: JSON.stringify({ name, phone, password, confirmPassword }),
    }),

  login: (phone: string, password: string, captchaToken: string, captchaAnswer: number) =>
    publicCustomerRequest<{ token: string; name: string }>('/customers/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password, captchaToken, captchaAnswer }),
    }),

  getProfile: () => customerRequest<CustomerProfile>('/customers/me'),

  getOrders: () => customerRequest<Order[]>('/customers/me/orders'),

  submitReview: (orderId: string, productId: string, rating: number, comment?: string) =>
    customerRequest<{ id: string }>('/customers/me/reviews', {
      method: 'POST',
      body: JSON.stringify({ orderId, productId, rating, comment }),
    }),

  getReviewedItems: () => customerRequest<string[]>('/customers/me/reviewed-items'),

  submitContact: (name: string, phone: string, email: string, message: string) =>
    publicCustomerRequest<{ id: string }>('/contact', {
      method: 'POST',
      body: JSON.stringify({ name, phone, email, message }),
    }),
};
