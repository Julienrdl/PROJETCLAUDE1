import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute, initDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDb();
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { id } = await params;
    const intervention = await queryOne<{ id: number; poseur_id: number | null }>('SELECT id, poseur_id FROM interventions WHERE id = ?', [id]);
    if (!intervention) return NextResponse.json({ error: 'Intervention non trouvée' }, { status: 404 });
    if (user.role === 'poseur' && intervention.poseur_id !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { contenu, photos } = await request.json();
    if (!contenu || typeof contenu !== 'string' || !contenu.trim()) {
      return NextResponse.json({ error: 'Le contenu du rapport est requis' }, { status: 400 });
    }

    const result = await execute(
      'INSERT INTO rapports (intervention_id, auteur_id, contenu) VALUES (?, ?, ?)',
      [id, user.id, contenu.trim()]
    );
    const rapportId = Number(result.lastInsertRowid);

    if (Array.isArray(photos)) {
      for (const photo of photos) {
        if (photo?.data) {
          await execute(
            'INSERT INTO rapport_photos (rapport_id, data, legende) VALUES (?, ?, ?)',
            [rapportId, photo.data, photo.legende || null]
          );
        }
      }
    }

    return NextResponse.json({ id: rapportId }, { status: 201 });
  } catch (error) {
    console.error('Create rapport error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
