import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// ── Gmail SMTP transporter ────────────────────────────────────────────────────
// Requires a Gmail account with 2-Step Verification + an "App Password"
// (regular Gmail passwords are rejected by SMTP). Set in .env:
//   GMAIL_USER=youraddress@gmail.com
//   GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx   (16-char app password, no spaces)
//   COMPANY_EMAIL=inbox-to-receive-requests@gmail.com   (optional — defaults to GMAIL_USER)
let transporter = null;
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
} else {
  console.error(
    '⚠️  GMAIL_USER / GMAIL_APP_PASSWORD not set — appointment request emails will fail until these are configured.'
  );
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── POST /api/appointments — public, called from the "Book An Appointment" form ──
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are all required.' });
    }

    if (!transporter) {
      return res.status(500).json({ success: false, message: 'Email is not configured on the server yet.' });
    }

    const to = process.env.COMPANY_EMAIL || process.env.GMAIL_USER;

    await transporter.sendMail({
      from: `"Vibewear Website" <${process.env.GMAIL_USER}>`,
      to,
      replyTo: email.trim(),
      subject: `New Appointment Request — ${name.trim()}`,
      text: `New in-person appointment request from the Vibewear homepage.\n\nName: ${name.trim()}\nEmail: ${email.trim()}\n\nMessage:\n${message.trim()}`,
      html: `
        <div style="font-family: sans-serif; font-size: 14px; color: #111;">
          <h2 style="margin-bottom: 4px;">New Appointment Request</h2>
          <p style="color:#666; margin-top:0;">Submitted via the Vibewear homepage "Book An Appointment" form.</p>
          <p><strong>Name:</strong> ${escapeHtml(name.trim())}</p>
          <p><strong>Email:</strong> ${escapeHtml(email.trim())}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${escapeHtml(message.trim())}</p>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Appointment email failed:', err);
    res.status(500).json({ success: false, message: 'Could not send your request right now. Please try again shortly.' });
  }
});

export default router;
