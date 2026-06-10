import { db } from '../firebase';
import {
  collection, addDoc, doc, updateDoc,
  serverTimestamp, arrayUnion,
} from 'firebase/firestore';
import { logAction } from './auditLogger';

/**
 * Creates a new grievance ticket in Firestore.
 */
export async function createTicket(data, user) {
  const ticketRef = await addDoc(collection(db, 'grievance_tickets'), {
    userId: user.uid,
    name: data.name,
    email: data.email,
    issueType: data.issueType,
    description: data.description,
    attachmentUrl: data.attachmentUrl || '',
    status: 'Open',
    assignedTo: 'DPO',
    remarks: [],
    isTest: data.isTest || false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await logAction(ticketRef.id, 'Ticket Created', user.email);
  return ticketRef.id;
}

/**
 * Updates the status of a ticket.
 */
export async function updateTicketStatus(ticketId, newStatus, performedBy) {
  const ref = doc(db, 'grievance_tickets', ticketId);
  await updateDoc(ref, {
    status: newStatus,
    updatedAt: serverTimestamp(),
  });
  await logAction(ticketId, `Status Changed to "${newStatus}"`, performedBy);
}

/**
 * Adds a remark to a ticket.
 */
export async function addRemark(ticketId, remark, performedBy) {
  const ref = doc(db, 'grievance_tickets', ticketId);
  const remarkEntry = {
    text: remark,
    by: performedBy,
    at: new Date().toISOString(),
  };
  await updateDoc(ref, {
    remarks: arrayUnion(remarkEntry),
    updatedAt: serverTimestamp(),
  });
  await logAction(ticketId, `Remark Added: "${remark.substring(0, 60)}..."`, performedBy);
}

/**
 * Assigns a ticket to a specific officer.
 */
export async function assignTicket(ticketId, assignee, performedBy) {
  const ref = doc(db, 'grievance_tickets', ticketId);
  await updateDoc(ref, {
    assignedTo: assignee,
    updatedAt: serverTimestamp(),
  });
  await logAction(ticketId, `Assigned to "${assignee}"`, performedBy);
}
