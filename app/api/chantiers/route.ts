import { NextRequest, NextResponse } from 'next/server';
import { query, execute, initDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { Chantier } from '@/types';

interface ChantierRow {
  id: number;
  nom: string;
  client_nom: string;
  client_telephone: string | null;
  client_email: string | null;
  adresse: string;
  puissance_kwc: number | null;
  nb_panneaux: number | null;
  puissance_panneau_wc: number | null;
  nb_onduleurs: number | null;
  puissance_onduleur_kw: number | null;
  ca_ht_prevu: number | null;
  facture: number;
  statut: string;
  notes: string | null;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

function toDTO(row: ChantierRow, hideFinance: boolean): Chantier {
  return {
    id: row.id,
    nom: row.nom,
    client_nom: row.client_nom,
    client_telephone: row.client_telephone,
    client_email: row.client_email,
    adresse: row.adresse,
    puissance_kwc: row.puissance_kwc,
    nb_panneaux: row.nb_panneaux,
    puissance_panneau_wc: row.puissance_panneau_wc,
    nb_onduleurs: row.nb_onduleurs,
    puissance_onduleur_kw: row.puissance_onduleur_kw,
    ca_ht_prevu: hideFinance ? null : row.ca_ht_prevu,
    facture: hideFinance ? false : !!row.facture,
    statut: row.statut as Chantier['statut'],
    notes: row.notes,
    created_by: row.created_by,
    created_by_name: row.created_by_name,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    let rows: ChantierRow[];
    if (user.role === 'poseur') {
      rows = await query<ChantierRow>(
        `SELECT DISTINCT c.*, u.name as created_by_name
         FROM chantiers c
         JOIN users u ON u.id = c.created_by
         JOIN interventions i ON i.chantier_id = c.id
         WHERE i.poseur_id = ?
         ORDER BY c.created_at DESC`,
        [user.id]
      );
    } else {
      rows = await query<ChantierRow>(
        `SELECT c.*, u.name as created_by_name FROM chantiers c JOIN users u ON u.id = c.created_by ORDER BY c.created_at DESC`
      );
    }

    return NextResponse.json({ chantiers: rows.map(r => toDTO(r, user.role === 'poseur')) });
  } catch (error) {
    console.error('List chantiers error:', error);
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
    const { nom, client_nom, client_telephone, client_email, adresse, puissance_kwc, nb_panneaux, puissance_panneau_wc, nb_onduleurs, puissance_onduleur_kw, ca_ht_prevu, statut, notes } = body;

    if (!nom || !client_nom || !adresse) {
      return NextResponse.json({ error: 'Nom, client et adresse requis' }, { status: 400 });
    }

    const result = await execute(
      `INSERT INTO chantiers (nom, client_nom, client_telephone, client_email, adresse, puissance_kwc, nb_panneaux, puissance_panneau_wc, nb_onduleurs, puissance_onduleur_kw, ca_ht_prevu, statut, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nom, client_nom, client_telephone || null, client_email || null, adresse,
        puissance_kwc ?? null, nb_panneaux ?? null, puissance_panneau_wc ?? null,
        nb_onduleurs ?? null, puissance_onduleur_kw ?? null, ca_ht_prevu ?? null,
        statut || 'a_planifier', notes || null, user.id,
      ]
    );

    return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
  } catch (error) {
    console.error('Create chantier error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
