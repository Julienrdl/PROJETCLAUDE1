'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { StatusBadge } from '@/components/StatusBadge';
import { INTERVENTION_TYPE_LABELS, INTERVENTION_TYPE_COLORS } from '@/lib/constants';
import { formatEuros, formatDateTime } from '@/lib/format';
import { Building2, Zap, Euro, CheckCircle2, CalendarClock, Users } from 'lucide-react';

interface InterventionSummary {
  id: number;
  titre: string;
  type: string;
  statut: string;
  date_debut: string;
  chantier_nom: string;
  chantier_adresse?: string;
  poseur_nom?: string | null;
}

interface BureauStats {
  role: 'bureau';
  chantiers_total: number;
  chantiers_actifs: number;
  kwc_total: number;
  ca_prevu_total: number;
  ca_facture: number;
  ca_non_facture: number;
  interventions_a_venir: InterventionSummary[];
  interventions_par_poseur: { poseur_nom: string; count: number }[];
}

interface PoseurStats {
  role: 'poseur';
  interventions_a_venir: InterventionSummary[];
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<BureauStats | PoseurStats | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(data => setStats(data))
      .finally(() => setFetching(false));
  }, [user]);

  if (loading || !user || fetching || !stats) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div></div>;
  }

  if (stats.role === 'poseur') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 mt-1">Bienvenue, {user.name}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 p-5 border-b border-gray-100">
            <CalendarClock size={18} className="text-gray-900" />
            <h2 className="font-semibold text-gray-900">Mes interventions à venir</h2>
          </div>
          {stats.interventions_a_venir.length === 0 ? (
            <p className="p-5 text-sm text-gray-400">Aucune intervention prévue cette semaine</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {stats.interventions_a_venir.map(iv => (
                <Link key={iv.id} href={`/interventions/${iv.id}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0">
                    <StatusBadge value={iv.type} labels={INTERVENTION_TYPE_LABELS} colors={INTERVENTION_TYPE_COLORS} />
                    <p className="font-medium text-gray-900 mt-1 truncate">{iv.titre}</p>
                    <p className="text-xs text-gray-500">{iv.chantier_nom} — {iv.chantier_adresse}</p>
                  </div>
                  <span className="text-sm text-gray-500 flex-shrink-0">{formatDateTime(iv.date_debut)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Chantiers actifs', value: `${stats.chantiers_actifs} / ${stats.chantiers_total}`, icon: Building2, color: 'bg-blue-50 text-blue-600' },
    { label: 'Puissance totale', value: `${stats.kwc_total.toFixed(1)} kWc`, icon: Zap, color: 'bg-amber-50 text-amber-600' },
    { label: 'CA HT prévu', value: formatEuros(stats.ca_prevu_total), icon: Euro, color: 'bg-purple-50 text-purple-600' },
    { label: 'CA HT facturé', value: formatEuros(stats.ca_facture), icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 mt-1">Bienvenue, {user.name}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`inline-flex p-2 rounded-lg ${card.color} mb-3`}>
              <card.icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Facturation</h2>
        <div className="flex items-center gap-2 h-4 rounded-full overflow-hidden bg-gray-100">
          {stats.ca_prevu_total > 0 && (
            <div className="h-full bg-green-500" style={{ width: `${(stats.ca_facture / stats.ca_prevu_total) * 100}%` }} />
          )}
        </div>
        <div className="flex items-center justify-between mt-2 text-sm">
          <span className="text-green-600 font-medium">Facturé : {formatEuros(stats.ca_facture)}</span>
          <span className="text-gray-500 font-medium">Non facturé : {formatEuros(stats.ca_non_facture)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><CalendarClock size={18} /> Interventions à venir (7 jours)</h2>
            <Link href="/planning" className="text-sm text-amber-600 hover:text-amber-700 font-medium">Voir tout →</Link>
          </div>
          {stats.interventions_a_venir.length === 0 ? (
            <p className="p-5 text-sm text-gray-400">Aucune intervention prévue</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {stats.interventions_a_venir.map(iv => (
                <Link key={iv.id} href={`/interventions/${iv.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate text-sm">{iv.titre}</p>
                    <p className="text-xs text-gray-500">{iv.chantier_nom}{iv.poseur_nom ? ` — ${iv.poseur_nom}` : ''}</p>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">{formatDateTime(iv.date_debut)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 p-5 border-b border-gray-100">
            <Users size={18} className="text-gray-900" />
            <h2 className="font-semibold text-gray-900">Interventions par poseur (ce mois)</h2>
          </div>
          {stats.interventions_par_poseur.length === 0 ? (
            <p className="p-5 text-sm text-gray-400">Aucune donnée ce mois-ci</p>
          ) : (
            <div className="p-5 space-y-3">
              {stats.interventions_par_poseur.map(p => {
                const max = Math.max(...stats.interventions_par_poseur.map(x => x.count));
                return (
                  <div key={p.poseur_nom}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700">{p.poseur_nom}</span>
                      <span className="font-medium text-gray-900">{p.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(p.count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
