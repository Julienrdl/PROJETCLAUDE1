import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, initDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { Reception, ReceptionPhoto } from '@/types';

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDb();
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { id } = await params;
    const row = await queryOne<ReceptionRow>(
      `SELECT r.*, c.nom as chantier_nom FROM receptions r JOIN chantiers c ON c.id = r.chantier_id WHERE r.id = ?`,
      [id]
    );
    if (!row) return NextResponse.json({ error: 'Réception non trouvée' }, { status: 404 });
    if (user.role === 'poseur' && row.poseur_id !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const photos = await query<ReceptionPhoto>('SELECT * FROM reception_photos WHERE reception_id = ? ORDER BY created_at ASC', [id]);
    const reception: Reception = { ...row, photos };

    return NextResponse.json({ reception });
  } catch (error) {
    console.error('Get reception error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
