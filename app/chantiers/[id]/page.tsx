'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { StatusBadge } from '@/components/StatusBadge';
import { Chantier, Intervention, Reception } from '@/types';
import {
  CHANTIER_STATUT_LABELS, CHANTIER_STATUT_COLORS,
  INTERVENTION_TYPE_LABELS, INTERVENTION_TYPE_COLORS,
  INTERVENTION_STATUT_LABELS, INTERVENTION_STATUT_COLORS,
} from '@/lib/constants';
import { formatEuros, formatDate, formatDateTime } from '@/lib/format';
import { MapPin, Zap, Phone, Mail, Pencil, Plus, Trash2, FileSignature, ClipboardList, CheckCircle2, Circle } from 'lucide-react';

export default function ChantierDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [receptions, setReceptions] = useState<Reception[]>([]);
  const [fetching, setFetching] = useState(true);

  const loadData = useCallback(() => {
    Promise.all([
      fetch(`/api/chantiers/${id}`).then(r => r.json()),
      fetch(`/api/interventions?chantier_id=${id}`).then(r => r.json()),
      fetch(`/api/receptions?chantier_id=${id}`).then(r => r.json()),
    ]).then(([cData, iData, rData]) => {
      setChantier(cData.chantier || null);
      setInterventions(iData.interventions || []);
      setReceptions(rData.receptions || []);
    }).finally(() => setFetching(false));
  }, [id]);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, loadData]);

  if (loading || !user || fetching) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div></div>;
  }

  if (!chantier) return <div className="text-gray-500">Chantier non trouvé</div>;

  const handleDelete = async () => {
    if (!confirm(`Supprimer définitivement le chantier "${chantier.nom}" et toutes ses interventions ?`)) return;
    const res = await fetch(`/api/chantiers/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/chantiers');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{chantier.nom}</h1>
            <StatusBadge value={chantier.statut} labels={CHANTIER_STATUT_LABELS} colors={CHANTIER_STATUT_COLORS} />
          </div>
          <p className="text-gray-500 mt-1">{chantier.client_nom}</p>
        </div>
        {user.role === 'bureau' && (
          <div className="flex items-center gap-2">
            <Link href={`/chantiers/${id}/edit`} className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2.5 rounded-xl transition-colors">
              <Pencil size={16} /> Modifier
            </Link>
            <button onClick={handleDelete} className="flex items-center gap-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 font-medium px-4 py-2.5 rounded-xl transition-colors">
              <Trash2 size={16} /> Supprimer
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Informations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2 sm:col-span-2">
                <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{chantier.adresse}</span>
              </div>
              {chantier.client_telephone && (
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700">{chantier.client_telephone}</span>
                </div>
              )}
              {chantier.client_email && (
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700">{chantier.client_email}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Installation</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500 flex items-center gap-1"><Zap size={14} /> Puissance</p>
                <p className="font-semibold text-gray-900 mt-0.5">{chantier.puissance_kwc ? `${chantier.puissance_kwc} kWc` : '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Panneaux</p>
                <p className="font-semibold text-gray-900 mt-0.5">{chantier.nb_panneaux ? `${chantier.nb_panneaux} × ${chantier.puissance_panneau_wc || '?'} Wc` : '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Onduleurs</p>
                <p className="font-semibold text-gray-900 mt-0.5">{chantier.nb_onduleurs ? `${chantier.nb_onduleurs} × ${chantier.puissance_onduleur_kw || '?'} kW` : '—'}</p>
              </div>
            </div>
          </div>

          {chantier.notes && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
              <h2 className="font-semibold text-gray-900">Informations complémentaires</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{chantier.notes}</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2"><ClipboardList size={18} /> Interventions</h2>
              {user.role === 'bureau' && (
                <Link href={`/interventions/new?chantier_id=${id}`} className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium">
                  <Plus size={16} /> Ajouter
                </Link>
              )}
            </div>
            {interventions.length === 0 ? (
              <p className="p-5 text-sm text-gray-400">Aucune intervention planifiée</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {interventions.map(iv => (
                  <Link key={iv.id} href={`/interventions/${iv.id}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <StatusBadge value={iv.type} labels={INTERVENTION_TYPE_LABELS} colors={INTERVENTION_TYPE_COLORS} />
                        <StatusBadge value={iv.statut} labels={INTERVENTION_STATUT_LABELS} colors={INTERVENTION_STATUT_COLORS} />
                      </div>
                      <p className="font-medium text-gray-900 truncate">{iv.titre}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(iv.date_debut)}{iv.poseur_nom ? ` — ${iv.poseur_nom}` : ''}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2"><FileSignature size={18} /> Réceptions de chantier</h2>
              <Link href={`/receptions/new?chantier_id=${id}`} className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium">
                <Plus size={16} /> Nouvelle réception
              </Link>
            </div>
            {receptions.length === 0 ? (
              <p className="p-5 text-sm text-gray-400">Aucune réception enregistrée</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {receptions.map(rc => (
                  <Link key={rc.id} href={`/receptions/${rc.id}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900">{formatDate(rc.date)}</p>
                      <p className="text-xs text-gray-500">Poseur : {rc.poseur_nom} — Client : {rc.client_nom}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {user.role === 'bureau' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h2 className="font-semibold text-gray-900">Facturation</h2>
              <div>
                <p className="text-sm text-gray-500">CA HT prévu</p>
                <p className="text-2xl font-bold text-gray-900">{formatEuros(chantier.ca_ht_prevu)}</p>
              </div>
              <div className={`flex items-center gap-2 text-sm font-medium ${chantier.facture ? 'text-green-600' : 'text-gray-500'}`}>
                {chantier.facture ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                {chantier.facture ? 'Chantier facturé' : 'Non facturé'}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-1 text-sm">
              <p className="text-gray-500">Créé par</p>
              <p className="text-gray-900 font-medium">{chantier.created_by_name}</p>
              <p className="text-gray-400 text-xs mt-2">Le {formatDate(chantier.created_at)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
