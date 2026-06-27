import pkg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// ── Connection Pool ──────────────────────────────────────────────────────────
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

// ── Helper ───────────────────────────────────────────────────────────────────
export async function query(text, params) {
  return pool.query(text, params);
}

// ── Schema Init + Seed ───────────────────────────────────────────────────────
export async function initSchema() {
  const client = await pool.connect();
  try {
    // Create tables
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      -- Users table (local auth — no Firebase)
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        username      TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        display_name  TEXT NOT NULL,
        email         TEXT NOT NULL UNIQUE,
        role          TEXT NOT NULL DEFAULT 'user'  -- 'admin' | 'staff' | 'user'
      );

      -- Grievance Tickets
      CREATE TABLE IF NOT EXISTS grievance_tickets (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id        INTEGER NOT NULL REFERENCES users(id),
        name           TEXT NOT NULL,
        email          TEXT NOT NULL,
        issue_type     TEXT NOT NULL,
        description    TEXT NOT NULL,
        attachment_url TEXT DEFAULT '',
        status         TEXT NOT NULL DEFAULT 'Open',
        assigned_to    TEXT NOT NULL DEFAULT 'DPO',
        is_test        BOOLEAN DEFAULT FALSE,
        created_at     TIMESTAMPTZ DEFAULT NOW(),
        updated_at     TIMESTAMPTZ DEFAULT NOW()
      );

      -- Ticket Remarks
      CREATE TABLE IF NOT EXISTS ticket_remarks (
        id           SERIAL PRIMARY KEY,
        ticket_id    UUID NOT NULL REFERENCES grievance_tickets(id) ON DELETE CASCADE,
        text         TEXT NOT NULL,
        performed_by TEXT NOT NULL,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );

      -- Audit Logs
      CREATE TABLE IF NOT EXISTS audit_logs (
        id           SERIAL PRIMARY KEY,
        ticket_id    UUID NOT NULL REFERENCES grievance_tickets(id) ON DELETE CASCADE,
        action       TEXT NOT NULL,
        performed_by TEXT NOT NULL,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );

      -- Dynamic Scanner Keywords
      CREATE TABLE IF NOT EXISTS scanner_keywords (
        id           SERIAL PRIMARY KEY,
        keyword      TEXT NOT NULL UNIQUE,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Add new columns for User Acknowledgment Workflow if they don't exist
    await client.query(`
      ALTER TABLE grievance_tickets
      ADD COLUMN IF NOT EXISTS resolution_message TEXT,
      ADD COLUMN IF NOT EXISTS acknowledged_by_user BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
    `);

    // Seed default users (only if they don't already exist)
    await seedUsers(client);

    console.log('✅ PostgreSQL schema initialised');
  } finally {
    client.release();
  }
}

async function seedUsers(client) {
  const seeds = [
    { username: 'admin',  display_name: 'Administrator',  email: 'admin@grievanceshield.in',  password: 'admin123',  role: 'admin' },
    { username: 'staff',  display_name: 'DPO Staff',       email: 'staff@grievanceshield.in',  password: 'staff123',  role: 'staff' },
    { username: 'user',   display_name: 'Regular User',    email: 'user@grievanceshield.in',   password: 'user123',   role: 'user'  },
  ];

  for (const u of seeds) {
    const { rows } = await client.query(
      'SELECT id FROM users WHERE username = $1',
      [u.username]
    );
    if (rows.length === 0) {
      const hash = await bcrypt.hash(u.password, 10);
      await client.query(
        `INSERT INTO users (username, password_hash, display_name, email, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [u.username, hash, u.display_name, u.email, u.role]
      );
      console.log(`  👤 Seeded user: ${u.username} (${u.role})`);
    }
  }
}
