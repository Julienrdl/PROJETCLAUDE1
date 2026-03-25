import { createClient } from '@libsql/client';

function getDb() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error('TURSO_DATABASE_URL is not set');
  return createClient({ url, authToken });
}

export async function initDb() {
  const db = getDb();
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('rose', 'owner', 'rajaa', 'accountant')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      supplier TEXT NOT NULL,
      amount REAL,
      invoice_date TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending_rose' CHECK(status IN ('pending_rose', 'pending_owner', 'pending_rajaa', 'validated', 'rejected')),
      uploaded_by INTEGER NOT NULL REFERENCES users(id),
      pdf_data TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS validations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id),
      validator_id INTEGER NOT NULL REFERENCES users(id),
      step TEXT NOT NULL CHECK(step IN ('rose', 'owner', 'rajaa')),
      action TEXT NOT NULL CHECK(action IN ('approved', 'rejected')),
      comment TEXT,
      pdf_annotations TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS pdf_edits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id),
      editor_id INTEGER NOT NULL REFERENCES users(id),
      filename TEXT NOT NULL,
      annotations TEXT,
      pdf_data TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  const result = await db.execute('SELECT COUNT(*) as count FROM users');
  const count = Number(result.rows[0][0]);
  if (count === 0) {
    const bcrypt = require('bcryptjs');
    const defaultPassword = bcrypt.hashSync('disolar2024', 10);
    await db.batch([
      { sql: 'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', args: ['Rose', 'rmartin@die.fr', defaultPassword, 'rose'] },
      { sql: 'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', args: ['Julien', 'jroudil@die.fr', defaultPassword, 'owner'] },
      { sql: 'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', args: ['Rajaa', 'accueil@gmc2.fr', defaultPassword, 'rajaa'] },
      { sql: 'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', args: ['Maëlle Taulelle', 'maelle.taulelle@fidsud.fr', defaultPassword, 'accountant'] },
    ]);
  }
}

export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const db = getDb();
  const result = await db.execute({ sql, args: params });
  return result.rows as unknown as T[];
}

export async function queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  const db = getDb();
  const result = await db.execute({ sql, args: params });
  return (result.rows[0] as unknown as T) || null;
}

export async function execute(sql: string, params: unknown[] = []): Promise<{ lastInsertRowid: number | bigint }> {
  const db = getDb();
  const result = await db.execute({ sql, args: params });
  return { lastInsertRowid: result.lastInsertRowid ?? 0 };
}
