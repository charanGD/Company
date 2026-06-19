/**
 * Audit logging is now handled server-side in PostgreSQL.
 * This file is kept as a no-op stub to avoid breaking any
 * future imports, but all audit writes happen automatically
 * in the backend API routes.
 */
export async function logAction(_ticketId, _action, _performedBy) {
  // no-op — handled by PostgreSQL backend
}
