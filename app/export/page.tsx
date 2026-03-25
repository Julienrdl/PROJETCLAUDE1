'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Invoice } from '@/types';
import { Download, FileText, Calendar, TrendingUp } from 'lucide-react';

export default function ExportPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  const fetchData = () => {
    setFetching(true);
    fetch(`/api/export?month=${month}`)
      .then(r => r.json())
      .then(d => {
        setInvoices(d.invoices || []);
        setTotal(d.total || 0);
      })
      .finally(() => setFetching(false));
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user, month]);

  const handleExport = () => {
    const url = `/api/export?month=${month}&format=${exportFormat}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `factures_validees_${month}.${exportFormat}`;
    a.click();
  };

  if (loading) return null;

  const monthLabel = new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Export comptable mensuel</h1>
        <p className="text-gray-500 mt-1">Exportez les factures validées par mois</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Calendar size={14} className="inline mr-1" />
              Mois sélectionné
            </label>
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Format d&apos;export</label>
            <div className="flex gap-2">
              <button
                onClick={() => setExportFormat('csv')}
                className={`px-4 py-2.5 rounded-xl border font-medium text-sm transition-colors ${
                  exportFormat === 'csv' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-700 border-gray-300 hover:border-amber-300'
                }`}
              >
                CSV (Excel)
              </button>
              <button
                onClick={() => setExportFormat('json')}
                className={`px-4 py-2.5 rounded-xl border font-medium text-sm transition-colors ${
                  exportFormat === 'json' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-700 border-gray-300 hover:border-amber-300'
                }`}
              >
                JSON
              </button>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={invoices.length === 0}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors"
          >
            <Download size={18} />
            Exporter
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText size={18} className="text-blue-600" />
            </div>
            <p className="text-gray-500 text-sm">Factures validées</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{invoices.length}</p>
          <p className="text-sm text-gray-500 mt-1 capitalize">{monthLabel}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp size={18} className="text-green-600" />
            </div>
            <p className="text-gray-500 text-sm">Total facturé</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{total.toFixed(2)} €</p>
          <p className="text-sm text-gray-500 mt-1 capitalize">{monthLabel}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg">
              <TrendingUp size={18} className="text-amber-600" />
            </div>
            <p className="text-gray-500 text-sm">Moyenne par facture</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {invoices.length > 0 ? (total / invoices.length).toFixed(2) : '0.00'} €
          </p>
          <p className="text-sm text-gray-500 mt-1 capitalize">{monthLabel}</p>
        </div>
      </div>

      {/* Invoices table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            Factures validées — {monthLabel}
          </h2>
        </div>
        {fetching ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-6 h-6 border-4 border-amber-500 border-t-transparent rounded-full"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-40" />
            <p>Aucune facture validée pour {monthLabel}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Fournisseur</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Fichier</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Description</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Date facture</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase px-5 py-3">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{inv.supplier}</td>
                    <td className="px-5 py-3 text-sm text-gray-500 max-w-[180px] truncate">{inv.original_name}</td>
                    <td className="px-5 py-3 text-sm text-gray-500 max-w-[200px] truncate">{inv.description || '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {inv.amount != null ? `${inv.amount.toFixed(2)} €` : '—'}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={4} className="px-5 py-3 text-right text-gray-700">Total</td>
                  <td className="px-5 py-3 text-right text-gray-900">{total.toFixed(2)} €</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
