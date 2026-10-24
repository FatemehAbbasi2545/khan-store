// A shared in-flight load prevents Strict Mode and early clicks creating two
// carts. Only an explicit 404 may replace an existing token.
export function cartLoader<T extends { token: string }>(
  client: { createCart: () => Promise<T>; getCart: (token: string) => Promise<T> },
  storage: { get: () => string | null; set: (token: string) => void },
  isNotFound: (error: unknown) => boolean,
) {
  let pending: Promise<T> | null = null;
  let generation = 0;
  function load(): Promise<T> {
    if (pending) return pending;
    const current = generation;
    pending = (async () => {
      const token = storage.get();
      if (token) {
        try { return await client.getCart(token); }
        catch (error) { if (!isNotFound(error)) throw error; }
      }
      const cart = await client.createCart();
      if (current !== generation) throw new Error('سبد خرید تغییر کرده است. دوباره تلاش کنید.');
      storage.set(cart.token);
      return cart;
    })().finally(() => { if (current === generation) pending = null; });
    return pending;
  }
  return Object.assign(load, { invalidate: () => { generation++; pending = null; } });
}
