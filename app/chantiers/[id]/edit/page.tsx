'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { ChantierForm, buildChantierPayload, ChantierFormValues } from '@/components/ChantierForm';
import { Chantier } from '@/types';

export default function EditChantierPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/');
    if (!loading && user && user.role !== 'bureau') router.push(`/chantiers/${id}`);
  }, [user, loading, router, id]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/chantiers/${id}`)
      .then(r => r.json())
      .then(data => setChantier(data.chantier || null))
      .finally(() => setFetching(false));
  }, [user, id]);

  if (loading || !user || user.role !== 'bureau' || fetching) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div></div>;
  }

  if (!chantier) return <div className="text-gray-500">Chantier non trouvé</div>;

  const handleSubmit = async (values: ChantierFormValues) => {
    const res = await fetch(`/api/chantiers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildChantierPayload(values)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur lors de la mise à jour');
    router.push(`/chantiers/${id}`);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Modifier le chantier</h1>
        <p className="text-gray-500 mt-1">{chantier.nom}</p>
      </div>
      <ChantierForm initial={chantier} onSubmit={handleSubmit} submitLabel="Enregistrer les modifications" />
    </div>
  );
}
