require('reflect-metadata');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { Module } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { JwtService } = require('@nestjs/jwt');
const { OrdersController } = require('../dist/src/orders/orders.controller');
const { OrdersService } = require('../dist/src/orders/orders.service');
const { CartController } = require('../dist/src/cart/cart.controller');
const { CartService } = require('../dist/src/cart/cart.service');
const { CustomerAuthGuard } = require('../dist/src/auth/customer-auth.guard');
const { AdminAuthGuard } = require('../dist/src/auth/admin-auth.guard');
const { jwtOptions } = require('../dist/src/auth/jwt-config');

const secret = crypto.randomBytes(48).toString('hex');
const jwt = new JwtService(jwtOptions(secret));
const order = {
  id: 'order-one', orderNumber: 'KHAN-ONE', customerId: 'customer-one',
  customerName: 'private-name', phone: 'private-phone', address: 'private-address',
  paymentAuthority: 'private-authority', status: 'PROCESSING', totalToman: 1000, paymentRefId: '12345',
};
let queries = [];
let createdFor = [];
const prisma = { order: { findFirst: async ({ where, select }) => {
  queries.push({ where, select });
  if (!Object.entries(where).every(([key, value]) => order[key] === value)) return null;
  return Object.fromEntries(Object.keys(select).filter((key) => select[key]).map((key) => [key, order[key]]));
} } };
const service = new OrdersService(prisma, {}, jwt);
const controllerService = {
  findByOrderNumber: service.findByOrderNumber.bind(service),
  createOrder: async (_dto, customerId) => {
    createdFor.push(customerId);
    return { order, paymentUrl: 'https://www.zarinpal.com/pg/StartPay/real' };
  },
};
const guestCart = { token: 'guest-cart-token', items: [], subtotalToman: 0 };
const cartService = {
  createCart: async () => guestCart,
  getByToken: async () => guestCart,
  addItem: async (_token, productId, quantity) => {
    guestCart.items.push({ productId, quantity });
    guestCart.subtotalToman += quantity * 1000;
    return guestCart;
  },
};
let app;
let base;
before(async () => {
  class TestModule {}
  Module({
    controllers: [OrdersController, CartController],
    providers: [{ provide: OrdersService, useValue: controllerService }, { provide: CartService, useValue: cartService }, { provide: JwtService, useValue: jwt }],
  })(TestModule);
  app = await NestFactory.create(TestModule, { logger: false });
  await app.listen(0, '127.0.0.1');
  base = await app.getUrl();
});
after(async () => { if (app) await app.close(); });

function token(payload, options) { return jwt.sign(payload, options); }
function read(orderNumber = 'KHAN-ONE', bearer) {
  return fetch(`${base}/orders/${orderNumber}`, { headers: bearer ? { Authorization: `Bearer ${bearer}` } : {} });
}
function receipt(orderId = order.id, options = {}) {
  return token({ role: 'order-receipt', orderId }, { expiresIn: '7d', audience: 'order-receipt', ...options });
}

test('anonymous order lookup is denied before querying the database', async () => {
  queries = [];
  for (const number of ['KHAN-ONE', 'KHAN-NONEXISTENT']) {
    const res = await read(number);
    assert.equal(res.status, 401);
    assert(!JSON.stringify(await res.json()).includes('private-'));
  }
  assert.equal(queries.length, 0);
});

test('invalid, expired, incorrectly signed and unsupported-role tokens are denied', async () => {
  queries = [];
  for (const bearer of [
    'garbage', token({ role: 'customer', customerId: order.customerId }, { expiresIn: -1 }),
    new JwtService({ secret: 'khan-dev-secret-change-me' }).sign({ role: 'admin' }),
    token({ role: 'unknown' }), token({ role: 'customer' }),
    receipt(order.id, { audience: 'wrong' }), receipt(order.id, { expiresIn: -1 }),
    token({ role: 'order-receipt' }, { audience: 'order-receipt' }),
  ]) assert.equal((await read('KHAN-ONE', bearer)).status, 401);
  assert.equal(queries.length, 0);
});

test('another customer cannot distinguish someone else\'s order from a missing order', async () => {
  const bearer = token({ role: 'customer', customerId: 'other-customer' });
  const first = await read('KHAN-ONE', bearer);
  const missing = await read('KHAN-MISSING', bearer);
  assert.equal(first.status, 404);
  assert.equal(missing.status, 404);
  assert.deepEqual(await first.json(), await missing.json());
  assert.equal(queries.at(-2).where.customerId, 'other-customer');
});

test('owner and admin receive only receipt fields with private no-store headers', async () => {
  for (const bearer of [token({ role: 'customer', customerId: order.customerId }), token({ role: 'admin' })]) {
    const res = await read('KHAN-ONE', bearer);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('cache-control'), 'private, no-store');
    const data = await res.json();
    assert.deepEqual(data, { orderNumber: 'KHAN-ONE', status: 'PROCESSING', totalToman: 1000, paymentRefId: '12345' });
    assert(!JSON.stringify(data).includes('private-'));
  }
});

test('guest receipt grant works only for its own order and exposes no PII', async () => {
  const bearer = receipt();
  const res = await read('KHAN-ONE', bearer);
  assert.equal(res.status, 200);
  assert(!JSON.stringify(await res.json()).includes('private-'));
  assert.equal((await read('KHAN-ONE', receipt('another-order'))).status, 404);
  assert.equal((await read('KHAN-TWO', bearer)).status, 404);
});

test('checkout issues an expiring receipt grant bound to the created order', async () => {
  const res = await fetch(`${base}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token({ role: 'customer', customerId: order.customerId })}` },
    body: JSON.stringify({ customerId: 'attacker-chosen-customer' }),
  });
  assert.equal(res.status, 201);
  assert.equal(res.headers.get('cache-control'), 'private, no-store');
  const data = await res.json();
  const claims = jwt.verify(data.receiptToken, { audience: 'order-receipt' });
  assert.equal(claims.orderId, order.id);
  assert.equal(claims.role, 'order-receipt');
  assert.equal(claims.exp - claims.iat, 7 * 24 * 60 * 60);
  assert(!JSON.stringify(claims).includes('private-'));
  assert.equal(createdFor.at(-1), order.customerId);
});

test('guest, expired, malformed, admin and receipt tokens cannot initiate checkout', async () => {
  createdFor = [];
  for (const bearer of [undefined, 'bad-token',
    token({ role: 'customer', customerId: order.customerId }, { expiresIn: -1 }),
    token({ role: 'customer' }), token({ role: 'admin' }), receipt(),
  ]) {
    const res = await fetch(`${base}/orders`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) },
      body: '{}',
    });
    assert.equal(res.status, 401);
    assert.equal(res.headers.get('set-cookie'), null);
  }
  assert.equal(createdFor.length, 0);
});

test('order service rejects an unauthenticated caller before any database or payment action', async () => {
  await assert.rejects(service.createOrder({ cartToken: 'guest-cart' }), { status: 401 });
});

test('guest can create, fill and view cart; rejected checkout does not change it', async () => {
  const created = await fetch(`${base}/cart`, { method: 'POST' });
  assert.equal(created.status, 201);
  const { token: cartToken } = await created.json();
  const added = await fetch(`${base}/cart/${cartToken}/items`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: 'flower', quantity: 2 }),
  });
  assert.equal(added.status, 201);
  const snapshot = await added.json();
  const rejected = await fetch(`${base}/orders`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cartToken }),
  });
  assert.equal(rejected.status, 401);
  const viewed = await fetch(`${base}/cart/${cartToken}`);
  assert.equal(viewed.status, 200);
  assert.deepEqual(await viewed.json(), snapshot);
  assert.equal(snapshot.subtotalToman, 2000);
});

test('receipt grants cannot be used as customer or admin sessions', () => {
  const request = { headers: { authorization: `Bearer ${receipt()}` } };
  const context = { switchToHttp: () => ({ getRequest: () => request }) };
  assert.throws(() => new CustomerAuthGuard(jwt).canActivate(context), { status: 401 });
  assert.throws(() => new AdminAuthGuard(jwt).canActivate(context), { status: 401 });
});

test('server refuses missing, short or documented example JWT secrets', () => {
  for (const invalid of [undefined, '', 'short', 'khan-dev-secret-change-me', 'change-me-too-a-long-random-string']) {
    assert.throws(() => jwtOptions(invalid));
  }
  assert.equal(jwtOptions(secret).secret, secret);
});
