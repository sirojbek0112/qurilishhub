import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { requireAuth, requireRole, recordAuditLog, type AuthRequest } from '../auth.ts';

const router = Router();

// Customer & Seller Orders
router.get('/orders', requireAuth, (req: AuthRequest, res) => {
  const scope = req.query.scope === 'seller' ? 'seller' : 'customer';
  let sql = `
    SELECT o.*, c.full_name as customer_name, s.full_name as seller_name
    FROM orders o
    JOIN users c ON c.id = o.customer_id
    JOIN users s ON s.id = o.seller_id
  `;
  const params: (string | number)[] = [];
  if (req.authUser!.role === 'ADMIN' && req.query.all === 'true') {
    sql += ' WHERE 1=1';
  } else if (scope === 'seller' || req.authUser!.role === 'SELLER') {
    sql += ' WHERE o.seller_id = ?';
    params.push(req.authUser!.id);
  } else {
    sql += ' WHERE o.customer_id = ?';
    params.push(req.authUser!.id);
  }
  sql += ' ORDER BY o.id DESC';

  const orders = db.prepare(sql).all(...params) as Array<{ id: number }>;
  const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
  const enriched = orders.map((o) => ({
    ...o,
    items: getItems.all(o.id),
  }));
  res.json({ items: enriched });
});

router.post('/orders', requireAuth, (req: AuthRequest, res) => {
  const schema = z.object({
    deliveryAddress: z.string().min(4).max(250),
    region: z.string().min(2),
    projectId: z.number().int().positive().optional(),
    notes: z.string().max(500).optional(),
    items: z
      .array(
        z.object({
          productId: z.number().int().positive(),
          quantity: z.number().int().positive(),
        })
      )
      .min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid order payload', details: parsed.error.flatten() });
    return;
  }

  const d = parsed.data;

  // Group items by seller so multi-seller carts cleanly produce per-seller orders atomically
  db.exec('BEGIN');
  try {
    const bySeller = new Map<
      number,
      Array<{ productId: number; name: string; priceUzs: number; quantity: number }>
    >();

    for (const item of d.items) {
      const prod = db
        .prepare(
          `SELECT p.id, p.seller_id, p.name_uz, p.price_uzs, COALESCE(i.quantity, 0) as stock
           FROM products p LEFT JOIN inventory i ON i.product_id = p.id
           WHERE p.id = ? AND p.deleted_at IS NULL`
        )
        .get(item.productId) as
        | { id: number; seller_id: number; name_uz: string; price_uzs: number; stock: number }
        | undefined;

      if (!prod) {
        throw new Error(`Product ${item.productId} not found`);
      }
      if (prod.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${prod.name_uz}`);
      }
      db.prepare("UPDATE inventory SET quantity = quantity - ?, updated_at = datetime('now') WHERE product_id = ?").run(
        item.quantity,
        prod.id
      );

      const list = bySeller.get(prod.seller_id) ?? [];
      list.push({ productId: prod.id, name: prod.name_uz, priceUzs: prod.price_uzs, quantity: item.quantity });
      bySeller.set(prod.seller_id, list);
    }

    const createdOrders: Array<{ id: number; orderNumber: string; totalUzs: number }> = [];
    for (const [sellerId, lineItems] of bySeller.entries()) {
      const totalUzs = lineItems.reduce((sum, l) => sum + l.priceUzs * l.quantity, 0);
      const orderNumber = `QH-ORD-${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 90 + 10)}`;
      const ordRes = db
        .prepare(
          `INSERT INTO orders (order_number, customer_id, seller_id, project_id, status, total_uzs, delivery_address, region, notes)
           VALUES (?, ?, ?, ?, 'PENDING', ?, ?, ?, ?)`
        )
        .run(
          orderNumber,
          req.authUser!.id,
          sellerId,
          d.projectId ?? null,
          totalUzs,
          d.deliveryAddress,
          d.region,
          d.notes ?? null
        );
      const orderId = Number(ordRes.lastInsertRowid);
      const insItem = db.prepare(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price_uzs, subtotal_uzs)
         VALUES (?, ?, ?, ?, ?, ?)`
      );
      for (const l of lineItems) {
        insItem.run(orderId, l.productId, l.name, l.quantity, l.priceUzs, l.priceUzs * l.quantity);
      }

      db.prepare(
        `INSERT INTO notifications (user_id, title, body, type, link_path)
         VALUES (?, 'Yangi buyurtma', ?, 'ORDER', '/dashboard')`
      ).run(sellerId, `${orderNumber} · ${totalUzs.toLocaleString('en-US')} UZS`);

      createdOrders.push({ id: orderId, orderNumber, totalUzs });
    }

    db.exec('COMMIT');
    res.status(201).json({ orders: createdOrders });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(400).json({ error: err instanceof Error ? err.message : 'Order creation failed' });
  }
});

router.patch('/orders/:id/status', requireAuth, (req: AuthRequest, res) => {
  const orderId = Number(req.params.id);
  const statusParsed = z
    .enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'])
    .safeParse(req.body?.status);
  if (!statusParsed.success) {
    res.status(400).json({ error: 'Invalid order status' });
    return;
  }

  const order = db.prepare('SELECT id, customer_id, seller_id, order_number FROM orders WHERE id = ?').get(orderId) as
    | { id: number; customer_id: number; seller_id: number; order_number: string }
    | undefined;
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const isSellerOrAdmin = req.authUser!.role === 'ADMIN' || order.seller_id === req.authUser!.id;
  const isCustomerCancelling = order.customer_id === req.authUser!.id && statusParsed.data === 'CANCELLED';
  if (!isSellerOrAdmin && !isCustomerCancelling) {
    res.status(403).json({ error: 'Forbidden to change this order status' });
    return;
  }

  db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(statusParsed.data, orderId);
  db.prepare(
    `INSERT INTO notifications (user_id, title, body, type, link_path)
     VALUES (?, 'Buyurtma holati yangilandi', ?, 'ORDER', '/dashboard')`
  ).run(order.customer_id, `${order.order_number} -> ${statusParsed.data}`);

  recordAuditLog({
    actorId: req.authUser!.id,
    action: 'ORDER_STATUS_UPDATED',
    entityType: 'ORDER',
    entityId: orderId,
    details: statusParsed.data,
  });

  res.json({ success: true });
});

// Sandbox Payment Architecture (Click / Payme / Uzum Bank — zero raw card data)
router.get('/payments', requireAuth, (req: AuthRequest, res) => {
  const rows = db
    .prepare(
      `SELECT p.*, o.order_number
       FROM payments p LEFT JOIN orders o ON o.id = p.order_id
       WHERE p.user_id = ? OR ? = 'ADMIN'
       ORDER BY p.id DESC`
    )
    .all(req.authUser!.id, req.authUser!.role);
  res.json({ items: rows, sandboxMode: true });
});

router.post('/payments/initiate', requireAuth, (req: AuthRequest, res) => {
  const schema = z.object({
    provider: z.enum(['CLICK', 'PAYME', 'UZUM']),
    orderId: z.number().int().positive().optional(),
    subscriptionPlan: z.enum(['PRO_SELLER', 'ENTERPRISE_COMPANY']).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payment initiation request' });
    return;
  }

  let amountUzs = 0;
  let subscriptionId: number | null = null;

  if (parsed.data.orderId) {
    const ord = db.prepare('SELECT id, customer_id, total_uzs FROM orders WHERE id = ?').get(parsed.data.orderId) as
      | { id: number; customer_id: number; total_uzs: number }
      | undefined;
    if (!ord || (ord.customer_id !== req.authUser!.id && req.authUser!.role !== 'ADMIN')) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    amountUzs = ord.total_uzs;
  } else if (parsed.data.subscriptionPlan) {
    amountUzs = parsed.data.subscriptionPlan === 'ENTERPRISE_COMPANY' ? 1490000 : 490000;
    const subRes = db
      .prepare(
        `INSERT INTO subscriptions (user_id, plan_code, price_uzs, status, ends_at)
         VALUES (?, ?, ?, 'PENDING', datetime('now', '+30 days'))`
      )
      .run(req.authUser!.id, parsed.data.subscriptionPlan, amountUzs);
    subscriptionId = Number(subRes.lastInsertRowid);
  } else {
    res.status(400).json({ error: 'orderId or subscriptionPlan required' });
    return;
  }

  const paymentRef = `PAY-SBX-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
  const info = db
    .prepare(
      `INSERT INTO payments (payment_ref, user_id, order_id, subscription_id, provider, amount_uzs, status, sandbox_mode)
       VALUES (?, ?, ?, ?, ?, ?, 'INITIATED', 1)`
    )
    .run(paymentRef, req.authUser!.id, parsed.data.orderId ?? null, subscriptionId, parsed.data.provider, amountUzs);

  const paymentId = Number(info.lastInsertRowid);
  db.prepare(
    `INSERT INTO transactions (payment_id, event_type, amount_uzs, status, signature_verified, metadata_json)
     VALUES (?, 'SANDBOX_INITIATE', ?, 'INITIATED', 1, ?)`
  ).run(paymentId, amountUzs, JSON.stringify({ provider: parsed.data.provider, mode: 'sandbox' }));

  res.status(201).json({
    id: paymentId,
    paymentRef,
    provider: parsed.data.provider,
    amountUzs,
    status: 'INITIATED',
    sandboxMode: true,
    sandboxCheckoutNotice: `Sandbox mode (${parsed.data.provider}): Confirm via webhook simulation without real card credentials.`,
  });
});

router.post('/payments/:id/confirm-sandbox', requireAuth, (req: AuthRequest, res) => {
  const paymentId = Number(req.params.id);
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId) as
    | {
        id: number;
        user_id: number;
        order_id: number | null;
        subscription_id: number | null;
        provider: string;
        amount_uzs: number;
        status: string;
      }
    | undefined;

  if (!payment || (payment.user_id !== req.authUser!.id && req.authUser!.role !== 'ADMIN')) {
    res.status(404).json({ error: 'Payment not found' });
    return;
  }

  // Simulated HMAC signature check for webhook integrity
  const secret = process.env.CLICK_SECRET_KEY || 'sandbox_secret';
  const signature = crypto.createHmac('sha256', secret).update(`${payment.id}:${payment.amount_uzs}`).digest('hex');
  const externalTxId = `${payment.provider}-SBX-${signature.slice(0, 10).toUpperCase()}`;

  db.exec('BEGIN');
  try {
    db.prepare(
      `UPDATE payments SET status = 'COMPLETED', external_tx_id = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(externalTxId, paymentId);

    db.prepare(
      `INSERT INTO transactions (payment_id, event_type, amount_uzs, status, signature_verified, metadata_json)
       VALUES (?, 'SANDBOX_WEBHOOK_CONFIRMED', ?, 'COMPLETED', 1, ?)`
    ).run(paymentId, payment.amount_uzs, JSON.stringify({ externalTxId, hmacPrefix: signature.slice(0, 8) }));

    if (payment.order_id) {
      db.prepare("UPDATE orders SET status = 'CONFIRMED', updated_at = datetime('now') WHERE id = ? AND status = 'PENDING'").run(
        payment.order_id
      );
    }
    if (payment.subscription_id) {
      db.prepare("UPDATE subscriptions SET status = 'ACTIVE' WHERE id = ?").run(payment.subscription_id);
    }
    db.exec('COMMIT');
    res.json({ success: true, status: 'COMPLETED', externalTxId, sandboxMode: true });
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
});

router.post('/payments/:id/refund', requireAuth, requireRole('ADMIN'), (req: AuthRequest, res) => {
  const paymentId = Number(req.params.id);
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId) as
    | { id: number; order_id: number | null; amount_uzs: number; status: string }
    | undefined;
  if (!payment || payment.status !== 'COMPLETED') {
    res.status(400).json({ error: 'Only completed payments can be refunded' });
    return;
  }
  db.prepare("UPDATE payments SET status = 'REFUNDED', updated_at = datetime('now') WHERE id = ?").run(paymentId);
  if (payment.order_id) {
    db.prepare("UPDATE orders SET status = 'REFUNDED', updated_at = datetime('now') WHERE id = ?").run(payment.order_id);
  }
  db.prepare(
    `INSERT INTO transactions (payment_id, event_type, amount_uzs, status, signature_verified)
     VALUES (?, 'SANDBOX_REFUND', ?, 'REFUNDED', 1)`
  ).run(paymentId, payment.amount_uzs);
  recordAuditLog({ actorId: req.authUser!.id, action: 'PAYMENT_REFUNDED', entityType: 'PAYMENT', entityId: paymentId });
  res.json({ success: true });
});

export default router;
