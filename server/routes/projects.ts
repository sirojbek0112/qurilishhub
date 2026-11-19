import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { optionalAuth, requireAuth, requireRole, recordAuditLog, type AuthRequest } from '../auth.ts';
import { calculateConstructionEstimate } from '../calculator.ts';

const router = Router();

// Public & user-scoped Projects
router.get('/projects', optionalAuth, (req: AuthRequest, res) => {
  const mine = req.query.mine === 'true';
  const region = typeof req.query.region === 'string' ? req.query.region.trim() : '';

  if (mine) {
    if (!req.authUser) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const items = db
      .prepare(
        `SELECT DISTINCT p.*, u.full_name as owner_name, c.name as company_name
         FROM projects p
         JOIN users u ON u.id = p.owner_id
         LEFT JOIN companies c ON c.id = p.company_id
         LEFT JOIN project_members pm ON pm.project_id = p.id
         WHERE p.deleted_at IS NULL
           AND (p.owner_id = ? OR pm.user_id = ? OR ? = 'ADMIN')
         ORDER BY p.id DESC`
      )
      .all(req.authUser.id, req.authUser.id, req.authUser.role);
    res.json({ items });
    return;
  }

  let sql = `
    SELECT p.*, u.full_name as owner_name, c.name as company_name
    FROM projects p
    JOIN users u ON u.id = p.owner_id
    LEFT JOIN companies c ON c.id = p.company_id
    WHERE p.deleted_at IS NULL AND p.is_public = 1
  `;
  const params: string[] = [];
  if (region) {
    sql += ' AND p.region = ?';
    params.push(region);
  }
  sql += ' ORDER BY p.id DESC';
  res.json({ items: db.prepare(sql).all(...params) });
});

router.get('/projects/:id', optionalAuth, (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const project = db
    .prepare(
      `SELECT p.*, u.full_name as owner_name, c.name as company_name
       FROM projects p
       JOIN users u ON u.id = p.owner_id
       LEFT JOIN companies c ON c.id = p.company_id
       WHERE p.id = ? AND p.deleted_at IS NULL`
    )
    .get(id) as { id: number; owner_id: number; is_public: number } | undefined;

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const members = db
    .prepare(
      `SELECT pm.*, u.full_name, u.email, u.role as user_role, u.phone
       FROM project_members pm JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = ?`
    )
    .all(id);
  const tasks = db
    .prepare(
      `SELECT t.*, u.full_name as assignee_name
       FROM project_tasks t LEFT JOIN users u ON u.id = t.assignee_id
       WHERE t.project_id = ? ORDER BY t.id DESC`
    )
    .all(id);
  const progress = db
    .prepare(
      `SELECT pr.*, u.full_name as author_name
       FROM project_progress pr JOIN users u ON u.id = pr.author_id
       WHERE pr.project_id = ? ORDER BY pr.id DESC`
    )
    .all(id);
  const expenses = db
    .prepare('SELECT * FROM project_expenses WHERE project_id = ? ORDER BY expense_date DESC, id DESC')
    .all(id);
  const contracts = db
    .prepare(
      `SELECT ct.*, u.full_name as contractor_name
       FROM contracts ct JOIN users u ON u.id = ct.contractor_id
       WHERE ct.project_id = ? ORDER BY ct.id DESC`
    )
    .all(id);
  const documents = db
    .prepare(
      `SELECT d.*, u.full_name as uploader_name
       FROM documents d JOIN users u ON u.id = d.uploaded_by
       WHERE d.project_id = ? ORDER BY d.id DESC`
    )
    .all(id);

  res.json({ project, members, tasks, progress, expenses, contracts, documents });
});

function canAccessProject(projectId: number, userId: number, role: string): boolean {
  if (role === 'ADMIN') return true;
  const proj = db.prepare('SELECT owner_id FROM projects WHERE id = ? AND deleted_at IS NULL').get(projectId) as
    | { owner_id: number }
    | undefined;
  if (!proj) return false;
  if (proj.owner_id === userId) return true;
  const member = db
    .prepare('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?')
    .get(projectId, userId);
  return Boolean(member);
}

router.post('/projects', requireAuth, (req: AuthRequest, res) => {
  const schema = z.object({
    name: z.string().min(3).max(160),
    description: z.string().min(5).max(2000),
    address: z.string().min(3).max(250),
    region: z.string().min(2),
    constructionType: z.string().min(2),
    buildingAreaSqm: z.number().positive(),
    floors: z.number().int().min(1).max(60),
    estimatedBudgetUzs: z.number().int().positive(),
    startDate: z.string().min(4),
    expectedEndDate: z.string().min(4),
    imageUrl: z.string().default('/src/assets/images/project_modern_villa_1794912448415.jpg'),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid project payload', details: parsed.error.flatten() });
    return;
  }
  const d = parsed.data;
  const company = db.prepare('SELECT id FROM companies WHERE owner_id = ?').get(req.authUser!.id) as
    | { id: number }
    | undefined;

  const info = db
    .prepare(
      `INSERT INTO projects (owner_id, company_id, name, description, address, region, construction_type, building_area_sqm, floors, estimated_budget_uzs, start_date, expected_end_date, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.authUser!.id,
      company?.id ?? null,
      d.name,
      d.description,
      d.address,
      d.region,
      d.constructionType,
      d.buildingAreaSqm,
      d.floors,
      d.estimatedBudgetUzs,
      d.startDate,
      d.expectedEndDate,
      d.imageUrl
    );
  const projectId = Number(info.lastInsertRowid);
  db.prepare('INSERT INTO project_members (project_id, user_id, member_role) VALUES (?, ?, ?)').run(
    projectId,
    req.authUser!.id,
    'OWNER'
  );
  recordAuditLog({ actorId: req.authUser!.id, action: 'PROJECT_CREATED', entityType: 'PROJECT', entityId: projectId });
  res.status(201).json({ id: projectId });
});

router.post('/projects/:id/members', requireAuth, (req: AuthRequest, res) => {
  const projectId = Number(req.params.id);
  if (!canAccessProject(projectId, req.authUser!.id, req.authUser!.role)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  const schema = z.object({
    email: z.string().email(),
    memberRole: z.string().min(2).default('CONTRACTOR'),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid member payload' });
    return;
  }
  const targetUser = db.prepare('SELECT id, full_name FROM users WHERE email = ?').get(parsed.data.email.toLowerCase()) as
    | { id: number; full_name: string }
    | undefined;
  if (!targetUser) {
    res.status(404).json({ error: 'User with that email not found' });
    return;
  }
  db.prepare(
    `INSERT INTO project_members (project_id, user_id, member_role)
     VALUES (?, ?, ?)
     ON CONFLICT(project_id, user_id) DO UPDATE SET member_role = excluded.member_role`
  ).run(projectId, targetUser.id, parsed.data.memberRole);
  res.status(201).json({ success: true, userId: targetUser.id, fullName: targetUser.full_name });
});

router.post('/projects/:id/tasks', requireAuth, (req: AuthRequest, res) => {
  const projectId = Number(req.params.id);
  if (!canAccessProject(projectId, req.authUser!.id, req.authUser!.role)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  const schema = z.object({
    title: z.string().min(2).max(160),
    description: z.string().max(1000).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
    deadline: z.string().optional(),
    assigneeId: z.number().int().positive().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid task payload' });
    return;
  }
  const d = parsed.data;
  const info = db
    .prepare(
      `INSERT INTO project_tasks (project_id, assignee_id, title, description, status, priority, deadline)
       VALUES (?, ?, ?, ?, 'TODO', ?, ?)`
    )
    .run(projectId, d.assigneeId ?? req.authUser!.id, d.title, d.description ?? '', d.priority, d.deadline ?? null);
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

router.patch('/tasks/:taskId', requireAuth, (req: AuthRequest, res) => {
  const taskId = Number(req.params.taskId);
  const task = db.prepare('SELECT project_id FROM project_tasks WHERE id = ?').get(taskId) as
    | { project_id: number }
    | undefined;
  if (!task || !canAccessProject(task.project_id, req.authUser!.id, req.authUser!.role)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  const statusParsed = z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED']).safeParse(req.body?.status);
  if (!statusParsed.success) {
    res.status(400).json({ error: 'Invalid task status' });
    return;
  }
  db.prepare("UPDATE project_tasks SET status = ?, updated_at = datetime('now') WHERE id = ?").run(statusParsed.data, taskId);
  res.json({ success: true });
});

router.post('/projects/:id/progress', requireAuth, (req: AuthRequest, res) => {
  const projectId = Number(req.params.id);
  if (!canAccessProject(projectId, req.authUser!.id, req.authUser!.role)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  const schema = z.object({
    title: z.string().min(2).max(160),
    notes: z.string().min(3).max(1500),
    percentComplete: z.number().int().min(0).max(100),
    photoUrl: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid progress update' });
    return;
  }
  const d = parsed.data;
  db.prepare(
    `INSERT INTO project_progress (project_id, author_id, title, notes, percent_complete, photo_url)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(projectId, req.authUser!.id, d.title, d.notes, d.percentComplete, d.photoUrl || '/src/assets/images/service_construction_team_1794912447881.jpg');

  const nextStatus = d.percentComplete >= 100 ? 'COMPLETED' : 'IN_PROGRESS';
  db.prepare("UPDATE projects SET progress_percent = ?, status = ?, updated_at = datetime('now') WHERE id = ?").run(
    d.percentComplete,
    nextStatus,
    projectId
  );
  res.status(201).json({ success: true });
});

router.post('/projects/:id/expenses', requireAuth, (req: AuthRequest, res) => {
  const projectId = Number(req.params.id);
  if (!canAccessProject(projectId, req.authUser!.id, req.authUser!.role)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  const schema = z.object({
    category: z.string().min(2),
    title: z.string().min(2).max(160),
    amountUzs: z.number().int().positive(),
    expenseDate: z.string().min(4),
    vendorName: z.string().max(120).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid expense payload' });
    return;
  }
  const d = parsed.data;
  db.exec('BEGIN');
  try {
    const info = db
      .prepare(
        `INSERT INTO project_expenses (project_id, recorded_by, category, title, amount_uzs, expense_date, vendor_name)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(projectId, req.authUser!.id, d.category, d.title, d.amountUzs, d.expenseDate, d.vendorName ?? null);

    db.prepare(
      `UPDATE projects SET spent_uzs = (SELECT COALESCE(SUM(amount_uzs), 0) FROM project_expenses WHERE project_id = ?), updated_at = datetime('now') WHERE id = ?`
    ).run(projectId, projectId);
    db.exec('COMMIT');
    res.status(201).json({ id: Number(info.lastInsertRowid) });
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
});

// Contracts & Documents
router.get('/contracts', requireAuth, (req: AuthRequest, res) => {
  const rows = db
    .prepare(
      `SELECT ct.*, p.name as project_name, c.full_name as client_name, k.full_name as contractor_name
       FROM contracts ct
       JOIN projects p ON p.id = ct.project_id
       JOIN users c ON c.id = ct.client_id
       JOIN users k ON k.id = ct.contractor_id
       WHERE ct.client_id = ? OR ct.contractor_id = ? OR ? = 'ADMIN'
       ORDER BY ct.id DESC`
    )
    .all(req.authUser!.id, req.authUser!.id, req.authUser!.role);
  res.json({ items: rows });
});

router.post('/contracts', requireAuth, (req: AuthRequest, res) => {
  const schema = z.object({
    projectId: z.number().int().positive(),
    contractorEmail: z.string().email(),
    title: z.string().min(3),
    amountUzs: z.number().int().positive(),
    terms: z.string().min(5),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid contract payload' });
    return;
  }
  const contractor = db.prepare('SELECT id FROM users WHERE email = ?').get(parsed.data.contractorEmail.toLowerCase()) as
    | { id: number }
    | undefined;
  if (!contractor) {
    res.status(404).json({ error: 'Contractor user not found' });
    return;
  }
  const num = `QH-CTR-${Date.now().toString().slice(-6)}`;
  const info = db
    .prepare(
      `INSERT INTO contracts (contract_number, project_id, client_id, contractor_id, title, amount_uzs, terms)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(num, parsed.data.projectId, req.authUser!.id, contractor.id, parsed.data.title, parsed.data.amountUzs, parsed.data.terms);
  res.status(201).json({ id: Number(info.lastInsertRowid), contractNumber: num });
});

router.post('/projects/:id/documents', requireAuth, (req: AuthRequest, res) => {
  const projectId = Number(req.params.id);
  if (!canAccessProject(projectId, req.authUser!.id, req.authUser!.role)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  const schema = z.object({
    title: z.string().min(2),
    docType: z.enum(['BLUEPRINT', 'PERMIT', 'CONTRACT', 'INVOICE', 'REPORT']).default('BLUEPRINT'),
    fileUrl: z.string().min(1).default('#document-file'),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid document payload' });
    return;
  }
  const info = db
    .prepare('INSERT INTO documents (project_id, uploaded_by, title, doc_type, file_url) VALUES (?, ?, ?, ?, ?)')
    .run(projectId, req.authUser!.id, parsed.data.title, parsed.data.docType, parsed.data.fileUrl);
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

// Smart Construction Estimate Calculator
const calcSchema = z.object({
  buildingAreaSqm: z.number().min(20).max(50000),
  floors: z.number().int().min(1).max(30),
  constructionType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'VILLA', 'WAREHOUSE']),
  foundationType: z.enum(['STRIP', 'SLAB', 'PILE']),
  wallMaterial: z.enum(['FIRED_BRICK', 'FOAM_BLOCK', 'MONOLITH_CONCRETE']),
  roofType: z.enum(['METAL_TILE', 'PROFNASTIL', 'FLAT_MEMBRANE']),
  finishingType: z.enum(['ECONOMY', 'STANDARD', 'PREMIUM']),
  region: z.string().min(2),
  lang: z.enum(['uz', 'ru', 'en']).optional(),
});

router.post('/estimates/calculate', (req, res) => {
  const parsed = calcSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid calculator inputs', details: parsed.error.flatten() });
    return;
  }
  const result = calculateConstructionEstimate(parsed.data, parsed.data.lang ?? 'uz');
  res.json(result);
});

router.get('/estimates/configs', (_req, res) => {
  const configs = db.prepare('SELECT * FROM estimate_configs ORDER BY id ASC').all();
  res.json({ items: configs });
});

router.patch('/estimates/configs/:key', requireAuth, requireRole('ADMIN', 'COMPANY'), (req: AuthRequest, res) => {
  const schema = z.object({
    unitPriceUzs: z.number().int().positive(),
    coefficient: z.number().min(0.2).max(5.0),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid config update' });
    return;
  }
  db.prepare(
    `UPDATE estimate_configs SET unit_price_uzs = ?, coefficient = ?, updated_by = ?, updated_at = datetime('now') WHERE key = ?`
  ).run(parsed.data.unitPriceUzs, parsed.data.coefficient, req.authUser!.id, req.params.key);
  recordAuditLog({
    actorId: req.authUser!.id,
    action: 'ESTIMATE_CONFIG_UPDATED',
    entityType: 'ESTIMATE_CONFIG',
    entityId: req.params.key,
  });
  res.json({ success: true });
});

router.get('/estimates', requireAuth, (req: AuthRequest, res) => {
  const rows = db
    .prepare('SELECT * FROM estimates WHERE user_id = ? OR ? = \'ADMIN\' ORDER BY id DESC')
    .all(req.authUser!.id, req.authUser!.role);
  res.json({ items: rows });
});

router.post('/estimates', requireAuth, (req: AuthRequest, res) => {
  const saveSchema = calcSchema.extend({
    title: z.string().min(2).max(160),
    projectId: z.number().int().positive().optional(),
  });
  const parsed = saveSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid estimate save payload' });
    return;
  }
  const d = parsed.data;
  const calc = calculateConstructionEstimate(d, d.lang ?? 'uz');
  db.exec('BEGIN');
  try {
    const info = db
      .prepare(
        `INSERT INTO estimates (user_id, project_id, title, building_area_sqm, floors, construction_type, foundation_type, wall_material, roof_type, finishing_type, region, total_estimated_uzs, is_estimate)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
      )
      .run(
        req.authUser!.id,
        d.projectId ?? null,
        d.title,
        d.buildingAreaSqm,
        d.floors,
        d.constructionType,
        d.foundationType,
        d.wallMaterial,
        d.roofType,
        d.finishingType,
        d.region,
        calc.totalEstimatedUzs
      );
    const estimateId = Number(info.lastInsertRowid);
    const insItem = db.prepare(
      `INSERT INTO estimate_items (estimate_id, item_key, name, quantity, unit, unit_price_uzs, subtotal_uzs)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const item of calc.items) {
      insItem.run(estimateId, item.itemKey, item.name, item.quantity, item.unit, item.unitPriceUzs, item.subtotalUzs);
    }
    db.exec('COMMIT');
    res.status(201).json({ id: estimateId, ...calc });
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
});

export default router;
