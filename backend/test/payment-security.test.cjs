const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const { PaymentService } = require('../dist/src/payment/payment.service');
const { OrdersService } = require('../dist/src/orders/orders.service');

let previousEnv;
let previousPost;
beforeEach(() => {
  previousEnv = { ...process.env };
  previousPost = axios.post;
  process.env.NODE_ENV = 'production';
  process.env.ZARINPAL_SANDBOX = 'false';
  process.env.ZARINPAL_MERCHANT_ID = 'test-merchant';
  process.env.ZARINPAL_CALLBACK_URL = 'https://shop.example/orders/payment/callback?keep=yes';
  axios.post = async () => { throw new Error('Unexpected network call in test'); };
});
afterEach(() => {
  process.env = previousEnv;
  axios.post = previousPost;
});

test('mock authorities are never verified, even with missing gateway settings', async () => {
  delete process.env.ZARINPAL_MERCHANT_ID;
  for (const authority of ['MOCK-order', 'mock-order', '', undefined, ['real']]) {
    assert.deepEqual(await new PaymentService().verifyPayment(1000, authority), { verified: false, refId: null });
  }
});

test('missing and placeholder merchant IDs fail closed', async () => {
  for (const id of ['', '00000000-0000-0000-0000-000000000000']) {
    process.env.ZARINPAL_MERCHANT_ID = id;
    await assert.rejects(new PaymentService().requestPayment(1000, 'test', 'order'), { status: 503 });
  }
});

test('production cannot create or verify sandbox payments', async () => {
  process.env.ZARINPAL_SANDBOX = 'true';
  await assert.rejects(new PaymentService().requestPayment(1000, 'test', 'order'), { status: 503 });
  await assert.rejects(new PaymentService().verifyPayment(1000, 'real-authority'), { status: 503 });
});

test('sandbox requires an explicitly non-production environment', async () => {
  process.env.ZARINPAL_SANDBOX = 'true';
  delete process.env.NODE_ENV;
  await assert.rejects(new PaymentService().requestPayment(1000, 'test', 'order'), { status: 503 });
  process.env.NODE_ENV = 'development';
  axios.post = async (url) => {
    assert.match(url, /^https:\/\/sandbox\.zarinpal\.com\//);
    return { data: { data: { code: 100, authority: 'sandbox-authority' } } };
  };
  const result = await new PaymentService().requestPayment(1000, 'test', 'order');
  assert.equal(result.paymentUrl, 'https://sandbox.zarinpal.com/pg/StartPay/sandbox-authority');
});

test('gateway request failure and malformed success never create a mock payment', async () => {
  const payment = new PaymentService();
  await assert.rejects(payment.requestPayment(1000, 'test', 'order'), { status: 503 });
  for (const response of [{ code: -9 }, { code: 100 }, { code: 100, authority: 'MOCK-test' }]) {
    axios.post = async () => ({ data: { data: response } });
    await assert.rejects(payment.requestPayment(1000, 'test', 'order'), { status: 503 });
  }
});

test('real request sends server amount in rials and preserves callback query', async () => {
  axios.post = async (url, body, options) => {
    assert.match(url, /^https:\/\/payment\.zarinpal\.com\//);
    assert.equal(body.amount, 12340);
    const callback = new URL(body.callback_url);
    assert.equal(callback.searchParams.get('order'), 'order & review');
    assert.equal(callback.searchParams.get('keep'), 'yes');
    assert.equal(options.timeout, 15000);
    return { data: { data: { code: 100, authority: 'real-authority' } } };
  };
  const result = await new PaymentService().requestPayment(1234, 'test', 'order & review');
  assert.equal(result.paymentUrl, 'https://www.zarinpal.com/pg/StartPay/real-authority');
});

test('invalid amounts and insecure production callback are rejected', async () => {
  const payment = new PaymentService();
  for (const amount of [0, -1, 1.5, NaN, Number.MAX_SAFE_INTEGER]) {
    await assert.rejects(payment.requestPayment(amount, 'test', 'order'), { status: 400 });
  }
  process.env.ZARINPAL_CALLBACK_URL = 'http://shop.example/callback';
  await assert.rejects(payment.requestPayment(1000, 'test', 'order'), { status: 503 });
});

test('verification requires a bank success code and a valid reference', async () => {
  for (const code of [100, 101]) {
    axios.post = async (_url, body) => {
      assert.equal(body.amount, 10000);
      assert.equal(body.authority, 'real-authority');
      return { data: { data: { code, ref_id: 12345 } } };
    };
    assert.deepEqual(await new PaymentService().verifyPayment(1000, 'real-authority'), { verified: true, refId: '12345' });
  }
  for (const data of [{ code: -51, ref_id: 123 }, { code: 100 }, { code: 100, ref_id: 0 }, { code: 100, ref_id: 'MOCKREF-123' }]) {
    axios.post = async () => ({ data: { data } });
    assert.equal((await new PaymentService().verifyPayment(1000, 'real-authority')).verified, false);
  }
});

test('verification network failure raises a retryable error', async () => {
  await assert.rejects(new PaymentService().verifyPayment(1000, 'real-authority'), { status: 503 });
});

function fixture(overrides = {}) {
  let order = {
    id: 'order-id', orderNumber: 'order', status: 'PENDING_PAYMENT',
    paymentAuthority: 'real-authority', paymentRefId: null, totalToman: 1000, ...overrides,
  };
  let verifications = 0;
  let writes = 0;
  const payment = { verifyPayment: async (amount, authority) => {
    verifications++;
    assert.equal(amount, order.totalToman);
    assert.equal(authority, 'real-authority');
    return { verified: true, refId: '12345' };
  } };
  const prisma = { order: {
    findUnique: async () => ({ ...order }),
    findUniqueOrThrow: async () => ({ ...order }),
    updateMany: async ({ where, data }) => {
      assert.deepEqual(where, { id: order.id, status: 'PENDING_PAYMENT', paymentAuthority: 'real-authority', paymentRefId: null });
      if (Object.entries(where).every(([key, value]) => order[key] === value)) {
        order = { ...order, ...data }; writes++; return { count: 1 };
      }
      return { count: 0 };
    },
  } };
  prisma.$transaction = (action) => action(prisma);
  return {
    service: new OrdersService(prisma, payment), payment, prisma,
    get: () => ({ ...order }), counts: () => ({ verifications, writes }),
    change: (data) => { order = { ...order, ...data }; },
  };
}

test('callback rejects missing, mismatched and legacy mock authorities before verification', async () => {
  const f = fixture();
  for (const authority of [undefined, '', 'other-authority', 'MOCK-order', ['real-authority']]) {
    await assert.rejects(f.service.handlePaymentCallback('order', authority, 'OK'), { status: 400 });
  }
  const legacy = fixture({ paymentAuthority: 'MOCK-order' });
  await assert.rejects(legacy.service.handlePaymentCallback('order', 'MOCK-order', 'OK'), { status: 400 });
  assert.deepEqual(f.counts(), { verifications: 0, writes: 0 });
});

test('cancelled browser callback never cancels an order', async () => {
  const f = fixture();
  assert.equal((await f.service.handlePaymentCallback('order', 'real-authority', 'NOK')).status, 'PENDING_PAYMENT');
  assert.deepEqual(f.counts(), { verifications: 0, writes: 0 });
});

test('paid, delivered and canceled orders are unchanged by repeated callbacks', async () => {
  for (const status of ['PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELED']) {
    // Legacy orders may have no reference; status alone must still protect them.
    for (const paymentRefId of [null, '12345']) {
      const f = fixture({ status, paymentRefId });
      for (const callbackStatus of ['OK', 'NOK']) {
        assert.equal((await f.service.handlePaymentCallback('order', 'real-authority', callbackStatus)).status, status);
      }
      assert.deepEqual(f.counts(), { verifications: 0, writes: 0 });
    }
  }
});

test('simultaneous failed and successful callbacks cannot cancel a verified payment', async () => {
  const f = fixture();
  await Promise.all([
    f.service.handlePaymentCallback('order', 'real-authority', 'OK'),
    f.service.handlePaymentCallback('order', 'real-authority', 'NOK'),
  ]);
  assert.equal(f.get().status, 'PROCESSING');
  assert.equal(f.get().paymentRefId, '12345');
  assert.equal(f.counts().writes, 1);
});

test('delivery completed during verification cannot be rolled back to processing', async () => {
  const f = fixture();
  f.payment.verifyPayment = async () => {
    f.change({ status: 'DELIVERED', paymentRefId: '12345' });
    return { verified: true, refId: '12345' };
  };
  assert.equal((await f.service.handlePaymentCallback('order', 'real-authority', 'OK')).status, 'DELIVERED');
  assert.equal(f.counts().writes, 0);
});

test('bank verification failure preserves the pending order', async () => {
  const f = fixture();
  f.payment.verifyPayment = async () => ({ verified: false, refId: null });
  assert.equal((await f.service.handlePaymentCallback('order', 'real-authority', 'OK')).status, 'PENDING_PAYMENT');
  assert.equal(f.counts().writes, 0);
});

test('verification outage never mutates the pending order', async () => {
  const f = fixture();
  f.payment.verifyPayment = async () => { throw new Error('gateway timeout'); };
  await assert.rejects(f.service.handlePaymentCallback('order', 'real-authority', 'OK'));
  assert.equal(f.get().status, 'PENDING_PAYMENT');
  assert.equal(f.counts().writes, 0);
});

test('simultaneous successful callbacks record payment exactly once', async () => {
  const f = fixture();
  const results = await Promise.all([
    f.service.handlePaymentCallback('order', 'real-authority', 'OK'),
    f.service.handlePaymentCallback('order', 'real-authority', 'OK'),
  ]);
  assert.equal(f.counts().writes, 1);
  assert(results.every((result) => result.status === 'PROCESSING' && result.paymentRefId === '12345'));
});

test('admin cancellation during bank verification is not overwritten', async () => {
  const f = fixture();
  f.payment.verifyPayment = async () => { f.change({ status: 'CANCELED' }); return { verified: true, refId: '12345' }; };
  assert.equal((await f.service.handlePaymentCallback('order', 'real-authority', 'OK')).status, 'CANCELED');
  assert.equal(f.counts().writes, 0);
});
