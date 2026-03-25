'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { ROLE_LABELS } from '@/lib/constants';
import { LogOut, FileText, LayoutDashboard, Upload, Download } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DS</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">DI SOLAR</span>
            <span className="text-gray-400 text-sm hidden sm:block">Validation Factures</span>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <LayoutDashboard size={16} />
              <span className="hidden sm:block">Tableau de bord</span>
            </Link>
            <Link
              href="/invoices"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <FileText size={16} />
              <span className="hidden sm:block">Factures</span>
            </Link>
            {user.role === 'rose' && (
              <Link
                href="/invoices/upload"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors"
              >
                <Upload size={16} />
                <span className="hidden sm:block">Déposer</span>
              </Link>
            )}
            {user.role === 'accountant' && (
              <Link
                href="/export"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-green-600 hover:bg-green-50 transition-colors"
              >
                <Download size={16} />
                <span className="hidden sm:block">Exporter</span>
              </Link>
            )}
          </div>

          {/* User info + logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Se déconnecter"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
