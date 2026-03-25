import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query, initDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
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
    const invoice = await queryOne(
      `SELECT i.id, i.filename, i.original_name, i.supplier, i.amount, i.invoice_date,
              i.description, i.status, i.uploaded_by, i.created_at, i.updated_at,
              u.name as uploader_name
       FROM invoices i
       JOIN users u ON i.uploaded_by = u.id
       WHERE i.id = ?`,
      [id]
    );

    if (!invoice) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 });
    }

    const validations = await query(
      `SELECT v.*, u.name as validator_name, u.role as validator_role
       FROM validations v
       JOIN users u ON v.validator_id = u.id
       WHERE v.invoice_id = ?
       ORDER BY v.created_at ASC`,
      [id]
    );

    const pdfEdits = await query(
      `SELECT pe.*, u.name as editor_name
       FROM pdf_edits pe
       JOIN users u ON pe.editor_id = u.id
       WHERE pe.invoice_id = ?
       ORDER BY pe.created_at DESC`,
      [id]
    );

    return NextResponse.json({ invoice, validations, pdfEdits });
  } catch (error) {
    console.error('Get invoice error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
