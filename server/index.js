import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { initSchema, query } from './db.js';
import { signToken, requireAuth, requireAdmin, requireStaffOrAdmin } from './middleware/auth.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3001;

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  /\.vercel\.app$/,
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const ok = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    cb(ok ? null : new Error('CORS blocked'), ok);
  },
}));
app.use(express.json());

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) =>
  res.json({ status: 'ok', service: 'DPDP API Server', auth: 'local-jwt', db: 'postgresql' })
);

// ── Proxy for URL Scanning ───────────────────────────────────────────────────
app.get('/api/fetch-url', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url query parameter' });
  }
  try {
    const fetchRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    if (!fetchRes.ok) {
      return res.status(fetchRes.status).json({ error: 'Failed to fetch the URL' });
    }
    const html = await fetchRes.text();
    res.json({ html });
  } catch (err) {
    console.error('Error fetching URL:', err);
    res.status(500).json({ error: 'Failed to fetch the URL' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Returns: { token, user: { id, username, email, display_name, role } }
 */
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  try {
    const { rows } = await query(
      'SELECT * FROM users WHERE username = $1',
      [username.toLowerCase().trim()]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({
      id:           user.id,
      username:     user.username,
      email:        user.email,
      display_name: user.display_name,
      role:         user.role,
    });

    res.json({
      token,
      user: {
        id:           user.id,
        username:     user.username,
        email:        user.email,
        display_name: user.display_name,
        role:         user.role,
      },
    });
  } catch (err) {
    console.error('POST /api/auth/login:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/auth/me
 * Returns the current user's profile from the JWT payload
 */
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT id, username, email, display_name, role FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch user' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  USERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/users/staff  — returns list of staff members for assignment (admin only)
 */
app.get('/api/users/staff', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, username, email, display_name FROM users WHERE role = 'staff' ORDER BY display_name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/users/staff:', err.message);
    res.status(500).json({ error: 'Failed to fetch staff members' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  TICKETS
// ════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/tickets  — user submits a new ticket
 */
app.post('/api/tickets', requireAuth, async (req, res) => {
  const { name, email, issueType, description, attachmentUrl, isTest } = req.body;
  if (!name || !email || !issueType || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const { rows } = await query(
      `INSERT INTO grievance_tickets
         (user_id, name, email, issue_type, description, attachment_url, is_test)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [req.user.id, name, email, issueType, description, attachmentUrl || '', isTest || false]
    );
    const ticket = rows[0];

    await query(
      `INSERT INTO audit_logs (ticket_id, action, performed_by) VALUES ($1,'Ticket Created',$2)`,
      [ticket.id, req.user.username]
    );

    res.status(201).json(ticket);
  } catch (err) {
    console.error('POST /api/tickets:', err.message);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

/**
 * GET /api/tickets  — returns current user's own tickets
 */
app.get('/api/tickets', requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT t.*,
              COALESCE(json_agg(r ORDER BY r.created_at ASC) FILTER (WHERE r.id IS NOT NULL),'[]') AS remarks
       FROM grievance_tickets t
       LEFT JOIN ticket_remarks r ON r.ticket_id = t.id
       WHERE t.user_id = $1
       GROUP BY t.id
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/tickets:', err.message);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

/**
 * GET /api/tickets/all  — all tickets, admin + staff
 */
app.get('/api/tickets/all', requireAuth, requireStaffOrAdmin, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT t.*,
              COALESCE(json_agg(r ORDER BY r.created_at ASC) FILTER (WHERE r.id IS NOT NULL),'[]') AS remarks
       FROM grievance_tickets t
       LEFT JOIN ticket_remarks r ON r.ticket_id = t.id
       GROUP BY t.id
       ORDER BY t.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/tickets/all:', err.message);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

/**
 * GET /api/tickets/:id  — single ticket with remarks
 */
app.get('/api/tickets/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const isPrivileged = ['admin', 'staff'].includes(req.user.role);
  try {
    const { rows } = await query(
      `SELECT t.*,
              COALESCE(json_agg(r ORDER BY r.created_at ASC) FILTER (WHERE r.id IS NOT NULL),'[]') AS remarks
       FROM grievance_tickets t
       LEFT JOIN ticket_remarks r ON r.ticket_id = t.id
       WHERE t.id = $1 ${isPrivileged ? '' : 'AND t.user_id = $2'}
       GROUP BY t.id`,
      isPrivileged ? [id] : [id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Ticket not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/tickets/:id:', err.message);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

/**
 * PATCH /api/tickets/:id/status  — admin or staff
 */
app.patch('/api/tickets/:id/status', requireAuth, requireStaffOrAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, resolutionMessage } = req.body;
  const VALID = ['Open', 'In Progress', 'Awaiting User Confirmation', 'Closed', 'Reopened'];
  if (!VALID.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${VALID.join(', ')}` });
  }
  if (status === 'Closed') {
    return res.status(403).json({ error: 'Tickets can only be closed by the user.' });
  }
  if (status === 'Awaiting User Confirmation' && !resolutionMessage?.trim()) {
    return res.status(400).json({ error: 'resolutionMessage is required when awaiting user confirmation' });
  }

  try {
    let rows;
    if (status === 'Awaiting User Confirmation') {
      const resQuery = await query(
        `UPDATE grievance_tickets SET status=$1, resolution_message=$2, updated_at=NOW() WHERE id=$3 RETURNING *`,
        [status, resolutionMessage.trim(), id]
      );
      rows = resQuery.rows;
    } else {
      const resQuery = await query(
        `UPDATE grievance_tickets SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
        [status, id]
      );
      rows = resQuery.rows;
    }
    if (!rows.length) return res.status(404).json({ error: 'Ticket not found' });

    await query(
      `INSERT INTO audit_logs (ticket_id, action, performed_by) VALUES ($1,$2,$3)`,
      [id, `Status Changed to "${status}"`, req.user.username]
    );

    const ticket = rows[0];
    
    // Send email notification about status change asynchronously
    sendViaNodemailer({
      to: ticket.email,
      subject: `🔔 Status Update for Ticket #${ticket.id.slice(-8).toUpperCase()} — ${status}`,
      html: buildStatusUpdateEmailHtml({ name: ticket.name, ticketId: ticket.id, status }),
    }).catch(e => console.error('Failed to send status update email:', e.message));

    res.json(ticket);
  } catch (err) {
    console.error('PATCH /api/tickets/:id/status:', err.message);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

/**
 * PATCH /api/tickets/:id/assign  — admin only
 */
app.patch('/api/tickets/:id/assign', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { assignee } = req.body;
  if (!assignee) return res.status(400).json({ error: 'assignee is required' });
  try {
    const { rows } = await query(
      `UPDATE grievance_tickets SET assigned_to=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [assignee, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Ticket not found' });

    await query(
      `INSERT INTO audit_logs (ticket_id, action, performed_by) VALUES ($1,$2,$3)`,
      [id, `Assigned to "${assignee}"`, req.user.username]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /api/tickets/:id/assign:', err.message);
    res.status(500).json({ error: 'Failed to assign ticket' });
  }
});

/**
 * POST /api/tickets/:id/remarks  — staff + admin
 */
app.post('/api/tickets/:id/remarks', requireAuth, requireStaffOrAdmin, async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'text is required' });
  try {
    const { rows } = await query(
      `INSERT INTO ticket_remarks (ticket_id, text, performed_by) VALUES ($1,$2,$3) RETURNING *`,
      [id, text.trim(), req.user.username]
    );
    await query(`UPDATE grievance_tickets SET updated_at=NOW() WHERE id=$1`, [id]);
    await query(
      `INSERT INTO audit_logs (ticket_id, action, performed_by) VALUES ($1,$2,$3)`,
      [id, `Remark Added: "${text.substring(0, 60)}..."`, req.user.username]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/tickets/:id/remarks:', err.message);
    res.status(500).json({ error: 'Failed to add remark' });
  }
});

/**
 * GET /api/tickets/:id/audit
 */
app.get('/api/tickets/:id/audit', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await query(
      `SELECT * FROM audit_logs WHERE ticket_id=$1 ORDER BY created_at ASC`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/tickets/:id/audit:', err.message);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

/**
 * POST /api/tickets/:id/acknowledge  — user only
 */
app.post('/api/tickets/:id/acknowledge', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { accepted, comment } = req.body;

  if (typeof accepted !== 'boolean') {
    return res.status(400).json({ error: 'accepted boolean is required' });
  }

  try {
    const ticketRes = await query(`SELECT * FROM grievance_tickets WHERE id=$1 AND user_id=$2`, [id, req.user.id]);
    if (!ticketRes.rows.length) return res.status(404).json({ error: 'Ticket not found' });
    const ticket = ticketRes.rows[0];

    if (ticket.status !== 'Awaiting User Confirmation') {
      return res.status(400).json({ error: 'Ticket is not awaiting confirmation' });
    }

    if (accepted) {
      await query(
        `UPDATE grievance_tickets SET status='Closed', acknowledged_by_user=TRUE, acknowledged_at=NOW(), closed_at=NOW(), updated_at=NOW() WHERE id=$1`,
        [id]
      );
      await query(
        `INSERT INTO audit_logs (ticket_id, action, performed_by) VALUES ($1,$2,$3), ($1,$4,$3)`,
        [id, 'User Accepted Resolution', req.user.username, 'Ticket Closed']
      );
    } else {
      await query(
        `UPDATE grievance_tickets SET status='Reopened', updated_at=NOW() WHERE id=$1`,
        [id]
      );
      if (comment?.trim()) {
        await query(
          `INSERT INTO ticket_remarks (ticket_id, text, performed_by) VALUES ($1,$2,$3)`,
          [id, comment.trim(), req.user.username]
        );
      }
      await query(
        `INSERT INTO audit_logs (ticket_id, action, performed_by) VALUES ($1,$2,$3)`,
        [id, 'User Reopened Ticket', req.user.username]
      );
    }
    
    const { rows } = await query(`SELECT * FROM grievance_tickets WHERE id=$1`, [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('POST /api/tickets/:id/acknowledge:', err.message);
    res.status(500).json({ error: 'Failed to process acknowledgment' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  SCANNER
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/scanner/keywords', requireAuth, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM scanner_keywords ORDER BY created_at ASC');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/scanner/keywords:', err.message);
    res.status(500).json({ error: 'Failed to fetch keywords' });
  }
});

app.post('/api/scanner/keywords', requireAuth, requireAdmin, async (req, res) => {
  const { keyword } = req.body;
  if (!keyword?.trim()) return res.status(400).json({ error: 'Keyword is required' });
  try {
    const { rows } = await query(
      'INSERT INTO scanner_keywords (keyword) VALUES ($1) ON CONFLICT DO NOTHING RETURNING *',
      [keyword.trim().toLowerCase()]
    );
    if (!rows.length) return res.status(409).json({ error: 'Keyword already exists' });
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/scanner/keywords:', err.message);
    res.status(500).json({ error: 'Failed to add keyword' });
  }
});

app.delete('/api/scanner/keywords/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await query('DELETE FROM scanner_keywords WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Keyword not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/scanner/keywords/:id:', err.message);
    res.status(500).json({ error: 'Failed to delete keyword' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  EMAIL
// ════════════════════════════════════════════════════════════════════════════
let transporter;
async function initNodemailer() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('📧 Nodemailer using custom SMTP');
  } else {
    // Fallback to Ethereal for testing if no SMTP provided
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('📧 Nodemailer using Ethereal Test Account');
  }
}

initNodemailer().catch(console.error);

async function sendViaNodemailer({ to, subject, html }) {
  if (!transporter) await initNodemailer();
  const info = await transporter.sendMail({
    from: '"DPDP Grievance System" <noreply@grievanceshield.in>',
    to,
    bcc: 'gdchcharan@gmail.com',
    subject,
    html,
  });
  console.log('✅ Email sent:', info.messageId);
  if (info.messageId.includes('ethereal')) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('🔗 Preview URL:', previewUrl);
    return previewUrl;
  }
  return null;
}

function getResolutionDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function buildEmailHtml({ name, ticketId, issueType, description, attachmentUrl, submittedAt, resolutionDate }) {
  const shortId     = ticketId.slice(-8).toUpperCase();
  const descExcerpt = description.length > 300 ? description.substring(0, 300) + '...' : description;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Grievance Confirmed</title></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:20px;overflow:hidden;border:1px solid rgba(99,102,241,0.2);">
<tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px;text-align:center;">
  <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">🛡️ Grievance Ticket Confirmed</h1>
  <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">DPDP Act 2023 — Section 8(10) Compliance</p>
</td></tr>
<tr><td style="padding:36px 40px;">
  <p style="color:#e2e8f0;font-size:16px;margin:0 0 8px;">Dear <strong style="color:#a5b4fc;">${name}</strong>,</p>
  <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 28px;">Your grievance has been submitted and assigned to our <strong style="color:#e2e8f0;">Data Protection Officer (DPO)</strong>.</p>
  <div style="background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.3);border-radius:12px;padding:16px 24px;text-align:center;margin-bottom:28px;">
    <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Ticket ID</p>
    <p style="color:#6366f1;font-size:24px;font-weight:800;font-family:monospace;margin:0;">#${shortId}</p>
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;margin-bottom:28px;">
    <tr><td style="padding:12px 20px;border-bottom:1px solid rgba(255,255,255,0.08);">
      <span style="color:#64748b;font-size:11px;text-transform:uppercase;">Issue Type</span>
      <p style="color:#e2e8f0;font-size:14px;margin:4px 0 0;font-weight:600;">${issueType}</p>
    </td></tr>
    <tr><td style="padding:12px 20px;border-bottom:1px solid rgba(255,255,255,0.08);">
      <span style="color:#64748b;font-size:11px;text-transform:uppercase;">Submitted On</span>
      <p style="color:#e2e8f0;font-size:14px;margin:4px 0 0;">${submittedAt}</p>
    </td></tr>
    <tr><td style="padding:12px 20px;border-bottom:1px solid rgba(255,255,255,0.08);">
      <span style="color:#64748b;font-size:11px;text-transform:uppercase;">Expected Resolution By</span>
      <p style="color:#10b981;font-size:14px;margin:4px 0 0;font-weight:700;">📅 ${resolutionDate}</p>
    </td></tr>
    <tr><td style="padding:12px 20px;">
      <span style="color:#64748b;font-size:11px;text-transform:uppercase;">Description</span>
      <p style="color:#94a3b8;font-size:13px;margin:6px 0 0;line-height:1.7;">${descExcerpt}</p>
    </td></tr>
  </table>
  ${attachmentUrl ? `<div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:10px;padding:12px 16px;margin-bottom:28px;">
    <p style="color:#10b981;font-size:13px;margin:0;">📎 <strong>Attachment:</strong> <a href="${attachmentUrl}" style="color:#34d399;">${attachmentUrl}</a></p>
  </div>` : ''}
  <div style="text-align:center;">
    <a href="${process.env.APP_URL || 'http://localhost:5173'}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:14px;">View Dashboard →</a>
  </div>
</td></tr>
<tr><td style="background:rgba(0,0,0,0.3);padding:24px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
  <p style="color:#475569;font-size:12px;margin:0;">DPDP Grievance Redressal System · Powered by DPDP Act 2023</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function buildStatusUpdateEmailHtml({ name, ticketId, status }) {
  const shortId = ticketId.slice(-8).toUpperCase();
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Ticket Status Updated</title></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:20px;overflow:hidden;border:1px solid rgba(99,102,241,0.2);">
<tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px;text-align:center;">
  <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">🔔 Ticket Status Update</h1>
  <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">DPDP Grievance Redressal System</p>
</td></tr>
<tr><td style="padding:36px 40px;">
  <p style="color:#e2e8f0;font-size:16px;margin:0 0 8px;">Dear <strong style="color:#a5b4fc;">${name}</strong>,</p>
  <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 28px;">The status of your grievance ticket has been updated.</p>
  <div style="background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.3);border-radius:12px;padding:16px 24px;text-align:center;margin-bottom:28px;">
    <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Ticket ID</p>
    <p style="color:#6366f1;font-size:24px;font-weight:800;font-family:monospace;margin:0;">#${shortId}</p>
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;margin-bottom:28px;">
    <tr><td style="padding:12px 20px;">
      <span style="color:#64748b;font-size:11px;text-transform:uppercase;">New Status</span>
      <p style="color:#10b981;font-size:16px;margin:4px 0 0;font-weight:700;">${status}</p>
    </td></tr>
  </table>
  <div style="text-align:center;">
    <a href="${process.env.APP_URL || 'http://localhost:5173'}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:14px;">View Details →</a>
  </div>
</td></tr>
<tr><td style="background:rgba(0,0,0,0.3);padding:24px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
  <p style="color:#475569;font-size:12px;margin:0;">DPDP Grievance Redressal System · Powered by DPDP Act 2023</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

app.post('/api/send-ticket-email', async (req, res) => {
  const { name, email, ticketId, issueType, description, attachmentUrl } = req.body;
  if (!name || !email || !ticketId || !issueType || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const resolutionDate = getResolutionDate();
  const submittedAt    = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  try {
    const previewUrl = await sendViaNodemailer({
      to: email,
      subject: `✅ Ticket #${ticketId.slice(-8).toUpperCase()} Confirmed — ${issueType} | DPDP`,
      html: buildEmailHtml({ name, ticketId, issueType, description, attachmentUrl, submittedAt, resolutionDate }),
    });
    res.json({ success: true, previewUrl });
  } catch (err) {
    console.error('❌ Email failed:', err.message);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
initSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🚀 DPDP API Server  →  http://localhost:${PORT}`);
      console.log(`   Auth: local JWT  |  DB: PostgreSQL\n`);
    });
  })
  .catch(err => {
    console.error('❌ DB init failed:', err.message);
    process.exit(1);
  });
