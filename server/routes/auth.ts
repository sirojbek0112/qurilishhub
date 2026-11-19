import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  requireAuth,
  recordAuditLog,
  type AuthRequest,
} from '../auth.ts';
import type { Role } from '../types.ts';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2).max(120),
  phone: z.string().min(7).max(30).optional(),
  role: z.enum(['CUSTOMER', 'SELLER', 'CONTRACTOR', 'ARCHITECT', 'COMPANY']).default('CUSTOMER'),
  region: z.string().min(2).default('Toshkent shahri'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.get('/demo-accounts', (_req, res) => {
  res.json({
    accounts: [
      { role: 'CUSTOMER', email: 'customer@qurilishhub.uz', password: 'Password123!', label: 'Azizbek Karimov (Buyurtmachi)' },
      { role: 'SELLER', email: 'seller@qurilishhub.uz', password: 'Password123!', label: 'Bunyod Stroy Market (Sotuvchi)' },
      { role: 'CONTRACTOR', email: 'contractor@qurilishhub.uz', password: 'Password123!', label: 'Dilshod Tursunov (Pudratchi)' },
      { role: 'ARCHITECT', email: 'architect@qurilishhub.uz', password: 'Password123!', label: 'Sardorbek Alimov (Arxitektor)' },
      { role: 'COMPANY', email: 'company@qurilishhub.uz', password: 'Password123!', label: 'Toshkent City Build (Kompaniya)' },
      { role: 'ADMIN', email: 'admin@qurilishhub.uz', password: 'Password123!', label: 'Jasur Rustamov (Admin)' },
    ],
  });
});

router.post('/register', (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { email, password, fullName, phone, role, region } = parsed.data;
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase()) as { id: number } | undefined;
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = hashPassword(password);
  const info = db
    .prepare(
      `INSERT INTO users (email, password_hash, full_name, phone, role, region, verified)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(email.toLowerCase(), passwordHash, fullName, phone ?? null, role, region, role === 'CUSTOMER' ? 1 : 0);

  const userId = Number(info.lastInsertRowid);
  db.prepare('INSERT INTO user_profiles (user_id) VALUES (?)').run(userId);

  if (role === 'CONTRACTOR') {
    db.prepare(
      `INSERT INTO contractor_profiles (user_id, headline, specialty, region, bio)
       VALUES (?, ?, 'Umumiy qurilish', ?, 'QurilishHub ro‘yxatdan o‘tgan pudratchisi.')`
    ).run(userId, `${fullName} — Qurilish xizmatlari`, region);
  } else if (role === 'ARCHITECT') {
    db.prepare(
      `INSERT INTO architect_profiles (user_id, studio_name, specialty, region, license_code, bio)
       VALUES (?, ?, 'Turar-joy arxitekturasi', ?, ?, 'QurilishHub ro‘yxatdan o‘tgan arxitektori.')`
    ).run(userId, `${fullName} Studio`, region, `ARC-UZ-${1000 + userId}`);
  } else if (role === 'COMPANY') {
    const slug = `${fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${userId}`;
    db.prepare(
      `INSERT INTO companies (owner_id, name, slug, description_uz, description_ru, description_en, region, address, phone, email, license_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      userId,
      fullName,
      slug,
      `${fullName} qurilish kompaniyasi`,
      `Строительная компания ${fullName}`,
      `${fullName} Construction Company`,
      region,
      region,
      phone ?? '+998 71 000 00 00',
      email.toLowerCase(),
      `UZ-LIC-${2026}-${userId}`
    );
  }

  const userObj = { id: userId, email: email.toLowerCase(), role: role as Role };
  const accessToken = signAccessToken(userObj);
  const refreshToken = signRefreshToken(userObj);

  db.prepare(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, datetime('now', '+14 days'))`
  ).run(userId, hashToken(refreshToken));

  recordAuditLog({ actorId: userId, action: 'USER_REGISTERED', entityType: 'USER', entityId: userId, details: `Role: ${role}` });

  res.status(201).json({
    accessToken,
    refreshToken,
    user: {
      id: userId,
      email: email.toLowerCase(),
      fullName,
      phone: phone ?? null,
      role,
      region,
      verified: role === 'CUSTOMER' ? 1 : 0,
    },
  });
});

router.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid credentials payload' });
    return;
  }

  const { email, password } = parsed.data;
  const row = db
    .prepare(
      `SELECT id, email, password_hash, full_name, phone, role, region, avatar_url, verified, is_active
       FROM users WHERE email = ? AND deleted_at IS NULL`
    )
    .get(email.toLowerCase()) as
    | {
        id: number;
        email: string;
        password_hash: string;
        full_name: string;
        phone: string | null;
        role: Role;
        region: string;
        avatar_url: string | null;
        verified: number;
        is_active: number;
      }
    | undefined;

  if (!row || row.is_active !== 1 || !verifyPassword(password, row.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const userObj = { id: row.id, email: row.email, role: row.role };
  const accessToken = signAccessToken(userObj);
  const refreshToken = signRefreshToken(userObj);

  db.prepare(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, datetime('now', '+14 days'))`
  ).run(row.id, hashToken(refreshToken));

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      phone: row.phone,
      role: row.role,
      region: row.region,
      avatarUrl: row.avatar_url,
      verified: row.verified,
    },
  });
});

router.post('/refresh', (req, res) => {
  const token = typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : '';
  if (!token) {
    res.status(400).json({ error: 'Refresh token required' });
    return;
  }

  try {
    const decoded = verifyRefreshToken(token);
    const tokenHash = hashToken(token);
    const stored = db
      .prepare(
        `SELECT id, user_id, revoked FROM refresh_tokens
         WHERE token_hash = ? AND expires_at > datetime('now')`
      )
      .get(tokenHash) as { id: number; user_id: number; revoked: number } | undefined;

    if (!stored || stored.revoked === 1) {
      res.status(401).json({ error: 'Refresh token revoked or expired' });
      return;
    }

    // Rotate refresh token
    db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?').run(stored.id);

    const userRow = db
      .prepare('SELECT id, email, role, is_active FROM users WHERE id = ? AND deleted_at IS NULL')
      .get(decoded.userId) as { id: number; email: string; role: Role; is_active: number } | undefined;

    if (!userRow || userRow.is_active !== 1) {
      res.status(401).json({ error: 'User not active' });
      return;
    }

    const accessToken = signAccessToken({ id: userRow.id, email: userRow.email, role: userRow.role });
    const newRefreshToken = signRefreshToken({ id: userRow.id, email: userRow.email, role: userRow.role });

    db.prepare(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES (?, ?, datetime('now', '+14 days'))`
    ).run(userRow.id, hashToken(newRefreshToken));

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', (req, res) => {
  const token = typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : '';
  if (token) {
    db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?').run(hashToken(token));
  }
  res.json({ success: true });
});

router.post('/forgot-password', (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number } | undefined;
  if (exists) {
    recordAuditLog({ actorId: exists.id, action: 'PASSWORD_RESET_REQUESTED', entityType: 'USER', entityId: exists.id });
  }
  res.json({
    success: true,
    mode: 'sandbox',
    message: 'Agar ushbu email tizimda mavjud bo‘lsa, tiklash yo‘riqnomasi yuborildi.',
  });
});

router.get('/me', requireAuth, (req: AuthRequest, res) => {
  const profile = db
    .prepare('SELECT company_name, tax_id, address, website, experience_years FROM user_profiles WHERE user_id = ?')
    .get(req.authUser!.id);
  const fullUser = db
    .prepare('SELECT id, email, full_name, phone, role, region, avatar_url, bio, preferred_lang, verified, created_at FROM users WHERE id = ?')
    .get(req.authUser!.id);

  res.json({ user: fullUser, profile: profile ?? null });
});

router.patch('/profile', requireAuth, (req: AuthRequest, res) => {
  const schema = z.object({
    fullName: z.string().min(2).max(120).optional(),
    phone: z.string().max(30).optional(),
    region: z.string().max(60).optional(),
    bio: z.string().max(1000).optional(),
    preferredLang: z.enum(['uz', 'ru', 'en']).optional(),
    companyName: z.string().max(150).optional(),
    address: z.string().max(250).optional(),
    website: z.string().max(200).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid profile update', details: parsed.error.flatten() });
    return;
  }

  const d = parsed.data;
  db.prepare(
    `UPDATE users SET
      full_name = COALESCE(?, full_name),
      phone = COALESCE(?, phone),
      region = COALESCE(?, region),
      bio = COALESCE(?, bio),
      preferred_lang = COALESCE(?, preferred_lang),
      updated_at = datetime('now')
     WHERE id = ?`
  ).run(d.fullName ?? null, d.phone ?? null, d.region ?? null, d.bio ?? null, d.preferredLang ?? null, req.authUser!.id);

  db.prepare(
    `INSERT INTO user_profiles (user_id, company_name, address, website)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       company_name = COALESCE(excluded.company_name, company_name),
       address = COALESCE(excluded.address, address),
       website = COALESCE(excluded.website, website),
       updated_at = datetime('now')`
  ).run(req.authUser!.id, d.companyName ?? null, d.address ?? null, d.website ?? null);

  res.json({ success: true });
});

export default router;
