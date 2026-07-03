'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { User } from '@/types';
import { ROLE_LABELS } from '@/lib/constants';
import { UserPlus, Trash2, Users } from 'lucide-react';

const inputClass = 'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition text-sm';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

export default function PoseursPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [fetching, setFetching] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('poseur');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(() => {
    fetch('/api/users').then(r => r.json()).then(d => setUsers(d.users || [])).finally(() => setFetching(false));
  }, []);

  useEffect(() => {
    if (!loading && !user) router.push('/');
    if (!loading && user && user.role !== 'bureau') router.push('/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'bureau') loadUsers();
  }, [user, loadUsers]);

  if (loading || !user || user.role !== 'bureau') {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div></div>;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) {
      setError('Nom, email et mot de passe requis');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création');
      setName(''); setEmail(''); setPassword(''); setRole('poseur');
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, targetName: string) => {
    if (!confirm(`Supprimer le compte de ${targetName} ?`)) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) loadUsers();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
        <p className="text-gray-500 mt-1">Gérer les comptes du bureau et des poseurs</p>
      </div>

      <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2"><UserPlus size={18} /> Ajouter un utilisateur</h2>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nom *</label>
            <input className={inputClass} value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Email *</label>
            <input type="email" className={inputClass} value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Mot de passe *</label>
            <input type="password" className={inputClass} value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Rôle</label>
            <select className={inputClass} value={role} onChange={e => setRole(e.target.value)}>
              <option value="poseur">Poseur</option>
              <option value="bureau">Bureau</option>
            </select>
          </div>
        </div>
        <button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm">
          {saving ? 'Création...' : 'Créer le compte'}
        </button>
      </form>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center gap-2 p-5 border-b border-gray-100">
          <Users size={18} className="text-gray-900" />
          <h2 className="font-semibold text-gray-900">Comptes existants</h2>
        </div>
        {fetching ? (
          <p className="p-5 text-sm text-gray-400">Chargement...</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email} — {ROLE_LABELS[u.role]}</p>
                </div>
                {u.id !== user.id && (
                  <button onClick={() => handleDelete(u.id, u.name)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
