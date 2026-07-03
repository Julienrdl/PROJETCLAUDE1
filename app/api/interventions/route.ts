import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute, initDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { Intervention } from '@/types';
import type { InValue } from '@libsql/client';

interface InterventionRow {
  id: number;
  chantier_id: number;
  chantier_nom: string;
  chantier_adresse: string;
  type: string;
  titre: string;
  date_debut: string;
  date_fin: string | null;
  poseur_id: number | null;
  poseur_nom: string | null;
  statut: string;
  ca_ht_prevu: number | null;
  facture: number;
  description: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

function toDTO(row: InterventionRow, hideFinance: boolean): Intervention {
  return {
    id: row.id,
    chantier_id: row.chantier_id,
    chantier_nom: row.chantier_nom,
    chantier_adresse: row.chantier_adresse,
    type: row.type as Intervention['type'],
    titre: row.titre,
    date_debut: row.date_debut,
    date_fin: row.date_fin,
    poseur_id: row.poseur_id,
    poseur_nom: row.poseur_nom,
    statut: row.statut as Intervention['statut'],
    ca_ht_prevu: hideFinance ? null : row.ca_ht_prevu,
    facture: hideFinance ? false : !!row.facture,
    description: row.description,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const url = new URL(request.url);
    const chantierId = url.searchParams.get('chantier_id');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const poseurIdParam = url.searchParams.get('poseur_id');

    const conditions: string[] = [];
    const args: InValue[] = [];

    if (chantierId) { conditions.push('i.chantier_id = ?'); args.push(chantierId); }
    if (from) { conditions.push('i.date_debut >= ?'); args.push(from); }
    if (to) { conditions.push('i.date_debut <= ?'); args.push(to); }

    if (user.role === 'poseur') {
      conditions.push('i.poseur_id = ?');
      args.push(user.id);
    } else if (poseurIdParam) {
      conditions.push('i.poseur_id = ?');
      args.push(poseurIdParam);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await query<InterventionRow>(
      `SELECT i.*, c.nom as chantier_nom, c.adresse as chantier_adresse, u.name as poseur_nom
       FROM interventions i
       JOIN chantiers c ON c.id = i.chantier_id
       LEFT JOIN users u ON u.id = i.poseur_id
       ${where}
       ORDER BY i.date_debut ASC`,
      args
    );

    return NextResponse.json({ interventions: rows.map(r => toDTO(r, user.role === 'poseur')) });
  } catch (error) {
    console.error('List interventions error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    if (user.role !== 'bureau') return NextResponse.json({ error: 'Accès réservé au bureau' }, { status: 403 });

    const body = await request.json();
    const { chantier_id, type, titre, date_debut, date_fin, poseur_id, statut, ca_ht_prevu, description } = body;

    if (!chantier_id || !type || !titre || !date_debut) {
      return NextResponse.json({ error: 'Chantier, type, titre et date requis' }, { status: 400 });
    }

    const chantier = await queryOne<{ id: number }>('SELECT id FROM chantiers WHERE id = ?', [chantier_id]);
    if (!chantier) return NextResponse.json({ error: 'Chantier introuvable' }, { status: 404 });

    const result = await execute(
      `INSERT INTO interventions (chantier_id, type, titre, date_debut, date_fin, poseur_id, statut, ca_ht_prevu, description, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [chantier_id, type, titre, date_debut, date_fin || null, poseur_id || null, statut || 'planifiee', ca_ht_prevu ?? null, description || null, user.id]
    );

    return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
  } catch (error) {
    console.error('Create intervention error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
