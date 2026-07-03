import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, queryOne, execute, initDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { User } from '@/types';

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    if (user.role !== 'bureau') return NextResponse.json({ error: 'Accès réservé au bureau' }, { status: 403 });

    const url = new URL(request.url);
    const role = url.searchParams.get('role');

    const rows = role
      ? await query<User>('SELECT id, name, email, role FROM users WHERE role = ? ORDER BY name ASC', [role])
      : await query<User>('SELECT id, name, email, role FROM users ORDER BY name ASC');

    return NextResponse.json({ users: rows });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    if (user.role !== 'bureau') return NextResponse.json({ error: 'Accès réservé au bureau' }, { status: 403 });

    const { name, email, password, role: newRole } = await request.json();
    if (!name || !email || !password || !newRole) {
      return NextResponse.json({ error: 'Nom, email, mot de passe et rôle requis' }, { status: 400 });
    }
    if (!['bureau', 'poseur'].includes(newRole)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 });
    }

    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return NextResponse.json({ error: 'Un compte existe déjà avec cet email' }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, newRole]
    );

    return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
