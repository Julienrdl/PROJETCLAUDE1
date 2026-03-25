import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'disolar.db');

function getDb() {
  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function initDb() {
  const db = getDb();

  db.exec(`
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
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed default users if none exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const bcrypt = require('bcryptjs');
    const defaultPassword = bcrypt.hashSync('disolar2024', 10);

    const insert = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);

    insert.run('Rose', 'rmartin@die.fr', defaultPassword, 'rose');
    insert.run('Julien', 'jroudil@die.fr', defaultPassword, 'owner');
    insert.run('Rajaa', 'accueil@gmc2.fr', defaultPassword, 'rajaa');
    insert.run('Maëlle Taulelle', 'maelle.taulelle@fidsud.fr', defaultPassword, 'accountant');
  }

  db.close();
}

export function query<T>(sql: string, params: unknown[] = []): T[] {
  const db = getDb();
  try {
    const stmt = db.prepare(sql);
    return stmt.all(...params) as T[];
  } finally {
    db.close();
  }
}

export function queryOne<T>(sql: string, params: unknown[] = []): T | null {
  const db = getDb();
  try {
    const stmt = db.prepare(sql);
    return (stmt.get(...params) as T) || null;
  } finally {
    db.close();
  }
}

export function execute(sql: string, params: unknown[] = []): Database.RunResult {
  const db = getDb();
  try {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  } finally {
    db.close();
  }
}
