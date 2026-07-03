import { NextRequest, NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const now = new Date();
    const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (user.role === 'poseur') {
      const upcoming = await query(
        `SELECT i.id, i.titre, i.type, i.statut, i.date_debut, c.nom as chantier_nom, c.adresse as chantier_adresse
         FROM interventions i JOIN chantiers c ON c.id = i.chantier_id
         WHERE i.poseur_id = ? AND i.date_debut >= datetime('now', '-1 day') AND i.date_debut <= ?
         ORDER BY i.date_debut ASC`,
        [user.id, in7days.toISOString()]
      );
      return NextResponse.json({ role: 'poseur', interventions_a_venir: upcoming });
    }

    const [chantiersStats] = await query<{ total: number; actifs: number; kwc_total: number | null }>(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN statut IN ('planifie', 'en_cours') THEN 1 ELSE 0 END) as actifs,
              SUM(puissance_kwc) as kwc_total
       FROM chantiers`
    );

    const [caChantiers] = await query<{ prevu: number | null; facture: number | null; non_facture: number | null }>(
      `SELECT SUM(ca_ht_prevu) as prevu,
              SUM(CASE WHEN facture = 1 THEN ca_ht_prevu ELSE 0 END) as facture,
              SUM(CASE WHEN facture = 0 THEN ca_ht_prevu ELSE 0 END) as non_facture
       FROM chantiers`
    );

    const [caInterventions] = await query<{ prevu: number | null; facture: number | null; non_facture: number | null }>(
      `SELECT SUM(ca_ht_prevu) as prevu,
              SUM(CASE WHEN facture = 1 THEN ca_ht_prevu ELSE 0 END) as facture,
              SUM(CASE WHEN facture = 0 THEN ca_ht_prevu ELSE 0 END) as non_facture
       FROM interventions`
    );

    const interventionsAVenir = await query(
      `SELECT i.id, i.titre, i.type, i.statut, i.date_debut, c.nom as chantier_nom, u.name as poseur_nom
       FROM interventions i
       JOIN chantiers c ON c.id = i.chantier_id
       LEFT JOIN users u ON u.id = i.poseur_id
       WHERE i.date_debut >= datetime('now', '-1 hour') AND i.date_debut <= ?
       ORDER BY i.date_debut ASC
       LIMIT 10`,
      [in7days.toISOString()]
    );

    const interventionsParPoseur = await query<{ poseur_nom: string; count: number }>(
      `SELECT u.name as poseur_nom, COUNT(*) as count
       FROM interventions i JOIN users u ON u.id = i.poseur_id
       WHERE strftime('%Y-%m', i.date_debut) = strftime('%Y-%m', 'now')
       GROUP BY u.id
       ORDER BY count DESC`
    );

    const caPrevuTotal = (caChantiers.prevu || 0) + (caInterventions.prevu || 0);
    const caFacture = (caChantiers.facture || 0) + (caInterventions.facture || 0);
    const caNonFacture = (caChantiers.non_facture || 0) + (caInterventions.non_facture || 0);

    return NextResponse.json({
      role: 'bureau',
      chantiers_total: chantiersStats.total || 0,
      chantiers_actifs: chantiersStats.actifs || 0,
      kwc_total: chantiersStats.kwc_total || 0,
      ca_prevu_total: caPrevuTotal,
      ca_facture: caFacture,
      ca_non_facture: caNonFacture,
      interventions_a_venir: interventionsAVenir,
      interventions_par_poseur: interventionsParPoseur,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
