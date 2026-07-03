'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { InterventionForm, buildInterventionPayload, InterventionFormValues } from '@/components/InterventionForm';

function NewInterventionContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const chantierId = searchParams.get('chantier_id') || undefined;

  useEffect(() => {
    if (!loading && !user) router.push('/');
    if (!loading && user && user.role !== 'bureau') router.push('/planning');
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'bureau') {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div></div>;
  }

  const handleSubmit = async (values: InterventionFormValues) => {
    const res = await fetch('/api/interventions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildInterventionPayload(values)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur lors de la création');
    router.push(`/interventions/${data.id}`);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle intervention</h1>
        <p className="text-gray-500 mt-1">Planifier une pose ou une intervention</p>
      </div>
      <InterventionForm defaultChantierId={chantierId} onSubmit={handleSubmit} submitLabel="Créer l'intervention" />
    </div>
  );
}

export default function NewInterventionPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div></div>}>
      <NewInterventionContent />
    </Suspense>
  );
}
