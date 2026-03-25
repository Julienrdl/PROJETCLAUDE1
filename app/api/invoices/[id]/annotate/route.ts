import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { queryOne, execute, initDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

interface Invoice {
  id: number;
  filename: string;
}

interface Annotation {
  type: 'text' | 'stamp';
  page: number;
  x: number;
  y: number;
  text: string;
  color?: string;
  fontSize?: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb();
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (user.role === 'accountant') {
      return NextResponse.json({ error: 'Non autorisé à modifier les PDFs' }, { status: 403 });
    }

    const { id } = await params;
    const { annotations } = await request.json() as { annotations: Annotation[] };

    const invoice = queryOne<Invoice>('SELECT * FROM invoices WHERE id = ?', [id]);
    if (!invoice) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 });
    }

    // Load original PDF
    const originalPath = path.join(process.cwd(), 'uploads', invoice.filename);
    const pdfBytes = await readFile(originalPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Apply annotations
    for (const annotation of annotations) {
      const pages = pdfDoc.getPages();
      const page = pages[annotation.page] || pages[0];
      const { height } = page.getSize();

      if (annotation.type === 'stamp') {
        // Approval/rejection stamp
        const isApproved = annotation.text.toLowerCase().includes('approuv') || annotation.text.toLowerCase().includes('valid');
        const stampColor = isApproved ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0);

        // Draw stamp box
        page.drawRectangle({
          x: annotation.x,
          y: height - annotation.y - 40,
          width: 180,
          height: 40,
          borderColor: stampColor,
          borderWidth: 2,
        });

        page.drawText(annotation.text, {
          x: annotation.x + 5,
          y: height - annotation.y - 20,
          size: annotation.fontSize || 14,
          font,
          color: stampColor,
        });

        // Add validator name and date
        const now = new Date().toLocaleDateString('fr-FR');
        page.drawText(`${user.name} - ${now}`, {
          x: annotation.x + 5,
          y: height - annotation.y - 35,
          size: 9,
          font,
          color: stampColor,
        });
      } else {
        // Text annotation
        let color = rgb(0, 0, 0);
        if (annotation.color === 'red') color = rgb(0.8, 0, 0);
        if (annotation.color === 'blue') color = rgb(0, 0, 0.8);
        if (annotation.color === 'green') color = rgb(0, 0.6, 0);

        page.drawText(annotation.text, {
          x: annotation.x,
          y: height - annotation.y,
          size: annotation.fontSize || 12,
          font,
          color,
        });
      }
    }

    // Save annotated PDF
    const uploadsDir = path.join(process.cwd(), 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const timestamp = Date.now();
    const newFilename = `edit_${timestamp}_${invoice.filename}`;
    const newPath = path.join(uploadsDir, newFilename);

    const newPdfBytes = await pdfDoc.save();
    await writeFile(newPath, newPdfBytes);

    // Record the edit
    const result = execute(
      `INSERT INTO pdf_edits (invoice_id, editor_id, filename, annotations)
       VALUES (?, ?, ?, ?)`,
      [id, user.id, newFilename, JSON.stringify(annotations)]
    );

    return NextResponse.json({ success: true, editId: result.lastInsertRowid, filename: newFilename });
  } catch (error) {
    console.error('Annotate PDF error:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'annotation du PDF' }, { status: 500 });
  }
}
