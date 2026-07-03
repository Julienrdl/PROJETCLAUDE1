import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute, initDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { Reception } from '@/types';
import type { InValue } from '@libsql/client';

interface ReceptionRow {
  id: number;
  chantier_id: number;
  chantier_nom: string;
  intervention_id: number | null;
  date: string;
  poseur_id: number | null;
  poseur_nom: string;
  poseur_signature: string;
  client_nom: string;
  client_signature: string;
  commentaires: string | null;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const url = new URL(request.url);
    const chantierId = url.searchParams.get('chantier_id');

    const conditions: string[] = [];
    const args: InValue[] = [];
    if (chantierId) { conditions.push('r.chantier_id = ?'); args.push(chantierId); }
    if (user.role === 'poseur') { conditions.push('r.poseur_id = ?'); args.push(user.id); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await query<ReceptionRow>(
      `SELECT r.*, c.nom as chantier_nom FROM receptions r JOIN chantiers c ON c.id = r.chantier_id ${where} ORDER BY r.date DESC`,
      args
    );

    const receptions: Reception[] = rows.map(r => ({ ...r, photos: [] }));
    return NextResponse.json({ receptions });
  } catch (error) {
    console.error('List receptions error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const body = await request.json();
    const { chantier_id, intervention_id, date, poseur_id, client_nom, client_signature, poseur_signature, commentaires, photos } = body;

    if (!chantier_id || !date || !client_nom || !client_signature || !poseur_signature) {
      return NextResponse.json({ error: 'Chantier, date, nom du client et les deux signatures sont requis' }, { status: 400 });
    }

    const chantier = await queryOne<{ id: number }>('SELECT id FROM chantiers WHERE id = ?', [chantier_id]);
    if (!chantier) return NextResponse.json({ error: 'Chantier introuvable' }, { status: 404 });

    let resolvedPoseurId: number | null = null;
    let poseurNom: string = user.name;

    if (user.role === 'poseur') {
      resolvedPoseurId = user.id;
      poseurNom = user.name;
    } else if (poseur_id) {
      const poseur = await queryOne<{ id: number; name: string }>('SELECT id, name FROM users WHERE id = ? AND role = ?', [poseur_id, 'poseur']);
      if (poseur) {
        resolvedPoseurId = poseur.id;
        poseurNom = poseur.name;
      }
    }

    const result = await execute(
      `INSERT INTO receptions (chantier_id, intervention_id, date, poseur_id, poseur_nom, poseur_signature, client_nom, client_signature, commentaires)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [chantier_id, intervention_id || null, date, resolvedPoseurId, poseurNom, poseur_signature, client_nom, client_signature, commentaires || null]
    );
    const receptionId = Number(result.lastInsertRowid);

    if (Array.isArray(photos)) {
      for (const photo of photos) {
        if (photo?.data) {
          await execute(
            'INSERT INTO reception_photos (reception_id, data, legende) VALUES (?, ?, ?)',
            [receptionId, photo.data, photo.legende || null]
          );
        }
      }
    }

    return NextResponse.json({ id: receptionId }, { status: 201 });
  } catch (error) {
    console.error('Create reception error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
