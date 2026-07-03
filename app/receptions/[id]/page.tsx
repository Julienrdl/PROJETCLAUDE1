'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Reception } from '@/types';
import { formatDate } from '@/lib/format';
import { Building2, Download } from 'lucide-react';

export default function ReceptionDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [reception, setReception] = useState<Reception | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/receptions/${id}`)
      .then(r => r.json())
      .then(data => setReception(data.reception || null))
      .finally(() => setFetching(false));
  }, [user, id]);

  if (loading || !user || fetching) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div></div>;
  }

  if (!reception) return <div className="text-gray-500">Réception non trouvée</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Réception du {formatDate(reception.date)}</h1>
          <Link href={`/chantiers/${reception.chantier_id}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-amber-600 mt-1">
            <Building2 size={14} /> {reception.chantier_nom}
          </Link>
        </div>
        <a
          href={`/api/receptions/${id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Download size={16} /> Télécharger le PDF
        </a>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500">Poseur</p>
            <p className="font-medium text-gray-900">{reception.poseur_nom}</p>
          </div>
          <div>
            <p className="text-gray-500">Client présent</p>
            <p className="font-medium text-gray-900">{reception.client_nom}</p>
          </div>
        </div>
        {reception.commentaires && (
          <div>
            <p className="text-gray-500 mb-1">Commentaires</p>
            <p className="text-gray-700 whitespace-pre-wrap">{reception.commentaires}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Signature du poseur</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={reception.poseur_signature} alt="Signature poseur" className="w-full h-32 object-contain bg-gray-50 border border-gray-200 rounded-lg" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Signature du client</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={reception.client_signature} alt="Signature client" className="w-full h-32 object-contain bg-gray-50 border border-gray-200 rounded-lg" />
        </div>
      </div>

      {reception.photos.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Photos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {reception.photos.map(photo => (
              <div key={photo.id} className="rounded-lg overflow-hidden border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.data} alt={photo.legende || 'Photo réception'} className="w-full h-32 object-cover" />
                {photo.legende && <p className="text-xs text-gray-500 px-2 py-1 bg-gray-50">{photo.legende}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
