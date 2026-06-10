import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.EMAIL_SERVER_PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  /\.vercel\.app$/,   // any *.vercel.app preview/production URL
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow curl/Postman
    const allowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    callback(allowed ? null : new Error('CORS blocked'), allowed);
  },
}));
app.use(express.json());

// ─── Nodemailer Transporter ────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use Gmail App Password (not your account password)
  },
});

// Verify transporter on startup
transporter.verify((error) => {
  if (error) {
    console.error('❌ Email transporter error:', error.message);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// ─── Helper: Estimate Resolution Date (30 days from now) ──────────────────
function getResolutionDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ─── Email Template ────────────────────────────────────────────────────────
function buildEmailHtml({ name, ticketId, issueType, description, attachmentUrl, submittedAt, resolutionDate }) {
  const shortId = ticketId.slice(-8).toUpperCase();
  const descExcerpt = description.length > 300 ? description.substring(0, 300) + '...' : description;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Grievance Ticket Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:20px;overflow:hidden;border:1px solid rgba(99,102,241,0.2);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 40px 32px;text-align:center;">
              <div style="width:64px;height:64px;background:rgba(255,255,255,0.15);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
                <span style="font-size:28px;">🛡️</span>
              </div>
              <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;letter-spacing:-0.5px;">
                Grievance Ticket Confirmed
              </h1>
              <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">
                DPDP Act 2023 — Section 8(10) Compliance
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              
              <!-- Greeting -->
              <p style="color:#e2e8f0;font-size:16px;margin:0 0 8px;">Dear <strong style="color:#a5b4fc;">${name}</strong>,</p>
              <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 28px;">
                Your privacy grievance has been successfully submitted and assigned to our <strong style="color:#e2e8f0;">Data Protection Officer (DPO)</strong>. 
                We are committed to addressing your concern within the statutory timeline.
              </p>

              <!-- Ticket ID Badge -->
              <div style="background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.3);border-radius:12px;padding:16px 24px;text-align:center;margin-bottom:28px;">
                <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Your Ticket ID</p>
                <p style="color:#6366f1;font-size:24px;font-weight:800;font-family:monospace;margin:0;">
                  #${shortId}
                </p>
              </div>

              <!-- Ticket Details Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;margin-bottom:28px;">
                <tr>
                  <td style="background:rgba(255,255,255,0.04);padding:12px 20px;border-bottom:1px solid rgba(255,255,255,0.08);">
                    <span style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Issue Type</span>
                    <p style="color:#e2e8f0;font-size:14px;margin:4px 0 0;font-weight:600;">${issueType}</p>
                  </td>
                </tr>
                <tr>
                  <td style="background:rgba(255,255,255,0.02);padding:12px 20px;border-bottom:1px solid rgba(255,255,255,0.08);">
                    <span style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Submitted On</span>
                    <p style="color:#e2e8f0;font-size:14px;margin:4px 0 0;">${submittedAt}</p>
                  </td>
                </tr>
                <tr>
                  <td style="background:rgba(255,255,255,0.04);padding:12px 20px;border-bottom:1px solid rgba(255,255,255,0.08);">
                    <span style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Expected Resolution By</span>
                    <p style="color:#10b981;font-size:14px;margin:4px 0 0;font-weight:700;">📅 ${resolutionDate}</p>
                  </td>
                </tr>
                <tr>
                  <td style="background:rgba(255,255,255,0.02);padding:12px 20px;">
                    <span style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Description</span>
                    <p style="color:#94a3b8;font-size:13px;margin:6px 0 0;line-height:1.7;">${descExcerpt}</p>
                  </td>
                </tr>
              </table>

              ${attachmentUrl ? `
              <!-- Attachment -->
              <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:10px;padding:12px 16px;margin-bottom:28px;">
                <p style="color:#10b981;font-size:13px;margin:0;">
                  📎 <strong>Attachment Submitted:</strong> 
                  <a href="${attachmentUrl}" style="color:#34d399;text-decoration:underline;">${attachmentUrl}</a>
                </p>
              </div>
              ` : ''}

              <!-- What Happens Next -->
              <div style="background:rgba(99,102,241,0.06);border-left:3px solid #6366f1;border-radius:0 10px 10px 0;padding:16px 20px;margin-bottom:28px;">
                <p style="color:#a5b4fc;font-size:13px;font-weight:700;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.5px;">What Happens Next?</p>
                <ul style="color:#94a3b8;font-size:13px;line-height:2;margin:0;padding-left:20px;">
                  <li>Our DPO will review your grievance within <strong style="color:#e2e8f0;">72 hours</strong></li>
                  <li>You may be contacted for additional information if required</li>
                  <li>A resolution will be provided by <strong style="color:#10b981;">${resolutionDate}</strong></li>
                  <li>You can track your ticket status in your <strong style="color:#e2e8f0;">Dashboard</strong></li>
                </ul>
              </div>

              <!-- Legal Notice -->
              <div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-radius:10px;padding:14px 16px;margin-bottom:28px;">
                <p style="color:#fca5a5;font-size:12px;line-height:1.7;margin:0;">
                  ⚖️ <strong>Legal Compliance:</strong> This grievance is being handled under 
                  <strong>DPDP Act 2023, Section 8(10)</strong>. If you are not satisfied with the resolution, 
                  you have the right to escalate to the <strong>Data Protection Board of India</strong>.
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:8px;">
                <a href="http://localhost:5173/dashboard" 
                   style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:14px;letter-spacing:0.3px;">
                  View Your Ticket Dashboard →
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:rgba(0,0,0,0.3);padding:24px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="color:#475569;font-size:12px;margin:0 0 4px;">
                This is an automated confirmation. Please do not reply to this email.
              </p>
              <p style="color:#334155;font-size:11px;margin:0;">
                DPDP Grievance Redressal System · Powered by DPDP Act 2023
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── POST /api/send-ticket-email ──────────────────────────────────────────
app.post('/api/send-ticket-email', async (req, res) => {
  const { name, email, ticketId, issueType, description, attachmentUrl } = req.body;

  // Basic validation
  if (!name || !email || !ticketId || !issueType || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const resolutionDate = getResolutionDate();
  const submittedAt = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  try {
    await transporter.sendMail({
      from: `"DPDP Grievance System 🛡️" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `✅ Ticket #${ticketId.slice(-8).toUpperCase()} Confirmed — ${issueType} | DPDP Grievance System`,
      html: buildEmailHtml({ name, ticketId, issueType, description, attachmentUrl, submittedAt, resolutionDate }),
    });

    console.log(`📧 Confirmation email sent to: ${email} | Ticket: ${ticketId}`);
    res.json({ success: true, message: `Email sent to ${email}` });
  } catch (err) {
    console.error('❌ Failed to send email:', err.message);
    res.status(500).json({ error: 'Failed to send email', details: err.message });
  }
});

// ─── Health check ─────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok', service: 'DPDP Email Server' }));

app.listen(PORT, () => {
  console.log(`\n🚀 DPDP Email Server running at http://localhost:${PORT}`);
  console.log(`   Sending from: ${process.env.EMAIL_USER || '(EMAIL_USER not set)'}\n`);
});
