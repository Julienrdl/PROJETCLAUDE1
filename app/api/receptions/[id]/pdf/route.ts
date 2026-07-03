import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, initDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { generateReceptionPdf } from '@/lib/pdf';
import { Reception, ReceptionPhoto, Chantier } from '@/types';

interface ReceptionRow {
  id: number;
  chantier_id: number;
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

interface ChantierRow {
  id: number;
  nom: string;
  client_nom: string;
  client_telephone: string | null;
  client_email: string | null;
  adresse: string;
  puissance_kwc: number | null;
  nb_panneaux: number | null;
  puissance_panneau_wc: number | null;
  nb_onduleurs: number | null;
  puissance_onduleur_kw: number | null;
  ca_ht_prevu: number | null;
  facture: number;
  statut: string;
  notes: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDb();
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { id } = await params;
    const row = await queryOne<ReceptionRow>('SELECT * FROM receptions WHERE id = ?', [id]);
    if (!row) return NextResponse.json({ error: 'Réception non trouvée' }, { status: 404 });
    if (user.role === 'poseur' && row.poseur_id !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const chantierRow = await queryOne<ChantierRow>('SELECT * FROM chantiers WHERE id = ?', [row.chantier_id]);
    if (!chantierRow) return NextResponse.json({ error: 'Chantier introuvable' }, { status: 404 });

    const photos = await query<ReceptionPhoto>('SELECT * FROM reception_photos WHERE reception_id = ? ORDER BY created_at ASC', [id]);

    const reception: Reception = { ...row, chantier_nom: chantierRow.nom, photos };
    const chantier: Chantier = { ...chantierRow, statut: chantierRow.statut as Chantier['statut'], facture: !!chantierRow.facture, created_by_name: '' };

    const pdfBytes = await generateReceptionPdf(reception, chantier);

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="reception-${chantier.nom.replace(/[^a-z0-9]+/gi, '-')}-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Generate reception PDF error:', error);
    return NextResponse.json({ error: 'Erreur lors de la génération du PDF' }, { status: 500 });
  }
}
