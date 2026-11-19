import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { requireAuth, type AuthRequest } from '../auth.ts';
import { getIO, getOnlineUserIds } from '../socket.ts';

const router = Router();

// Conversations & Real-Time Messages
router.get('/conversations', requireAuth, (req: AuthRequest, res) => {
  const userId = req.authUser!.id;
  const rows = db
    .prepare(
      `SELECT c.*,
              CASE WHEN c.participant_one = ? THEN u2.id ELSE u1.id END as peer_id,
              CASE WHEN c.participant_one = ? THEN u2.full_name ELSE u1.full_name END as peer_name,
              CASE WHEN c.participant_one = ? THEN u2.role ELSE u1.role END as peer_role,
              (SELECT body FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) as last_message,
              (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) as unread_count
       FROM conversations c
       JOIN users u1 ON u1.id = c.participant_one
       JOIN users u2 ON u2.id = c.participant_two
       WHERE c.participant_one = ? OR c.participant_two = ?
       ORDER BY c.last_message_at DESC, c.id DESC`
    )
    .all(userId, userId, userId, userId, userId, userId) as Array<{ peer_id: number }>;

  const onlineIds = new Set(getOnlineUserIds());
  const enriched = rows.map((r) => ({
    ...r,
    peer_online: onlineIds.has(r.peer_id),
  }));

  res.json({ items: enriched });
});

router.post('/conversations', requireAuth, (req: AuthRequest, res) => {
  const schema = z.object({
    peerId: z.number().int().positive(),
    subject: z.string().max(150).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid conversation request' });
    return;
  }
  const peerId = parsed.data.peerId;
  if (peerId === req.authUser!.id) {
    res.status(400).json({ error: 'Cannot message yourself' });
    return;
  }
  const p1 = Math.min(req.authUser!.id, peerId);
  const p2 = Math.max(req.authUser!.id, peerId);

  const existing = db
    .prepare('SELECT id FROM conversations WHERE participant_one = ? AND participant_two = ?')
    .get(p1, p2) as { id: number } | undefined;
  if (existing) {
    res.json({ id: existing.id });
    return;
  }

  const info = db
    .prepare('INSERT INTO conversations (participant_one, participant_two, subject) VALUES (?, ?, ?)')
    .run(p1, p2, parsed.data.subject ?? 'QurilishHub Muloqoti');
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

router.get('/conversations/:id/messages', requireAuth, (req: AuthRequest, res) => {
  const convId = Number(req.params.id);
  const conv = db
    .prepare('SELECT * FROM conversations WHERE id = ? AND (participant_one = ? OR participant_two = ?)')
    .get(convId, req.authUser!.id, req.authUser!.id);
  if (!conv) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  db.prepare('UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?').run(convId, req.authUser!.id);
  const messages = db
    .prepare(
      `SELECT m.*, u.full_name as sender_name
       FROM messages m JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = ? ORDER BY m.id ASC`
    )
    .all(convId);
  res.json({ items: messages });
});

router.post('/conversations/:id/messages', requireAuth, (req: AuthRequest, res) => {
  const convId = Number(req.params.id);
  const conv = db
    .prepare('SELECT participant_one, participant_two FROM conversations WHERE id = ? AND (participant_one = ? OR participant_two = ?)')
    .get(convId, req.authUser!.id, req.authUser!.id) as
    | { participant_one: number; participant_two: number }
    | undefined;

  if (!conv) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  const schema = z.object({
    body: z.string().min(1).max(2000),
    attachmentUrl: z.string().max(500).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Message body required' });
    return;
  }

  const info = db
    .prepare('INSERT INTO messages (conversation_id, sender_id, body, attachment_url) VALUES (?, ?, ?, ?)')
    .run(convId, req.authUser!.id, parsed.data.body, parsed.data.attachmentUrl ?? null);
  const msgId = Number(info.lastInsertRowid);
  db.prepare("UPDATE conversations SET last_message_at = datetime('now') WHERE id = ?").run(convId);

  const saved = db
    .prepare(
      `SELECT m.*, u.full_name as sender_name
       FROM messages m JOIN users u ON u.id = m.sender_id
       WHERE m.id = ?`
    )
    .get(msgId);

  const io = getIO();
  if (io) {
    io.to(`conv:${convId}`).emit('message:new', saved);
    const recipientId = conv.participant_one === req.authUser!.id ? conv.participant_two : conv.participant_one;
    io.to(`user:${recipientId}`).emit('message:new', saved);
  }

  res.status(201).json(saved);
});

// Notifications
router.get('/notifications', requireAuth, (req: AuthRequest, res) => {
  const items = db
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 40')
    .all(req.authUser!.id);
  res.json({ items });
});

router.patch('/notifications/:id/read', requireAuth, (req: AuthRequest, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(Number(req.params.id), req.authUser!.id);
  res.json({ success: true });
});

router.post('/notifications/read-all', requireAuth, (req: AuthRequest, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.authUser!.id);
  res.json({ success: true });
});

// Complaints
router.post('/complaints', requireAuth, (req: AuthRequest, res) => {
  const schema = z.object({
    targetType: z.enum(['PRODUCT', 'SERVICE', 'COMPANY', 'USER', 'ORDER']),
    targetId: z.number().int().positive(),
    reason: z.string().min(3).max(120),
    details: z.string().min(5).max(1500),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid complaint payload' });
    return;
  }
  const info = db
    .prepare('INSERT INTO complaints (reporter_id, target_type, target_id, reason, details) VALUES (?, ?, ?, ?, ?)')
    .run(req.authUser!.id, parsed.data.targetType, parsed.data.targetId, parsed.data.reason, parsed.data.details);
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

// Public Blog, Banners, Contact, Stats
router.get('/blog', (_req, res) => {
  const items = db
    .prepare(
      `SELECT b.*, u.full_name as author_name
       FROM blog_posts b JOIN users u ON u.id = b.author_id
       WHERE b.published = 1 ORDER BY b.id DESC`
    )
    .all();
  res.json({ items });
});

router.get('/blog/:id', (req, res) => {
  const idOrSlug = req.params.id;
  const post = db
    .prepare(
      `SELECT b.*, u.full_name as author_name
       FROM blog_posts b JOIN users u ON u.id = b.author_id
       WHERE (b.id = ? OR b.slug = ?) AND b.published = 1`
    )
    .get(Number(idOrSlug) || -1, idOrSlug);
  if (!post) {
    res.status(404).json({ error: 'Article not found' });
    return;
  }
  res.json({ post });
});

router.get('/banners', (_req, res) => {
  res.json({ items: db.prepare('SELECT * FROM banners WHERE is_active = 1 ORDER BY id DESC').all() });
});

router.get('/stats/public', (_req, res) => {
  const products = (db.prepare('SELECT COUNT(*) as c FROM products WHERE deleted_at IS NULL').get() as { c: number }).c;
  const companies = (db.prepare('SELECT COUNT(*) as c FROM companies WHERE deleted_at IS NULL AND verified = 1').get() as { c: number }).c;
  const projects = (db.prepare('SELECT COUNT(*) as c FROM projects WHERE deleted_at IS NULL').get() as { c: number }).c;
  const contractors = (db.prepare('SELECT COUNT(*) as c FROM contractor_profiles').get() as { c: number }).c;
  const architects = (db.prepare('SELECT COUNT(*) as c FROM architect_profiles').get() as { c: number }).c;
  res.json({ products, companies, projects, professionals: contractors + architects });
});

router.post('/contact', (req, res) => {
  const schema = z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    phone: z.string().max(30).optional(),
    subject: z.string().min(2).max(160),
    message: z.string().min(5).max(2000),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid contact form submission' });
    return;
  }
  const d = parsed.data;
  const info = db
    .prepare('INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)')
    .run(d.name, d.email, d.phone ?? null, d.subject, d.message);
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

export default router;
