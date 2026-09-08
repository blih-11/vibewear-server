// Loads .env before anything else. This file MUST be the very first import in
// index.js — ES modules evaluate every import's top-level code before the
// importing file's own code runs, regardless of where the import statement is
// textually written. That meant dotenv.config() (previously inline at the top
// of index.js) was actually running AFTER routes/products.js and
// routes/appointments.js had already read process.env at their own top level —
// so those checks always saw an empty environment locally, even when the .env
// file had the right values. Isolating dotenv into its own file and importing
// it first (before any route files) guarantees it runs before anything else.
import dotenv from 'dotenv';
import { dirname as _dirname, join as _join } from 'path';
import { fileURLToPath as _ftu } from 'url';

dotenv.config({ path: _join(_dirname(_ftu(import.meta.url)), '.env') });

// ── Local-only TLS bypass for antivirus/network interception ─────────────────
// Some antivirus software (Kaspersky, ESET, etc.) and corporate networks
// intercept ALL outgoing HTTPS traffic and re-sign it with their own
// certificate, which Node rejects by default. Passing tls.rejectUnauthorized
// into just one library (e.g. nodemailer) isn't reliable — this is Node's own
// official process-wide override, guaranteed to affect every outgoing TLS
// connection in this process (Gmail SMTP, MongoDB Atlas, etc). Opt in
// explicitly via .env — this must NEVER be set on Render/production.
if (process.env.ALLOW_INSECURE_TLS === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('⚠️  NODE_TLS_REJECT_UNAUTHORIZED=0 — certificate validation disabled process-wide (local dev only).');
}
