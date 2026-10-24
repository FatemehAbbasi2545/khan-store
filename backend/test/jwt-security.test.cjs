require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { NestFactory } = require('@nestjs/core');
const { JwtService } = require('@nestjs/jwt');
const { AuthModule } = require('../dist/src/auth/auth.module');
const { AdminAuthGuard } = require('../dist/src/auth/admin-auth.guard');
const { CaptchaService } = require('../dist/src/captcha/captcha.service');
const { jwtOptions } = require('../dist/src/auth/jwt-config');

function context(token) {
  return { switchToHttp: () => ({ getRequest: () => ({ headers: { authorization: `Bearer ${token}` } }) }) };
}
async function withSecret(secret, action) {
  const previous = process.env.ADMIN_JWT_SECRET;
  if (secret === undefined) delete process.env.ADMIN_JWT_SECRET;
  else process.env.ADMIN_JWT_SECRET = secret;
  try { return await action(); }
  finally {
    if (previous === undefined) delete process.env.ADMIN_JWT_SECRET;
    else process.env.ADMIN_JWT_SECRET = previous;
  }
}

test('actual AuthModule startup fails without a valid configured secret', async () => {
  for (const secret of [undefined, '', ' '.repeat(50), 'short', 'khan-dev-secret-change-me', 'change-me-too-a-long-random-string']) {
    await withSecret(secret, async () => {
      await assert.rejects(
        NestFactory.createApplicationContext(AuthModule, { logger: false, abortOnError: false }),
        /ADMIN_JWT_SECRET must be a unique secret/,
      );
    });
  }
});

test('actual AuthModule uses the configured secret and rejects forged tokens from public keys', async () => {
  const secret = crypto.randomBytes(48).toString('hex');
  await withSecret(secret, async () => {
    const app = await NestFactory.createApplicationContext(AuthModule, { logger: false, abortOnError: false });
    try {
      const jwt = app.get(JwtService);
      const guard = app.get(AdminAuthGuard);
      const legitimate = jwt.sign({ role: 'admin' });
      assert.equal(new JwtService({ secret }).verify(legitimate).role, 'admin');
      assert.equal(guard.canActivate(context(legitimate)), true);
      for (const publicSecret of ['khan-dev-secret-change-me', 'change-me-too-a-long-random-string']) {
        const forged = new JwtService({ secret: publicSecret }).sign({ role: 'admin' });
        assert.throws(() => guard.canActivate(context(forged)), { status: 401 });
      }
    } finally { await app.close(); }
  });
});

test('admin guard rejects changed roles, customer tokens, expired tokens and unsigned tokens', () => {
  const jwt = new JwtService(jwtOptions(crypto.randomBytes(48).toString('hex')));
  const guard = new AdminAuthGuard(jwt);
  const customer = jwt.sign({ role: 'customer', customerId: 'customer' });
  const parts = customer.split('.');
  parts[1] = Buffer.from(JSON.stringify({ role: 'admin' })).toString('base64url');
  const unsigned = `${Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')}.${parts[1]}.`;
  for (const value of [customer, parts.join('.'), unsigned, jwt.sign({ role: 'admin' }, { expiresIn: -1 })]) {
    assert.throws(() => guard.canActivate(context(value)), { status: 401 });
  }
});

test('only HS256 is accepted, even if another HMAC algorithm uses the correct key', () => {
  const secret = crypto.randomBytes(48).toString('hex');
  const configured = new JwtService(jwtOptions(secret));
  const alternative = new JwtService({ secret }).sign({ role: 'admin' }, { algorithm: 'HS384' });
  assert.throws(() => new AdminAuthGuard(configured).canActivate(context(alternative)), { status: 401 });
});

test('rotating the configured secret invalidates existing admin tokens', () => {
  const oldJwt = new JwtService(jwtOptions(crypto.randomBytes(48).toString('hex')));
  const newJwt = new JwtService(jwtOptions(crypto.randomBytes(48).toString('hex')));
  const guard = new AdminAuthGuard(newJwt);
  assert.throws(() => guard.canActivate(context(oldJwt.sign({ role: 'admin' }))), { status: 401 });
  assert.equal(guard.canActivate(context(newJwt.sign({ role: 'admin' }))), true);
});

test('CAPTCHA no longer falls back to a public secret', async () => {
  await withSecret(undefined, async () => {
    await assert.rejects(new CaptchaService().generate(), /ADMIN_JWT_SECRET/);
  });
  await withSecret(crypto.randomBytes(48).toString('hex'), async () => {
    const rows = new Map();
    const prisma = { captchaChallenge: {
      create: async ({ data }) => rows.set(data.id, data),
      findUnique: async ({ where }) => rows.get(where.id),
      deleteMany: async ({ where }) => {
        if (!where.id) return { count: 0 };
        return { count: rows.delete(where.id) ? 1 : 0 };
      },
    } };
    const captcha = new CaptchaService(prisma);
    const challenge = await captcha.generate();
    const [a, b] = challenge.question.match(/\d+/g).map(Number);
    assert.equal(await captcha.verify(challenge.token, a + b), true);
  });
});
