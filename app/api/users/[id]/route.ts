import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute, initDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDb();
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    if (user.role !== 'bureau') return NextResponse.json({ error: 'Accès réservé au bureau' }, { status: 403 });

    const { id } = await params;
    if (Number(id) === user.id) {
      return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 });
    }

    const existing = await queryOne<{ id: number }>('SELECT id FROM users WHERE id = ?', [id]);
    if (!existing) return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });

    await execute('UPDATE interventions SET poseur_id = NULL WHERE poseur_id = ?', [id]);
    await execute('DELETE FROM users WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
