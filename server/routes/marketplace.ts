import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { optionalAuth, requireAuth, requireRole, recordAuditLog, type AuthRequest } from '../auth.ts';

const router = Router();

// Public Categories
router.get('/categories', (_req, res) => {
  const productCategories = db.prepare('SELECT * FROM product_categories ORDER BY id ASC').all();
  const serviceCategories = db.prepare('SELECT * FROM service_categories ORDER BY id ASC').all();
  res.json({ productCategories, serviceCategories });
});

// Products listing with search, filters, sorting, pagination
router.get('/products', optionalAuth, (req: AuthRequest, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const region = typeof req.query.region === 'string' ? req.query.region.trim() : '';
  const sellerId = req.query.sellerId ? Number(req.query.sellerId) : null;
  const sort = typeof req.query.sort === 'string' ? req.query.sort : 'newest';
  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : null;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;

  let sql = `
    SELECT p.*, pc.slug as category_slug, pc.name_uz as category_uz, pc.name_ru as category_ru, pc.name_en as category_en,
           u.full_name as seller_name, u.verified as seller_verified, u.phone as seller_phone,
           COALESCE(i.quantity, 0) as stock_quantity,
           (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id ASC LIMIT 1) as image_url
    FROM products p
    JOIN product_categories pc ON pc.id = p.category_id
    JOIN users u ON u.id = p.seller_id
    LEFT JOIN inventory i ON i.product_id = p.id
    WHERE p.deleted_at IS NULL
  `;
  const params: (string | number)[] = [];

  if (!req.authUser || (req.authUser.role !== 'ADMIN' && req.authUser.id !== sellerId)) {
    sql += " AND p.moderation_status = 'APPROVED'";
  }
  if (q) {
    sql += ' AND (p.name_uz LIKE ? OR p.name_ru LIKE ? OR p.name_en LIKE ? OR p.sku LIKE ?)';
    const pattern = `%${q}%`;
    params.push(pattern, pattern, pattern, pattern);
  }
  if (category) {
    sql += ' AND (pc.slug = ? OR pc.id = ?)';
    params.push(category, Number(category) || -1);
  }
  if (region) {
    sql += ' AND p.region = ?';
    params.push(region);
  }
  if (sellerId) {
    sql += ' AND p.seller_id = ?';
    params.push(sellerId);
  }
  if (minPrice !== null && !Number.isNaN(minPrice)) {
    sql += ' AND p.price_uzs >= ?';
    params.push(minPrice);
  }
  if (maxPrice !== null && !Number.isNaN(maxPrice)) {
    sql += ' AND p.price_uzs <= ?';
    params.push(maxPrice);
  }

  if (sort === 'price_asc') sql += ' ORDER BY p.price_uzs ASC';
  else if (sort === 'price_desc') sql += ' ORDER BY p.price_uzs DESC';
  else if (sort === 'rating') sql += ' ORDER BY p.rating DESC';
  else sql += ' ORDER BY p.id DESC';

  const items = db.prepare(sql).all(...params);
  res.json({ items, total: items.length });
});

router.get('/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const product = db
    .prepare(
      `SELECT p.*, pc.slug as category_slug, pc.name_uz as category_uz, pc.name_ru as category_ru, pc.name_en as category_en,
              u.full_name as seller_name, u.verified as seller_verified, u.phone as seller_phone, u.region as seller_region,
              COALESCE(i.quantity, 0) as stock_quantity
       FROM products p
       JOIN product_categories pc ON pc.id = p.category_id
       JOIN users u ON u.id = p.seller_id
       LEFT JOIN inventory i ON i.product_id = p.id
       WHERE p.id = ? AND p.deleted_at IS NULL`
    )
    .get(id);

  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const images = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC').all(id);
  const reviews = db
    .prepare(
      `SELECT r.*, u.full_name as author_name
       FROM reviews r JOIN users u ON u.id = r.author_id
       WHERE r.target_type = 'PRODUCT' AND r.target_id = ? AND r.moderation_status = 'APPROVED'
       ORDER BY r.id DESC`
    )
    .all(id);

  res.json({ product, images, reviews });
});

const productSchema = z.object({
  categoryId: z.number().int().positive(),
  sku: z.string().min(2).max(40).optional(),
  nameUz: z.string().min(2).max(160),
  nameRu: z.string().min(2).max(160).optional(),
  nameEn: z.string().min(2).max(160).optional(),
  descriptionUz: z.string().min(5).max(2000),
  descriptionRu: z.string().max(2000).optional(),
  descriptionEn: z.string().max(2000).optional(),
  priceUzs: z.number().int().positive(),
  unit: z.string().min(1).max(40),
  stockQuantity: z.number().int().min(0),
  region: z.string().min(2),
  deliveryOptions: z.string().min(2).max(200),
  imageUrl: z.string().min(1).default('/src/assets/images/material_cement_bricks_1794912446302.jpg'),
});

router.post('/products', requireAuth, requireRole('SELLER', 'ADMIN'), (req: AuthRequest, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const d = parsed.data;
  const sku = d.sku || `QH-${Date.now().toString().slice(-6)}`;
  const info = db
    .prepare(
      `INSERT INTO products (seller_id, category_id, sku, name_uz, name_ru, name_en, description_uz, description_ru, description_en, price_uzs, unit, region, delivery_options, moderation_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')`
    )
    .run(
      req.authUser!.id,
      d.categoryId,
      sku,
      d.nameUz,
      d.nameRu || d.nameUz,
      d.nameEn || d.nameUz,
      d.descriptionUz,
      d.descriptionRu || d.descriptionUz,
      d.descriptionEn || d.descriptionUz,
      d.priceUzs,
      d.unit,
      d.region,
      d.deliveryOptions
    );
  const productId = Number(info.lastInsertRowid);
  db.prepare('INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)').run(productId, d.imageUrl);
  db.prepare('INSERT INTO inventory (product_id, quantity) VALUES (?, ?)').run(productId, d.stockQuantity);
  recordAuditLog({ actorId: req.authUser!.id, action: 'PRODUCT_CREATED', entityType: 'PRODUCT', entityId: productId });
  res.status(201).json({ id: productId });
});

router.patch('/products/:id', requireAuth, requireRole('SELLER', 'ADMIN'), (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT seller_id FROM products WHERE id = ? AND deleted_at IS NULL').get(id) as
    | { seller_id: number }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  if (req.authUser!.role !== 'ADMIN' && existing.seller_id !== req.authUser!.id) {
    res.status(403).json({ error: 'Cannot edit another seller product' });
    return;
  }

  const schema = productSchema.partial();
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid update', details: parsed.error.flatten() });
    return;
  }
  const d = parsed.data;
  db.prepare(
    `UPDATE products SET
      category_id = COALESCE(?, category_id),
      name_uz = COALESCE(?, name_uz),
      name_ru = COALESCE(?, name_ru),
      name_en = COALESCE(?, name_en),
      description_uz = COALESCE(?, description_uz),
      price_uzs = COALESCE(?, price_uzs),
      unit = COALESCE(?, unit),
      region = COALESCE(?, region),
      delivery_options = COALESCE(?, delivery_options),
      updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    d.categoryId ?? null,
    d.nameUz ?? null,
    d.nameRu ?? null,
    d.nameEn ?? null,
    d.descriptionUz ?? null,
    d.priceUzs ?? null,
    d.unit ?? null,
    d.region ?? null,
    d.deliveryOptions ?? null,
    id
  );
  if (d.stockQuantity !== undefined) {
    db.prepare("UPDATE inventory SET quantity = ?, updated_at = datetime('now') WHERE product_id = ?").run(d.stockQuantity, id);
  }
  res.json({ success: true });
});

router.delete('/products/:id', requireAuth, requireRole('SELLER', 'ADMIN'), (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT seller_id FROM products WHERE id = ? AND deleted_at IS NULL').get(id) as
    | { seller_id: number }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  if (req.authUser!.role !== 'ADMIN' && existing.seller_id !== req.authUser!.id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  db.prepare("UPDATE products SET deleted_at = datetime('now') WHERE id = ?").run(id);
  recordAuditLog({ actorId: req.authUser!.id, action: 'PRODUCT_DELETED', entityType: 'PRODUCT', entityId: id });
  res.json({ success: true });
});

// Price comparison grouped by normalized material family
router.get('/price-comparison', (req, res) => {
  const category = typeof req.query.category === 'string' ? req.query.category : '';
  let sql = `
    SELECT p.id, p.name_uz, p.name_ru, p.name_en, p.price_uzs, p.unit, p.region, p.rating,
           u.full_name as seller_name, u.verified as seller_verified,
           pc.slug as category_slug, pc.name_uz as category_uz,
           COALESCE(i.quantity, 0) as stock_quantity
    FROM products p
    JOIN users u ON u.id = p.seller_id
    JOIN product_categories pc ON pc.id = p.category_id
    LEFT JOIN inventory i ON i.product_id = p.id
    WHERE p.deleted_at IS NULL AND p.moderation_status = 'APPROVED'
  `;
  const params: string[] = [];
  if (category) {
    sql += ' AND pc.slug = ?';
    params.push(category);
  }
  sql += ' ORDER BY pc.id ASC, p.price_uzs ASC';
  const rows = db.prepare(sql).all(...params);
  res.json({ items: rows });
});

// Services
router.get('/services', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const region = typeof req.query.region === 'string' ? req.query.region.trim() : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const providerId = req.query.providerId ? Number(req.query.providerId) : null;

  let sql = `
    SELECT s.*, sc.slug as category_slug, sc.name_uz as category_uz, sc.name_ru as category_ru, sc.name_en as category_en,
           u.full_name as provider_name, u.role as provider_role, u.verified as provider_verified, u.phone as provider_phone
    FROM services s
    JOIN service_categories sc ON sc.id = s.category_id
    JOIN users u ON u.id = s.provider_id
    WHERE s.deleted_at IS NULL AND s.moderation_status = 'APPROVED'
  `;
  const params: (string | number)[] = [];
  if (q) {
    sql += ' AND (s.title_uz LIKE ? OR s.title_ru LIKE ? OR s.title_en LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (region) {
    sql += ' AND s.region = ?';
    params.push(region);
  }
  if (category) {
    sql += ' AND sc.slug = ?';
    params.push(category);
  }
  if (providerId) {
    sql += ' AND s.provider_id = ?';
    params.push(providerId);
  }
  sql += ' ORDER BY s.rating DESC, s.id DESC';
  res.json({ items: db.prepare(sql).all(...params) });
});

router.get('/services/:id', (req, res) => {
  const id = Number(req.params.id);
  const service = db
    .prepare(
      `SELECT s.*, sc.name_uz as category_uz, sc.name_ru as category_ru, sc.name_en as category_en,
              u.full_name as provider_name, u.role as provider_role, u.verified as provider_verified, u.phone as provider_phone, u.bio as provider_bio
       FROM services s
       JOIN service_categories sc ON sc.id = s.category_id
       JOIN users u ON u.id = s.provider_id
       WHERE s.id = ? AND s.deleted_at IS NULL`
    )
    .get(id) as { provider_id: number } | undefined;

  if (!service) {
    res.status(404).json({ error: 'Service not found' });
    return;
  }
  const portfolios = db.prepare('SELECT * FROM portfolios WHERE user_id = ? ORDER BY id DESC').all(service.provider_id);
  const reviews = db
    .prepare(
      `SELECT r.*, u.full_name as author_name
       FROM reviews r JOIN users u ON u.id = r.author_id
       WHERE r.target_type = 'SERVICE' AND r.target_id = ? ORDER BY r.id DESC`
    )
    .all(id);
  res.json({ service, portfolios, reviews });
});

router.post('/services', requireAuth, requireRole('CONTRACTOR', 'ARCHITECT', 'COMPANY', 'ADMIN'), (req: AuthRequest, res) => {
  const schema = z.object({
    categoryId: z.number().int().positive(),
    titleUz: z.string().min(3).max(160),
    titleRu: z.string().max(160).optional(),
    titleEn: z.string().max(160).optional(),
    descriptionUz: z.string().min(5).max(2000),
    priceFromUzs: z.number().int().positive(),
    priceUnit: z.string().min(1).max(30),
    region: z.string().min(2),
    imageUrl: z.string().default('/src/assets/images/service_construction_team_1794912447881.jpg'),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid service payload', details: parsed.error.flatten() });
    return;
  }
  const d = parsed.data;
  const info = db
    .prepare(
      `INSERT INTO services (provider_id, category_id, title_uz, title_ru, title_en, description_uz, description_ru, description_en, price_from_uzs, price_unit, region, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.authUser!.id,
      d.categoryId,
      d.titleUz,
      d.titleRu || d.titleUz,
      d.titleEn || d.titleUz,
      d.descriptionUz,
      d.descriptionUz,
      d.descriptionUz,
      d.priceFromUzs,
      d.priceUnit,
      d.region,
      d.imageUrl
    );
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

router.post('/service-bookings', requireAuth, (req: AuthRequest, res) => {
  const schema = z.object({
    serviceId: z.number().int().positive(),
    projectId: z.number().int().positive().optional(),
    preferredDate: z.string().min(4),
    budgetUzs: z.number().int().positive(),
    notes: z.string().min(3).max(1000),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid booking request', details: parsed.error.flatten() });
    return;
  }
  const svc = db.prepare('SELECT provider_id, title_uz FROM services WHERE id = ?').get(parsed.data.serviceId) as
    | { provider_id: number; title_uz: string }
    | undefined;
  if (!svc) {
    res.status(404).json({ error: 'Service not found' });
    return;
  }
  const info = db
    .prepare(
      `INSERT INTO service_bookings (service_id, customer_id, provider_id, project_id, preferred_date, budget_uzs, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      parsed.data.serviceId,
      req.authUser!.id,
      svc.provider_id,
      parsed.data.projectId ?? null,
      parsed.data.preferredDate,
      parsed.data.budgetUzs,
      parsed.data.notes
    );
  db.prepare(
    `INSERT INTO notifications (user_id, title, body, type, link_path)
     VALUES (?, 'Yangi ish so‘rovi', ?, 'BOOKING', '/dashboard')`
  ).run(svc.provider_id, `${req.authUser!.fullName}: ${svc.title_uz}`);
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

router.get('/service-bookings', requireAuth, (req: AuthRequest, res) => {
  const rows = db
    .prepare(
      `SELECT b.*, s.title_uz as service_title, c.full_name as customer_name, p.full_name as provider_name
       FROM service_bookings b
       JOIN services s ON s.id = b.service_id
       JOIN users c ON c.id = b.customer_id
       JOIN users p ON p.id = b.provider_id
       WHERE b.customer_id = ? OR b.provider_id = ?
       ORDER BY b.id DESC`
    )
    .all(req.authUser!.id, req.authUser!.id);
  res.json({ items: rows });
});

router.patch('/service-bookings/:id', requireAuth, (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const status = z.enum(['ACCEPTED', 'REJECTED', 'COMPLETED']).safeParse(req.body?.status);
  if (!status.success) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }
  const booking = db.prepare('SELECT provider_id FROM service_bookings WHERE id = ?').get(id) as
    | { provider_id: number }
    | undefined;
  if (!booking || (booking.provider_id !== req.authUser!.id && req.authUser!.role !== 'ADMIN')) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  db.prepare('UPDATE service_bookings SET status = ? WHERE id = ?').run(status.data, id);
  res.json({ success: true });
});

// Companies & Employees
router.get('/companies', (req, res) => {
  const region = typeof req.query.region === 'string' ? req.query.region.trim() : '';
  let sql = 'SELECT * FROM companies WHERE deleted_at IS NULL';
  const params: string[] = [];
  if (region) {
    sql += ' AND region = ?';
    params.push(region);
  }
  sql += ' ORDER BY verified DESC, rating DESC, id DESC';
  res.json({ items: db.prepare(sql).all(...params) });
});

router.get('/companies/:id', (req, res) => {
  const id = Number(req.params.id);
  const company = db.prepare('SELECT * FROM companies WHERE id = ? AND deleted_at IS NULL').get(id);
  if (!company) {
    res.status(404).json({ error: 'Company not found' });
    return;
  }
  const employees = db.prepare('SELECT * FROM company_employees WHERE company_id = ? ORDER BY id DESC').all(id);
  const projects = db.prepare('SELECT * FROM projects WHERE company_id = ? AND deleted_at IS NULL ORDER BY id DESC').all(id);
  const reviews = db
    .prepare(
      `SELECT r.*, u.full_name as author_name FROM reviews r JOIN users u ON u.id = r.author_id
       WHERE r.target_type = 'COMPANY' AND r.target_id = ? ORDER BY r.id DESC`
    )
    .all(id);
  res.json({ company, employees, projects, reviews });
});

router.post('/companies/employees', requireAuth, requireRole('COMPANY', 'ADMIN'), (req: AuthRequest, res) => {
  const schema = z.object({
    fullName: z.string().min(2),
    position: z.string().min(2),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    specialty: z.string().min(2),
    salaryUzs: z.number().int().min(0).default(0),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid employee payload' });
    return;
  }
  const comp = db.prepare('SELECT id FROM companies WHERE owner_id = ? LIMIT 1').get(req.authUser!.id) as
    | { id: number }
    | undefined;
  if (!comp) {
    res.status(404).json({ error: 'Company record not found for account' });
    return;
  }
  const d = parsed.data;
  const info = db
    .prepare(
      `INSERT INTO company_employees (company_id, full_name, position, phone, email, specialty, salary_uzs)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(comp.id, d.fullName, d.position, d.phone ?? null, d.email ?? null, d.specialty, d.salaryUzs);
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

// Architects & Contractors
router.get('/architects', (req, res) => {
  const region = typeof req.query.region === 'string' ? req.query.region.trim() : '';
  let sql = `
    SELECT a.*, u.full_name, u.email, u.phone, u.avatar_url
    FROM architect_profiles a
    JOIN users u ON u.id = a.user_id
    WHERE u.deleted_at IS NULL
  `;
  const params: string[] = [];
  if (region) {
    sql += ' AND a.region = ?';
    params.push(region);
  }
  sql += ' ORDER BY a.rating DESC';
  const architects = db.prepare(sql).all(...params);
  res.json({ items: architects });
});

router.get('/architects/:id', (req, res) => {
  const id = Number(req.params.id);
  const architect = db
    .prepare(
      `SELECT a.*, u.full_name, u.email, u.phone, u.avatar_url, u.bio as user_bio
       FROM architect_profiles a JOIN users u ON u.id = a.user_id
       WHERE a.id = ? OR a.user_id = ?`
    )
    .get(id, id) as { user_id: number } | undefined;
  if (!architect) {
    res.status(404).json({ error: 'Architect not found' });
    return;
  }
  const portfolios = db.prepare('SELECT * FROM portfolios WHERE user_id = ? ORDER BY id DESC').all(architect.user_id);
  const services = db.prepare('SELECT * FROM services WHERE provider_id = ? AND deleted_at IS NULL').all(architect.user_id);
  res.json({ architect, portfolios, services });
});

router.get('/contractors', (_req, res) => {
  const items = db
    .prepare(
      `SELECT c.*, u.full_name, u.phone, u.avatar_url
       FROM contractor_profiles c JOIN users u ON u.id = c.user_id
       WHERE u.deleted_at IS NULL ORDER BY c.verified DESC, c.rating DESC`
    )
    .all();
  res.json({ items });
});

router.post('/portfolios', requireAuth, requireRole('CONTRACTOR', 'ARCHITECT', 'COMPANY', 'ADMIN'), (req: AuthRequest, res) => {
  const schema = z.object({
    title: z.string().min(3),
    category: z.string().min(2),
    region: z.string().min(2),
    areaSqm: z.number().int().positive().default(200),
    completionYear: z.number().int().min(2000).max(2030).default(2026),
    imageUrl: z.string().default('/src/assets/images/project_modern_villa_1794912448415.jpg'),
    description: z.string().min(5),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid portfolio item' });
    return;
  }
  const d = parsed.data;
  const info = db
    .prepare(
      `INSERT INTO portfolios (user_id, title, category, region, area_sqm, completion_year, image_url, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(req.authUser!.id, d.title, d.category, d.region, d.areaSqm, d.completionYear, d.imageUrl, d.description);
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

// Favorites
router.get('/favorites', requireAuth, (req: AuthRequest, res) => {
  const favs = db.prepare('SELECT * FROM favorites WHERE user_id = ? ORDER BY id DESC').all(req.authUser!.id) as Array<{
    id: number;
    target_type: string;
    target_id: number;
  }>;
  const productIds = favs.filter((f) => f.target_type === 'PRODUCT').map((f) => f.target_id);
  let products: unknown[] = [];
  if (productIds.length > 0) {
    const placeholders = productIds.map(() => '?').join(',');
    products = db
      .prepare(
        `SELECT p.*, u.full_name as seller_name,
                (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as image_url
         FROM products p JOIN users u ON u.id = p.seller_id
         WHERE p.id IN (${placeholders}) AND p.deleted_at IS NULL`
      )
      .all(...productIds);
  }
  res.json({ favorites: favs, products });
});

router.post('/favorites/toggle', requireAuth, (req: AuthRequest, res) => {
  const schema = z.object({
    targetType: z.enum(['PRODUCT', 'SERVICE', 'COMPANY', 'ARCHITECT', 'PROJECT']),
    targetId: z.number().int().positive(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid favorite payload' });
    return;
  }
  const { targetType, targetId } = parsed.data;
  const existing = db
    .prepare('SELECT id FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?')
    .get(req.authUser!.id, targetType, targetId) as { id: number } | undefined;

  if (existing) {
    db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id);
    res.json({ favorited: false });
  } else {
    db.prepare('INSERT INTO favorites (user_id, target_type, target_id) VALUES (?, ?, ?)').run(req.authUser!.id, targetType, targetId);
    res.json({ favorited: true });
  }
});

// Reviews
router.post('/reviews', requireAuth, (req: AuthRequest, res) => {
  const schema = z.object({
    targetType: z.enum(['PRODUCT', 'SERVICE', 'COMPANY', 'ARCHITECT']),
    targetId: z.number().int().positive(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(3).max(1000),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid review payload' });
    return;
  }
  const { targetType, targetId, rating, comment } = parsed.data;
  const info = db
    .prepare('INSERT INTO reviews (author_id, target_type, target_id, rating, comment) VALUES (?, ?, ?, ?, ?)')
    .run(req.authUser!.id, targetType, targetId, rating, comment);

  if (targetType === 'PRODUCT') {
    db.prepare(
      `UPDATE products SET
         rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE target_type = 'PRODUCT' AND target_id = ?), rating),
         review_count = (SELECT COUNT(*) FROM reviews WHERE target_type = 'PRODUCT' AND target_id = ?)
       WHERE id = ?`
    ).run(targetId, targetId, targetId);
  } else if (targetType === 'SERVICE') {
    db.prepare(
      `UPDATE services SET
         rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE target_type = 'SERVICE' AND target_id = ?), rating),
         review_count = (SELECT COUNT(*) FROM reviews WHERE target_type = 'SERVICE' AND target_id = ?)
       WHERE id = ?`
    ).run(targetId, targetId, targetId);
  }
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

export default router;
