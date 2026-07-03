'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { ROLE_LABELS } from '@/lib/constants';
import { LogOut, LayoutDashboard, CalendarDays, Building2, Users, Sun } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
              <Sun size={20} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">JMGA</span>
          </div>

          <div className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <LayoutDashboard size={16} />
              <span className="hidden sm:block">Tableau de bord</span>
            </Link>
            <Link
              href="/planning"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <CalendarDays size={16} />
              <span className="hidden sm:block">Planning</span>
            </Link>
            <Link
              href="/chantiers"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <Building2 size={16} />
              <span className="hidden sm:block">Chantiers</span>
            </Link>
            {user.role === 'bureau' && (
              <Link
                href="/poseurs"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <Users size={16} />
                <span className="hidden sm:block">Poseurs</span>
              </Link>
            )}
          </div>

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
