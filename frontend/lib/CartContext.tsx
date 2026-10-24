'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api, ApiError } from './api';
import { cartLoader } from './cart-session';
import { getCartToken, setCartToken, clearCartToken } from './cart-token';
import type { Cart, Occasion } from './types';
import { SHOP_ENABLED } from './site';

interface GiftOptions {
  occasion?: Occasion;
  greetingCard?: string;
  message?: string;
  isAnonymous?: boolean;
}

interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  pending: boolean;
  error: string | null;
  addItem: (productId: string, quantity?: number, gift?: GiftOptions) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
  resetCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const generation = useRef(0);
  const [error, setError] = useState<string | null>(null);

  const loader = useRef(cartLoader(api, { get: getCartToken, set: setCartToken },
    (error) => error instanceof ApiError && error.status === 404));
  const ensureCart = useCallback(() => loader.current(), []);

  const refresh = useCallback(async () => {
    const current = generation.current;
    if (!SHOP_ENABLED) {
      // Ordering is switched off: don't create carts on the server.
      setCart(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const c = await ensureCart();
      if (current === generation.current) setCart(c);
    } catch (err: any) {
      if (current === generation.current) setError(err?.message ?? 'ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.');
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [ensureCart]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const mutate = useCallback((operation: (token: string) => Promise<Cart>) => {
    const version = generation.current;
    const task = queue.current.catch(() => {}).then(async () => {
      if (version !== generation.current) throw new Error('سبد خرید تغییر کرده است.');
      setPending(true); setError(null);
      try {
        const current = await ensureCart();
        if (version !== generation.current) throw new Error('سبد خرید تغییر کرده است.');
        const updated = await operation(current.token);
        if (version === generation.current) setCart(updated);
      } catch (error) {
        if (version === generation.current) setError(error instanceof Error ? error.message : 'عملیات سبد ناموفق بود.');
        throw error;
      } finally { if (version === generation.current) setPending(false); }
    });
    queue.current = task;
    return task;
  }, [ensureCart]);

  const addItem = useCallback((productId: string, quantity = 1, gift?: GiftOptions) =>
    mutate((token) => api.addCartItem(token, productId, quantity, gift)), [mutate]);

  const updateItem = useCallback((itemId: string, quantity: number) =>
    mutate((token) => api.updateCartItem(token, itemId, quantity)), [mutate]);

  const removeItem = useCallback((itemId: string) => mutate((token) => api.removeCartItem(token, itemId)), [mutate]);

  const resetCart = useCallback(async () => {
    generation.current++;
    loader.current.invalidate();
    setPending(false);
    clearCartToken();
    setCart(null);
    await refresh();
  }, [refresh]);

  return (
    <CartContext.Provider value={{ cart, loading, pending, error, addItem, updateItem, removeItem, refresh, resetCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
