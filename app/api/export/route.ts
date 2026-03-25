import { NextRequest, NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

interface Invoice {
  id: number;
  original_name: string;
  supplier: string;
  amount: number | null;
  invoice_date: string | null;
  description: string | null;
  status: string;
  uploader_name: string;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  try {
    initDb();
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const url = new URL(request.url);
    const month = url.searchParams.get('month'); // YYYY-MM
    const format = url.searchParams.get('format') || 'json'; // json or csv

    let sql = `
      SELECT i.id, i.original_name, i.supplier, i.amount, i.invoice_date,
             i.description, i.status, u.name as uploader_name, i.created_at, i.updated_at
      FROM invoices i
      JOIN users u ON i.uploaded_by = u.id
      WHERE i.status = 'validated'
    `;
    const params: unknown[] = [];

    if (month) {
      sql += ` AND strftime('%Y-%m', i.created_at) = ?`;
      params.push(month);
    }

    sql += ` ORDER BY i.invoice_date ASC, i.created_at ASC`;

    const invoices = query<Invoice>(sql, params);

    if (format === 'csv') {
      const headers = ['ID', 'Fournisseur', 'Montant (€)', 'Date Facture', 'Description', 'Fichier', 'Ajouté par', 'Date Ajout'];
      const rows = invoices.map(inv => [
        inv.id,
        `"${inv.supplier.replace(/"/g, '""')}"`,
        inv.amount !== null ? inv.amount.toFixed(2) : '',
        inv.invoice_date || '',
        `"${(inv.description || '').replace(/"/g, '""')}"`,
        `"${inv.original_name.replace(/"/g, '""')}"`,
        `"${inv.uploader_name.replace(/"/g, '""')}"`,
        inv.created_at,
      ].join(','));

      const csv = [headers.join(','), ...rows].join('\n');
      const monthLabel = month || 'all';

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="factures_validees_${monthLabel}.csv"`,
        },
      });
    }

    // JSON export with totals
    const total = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    return NextResponse.json({
      month,
      count: invoices.length,
      total: total,
      invoices,
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
