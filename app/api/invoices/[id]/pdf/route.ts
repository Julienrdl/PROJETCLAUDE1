import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { queryOne, initDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

interface Invoice {
  id: number;
  filename: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb();
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const invoice = queryOne<Invoice>('SELECT * FROM invoices WHERE id = ?', [id]);

    if (!invoice) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 });
    }

    // Check if there's an edited version
    const url = new URL(request.url);
    const editId = url.searchParams.get('edit_id');

    let filename = invoice.filename;
    if (editId) {
      const edit = queryOne<{ filename: string }>(
        'SELECT filename FROM pdf_edits WHERE id = ? AND invoice_id = ?',
        [editId, id]
      );
      if (edit) filename = edit.filename;
    }

    const filePath = path.join(process.cwd(), 'uploads', filename);
    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Get PDF error:', error);
    return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
  }
}
