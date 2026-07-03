'use client';

import { useState } from 'react';
import { Chantier } from '@/types';
import { CHANTIER_STATUT_LABELS } from '@/lib/constants';

export interface ChantierFormValues {
  nom: string;
  client_nom: string;
  client_telephone: string;
  client_email: string;
  adresse: string;
  puissance_kwc: string;
  nb_panneaux: string;
  puissance_panneau_wc: string;
  nb_onduleurs: string;
  puissance_onduleur_kw: string;
  ca_ht_prevu: string;
  statut: string;
  facture: boolean;
  notes: string;
}

function toFormValues(c?: Chantier): ChantierFormValues {
  return {
    nom: c?.nom || '',
    client_nom: c?.client_nom || '',
    client_telephone: c?.client_telephone || '',
    client_email: c?.client_email || '',
    adresse: c?.adresse || '',
    puissance_kwc: c?.puissance_kwc?.toString() || '',
    nb_panneaux: c?.nb_panneaux?.toString() || '',
    puissance_panneau_wc: c?.puissance_panneau_wc?.toString() || '',
    nb_onduleurs: c?.nb_onduleurs?.toString() || '',
    puissance_onduleur_kw: c?.puissance_onduleur_kw?.toString() || '',
    ca_ht_prevu: c?.ca_ht_prevu?.toString() || '',
    statut: c?.statut || 'a_planifier',
    facture: c?.facture || false,
    notes: c?.notes || '',
  };
}

export function buildChantierPayload(values: ChantierFormValues) {
  return {
    nom: values.nom,
    client_nom: values.client_nom,
    client_telephone: values.client_telephone || null,
    client_email: values.client_email || null,
    adresse: values.adresse,
    puissance_kwc: values.puissance_kwc ? Number(values.puissance_kwc) : null,
    nb_panneaux: values.nb_panneaux ? Number(values.nb_panneaux) : null,
    puissance_panneau_wc: values.puissance_panneau_wc ? Number(values.puissance_panneau_wc) : null,
    nb_onduleurs: values.nb_onduleurs ? Number(values.nb_onduleurs) : null,
    puissance_onduleur_kw: values.puissance_onduleur_kw ? Number(values.puissance_onduleur_kw) : null,
    ca_ht_prevu: values.ca_ht_prevu ? Number(values.ca_ht_prevu) : null,
    statut: values.statut,
    facture: values.facture,
    notes: values.notes || null,
  };
}

interface Props {
  initial?: Chantier;
  onSubmit: (values: ChantierFormValues) => Promise<void>;
  submitLabel: string;
}

const inputClass = 'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition text-sm';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

export function ChantierForm({ initial, onSubmit, submitLabel }: Props) {
  const [values, setValues] = useState<ChantierFormValues>(toFormValues(initial));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k: keyof ChantierFormValues, v: string | boolean) => setValues(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!values.nom || !values.client_nom || !values.adresse) {
      setError('Nom du chantier, client et adresse sont requis');
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
        <h2 className="font-semibold text-gray-900">Informations générales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nom du chantier *</label>
            <input className={inputClass} value={values.nom} onChange={e => set('nom', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Statut</label>
            <select className={inputClass} value={values.statut} onChange={e => set('statut', e.target.value)}>
              {Object.entries(CHANTIER_STATUT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Client *</label>
            <input className={inputClass} value={values.client_nom} onChange={e => set('client_nom', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Téléphone client</label>
            <input className={inputClass} value={values.client_telephone} onChange={e => set('client_telephone', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Email client</label>
            <input type="email" className={inputClass} value={values.client_email} onChange={e => set('client_email', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Adresse du chantier *</label>
            <input className={inputClass} value={values.adresse} onChange={e => set('adresse', e.target.value)} required />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Caractéristiques de l&apos;installation</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Puissance totale (kWc)</label>
            <input type="number" step="0.01" className={inputClass} value={values.puissance_kwc} onChange={e => set('puissance_kwc', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Nb panneaux</label>
            <input type="number" className={inputClass} value={values.nb_panneaux} onChange={e => set('nb_panneaux', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Puissance / panneau (Wc)</label>
            <input type="number" step="1" className={inputClass} value={values.puissance_panneau_wc} onChange={e => set('puissance_panneau_wc', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Nb onduleurs</label>
            <input type="number" className={inputClass} value={values.nb_onduleurs} onChange={e => set('nb_onduleurs', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Puissance / onduleur (kW)</label>
            <input type="number" step="0.01" className={inputClass} value={values.puissance_onduleur_kw} onChange={e => set('puissance_onduleur_kw', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Facturation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className={labelClass}>CA HT prévu (€)</label>
            <input type="number" step="0.01" className={inputClass} value={values.ca_ht_prevu} onChange={e => set('ca_ht_prevu', e.target.value)} />
          </div>
          <label className="flex items-center gap-2.5 pb-2.5 cursor-pointer">
            <input type="checkbox" checked={values.facture} onChange={e => set('facture', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500" />
            <span className="text-sm font-medium text-gray-700">Chantier facturé</span>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Informations complémentaires</h2>
        <div>
          <label className={labelClass}>Champ libre / notes</label>
          <textarea rows={4} className={inputClass} value={values.notes} onChange={e => set('notes', e.target.value)} placeholder="Toute information utile : accès, contraintes techniques, contacts..." />
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
