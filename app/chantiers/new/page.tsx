'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { ChantierForm, buildChantierPayload, ChantierFormValues } from '@/components/ChantierForm';

export default function NewChantierPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/');
    if (!loading && user && user.role !== 'bureau') router.push('/chantiers');
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'bureau') {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div></div>;
  }

  const handleSubmit = async (values: ChantierFormValues) => {
    const res = await fetch('/api/chantiers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildChantierPayload(values)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur lors de la création');
    router.push(`/chantiers/${data.id}`);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau chantier</h1>
        <p className="text-gray-500 mt-1">Créer une nouvelle installation à suivre</p>
      </div>
      <ChantierForm onSubmit={handleSubmit} submitLabel="Créer le chantier" />
    </div>
  );
}
