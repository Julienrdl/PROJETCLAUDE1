'use client';

import { useEffect, useState } from 'react';
import { Intervention, Chantier, User } from '@/types';
import { INTERVENTION_TYPE_LABELS, INTERVENTION_STATUT_LABELS } from '@/lib/constants';

export interface InterventionFormValues {
  chantier_id: string;
  type: string;
  titre: string;
  date_debut: string;
  date_fin: string;
  poseur_id: string;
  statut: string;
  ca_ht_prevu: string;
  description: string;
}

function toLocalInput(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toFormValues(iv?: Intervention, defaultChantierId?: string): InterventionFormValues {
  return {
    chantier_id: iv?.chantier_id.toString() || defaultChantierId || '',
    type: iv?.type || 'pose',
    titre: iv?.titre || '',
    date_debut: toLocalInput(iv?.date_debut || null),
    date_fin: toLocalInput(iv?.date_fin || null),
    poseur_id: iv?.poseur_id?.toString() || '',
    statut: iv?.statut || 'planifiee',
    ca_ht_prevu: iv?.ca_ht_prevu?.toString() || '',
    description: iv?.description || '',
  };
}

export function buildInterventionPayload(values: InterventionFormValues) {
  return {
    chantier_id: Number(values.chantier_id),
    type: values.type,
    titre: values.titre,
    date_debut: values.date_debut ? new Date(values.date_debut).toISOString() : null,
    date_fin: values.date_fin ? new Date(values.date_fin).toISOString() : null,
    poseur_id: values.poseur_id ? Number(values.poseur_id) : null,
    statut: values.statut,
    ca_ht_prevu: values.ca_ht_prevu ? Number(values.ca_ht_prevu) : null,
    description: values.description || null,
  };
}

interface Props {
  initial?: Intervention;
  defaultChantierId?: string;
  onSubmit: (values: InterventionFormValues) => Promise<void>;
  submitLabel: string;
}

const inputClass = 'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition text-sm';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

export function InterventionForm({ initial, defaultChantierId, onSubmit, submitLabel }: Props) {
  const [values, setValues] = useState<InterventionFormValues>(toFormValues(initial, defaultChantierId));
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [poseurs, setPoseurs] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/chantiers').then(r => r.json()).then(d => setChantiers(d.chantiers || []));
    fetch('/api/users?role=poseur').then(r => r.json()).then(d => setPoseurs(d.users || []));
  }, []);

  const set = (k: keyof InterventionFormValues, v: string) => setValues(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!values.chantier_id || !values.titre || !values.date_debut) {
      setError('Chantier, titre et date sont requis');
      return;
    }
    setSaving(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Chantier *</label>
            <select className={inputClass} value={values.chantier_id} onChange={e => set('chantier_id', e.target.value)} required>
              <option value="">Sélectionner un chantier</option>
              {chantiers.map(c => <option key={c.id} value={c.id}>{c.nom} — {c.client_nom}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Type d&apos;intervention</label>
            <select className={inputClass} value={values.type} onChange={e => set('type', e.target.value)}>
              {Object.entries(INTERVENTION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Statut</label>
            <select className={inputClass} value={values.statut} onChange={e => set('statut', e.target.value)}>
              {Object.entries(INTERVENTION_STATUT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Titre *</label>
            <input className={inputClass} value={values.titre} onChange={e => set('titre', e.target.value)} placeholder="Ex : Pose centrale toiture, SAV onduleur..." required />
          </div>
          <div>
            <label className={labelClass}>Date et heure de début *</label>
            <input type="datetime-local" className={inputClass} value={values.date_debut} onChange={e => set('date_debut', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Date et heure de fin</label>
            <input type="datetime-local" className={inputClass} value={values.date_fin} onChange={e => set('date_fin', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Poseur assigné</label>
            <select className={inputClass} value={values.poseur_id} onChange={e => set('poseur_id', e.target.value)}>
              <option value="">Non assigné</option>
              {poseurs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>CA HT prévu (€)</label>
            <input type="number" step="0.01" className={inputClass} value={values.ca_ht_prevu} onChange={e => set('ca_ht_prevu', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea rows={4} className={inputClass} value={values.description} onChange={e => set('description', e.target.value)} placeholder="Détails de l'intervention..." />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        {saving ? 'Enregistrement...' : submitLabel}
      </button>
    </form>
  );
}
