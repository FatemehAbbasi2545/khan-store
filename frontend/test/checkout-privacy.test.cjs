const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { NextRequest } = require('next/server');

const filename = path.resolve(__dirname, '../app/api/checkout/route.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const mod = new Module(filename, module);
mod.filename = filename;
mod.paths = Module._nodeModulePaths(path.dirname(filename));
mod._compile(compiled.outputText, filename);
const { POST } = mod.exports;
let originalFetch;
let originalEnv;
beforeEach(() => { originalFetch = global.fetch; originalEnv = process.env.NODE_ENV; process.env.NODE_ENV = 'production'; });
afterEach(() => { global.fetch = originalFetch; if (originalEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = originalEnv; });

test('checkout proxy stores guest grant in a secure HttpOnly cookie, never JSON or URL', async () => {
  global.fetch = async (_url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer customer-token');
    assert.equal(options.headers['Content-Type'], 'application/json');
    return Response.json({ order: { orderNumber: 'KHAN-ONE' }, paymentUrl: 'https://www.zarinpal.com/pay', receiptToken: 'private-receipt' });
  };
  const response = await POST(new NextRequest('https://shop.example/api/checkout', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer customer-token' }, body: JSON.stringify({ cartToken: 'cart' }),
  }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  const cookie = response.headers.get('set-cookie');
  for (const attribute of ['HttpOnly', 'Secure', 'SameSite=lax', 'Path=/checkout/callback', 'Max-Age=604800']) assert(cookie.includes(attribute), attribute);
  const body = await response.json();
  assert.equal(body.paymentUrl, 'https://www.zarinpal.com/pay');
  assert(!JSON.stringify(body).includes('private-receipt'));
});

test('backend error does not set receipt cookie or expose backend response fields', async () => {
  global.fetch = async () => Response.json({ message: 'invalid order', receiptToken: 'private-receipt' }, { status: 400 });
  const response = await POST(new NextRequest('https://shop.example/api/checkout', { method: 'POST', headers: { Authorization: 'Bearer customer-token' }, body: '{}' }));
  assert.equal(response.status, 400);
  assert.equal(response.headers.get('set-cookie'), null);
  assert.deepEqual(await response.json(), { message: 'invalid order' });
});

test('malformed upstream grant or cookie name fails without creating a cookie', async () => {
  for (const orderNumber of ['bad; cookie=value', undefined]) {
    global.fetch = async () => Response.json({ order: { orderNumber }, paymentUrl: 'https://www.zarinpal.com/pay', receiptToken: 'token' });
    const response = await POST(new NextRequest('https://shop.example/api/checkout', { method: 'POST', headers: { Authorization: 'Bearer customer-token' }, body: '{}' }));
    assert.equal(response.status, 502);
    assert.equal(response.headers.get('set-cookie'), null);
  }
});

test('guest checkout is rejected without contacting the backend', async () => {
  global.fetch = async () => { throw new Error('must not contact backend'); };
  for (const authorization of [null, '', 'Bearer ', 'Basic secret']) {
    const response = await POST(new NextRequest('https://shop.example/api/checkout', {
      method: 'POST', headers: authorization ? { Authorization: authorization } : {}, body: '{}',
    }));
    assert.equal(response.status, 401);
    assert.equal(response.headers.get('set-cookie'), null);
  }
});

test('expired session from backend remains a 401 and does not issue a receipt', async () => {
  global.fetch = async () => Response.json({ message: 'expired' }, { status: 401 });
  const response = await POST(new NextRequest('https://shop.example/api/checkout', {
    method: 'POST', headers: { Authorization: 'Bearer expired-token' }, body: '{}',
  }));
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('set-cookie'), null);
});

test('post-login redirect allows checkout and rejects external or unexpected destinations', () => {
  const redirectFile = path.resolve(__dirname, '../lib/auth-return.ts');
  const output = ts.transpileModule(fs.readFileSync(redirectFile, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  const redirectModule = new Module(redirectFile, module);
  redirectModule._compile(output.outputText, redirectFile);
  const { accountDestination } = redirectModule.exports;
  assert.equal(accountDestination('/checkout'), '/checkout');
  for (const value of [null, '', 'https://evil.example', '//evil.example', '/admin', '/\\evil.example', '%2F%2Fevil.example']) {
    assert.equal(accountDestination(value), '/account/orders');
  }
});

function localModule(relative) {
  const file = path.resolve(__dirname, relative);
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const loaded = new Module(file, module); loaded._compile(compiled.outputText, file); return loaded.exports;
}

test('JSON-LD serializer prevents closing-script injection while preserving original values', () => {
  const { safeJson } = localModule('../lib/safe-json.ts');
  const input = { description: '</script><script>alert(1)</script>', name: 'Flower\u2028Name' };
  const encoded = safeJson(input);
  assert(!encoded.includes('<'));
  assert(!encoded.includes('</script>'));
  assert.deepEqual(JSON.parse(encoded), input);
});

test('temporary cart fetch failure preserves the existing token and does not create a replacement', async () => {
  const { cartLoader } = localModule('../lib/cart-session.ts');
  let token = 'existing-token', creates = 0;
  const load = cartLoader({ createCart: async () => { creates++; return { token: 'new' }; }, getCart: async () => { throw { status: 503 }; } },
    { get: () => token, set: (value) => { token = value; } }, (error) => error.status === 404);
  await assert.rejects(load()); assert.equal(token, 'existing-token'); assert.equal(creates, 0);
});

test('only an explicit missing cart replaces the token and concurrent loading creates one cart', async () => {
  const { cartLoader } = localModule('../lib/cart-session.ts');
  let token = 'gone', creates = 0;
  const load = cartLoader({ createCart: async () => { creates++; return { token: 'new' }; }, getCart: async () => { throw { status: 404 }; } },
    { get: () => token, set: (value) => { token = value; } }, (error) => error.status === 404);
  const results = await Promise.all([load(), load(), load()]);
  assert.equal(creates, 1); assert.equal(token, 'new'); assert(results.every((cart) => cart.token === 'new'));
});

test('payment retry uses the authenticated order endpoint and keeps the receipt private', async () => {
  global.fetch = async (url, options) => {
    assert(url.endsWith('/orders/KHAN-ONE/payment'));
    assert.equal(options.headers.Authorization, 'Bearer customer-token');
    return Response.json({ order: { orderNumber: 'KHAN-ONE' }, receiptToken: 'private', paymentUrl: 'https://www.zarinpal.com/pay' });
  };
  const response = await POST(new NextRequest('https://shop.example/api/checkout', {
    method: 'POST', headers: { Authorization: 'Bearer customer-token' }, body: JSON.stringify({ retryOrderNumber: 'KHAN-ONE' }),
  }));
  assert.equal(response.status, 200); assert(!JSON.stringify(await response.json()).includes('receiptToken'));
});

test('a canceled cart creation cannot restore a token after logout', async () => {
  const { cartLoader } = localModule('../lib/cart-session.ts');
  let resolve, token = null;
  const load = cartLoader({ createCart: () => new Promise((done) => { resolve = done; }), getCart: async () => ({ token: 'unused' }) },
    { get: () => token, set: (value) => { token = value; } }, () => false);
  const pending = load();
  load.invalidate(); resolve({ token: 'old-session-cart' });
  await assert.rejects(pending); assert.equal(token, null);
});
