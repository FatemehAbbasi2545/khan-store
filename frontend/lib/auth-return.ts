// Only known destinations can be used after authentication.
export function accountDestination(value: string | null): string {
  return value === '/checkout' ? '/checkout' : '/account/orders';
}

export const CHECKOUT_LOGIN_URL = '/account/login?next=%2Fcheckout';
