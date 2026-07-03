'use client';

import { useState } from 'react';
import { PhotoUploader, PhotoDraft } from './PhotoUploader';

interface Props {
  interventionId: number;
  onCreated: () => void;
}

export function RapportForm({ interventionId, onCreated }: Props) {
  const [contenu, setContenu] = useState('');
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!contenu.trim()) {
      setError('Merci de décrire l\'intervention');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/interventions/${interventionId}/rapports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu, photos }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'envoi du rapport');
      setContenu('');
      setPhotos([]);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Compte rendu</label>
        <textarea
          rows={4}
          value={contenu}
          onChange={e => setContenu(e.target.value)}
          placeholder="Décrire le déroulement de l'intervention, observations, matériel utilisé..."
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition text-sm"
        />
      </div>
      <PhotoUploader photos={photos} onChange={setPhotos} />
      <button
        type="submit"
        disabled={saving}
        className="bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm"
      >
        {saving ? 'Envoi...' : 'Ajouter le rapport'}
      </button>
    </form>
  );
}
