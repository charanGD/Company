import { apiGet, apiPost, apiPatch } from '../api/client';

/**
 * Creates a new grievance ticket via the REST API.
 * Returns the new ticket id.
 */
export async function createTicket(data, _user) {
  const ticket = await apiPost('/api/tickets', {
    name:          data.name,
    email:         data.email,
    issueType:     data.issueType,
    description:   data.description,
    attachmentUrl: data.attachmentUrl || '',
    isTest:        data.isTest || false,
  });
  return ticket.id;
}

/**
 * Updates the status of a ticket.
 */
export async function updateTicketStatus(ticketId, newStatus) {
  return apiPatch(`/api/tickets/${ticketId}/status`, { status: newStatus });
}

/**
 * Adds a remark to a ticket.
 */
export async function addRemark(ticketId, remark) {
  return apiPost(`/api/tickets/${ticketId}/remarks`, { text: remark });
}

/**
 * Assigns a ticket to a specific officer.
 */
export async function assignTicket(ticketId, assignee) {
  return apiPatch(`/api/tickets/${ticketId}/assign`, { assignee });
}
