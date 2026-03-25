import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute, initDb } from '@/lib/db';
import { getUserFromRequest, ROLE_TO_STATUS, ROLE_TO_STEP, NEXT_STATUS } from '@/lib/auth';

interface Invoice {
  id: number;
  status: string;
  filename: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const { action, comment, annotations } = await request.json();

    if (!action || !['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    if (!ROLE_TO_STATUS[user.role]) {
      return NextResponse.json({ error: "Vous n'êtes pas autorisé à valider" }, { status: 403 });
    }

    const invoice = await queryOne<Invoice>('SELECT * FROM invoices WHERE id = ?', [id]);
    if (!invoice) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 });
    }

    const expectedStatus = ROLE_TO_STATUS[user.role];
    if (invoice.status !== expectedStatus) {
      return NextResponse.json(
        { error: `Cette facture n'est pas en attente de votre validation (statut: ${invoice.status})` },
        { status: 400 }
      );
    }

    await execute(
      `INSERT INTO validations (invoice_id, validator_id, step, action, comment, pdf_annotations)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, user.id, ROLE_TO_STEP[user.role], action, comment || null, annotations ? JSON.stringify(annotations) : null]
    );

    const newStatus = action === 'approved' ? NEXT_STATUS[user.role] : 'rejected';
    await execute(
      `UPDATE invoices SET status = ?, updated_at = datetime('now') WHERE id = ?`,
      [newStatus, id]
    );

    return NextResponse.json({ success: true, newStatus });
  } catch (error) {
    console.error('Validate invoice error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
