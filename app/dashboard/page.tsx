'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { StatusBadge } from '@/components/StatusBadge';
import { Invoice } from '@/types';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight, Upload } from 'lucide-react';
import { ROLE_TO_STATUS } from '@/lib/constants';

interface Stats {
  total: number;
  pending_rose: number;
  pending_owner: number;
  pending_rajaa: number;
  validated: number;
  rejected: number;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending_rose: 0, pending_owner: 0, pending_rajaa: 0, validated: 0, rejected: 0 });
  const [myPending, setMyPending] = useState<Invoice[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/invoices')
      .then(r => r.json())
      .then(data => {
        const all: Invoice[] = data.invoices || [];
        setInvoices(all.slice(0, 5));

        const s: Stats = { total: all.length, pending_rose: 0, pending_owner: 0, pending_rajaa: 0, validated: 0, rejected: 0 };
        all.forEach(inv => { s[inv.status as keyof Stats]++; });
        setStats(s);

        const myStatus = ROLE_TO_STATUS[user.role];
        if (myStatus) {
          setMyPending(all.filter(inv => inv.status === myStatus));
        }
      });
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div></div>;
  }

  if (!user) return null;

  const statCards = [
    { label: 'Total factures', value: stats.total, icon: FileText, color: 'bg-blue-50 text-blue-600' },
    { label: 'En attente', value: stats.pending_rose + stats.pending_owner + stats.pending_rajaa, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Validées', value: stats.validated, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
    { label: 'Rejetées', value: stats.rejected, icon: XCircle, color: 'bg-red-50 text-red-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 mt-1">Bienvenue, {user.name}</p>
      </div>

      {/* My pending validations alert */}
      {myPending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="font-medium text-amber-800">
              {myPending.length} facture{myPending.length > 1 ? 's' : ''} en attente de votre validation
            </p>
            <div className="mt-2 space-y-1">
              {myPending.map(inv => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="flex items-center gap-2 text-sm text-amber-700 hover:text-amber-900 font-medium"
                >
                  <ArrowRight size={14} />
                  {inv.supplier} — {inv.original_name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`inline-flex p-2 rounded-lg ${card.color} mb-3`}>
              <card.icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Workflow visualization */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Circuit de validation</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: 'Rose', sublabel: 'Assistante', count: stats.pending_rose, color: 'border-yellow-300 bg-yellow-50' },
            { label: 'Directeur', sublabel: 'DI SOLAR', count: stats.pending_owner, color: 'border-blue-300 bg-blue-50' },
            { label: 'Rajaa', sublabel: 'Validatrice', count: stats.pending_rajaa, color: 'border-purple-300 bg-purple-50' },
            { label: 'Validées', sublabel: 'Comptable', count: stats.validated, color: 'border-green-300 bg-green-50' },
          ].map((step, idx) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className={`border-2 ${step.color} rounded-xl px-4 py-3 text-center min-w-[100px]`}>
                <p className="font-semibold text-gray-800 text-sm">{step.label}</p>
                <p className="text-xs text-gray-500">{step.sublabel}</p>
                {step.count > 0 && (
                  <span className="inline-block mt-1 bg-gray-800 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {step.count}
                  </span>
                )}
              </div>
              {idx < 3 && <ArrowRight size={20} className="text-gray-400 flex-shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Recent invoices */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Factures récentes</h2>
          <Link href="/invoices" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
            Voir tout →
          </Link>
        </div>
        {invoices.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <FileText size={36} className="mx-auto mb-3 opacity-40" />
            <p>Aucune facture pour l&apos;instant</p>
            {user.role === 'rose' && (
              <Link href="/invoices/upload" className="mt-3 inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 text-sm font-medium">
                <Upload size={16} /> Déposer la première facture
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {invoices.map(inv => (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{inv.supplier}</p>
                  <p className="text-sm text-gray-500 truncate">{inv.original_name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {inv.amount && <p className="font-semibold text-gray-900">{inv.amount.toFixed(2)} €</p>}
                  <StatusBadge status={inv.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
