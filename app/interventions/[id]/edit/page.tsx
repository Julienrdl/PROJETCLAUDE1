'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { InterventionForm, buildInterventionPayload, InterventionFormValues } from '@/components/InterventionForm';
import { Intervention } from '@/types';

export default function EditInterventionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/');
    if (!loading && user && user.role !== 'bureau') router.push(`/interventions/${id}`);
  }, [user, loading, router, id]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/interventions/${id}`)
      .then(r => r.json())
      .then(data => setIntervention(data.intervention || null))
      .finally(() => setFetching(false));
  }, [user, id]);

  if (loading || !user || user.role !== 'bureau' || fetching) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div></div>;
  }

  if (!intervention) return <div className="text-gray-500">Intervention non trouvée</div>;

  const handleSubmit = async (values: InterventionFormValues) => {
    const res = await fetch(`/api/interventions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildInterventionPayload(values)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur lors de la mise à jour');
    router.push(`/interventions/${id}`);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Modifier l&apos;intervention</h1>
        <p className="text-gray-500 mt-1">{intervention.titre}</p>
      </div>
      <InterventionForm initial={intervention} onSubmit={handleSubmit} submitLabel="Enregistrer les modifications" />
    </div>
  );
}
