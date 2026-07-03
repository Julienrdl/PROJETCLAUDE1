'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { StatusBadge } from '@/components/StatusBadge';
import { Chantier } from '@/types';
import { CHANTIER_STATUT_LABELS, CHANTIER_STATUT_COLORS } from '@/lib/constants';
import { formatEuros } from '@/lib/format';
import { Building2, Plus, MapPin, Zap, CheckCircle2, Circle } from 'lucide-react';

export default function ChantiersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/chantiers')
      .then(r => r.json())
      .then(data => setChantiers(data.chantiers || []))
      .finally(() => setFetching(false));
  }, [user]);

  if (loading || !user) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div></div>;
  }

  const filtered = chantiers.filter(c =>
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.client_nom.toLowerCase().includes(search.toLowerCase()) ||
    c.adresse.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chantiers</h1>
          <p className="text-gray-500 mt-1">{chantiers.length} chantier{chantiers.length > 1 ? 's' : ''}</p>
        </div>
        {user.role === 'bureau' && (
          <Link
            href="/chantiers/new"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={18} /> Nouveau chantier
          </Link>
        )}
      </div>

      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher par nom, client ou adresse..."
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
      />

      {fetching ? (
        <div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-4 border-amber-500 border-t-transparent rounded-full"></div></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
          <Building2 size={36} className="mx-auto mb-3 opacity-40" />
          <p>Aucun chantier trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <Link
              key={c.id}
              href={`/chantiers/${c.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-amber-300 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-gray-900 leading-tight">{c.nom}</h3>
                <StatusBadge value={c.statut} labels={CHANTIER_STATUT_LABELS} colors={CHANTIER_STATUT_COLORS} />
              </div>
              <p className="text-sm text-gray-500 mb-3">{c.client_nom}</p>
              <div className="flex items-start gap-1.5 text-sm text-gray-600 mb-2">
                <MapPin size={14} className="flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">{c.adresse}</span>
              </div>
              {c.puissance_kwc && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
                  <Zap size={14} className="flex-shrink-0" />
                  <span>{c.puissance_kwc} kWc</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                {user.role === 'bureau' ? (
                  <span className="font-semibold text-gray-900">{formatEuros(c.ca_ht_prevu)}</span>
                ) : <span />}
                {user.role === 'bureau' && (
                  <span className={`flex items-center gap-1 text-xs font-medium ${c.facture ? 'text-green-600' : 'text-gray-400'}`}>
                    {c.facture ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                    {c.facture ? 'Facturé' : 'Non facturé'}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
