'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { StatusBadge } from '@/components/StatusBadge';
import { RapportForm } from '@/components/RapportForm';
import { Intervention, Rapport } from '@/types';
import {
  INTERVENTION_TYPE_LABELS, INTERVENTION_TYPE_COLORS,
  INTERVENTION_STATUT_LABELS, INTERVENTION_STATUT_COLORS,
} from '@/lib/constants';
import { formatEuros, formatDateTime } from '@/lib/format';
import { Building2, Pencil, Trash2, User as UserIcon, CheckCircle2, Circle, MessageSquare } from 'lucide-react';

export default function InterventionDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [fetching, setFetching] = useState(true);

  const loadData = useCallback(() => {
    fetch(`/api/interventions/${id}`)
      .then(r => r.json())
      .then(data => {
        setIntervention(data.intervention || null);
        setRapports(data.rapports || []);
      })
      .finally(() => setFetching(false));
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

  if (!intervention) return <div className="text-gray-500">Intervention non trouvée</div>;

  const canEditReport = user.role === 'bureau' || intervention.poseur_id === user.id;

  const handleDelete = async () => {
    if (!confirm(`Supprimer définitivement cette intervention ?`)) return;
    const res = await fetch(`/api/interventions/${id}`, { method: 'DELETE' });
    if (res.ok) router.push(`/chantiers/${intervention.chantier_id}`);
  };

  const updateStatut = async (statut: string) => {
    const res = await fetch(`/api/interventions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    });
    if (res.ok) loadData();
  };

  const toggleFacture = async () => {
    const res = await fetch(`/api/interventions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facture: !intervention.facture }),
    });
    if (res.ok) loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <StatusBadge value={intervention.type} labels={INTERVENTION_TYPE_LABELS} colors={INTERVENTION_TYPE_COLORS} />
            <StatusBadge value={intervention.statut} labels={INTERVENTION_STATUT_LABELS} colors={INTERVENTION_STATUT_COLORS} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{intervention.titre}</h1>
          <Link href={`/chantiers/${intervention.chantier_id}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-amber-600 mt-1">
            <Building2 size={14} /> {intervention.chantier_nom}
          </Link>
        </div>
        {user.role === 'bureau' && (
          <div className="flex items-center gap-2">
            <Link href={`/interventions/${id}/edit`} className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2.5 rounded-xl transition-colors">
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
            <h2 className="font-semibold text-gray-900">Détails</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Début</p>
                <p className="font-medium text-gray-900">{formatDateTime(intervention.date_debut)}</p>
              </div>
              {intervention.date_fin && (
                <div>
                  <p className="text-gray-500">Fin</p>
                  <p className="font-medium text-gray-900">{formatDateTime(intervention.date_fin)}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500 flex items-center gap-1"><UserIcon size={14} /> Poseur</p>
                <p className="font-medium text-gray-900">{intervention.poseur_nom || 'Non assigné'}</p>
              </div>
            </div>
            {intervention.description && (
              <div>
                <p className="text-gray-500 text-sm mb-1">Description</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{intervention.description}</p>
              </div>
            )}
            {intervention.poseur_id === user.id && (
              <div className="flex items-center gap-2 pt-2">
                {intervention.statut !== 'en_cours' && intervention.statut !== 'terminee' && (
                  <button onClick={() => updateStatut('en_cours')} className="text-sm font-medium bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors">
                    Démarrer l&apos;intervention
                  </button>
                )}
                {intervention.statut !== 'terminee' && (
                  <button onClick={() => updateStatut('terminee')} className="text-sm font-medium bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
                    Marquer comme terminée
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 p-5 border-b border-gray-100">
              <MessageSquare size={18} className="text-gray-900" />
              <h2 className="font-semibold text-gray-900">Rapports d&apos;intervention</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {rapports.map(r => (
                <div key={r.id} className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900">{r.auteur_nom}</span>
                    <span className="text-gray-400">{formatDateTime(r.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.contenu}</p>
                  {r.photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {r.photos.map(photo => (
                        <div key={photo.id} className="rounded-lg overflow-hidden border border-gray-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo.data} alt={photo.legende || 'Photo intervention'} className="w-full h-32 object-cover" />
                          {photo.legende && <p className="text-xs text-gray-500 px-2 py-1 bg-gray-50">{photo.legende}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {rapports.length === 0 && <p className="p-5 text-sm text-gray-400">Aucun rapport pour l&apos;instant</p>}
            </div>
            {canEditReport && (
              <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                <RapportForm interventionId={intervention.id} onCreated={loadData} />
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
                <p className="text-2xl font-bold text-gray-900">{formatEuros(intervention.ca_ht_prevu)}</p>
              </div>
              <button
                onClick={toggleFacture}
                className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${intervention.facture ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'}`}
              >
                {intervention.facture ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                {intervention.facture ? 'Facturée' : 'Non facturée'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
