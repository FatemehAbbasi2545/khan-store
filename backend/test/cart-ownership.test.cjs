require('reflect-metadata');
const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { Module, ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { CartController } = require('../dist/src/cart/cart.controller');
const { CartService } = require('../dist/src/cart/cart.service');

let items;
let writeCalls;
let beforeWrite;
const carts = [{ id: 'cart-a', token: 'token-a' }, { id: 'cart-b', token: 'token-b' }];
const matches = (row, where) => Object.entries(where).every(([key, value]) => row[key] === value);
const prisma = {
  cart: { findUnique: async ({ where, include }) => {
    const cart = carts.find((row) => matches(row, where));
    if (!cart) return null;
    return { ...cart, ...(include ? { items: items.filter((row) => row.cartId === cart.id).map((row) => ({ ...row })) } : {}) };
  } },
  cartItem: {
    updateMany: async ({ where, data }) => {
      writeCalls++;
      if (beforeWrite) { beforeWrite(); beforeWrite = null; }
      const selected = items.filter((row) => matches(row, where));
      for (const row of selected) Object.assign(row, Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)));
      return { count: selected.length };
    },
    deleteMany: async ({ where }) => {
      writeCalls++;
      if (beforeWrite) { beforeWrite(); beforeWrite = null; }
      const count = items.filter((row) => matches(row, where)).length;
      items = items.filter((row) => !matches(row, where));
      return { count };
    },
    // Model the old operations as well, so regressions would actually mutate
    // the victim record instead of merely failing on an absent mock method.
    update: async ({ where, data }) => {
      writeCalls++;
      const row = items.find((item) => matches(item, where));
      Object.assign(row, Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)));
      return row;
    },
    delete: async ({ where }) => {
      writeCalls++;
      const row = items.find((item) => matches(item, where));
      items = items.filter((item) => !matches(item, where));
      return row;
    },
  },
};
prisma.$transaction = (action) => action(prisma);
prisma.cart.findUniqueOrThrow = prisma.cart.findUnique;
prisma.cart.updateMany = async ({ where }) => ({ count: carts.filter((row) => matches(row, where)).length });
prisma.cart.update = async ({ where }) => carts.find((row) => matches(row, where));
prisma.cartItem.findFirst = async ({ where }) => items.find((row) => matches(row, where)) ?? null;
const service = new CartService(prisma);
let app;
let base;
before(async () => {
  class TestModule {}
  Module({ controllers: [CartController], providers: [{ provide: CartService, useValue: service }] })(TestModule);
  app = await NestFactory.create(TestModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(0, '127.0.0.1');
  base = await app.getUrl();
});
beforeEach(() => {
  items = [
    { id: 'item-a', cartId: 'cart-a', quantity: 2, occasion: null, product: { priceToman: 1000, stockStatus: 'IN_STOCK', images: [] }, message: 'private-a' },
    { id: 'item-b', cartId: 'cart-b', quantity: 3, occasion: 'BIRTHDAY', greetingCard: 'old-card', product: { priceToman: 2000, stockStatus: 'IN_STOCK', images: [] }, message: 'private-b' },
  ];
  writeCalls = 0;
  beforeWrite = null;
});
after(async () => { if (app) await app.close(); });

function mutate(token, id, method, body) {
  return fetch(`${base}/cart/${token}/items/${id}`, {
    method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

test('one cart cannot update another cart\'s quantity or gift fields, in either direction', async () => {
  const original = structuredClone(items);
  for (const [token, id] of [['token-a', 'item-b'], ['token-b', 'item-a']]) {
    const response = await mutate(token, id, 'PATCH', { quantity: 9, occasion: 'ANNIVERSARY', message: 'attacker', greetingCard: 'changed', isAnonymous: true });
    assert.equal(response.status, 404);
    assert(!JSON.stringify(await response.json()).includes('private-'));
  }
  assert.deepEqual(items, original);
});

test('one cart cannot delete another cart\'s item, in either direction', async () => {
  const original = structuredClone(items);
  for (const [token, id] of [['token-a', 'item-b'], ['token-b', 'item-a']]) {
    assert.equal((await mutate(token, id, 'DELETE')).status, 404);
  }
  assert.deepEqual(items, original);
});

test('missing item and foreign item return the same error for update and delete', async () => {
  for (const method of ['PATCH', 'DELETE']) {
    const foreign = await mutate('token-a', 'item-b', method, method === 'PATCH' ? { quantity: 4 } : undefined);
    const absent = await mutate('token-a', 'missing-item', method, method === 'PATCH' ? { quantity: 4 } : undefined);
    assert.equal(foreign.status, 404);
    assert.equal(absent.status, 404);
    assert.deepEqual(await foreign.json(), await absent.json());
  }
});

test('owner can update quantity and receives only their own recalculated cart', async () => {
  const victim = structuredClone(items[1]);
  const response = await mutate('token-a', 'item-a', 'PATCH', { quantity: 5, cartId: 'cart-b' });
  assert.equal(response.status, 200);
  const cart = await response.json();
  assert.equal(cart.subtotalToman, 5000);
  assert.equal(cart.items.length, 1);
  assert.equal(cart.items[0].quantity, 5);
  assert.equal(cart.items[0].cartId, 'cart-a');
  assert.deepEqual(items[1], victim);
});

test('owner can update gift details without affecting other carts', async () => {
  const other = structuredClone(items[0]);
  const response = await mutate('token-b', 'item-b', 'PATCH', { occasion: 'ANNIVERSARY', greetingCard: 'new-card', message: 'new-message', isAnonymous: true });
  assert.equal(response.status, 200);
  const cart = await response.json();
  assert.equal(cart.items[0].message, 'new-message');
  assert.equal(cart.items[0].greetingCard, 'new-card');
  assert.equal(cart.items[0].occasion, 'ANNIVERSARY');
  assert.equal(cart.items[0].isAnonymous, true);
  assert.equal(cart.subtotalToman, 6000);
  assert.deepEqual(items[0], other);
});

test('owner can delete own item without deleting another cart\'s item', async () => {
  const other = structuredClone(items[1]);
  const response = await mutate('token-a', 'item-a', 'DELETE');
  assert.equal(response.status, 200);
  const cart = await response.json();
  assert.deepEqual(cart.items, []);
  assert.equal(cart.subtotalToman, 0);
  assert.deepEqual(items, [other]);
});

test('invalid cart token never reaches a write operation', async () => {
  const original = structuredClone(items);
  assert.equal((await mutate('invalid-token', 'item-a', 'PATCH', { quantity: 9 })).status, 404);
  assert.equal((await mutate('invalid-token', 'item-a', 'DELETE')).status, 404);
  assert.equal(writeCalls, 0);
  assert.deepEqual(items, original);
});

test('ownership is enforced at write time if the item changes cart after token lookup', async () => {
  for (const method of ['PATCH', 'DELETE']) {
    items[0].cartId = 'cart-a';
    beforeWrite = () => { items[0].cartId = 'cart-b'; };
    const response = await mutate('token-a', 'item-a', method, method === 'PATCH' ? { quantity: 9 } : undefined);
    assert.equal(response.status, 404);
    assert.equal(items.length, 2);
    assert.equal(items[0].quantity, 2);
    assert.equal(items[0].cartId, 'cart-b');
  }
});
