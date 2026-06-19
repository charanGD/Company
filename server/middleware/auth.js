import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dpdp-grievance-secret-change-in-prod';

// ── Sign a token ─────────────────────────────────────────────────────────────
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

/**
 * requireAuth middleware
 * Verifies the JWT in the `Authorization: Bearer <token>` header.
 * Attaches req.user = { id, username, email, role, display_name }
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorised — invalid or expired token' });
  }
}

/**
 * requireAdmin middleware — must be used AFTER requireAuth
 * Allows role: 'admin' only
 */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden — admin only' });
  }
  next();
}

/**
 * requireStaffOrAdmin middleware — must be used AFTER requireAuth
 * Allows role: 'admin' or 'staff'
 */
export function requireStaffOrAdmin(req, res, next) {
  if (!['admin', 'staff'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Forbidden — staff or admin only' });
  }
  next();
}
