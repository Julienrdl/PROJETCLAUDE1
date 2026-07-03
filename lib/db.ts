import { createClient, InValue } from '@libsql/client';
import bcrypt from 'bcryptjs';

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
      role TEXT NOT NULL CHECK(role IN ('bureau', 'poseur')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS chantiers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      client_nom TEXT NOT NULL,
      client_telephone TEXT,
      client_email TEXT,
      adresse TEXT NOT NULL,
      puissance_kwc REAL,
      nb_panneaux INTEGER,
      puissance_panneau_wc REAL,
      nb_onduleurs INTEGER,
      puissance_onduleur_kw REAL,
      ca_ht_prevu REAL,
      facture INTEGER NOT NULL DEFAULT 0,
      statut TEXT NOT NULL DEFAULT 'a_planifier' CHECK(statut IN ('a_planifier', 'planifie', 'en_cours', 'termine', 'annule')),
      notes TEXT,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS interventions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chantier_id INTEGER NOT NULL REFERENCES chantiers(id),
      type TEXT NOT NULL CHECK(type IN ('pose', 'maintenance', 'sav', 'autre')),
      titre TEXT NOT NULL,
      date_debut TEXT NOT NULL,
      date_fin TEXT,
      poseur_id INTEGER REFERENCES users(id),
      statut TEXT NOT NULL DEFAULT 'planifiee' CHECK(statut IN ('planifiee', 'en_cours', 'terminee', 'annulee')),
      ca_ht_prevu REAL,
      facture INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS rapports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      intervention_id INTEGER NOT NULL REFERENCES interventions(id),
      auteur_id INTEGER NOT NULL REFERENCES users(id),
      contenu TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS rapport_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rapport_id INTEGER NOT NULL REFERENCES rapports(id),
      data TEXT NOT NULL,
      legende TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS receptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chantier_id INTEGER NOT NULL REFERENCES chantiers(id),
      intervention_id INTEGER REFERENCES interventions(id),
      date TEXT NOT NULL,
      poseur_id INTEGER REFERENCES users(id),
      poseur_nom TEXT NOT NULL,
      poseur_signature TEXT NOT NULL,
      client_nom TEXT NOT NULL,
      client_signature TEXT NOT NULL,
      commentaires TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS reception_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reception_id INTEGER NOT NULL REFERENCES receptions(id),
      data TEXT NOT NULL,
      legende TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  const result = await db.execute('SELECT COUNT(*) as count FROM users');
  const count = Number(result.rows[0][0]);
  if (count === 0) {
    const defaultPassword = bcrypt.hashSync('jmga2024', 10);
    await db.batch([
      { sql: 'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', args: ['Julien', 'jroudil@die.fr', defaultPassword, 'bureau'] },
    ]);
  }
}

export async function query<T>(sql: string, params: InValue[] = []): Promise<T[]> {
  const db = getDb();
  const result = await db.execute({ sql, args: params });
  return result.rows as unknown as T[];
}

export async function queryOne<T>(sql: string, params: InValue[] = []): Promise<T | null> {
  const db = getDb();
  const result = await db.execute({ sql, args: params });
  return (result.rows[0] as unknown as T) || null;
}

export async function execute(sql: string, params: InValue[] = []): Promise<{ lastInsertRowid: number | bigint }> {
  const db = getDb();
  const result = await db.execute({ sql, args: params });
  return { lastInsertRowid: result.lastInsertRowid ?? 0 };
}
