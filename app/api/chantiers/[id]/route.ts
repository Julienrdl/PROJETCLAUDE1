import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute, initDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { Chantier } from '@/types';
import type { InValue } from '@libsql/client';

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDb();
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { id } = await params;
    const row = await queryOne<ChantierRow>(
      `SELECT c.*, u.name as created_by_name FROM chantiers c JOIN users u ON u.id = c.created_by WHERE c.id = ?`,
      [id]
    );
    if (!row) return NextResponse.json({ error: 'Chantier non trouvé' }, { status: 404 });

    return NextResponse.json({ chantier: toDTO(row, user.role === 'poseur') });
  } catch (error) {
    console.error('Get chantier error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDb();
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    if (user.role !== 'bureau') return NextResponse.json({ error: 'Accès réservé au bureau' }, { status: 403 });

    const { id } = await params;
    const existing = await queryOne<{ id: number }>('SELECT id FROM chantiers WHERE id = ?', [id]);
    if (!existing) return NextResponse.json({ error: 'Chantier non trouvé' }, { status: 404 });

    const body = await request.json();
    const fields = [
      'nom', 'client_nom', 'client_telephone', 'client_email', 'adresse',
      'puissance_kwc', 'nb_panneaux', 'puissance_panneau_wc', 'nb_onduleurs',
      'puissance_onduleur_kw', 'ca_ht_prevu', 'statut', 'notes', 'facture',
    ];
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

    await execute(`UPDATE chantiers SET ${updates.join(', ')} WHERE id = ?`, args);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update chantier error:', error);
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

    const interventions = await query<{ id: number }>('SELECT id FROM interventions WHERE chantier_id = ?', [id]);
    for (const iv of interventions) {
      const rapports = await query<{ id: number }>('SELECT id FROM rapports WHERE intervention_id = ?', [iv.id]);
      for (const r of rapports) {
        await execute('DELETE FROM rapport_photos WHERE rapport_id = ?', [r.id]);
      }
      await execute('DELETE FROM rapports WHERE intervention_id = ?', [iv.id]);
    }
    const receptions = await query<{ id: number }>('SELECT id FROM receptions WHERE chantier_id = ?', [id]);
    for (const rc of receptions) {
      await execute('DELETE FROM reception_photos WHERE reception_id = ?', [rc.id]);
    }
    await execute('DELETE FROM receptions WHERE chantier_id = ?', [id]);
    await execute('DELETE FROM interventions WHERE chantier_id = ?', [id]);
    await execute('DELETE FROM chantiers WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete chantier error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
