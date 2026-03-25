import { NextRequest, NextResponse } from 'next/server';
import { queryOne, initDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

interface Invoice {
  id: number;
  filename: string;
  pdf_data: string;
}

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
    const url = new URL(request.url);
    const editId = url.searchParams.get('edit_id');

    let pdfBase64: string | null = null;
    let filename = '';

    if (editId) {
      const edit = await queryOne<{ filename: string; pdf_data: string }>(
        'SELECT filename, pdf_data FROM pdf_edits WHERE id = ? AND invoice_id = ?',
        [editId, id]
      );
      if (edit) {
        pdfBase64 = edit.pdf_data;
        filename = edit.filename;
      }
    }

    if (!pdfBase64) {
      const invoice = await queryOne<Invoice>('SELECT * FROM invoices WHERE id = ?', [id]);
      if (!invoice) {
        return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 });
      }
      pdfBase64 = invoice.pdf_data;
      filename = invoice.filename;
    }

    if (!pdfBase64) {
      return NextResponse.json({ error: 'PDF non disponible' }, { status: 404 });
    }

    const fileBuffer = Buffer.from(pdfBase64, 'base64');

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
