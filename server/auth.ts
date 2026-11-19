import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import type { AuthUser, JwtPayload, Role } from './types.ts';

const ACCESS_SECRET = process.env.JWT_SECRET || 'qurilishhub_dev_access_secret_change_me';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'qurilishhub_dev_refresh_secret_change_me';

export interface AuthRequest extends Request {
  authUser?: AuthUser;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function signAccessToken(user: { id: number; email: string; role: Role }): string {
  const payload: JwtPayload & { jti: string } = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'access',
    jti: crypto.randomUUID(),
  };
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '2h' });
}

export function signRefreshToken(user: { id: number; email: string; role: Role }): string {
  const payload: JwtPayload & { jti: string } = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'refresh',
    jti: crypto.randomUUID(),
  };
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '14d' });
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, ACCESS_SECRET) as JwtPayload;
  if (decoded.type !== 'access') {
    throw new Error('Invalid access token type');
  }
  return decoded;
}

export function verifyRefreshToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, REFRESH_SECRET) as JwtPayload;
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid refresh token type');
  }
  return decoded;
}

export function getAuthUserById(userId: number): AuthUser | null {
  const row = db
    .prepare(
      `SELECT id, email, full_name, phone, role, region, avatar_url, verified, is_active
       FROM users
       WHERE id = ? AND deleted_at IS NULL`
    )
    .get(userId) as
    | {
        id: number;
        email: string;
        full_name: string;
        phone: string | null;
        role: Role;
        region: string;
        avatar_url: string | null;
        verified: number;
        is_active: number;
      }
    | undefined;

  if (!row || row.is_active !== 1) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    role: row.role,
    region: row.region,
    avatarUrl: row.avatar_url,
    verified: row.verified,
    isActive: row.is_active,
  };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    const decoded = verifyAccessToken(token);
    const user = getAuthUserById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: 'Account inactive or not found' });
      return;
    }
    req.authUser = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice('Bearer '.length).trim();
    try {
      const decoded = verifyAccessToken(token);
      const user = getAuthUserById(decoded.userId);
      if (user) {
        req.authUser = user;
      }
    } catch {
      // Ignore invalid optional token
    }
  }
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.authUser.role)) {
      res.status(403).json({
        error: `Forbidden: requires one of roles [${roles.join(', ')}]`,
      });
      return;
    }
    next();
  };
}

export function recordAuditLog(params: {
  actorId?: number | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  details?: string;
  ipAddress?: string;
}): void {
  try {
    db.prepare(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      params.actorId ?? null,
      params.action,
      params.entityType,
      params.entityId != null ? String(params.entityId) : null,
      params.details ?? null,
      params.ipAddress ?? null
    );
  } catch (err) {
    console.error('Failed to record audit log:', err);
  }
}
