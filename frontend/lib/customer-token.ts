const KEY = 'khan_customer_token';
const NAME_KEY = 'khan_customer_name';

export function getCustomerToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(KEY);
}

export function setCustomerSession(token: string, name: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, token);
  window.localStorage.setItem(NAME_KEY, name);
}

export function getCustomerName(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(NAME_KEY);
}

export function clearCustomerSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(NAME_KEY);
}
