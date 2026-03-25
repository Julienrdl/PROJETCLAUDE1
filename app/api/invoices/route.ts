import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { query, execute, initDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    initDb();
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const url = new URL(request.url);
    const month = url.searchParams.get('month'); // format: YYYY-MM
    const status = url.searchParams.get('status');

    let sql = `
      SELECT i.*, u.name as uploader_name
      FROM invoices i
      JOIN users u ON i.uploaded_by = u.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (month) {
      sql += ` AND strftime('%Y-%m', i.invoice_date) = ?`;
      params.push(month);
    }

    if (status) {
      sql += ` AND i.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY i.created_at DESC`;

    const invoices = query(sql, params);
    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Get invoices error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    initDb();
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Only rose can upload invoices
    if (user.role !== 'rose') {
      return NextResponse.json({ error: 'Seule Rose peut téléverser des factures' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const supplier = formData.get('supplier') as string;
    const amount = formData.get('amount') as string;
    const invoiceDate = formData.get('invoice_date') as string;
    const description = formData.get('description') as string;

    if (!file || !supplier) {
      return NextResponse.json({ error: 'Fichier et fournisseur requis' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Seuls les fichiers PDF sont acceptés' }, { status: 400 });
    }

    // Save file
    const uploadsDir = path.join(process.cwd(), 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const timestamp = Date.now();
    const filename = `invoice_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadsDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const result = execute(
      `INSERT INTO invoices (filename, original_name, supplier, amount, invoice_date, description, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [filename, file.name, supplier, amount ? parseFloat(amount) : null, invoiceDate || null, description || null, user.id]
    );

    return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
  } catch (error) {
    console.error('Upload invoice error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
