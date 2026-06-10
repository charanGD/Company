import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Logs an action to the audit_logs Firestore collection.
 * @param {string} ticketId
 * @param {string} action - e.g. "Ticket Created", "Status Changed to Resolved"
 * @param {string} performedBy - user email or uid
 */
export async function logAction(ticketId, action, performedBy) {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      ticketId,
      action,
      performedBy,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}
