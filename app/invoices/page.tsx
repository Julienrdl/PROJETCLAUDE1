'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { StatusBadge } from '@/components/StatusBadge';
import { Invoice } from '@/types';
import { FileText, Search, Upload, Filter } from 'lucide-react';

export default function InvoicesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/invoices?${params}`)
      .then(r => r.json())
      .then(data => setInvoices(data.invoices || []))
      .finally(() => setFetching(false));
  }, [user, statusFilter]);

  const filtered = invoices.filter(inv =>
    inv.supplier.toLowerCase().includes(search.toLowerCase()) ||
    inv.original_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading || fetching) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Factures fournisseurs</h1>
          <p className="text-gray-500 mt-1">{invoices.length} facture{invoices.length !== 1 ? 's' : ''} au total</p>
        </div>
        {user?.role === 'rose' && (
          <Link
            href="/invoices/upload"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Upload size={18} />
            Déposer une facture
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un fournisseur..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none appearance-none bg-white cursor-pointer"
          >
            <option value="">Tous les statuts</option>
            <option value="pending_rose">En attente de Rose</option>
            <option value="pending_owner">En attente du Directeur</option>
            <option value="pending_rajaa">En attente de Rajaa</option>
            <option value="validated">Validées</option>
            <option value="rejected">Rejetées</option>
          </select>
        </div>
      </div>

      {/* Invoices table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">Aucune facture trouvée</p>
            {user?.role === 'rose' && !search && (
              <Link href="/invoices/upload" className="mt-3 inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 text-sm font-medium">
                <Upload size={16} /> Déposer la première facture
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">Fournisseur</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">Fichier</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">Montant</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">Date facture</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">Statut</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">Déposée le</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-900">{inv.supplier}</td>
                    <td className="px-5 py-4 text-sm text-gray-500 max-w-[200px] truncate">{inv.original_name}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {inv.amount != null ? `${inv.amount.toFixed(2)} €` : '—'}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={inv.status} /></td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {new Date(inv.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                      >
                        Voir →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
