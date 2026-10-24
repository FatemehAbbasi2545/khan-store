const KEY = 'khan_cart_token';

export function getCartToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(KEY);
}

export function setCartToken(token: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, token);
}

export function clearCartToken() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
}
