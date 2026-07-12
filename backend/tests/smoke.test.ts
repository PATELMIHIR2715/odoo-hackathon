import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';

process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT ?? '4000';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://user:pass@localhost:5432/transitops';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? '12345678901234567890123456789012';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? '12345678901234567890123456789013';
process.env.FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

let server: Server;
let baseUrl: string;

before(async () => {
  const { app } = await import('../src/index.js');
  server = createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server did not start');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe('TransitOps smoke tests', () => {
  it('returns the standard success envelope for health', async () => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.message, 'SUCCESS');
    assert.deepEqual(body.data, { status: 'ok' });
  });

  it('returns the standard error envelope for not found routes', async () => {
    const response = await fetch(`${baseUrl}/missing-route`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.success, false);
    assert.equal(body.code, 'NOT_FOUND');
    assert.match(String(body.error), /Route GET \/missing-route was not found/);
  });

  it('returns validation errors in the shared format', async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bad-email' }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.error, 'VALIDATION_ERROR');
    assert.ok(Array.isArray(body.field));
  });
});
