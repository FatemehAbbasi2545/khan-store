// Run after a local build with no production API configuration. All API data
// below is synthetic; this script never contacts a payment gateway or database.
const assert = require('node:assert/strict');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const path = require('node:path');

async function main() {
  const seen = [];
  const product = {
    id: 'smoke-product', slug: 'smoke-flower', nameFa: 'Smoke Flower', description: 'Synthetic </script><script>/*unsafe-marker*/</script>',
    priceToman: 1000, images: [], stockStatus: 'IN_STOCK', ratingCount: 0,
    category: { id: 'smoke-category', slug: 'flowers', nameFa: 'Smoke Category' },
  };
  const fixture = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    seen.push(url.pathname + url.search);
    res.setHeader('Content-Type', 'application/json');
    let data;
    if (url.pathname === '/categories') data = [product.category];
    else if (url.pathname === '/products') data = { count: 1, products: [product] };
    else if (url.pathname === '/products/smoke-flower') data = product;
    else if (url.pathname.endsWith('/reviews')) data = { reviews: [], average: 0, count: 0 };
    else if (url.pathname === '/articles') data = [];
    else if (url.pathname === '/articles/smoke-article') data = { title: 'Smoke Article', slug: 'smoke-article', content: 'Synthetic article for upgrade verification', excerpt: 'Smoke excerpt' };
    else if (url.pathname.startsWith('/site-content/')) data = { key: url.pathname.split('/').pop(), value: 'Smoke Content' };
    else if (url.pathname === '/orders/KHAN-TEST' && req.headers.authorization === 'Bearer smoke-receipt') {
      data = { orderNumber: 'KHAN-TEST', status: 'PROCESSING', totalToman: 1000, paymentRefId: '12345' };
    } else { res.statusCode = 404; data = { message: 'not found' }; }
    res.end(JSON.stringify(data));
  });
  // The unconfigured local frontend's default API is localhost:4000.
  await new Promise((resolve, reject) => { fixture.once('error', reject); fixture.listen(4000, resolve); });
  const reservation = http.createServer();
  await new Promise((resolve) => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const base = `http://127.0.0.1:${port}`;
  let output = '';
  const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-H', '127.0.0.1', '-p', String(port)], {
    cwd: path.resolve(__dirname, '..'), env: { ...process.env, NEXT_PUBLIC_API_URL: 'http://localhost:4000' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 80; attempt++) {
      if (child.exitCode !== null) throw new Error(output);
      try { ready = (await fetch(`${base}/account/login`)).ok; } catch {}
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    assert(ready, output);
    const loginHtml = await (await fetch(`${base}/account/login`)).text();
    const cssFiles = [...loginHtml.matchAll(/href="([^"]+\.css[^"]*)"/g)].map((match) => match[1]);
    assert(cssFiles.length > 0);
    const css = (await Promise.all(cssFiles.map(async (file) => (await fetch(new URL(file, base))).text()))).join('\n').toLowerCase();
    assert(css.includes('.bg-ruby') && css.includes('.text-bronze-light') && css.includes('#6b1030'));
    for (const route of ['/account/login?next=%2Fcheckout', '/account/register?next=%2Fcheckout', '/cart', '/checkout', '/story', '/values']) {
      assert.equal((await fetch(base + route)).status, 200, route);
    }
    const catalog = await fetch(`${base}/catalog?category=flowers&search=rose&search=lily`);
    assert.equal(catalog.status, 200);
    assert((await catalog.text()).includes('Smoke Flower'));
    assert(seen.some((entry) => entry.includes('search=rose') && !entry.includes('lily')));
    for (const [route, text] of [['/product/smoke-flower', 'Smoke Flower'], ['/magazine/smoke-article', 'Smoke Article']]) {
      const response = await fetch(base + route);
      assert.equal(response.status, 200);
      const html = await response.text();
      assert(html.includes(text));
      assert(!html.includes('</script><script>/*unsafe-marker*/'));
    }
    const unsigned = await fetch(`${base}/checkout/callback?order=KHAN-TEST&result=success`);
    assert.equal(unsigned.status, 200);
    assert(!(await unsigned.text()).includes('پرداخت با موفقیت انجام شد'));
    const receipt = await fetch(`${base}/checkout/callback?order=KHAN-TEST`, { headers: { Cookie: 'khan_receipt_KHAN-TEST=smoke-receipt' } });
    assert.equal(receipt.status, 200);
    assert((await receipt.text()).includes('پرداخت با موفقیت انجام شد'));
    const guest = await fetch(`${base}/api/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(guest.status, 401);
    assert(!/sync-dynamic-apis|used `params\.|used `searchParams\./.test(output), output);
    console.log('PASS: production routes, async params/searchParams/cookies, receipt privacy and guest checkout rejection.');
  } finally {
    if (child.exitCode === null) { const closed = once(child, 'exit'); child.kill(); await closed; }
    await new Promise((resolve) => fixture.close(resolve));
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
