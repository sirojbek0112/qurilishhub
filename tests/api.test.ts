import test from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { createAppServer } from '../server.ts';

let baseUrl = '';
let closeServer: () => Promise<void>;

test.before(async () => {
  process.env.NODE_ENV = 'production';
  const { httpServer } = await createAppServer();
  await new Promise<void>((resolve) => {
    httpServer.listen(0, '127.0.0.1', () => {
      const addr = httpServer.address() as AddressInfo;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
  closeServer = () =>
    new Promise<void>((resolve, reject) => {
      httpServer.close((err) => (err ? reject(err) : resolve()));
    });
});

test.after(async () => {
  if (closeServer) await closeServer();
});

test('GET /api/health returns 200 ok', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const json = (await res.json()) as { status: string };
  assert.equal(json.status, 'ok');
});

test('POST /api/estimates/calculate returns itemized UZS estimate with disclaimer', async () => {
  const res = await fetch(`${baseUrl}/api/estimates/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buildingAreaSqm: 200,
      floors: 2,
      constructionType: 'VILLA',
      foundationType: 'STRIP',
      wallMaterial: 'FIRED_BRICK',
      roofType: 'METAL_TILE',
      finishingType: 'STANDARD',
      region: 'Toshkent shahri',
      lang: 'uz',
    }),
  });
  assert.equal(res.status, 200);
  const data = (await res.json()) as { isEstimate: boolean; totalEstimatedUzs: number; items: unknown[] };
  assert.equal(data.isEstimate, true);
  assert.ok(data.totalEstimatedUzs > 0);
  assert.equal(data.items.length, 8);
});

test('RBAC blocks CUSTOMER from /api/admin/overview and allows ADMIN', async () => {
  const custLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@qurilishhub.uz', password: 'Password123!' }),
  });
  const custData = (await custLogin.json()) as { accessToken: string };
  assert.ok(custData.accessToken);

  const forbiddenRes = await fetch(`${baseUrl}/api/admin/overview`, {
    headers: { Authorization: `Bearer ${custData.accessToken}` },
  });
  assert.equal(forbiddenRes.status, 403);

  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@qurilishhub.uz', password: 'Password123!' }),
  });
  const adminData = (await adminLogin.json()) as { accessToken: string };
  const okRes = await fetch(`${baseUrl}/api/admin/overview`, {
    headers: { Authorization: `Bearer ${adminData.accessToken}` },
  });
  assert.equal(okRes.status, 200);
});

test('Order creation and Payme sandbox payment confirmation workflow succeeds', async () => {
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@qurilishhub.uz', password: 'Password123!' }),
  });
  const { accessToken } = (await loginRes.json()) as { accessToken: string };

  const ordRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      deliveryAddress: 'Toshkent sh., Mirzo Ulugbek tumani 12',
      region: 'Toshkent shahri',
      items: [{ productId: 1, quantity: 2 }],
    }),
  });
  assert.equal(ordRes.status, 201);
  const ordJson = (await ordRes.json()) as { orders: Array<{ id: number }> };
  assert.ok(ordJson.orders[0].id > 0);

  const payInit = await fetch(`${baseUrl}/api/payments/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ provider: 'PAYME', orderId: ordJson.orders[0].id }),
  });
  assert.equal(payInit.status, 201);
  const payJson = (await payInit.json()) as { id: number };

  const payConfirm = await fetch(`${baseUrl}/api/payments/${payJson.id}/confirm-sandbox`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert.equal(payConfirm.status, 200);
  const confJson = (await payConfirm.json()) as { status: string };
  assert.equal(confJson.status, 'COMPLETED');
});
