import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { requireAuth, requireRole, recordAuditLog, type AuthRequest } from '../auth.ts';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/overview', (_req, res) => {
  const usersTotal = (db.prepare('SELECT COUNT(*) as c FROM users WHERE deleted_at IS NULL').get() as { c: number }).c;
  const productsTotal = (db.prepare('SELECT COUNT(*) as c FROM products WHERE deleted_at IS NULL').get() as { c: number }).c;
  const servicesTotal = (db.prepare('SELECT COUNT(*) as c FROM services WHERE deleted_at IS NULL').get() as { c: number }).c;
  const projectsTotal = (db.prepare('SELECT COUNT(*) as c FROM projects WHERE deleted_at IS NULL').get() as { c: number }).c;
  const ordersTotal = (db.prepare('SELECT COUNT(*) as c FROM orders').get() as { c: number }).c;
  const revenueUzs = (
    db.prepare("SELECT COALESCE(SUM(total_uzs), 0) as s FROM orders WHERE status != 'CANCELLED' AND status != 'REFUNDED'").get() as { s: number }
  ).s;
  const openComplaints = (db.prepare("SELECT COUNT(*) as c FROM complaints WHERE status = 'OPEN'").get() as { c: number }).c;
  const pendingVerifications = (db.prepare('SELECT COUNT(*) as c FROM companies WHERE verified = 0 AND deleted_at IS NULL').get() as { c: number }).c;

  const roleBreakdown = db
    .prepare('SELECT role, COUNT(*) as count FROM users WHERE deleted_at IS NULL GROUP BY role')
    .all();

  res.json({
    metrics: {
      usersTotal,
      productsTotal,
      servicesTotal,
      projectsTotal,
      ordersTotal,
      revenueUzs,
      openComplaints,
      pendingVerifications,
    },
    roleBreakdown,
  });
});

router.get('/users', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const role = typeof req.query.role === 'string' ? req.query.role.trim() : '';
  let sql = 'SELECT id, email, full_name, phone, role, region, verified, is_active, created_at FROM users WHERE deleted_at IS NULL';
  const params: string[] = [];
  if (q) {
    sql += ' AND (full_name LIKE ? OR email LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  if (role) {
    sql += ' AND role = ?';
    params.push(role);
  }
  sql += ' ORDER BY id DESC';
  res.json({ items: db.prepare(sql).all(...params) });
});

router.patch('/users/:id', (req: AuthRequest, res) => {
  const userId = Number(req.params.id);
  const schema = z.object({
    role: z.enum(['CUSTOMER', 'SELLER', 'CONTRACTOR', 'ARCHITECT', 'COMPANY', 'ADMIN']).optional(),
    verified: z.number().int().min(0).max(1).optional(),
    isActive: z.number().int().min(0).max(1).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid user update' });
    return;
  }
  const d = parsed.data;
  db.prepare(
    `UPDATE users SET
      role = COALESCE(?, role),
      verified = COALESCE(?, verified),
      is_active = COALESCE(?, is_active),
      updated_at = datetime('now')
     WHERE id = ?`
  ).run(d.role ?? null, d.verified ?? null, d.isActive ?? null, userId);

  recordAuditLog({
    actorId: req.authUser!.id,
    action: 'ADMIN_USER_UPDATED',
    entityType: 'USER',
    entityId: userId,
    details: JSON.stringify(d),
  });
  res.json({ success: true });
});

router.get('/companies', (_req, res) => {
  res.json({ items: db.prepare('SELECT * FROM companies WHERE deleted_at IS NULL ORDER BY id DESC').all() });
});

router.patch('/companies/:id/verify', (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const verified = req.body?.verified ? 1 : 0;
  db.prepare("UPDATE companies SET verified = ?, updated_at = datetime('now') WHERE id = ?").run(verified, id);
  recordAuditLog({ actorId: req.authUser!.id, action: 'COMPANY_VERIFICATION', entityType: 'COMPANY', entityId: id, details: `verified=${verified}` });
  res.json({ success: true });
});

router.get('/moderation/products', (_req, res) => {
  const items = db
    .prepare(
      `SELECT p.*, u.full_name as seller_name, pc.name_uz as category_name
       FROM products p
       JOIN users u ON u.id = p.seller_id
       JOIN product_categories pc ON pc.id = p.category_id
       WHERE p.deleted_at IS NULL ORDER BY p.id DESC`
    )
    .all();
  res.json({ items });
});

router.patch('/moderation/products/:id', (req: AuthRequest, res) => {
  const status = z.enum(['PENDING', 'APPROVED', 'REJECTED']).safeParse(req.body?.status);
  if (!status.success) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }
  const id = Number(req.params.id);
  db.prepare('UPDATE products SET moderation_status = ? WHERE id = ?').run(status.data, id);
  recordAuditLog({ actorId: req.authUser!.id, action: 'PRODUCT_MODERATED', entityType: 'PRODUCT', entityId: id, details: status.data });
  res.json({ success: true });
});

router.post('/categories', (req: AuthRequest, res) => {
  const schema = z.object({
    slug: z.string().min(2),
    nameUz: z.string().min(2),
    nameRu: z.string().min(2),
    nameEn: z.string().min(2),
    icon: z.string().default('Package'),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid category payload' });
    return;
  }
  const d = parsed.data;
  const info = db
    .prepare('INSERT INTO product_categories (slug, name_uz, name_ru, name_en, icon) VALUES (?, ?, ?, ?, ?)')
    .run(d.slug, d.nameUz, d.nameRu, d.nameEn, d.icon);
  recordAuditLog({ actorId: req.authUser!.id, action: 'CATEGORY_CREATED', entityType: 'CATEGORY', entityId: Number(info.lastInsertRowid) });
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

router.get('/complaints', (_req, res) => {
  const items = db
    .prepare(
      `SELECT c.*, u.full_name as reporter_name, u.email as reporter_email
       FROM complaints c JOIN users u ON u.id = c.reporter_id
       ORDER BY c.id DESC`
    )
    .all();
  res.json({ items });
});

router.patch('/complaints/:id', (req: AuthRequest, res) => {
  const schema = z.object({
    status: z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED']),
    resolutionNote: z.string().max(1000).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid complaint update' });
    return;
  }
  const id = Number(req.params.id);
  db.prepare("UPDATE complaints SET status = ?, resolution_note = ?, updated_at = datetime('now') WHERE id = ?").run(
    parsed.data.status,
    parsed.data.resolutionNote ?? null,
    id
  );
  recordAuditLog({ actorId: req.authUser!.id, action: 'COMPLAINT_UPDATED', entityType: 'COMPLAINT', entityId: id, details: parsed.data.status });
  res.json({ success: true });
});

router.post('/blog', (req: AuthRequest, res) => {
  const schema = z.object({
    titleUz: z.string().min(3),
    titleRu: z.string().optional(),
    titleEn: z.string().optional(),
    excerptUz: z.string().min(5),
    contentUz: z.string().min(10),
    category: z.string().min(2),
    imageUrl: z.string().default('/src/assets/images/hero_tashkent_construction_1794912446373.jpg'),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid blog post payload' });
    return;
  }
  const d = parsed.data;
  const slug = `${d.titleUz.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
  const info = db
    .prepare(
      `INSERT INTO blog_posts (slug, author_id, title_uz, title_ru, title_en, excerpt_uz, excerpt_ru, excerpt_en, content_uz, content_ru, content_en, category, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      slug,
      req.authUser!.id,
      d.titleUz,
      d.titleRu || d.titleUz,
      d.titleEn || d.titleUz,
      d.excerptUz,
      d.excerptUz,
      d.excerptUz,
      d.contentUz,
      d.contentUz,
      d.contentUz,
      d.category,
      d.imageUrl
    );
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

router.get('/settings', (_req, res) => {
  const settings = db.prepare('SELECT * FROM platform_settings ORDER BY key ASC').all();
  res.json({ items: settings });
});

router.patch('/settings', (req: AuthRequest, res) => {
  const schema = z.object({
    key: z.string().min(2),
    value: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid setting payload' });
    return;
  }
  db.prepare(
    `INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  ).run(parsed.data.key, parsed.data.value);
  recordAuditLog({ actorId: req.authUser!.id, action: 'PLATFORM_SETTING_UPDATED', entityType: 'SETTING', entityId: parsed.data.key, details: parsed.data.value });
  res.json({ success: true });
});

router.get('/audit-logs', (_req, res) => {
  const items = db
    .prepare(
      `SELECT a.*, u.full_name as actor_name, u.email as actor_email
       FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id
       ORDER BY a.id DESC LIMIT 100`
    )
    .all();
  res.json({ items });
});

export default router;
