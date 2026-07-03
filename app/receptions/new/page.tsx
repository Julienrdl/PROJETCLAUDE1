'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { SignaturePad } from '@/components/SignaturePad';
import { PhotoUploader, PhotoDraft } from '@/components/PhotoUploader';
import { Chantier, User } from '@/types';

const inputClass = 'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition text-sm';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

function NewReceptionContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultChantierId = searchParams.get('chantier_id') || '';

  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [poseurs, setPoseurs] = useState<User[]>([]);
  const [chantierId, setChantierId] = useState(defaultChantierId);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [poseurId, setPoseurId] = useState('');
  const [clientNom, setClientNom] = useState('');
  const [commentaires, setCommentaires] = useState('');
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [poseurSignature, setPoseurSignature] = useState('');
  const [clientSignature, setClientSignature] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/chantiers').then(r => r.json()).then(d => setChantiers(d.chantiers || []));
    if (user.role === 'bureau') {
      fetch('/api/users?role=poseur').then(r => r.json()).then(d => setPoseurs(d.users || []));
    }
  }, [user]);

  if (loading || !user) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div></div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!chantierId || !clientNom || !poseurSignature || !clientSignature) {
      setError('Chantier, nom du client et les deux signatures sont requis');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/receptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chantier_id: Number(chantierId),
          date: new Date(date).toISOString(),
          poseur_id: poseurId ? Number(poseurId) : undefined,
          client_nom: clientNom,
          poseur_signature: poseurSignature,
          client_signature: clientSignature,
          commentaires: commentaires || null,
          photos,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création');
      router.push(`/receptions/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle réception de chantier</h1>
        <p className="text-gray-500 mt-1">Faire signer le poseur et le client, ajouter des photos</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Chantier *</label>
              <select className={inputClass} value={chantierId} onChange={e => setChantierId(e.target.value)} required>
                <option value="">Sélectionner un chantier</option>
                {chantiers.map(c => <option key={c.id} value={c.id}>{c.nom} — {c.client_nom}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Date de réception *</label>
              <input type="date" className={inputClass} value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            {user.role === 'bureau' ? (
              <div>
                <label className={labelClass}>Poseur</label>
                <select className={inputClass} value={poseurId} onChange={e => setPoseurId(e.target.value)}>
                  <option value="">Moi (bureau)</option>
                  {poseurs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className={labelClass}>Poseur</label>
                <input className={inputClass} value={user.name} disabled />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className={labelClass}>Nom du client présent *</label>
              <input className={inputClass} value={clientNom} onChange={e => setClientNom(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Commentaires</label>
              <textarea rows={3} className={inputClass} value={commentaires} onChange={e => setCommentaires(e.target.value)} placeholder="Remarques, réserves éventuelles..." />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Photos du chantier</h2>
          <PhotoUploader photos={photos} onChange={setPhotos} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <SignaturePad label="Signature du poseur *" onChange={setPoseurSignature} />
          <SignaturePad label="Signature du client *" onChange={setClientSignature} />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          {saving ? 'Enregistrement...' : 'Valider la réception'}
        </button>
      </form>
    </div>
  );
}

export default function NewReceptionPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div></div>}>
      <NewReceptionContent />
    </Suspense>
  );
}
