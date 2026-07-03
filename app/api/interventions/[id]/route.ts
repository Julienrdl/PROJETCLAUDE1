import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute, initDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { Intervention, Rapport, RapportPhoto } from '@/types';
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

async function fetchRow(id: string): Promise<InterventionRow | null> {
  return queryOne<InterventionRow>(
    `SELECT i.*, c.nom as chantier_nom, c.adresse as chantier_adresse, u.name as poseur_nom
     FROM interventions i
     JOIN chantiers c ON c.id = i.chantier_id
     LEFT JOIN users u ON u.id = i.poseur_id
     WHERE i.id = ?`,
    [id]
  );
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDb();
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { id } = await params;
    const row = await fetchRow(id);
    if (!row) return NextResponse.json({ error: 'Intervention non trouvée' }, { status: 404 });
    if (user.role === 'poseur' && row.poseur_id !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const rapportRows = await query<{ id: number; intervention_id: number; auteur_id: number; auteur_nom: string; contenu: string; created_at: string }>(
      `SELECT r.*, u.name as auteur_nom FROM rapports r JOIN users u ON u.id = r.auteur_id WHERE r.intervention_id = ? ORDER BY r.created_at DESC`,
      [id]
    );
    const rapports: Rapport[] = [];
    for (const r of rapportRows) {
      const photos = await query<RapportPhoto>('SELECT * FROM rapport_photos WHERE rapport_id = ? ORDER BY created_at ASC', [r.id]);
      rapports.push({ ...r, photos });
    }

    return NextResponse.json({ intervention: toDTO(row, user.role === 'poseur'), rapports });
  } catch (error) {
    console.error('Get intervention error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDb();
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { id } = await params;
    const existing = await fetchRow(id);
    if (!existing) return NextResponse.json({ error: 'Intervention non trouvée' }, { status: 404 });

    const body = await request.json();

    if (user.role === 'poseur') {
      if (existing.poseur_id !== user.id) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      const allowed = new Set(['statut']);
      const keys = Object.keys(body);
      if (keys.some(k => !allowed.has(k))) {
        return NextResponse.json({ error: 'Seul le statut peut être modifié' }, { status: 403 });
      }
    }

    const fields = ['chantier_id', 'type', 'titre', 'date_debut', 'date_fin', 'poseur_id', 'statut', 'ca_ht_prevu', 'facture', 'description'];
    const updates: string[] = [];
    const args: InValue[] = [];
    for (const f of fields) {
      if (f in body) {
        updates.push(`${f} = ?`);
        args.push(f === 'facture' ? (body[f] ? 1 : 0) : body[f]);
      }
    }
    if (updates.length === 0) return NextResponse.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 });

    updates.push(`updated_at = datetime('now')`);
    args.push(id);

    await execute(`UPDATE interventions SET ${updates.join(', ')} WHERE id = ?`, args);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update intervention error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDb();
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    if (user.role !== 'bureau') return NextResponse.json({ error: 'Accès réservé au bureau' }, { status: 403 });

    const { id } = await params;

    const rapports = await query<{ id: number }>('SELECT id FROM rapports WHERE intervention_id = ?', [id]);
    for (const r of rapports) {
      await execute('DELETE FROM rapport_photos WHERE rapport_id = ?', [r.id]);
    }
    await execute('DELETE FROM rapports WHERE intervention_id = ?', [id]);
    await execute('UPDATE receptions SET intervention_id = NULL WHERE intervention_id = ?', [id]);
    await execute('DELETE FROM interventions WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete intervention error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
