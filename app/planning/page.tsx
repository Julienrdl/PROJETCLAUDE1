'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Intervention, User } from '@/types';
import { INTERVENTION_TYPE_LABELS, INTERVENTION_TYPE_COLORS } from '@/lib/constants';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, addMonths, subMonths, isSameMonth, isSameDay, isToday,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export default function PlanningPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [month, setMonth] = useState(() => new Date());
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [poseurs, setPoseurs] = useState<User[]>([]);
  const [poseurFilter, setPoseurFilter] = useState('');
  const [fetching, setFetching] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'bureau') {
      fetch('/api/users?role=poseur').then(r => r.json()).then(d => setPoseurs(d.users || []));
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const from = startOfWeek(startOfMonth(month), { weekStartsOn: 1 }).toISOString();
    const to = endOfWeek(endOfMonth(month), { weekStartsOn: 1 }).toISOString();
    const qs = new URLSearchParams({ from, to });
    if (poseurFilter) qs.set('poseur_id', poseurFilter);
    fetch(`/api/interventions?${qs.toString()}`)
      .then(r => r.json())
      .then(data => setInterventions(data.interventions || []))
      .finally(() => setFetching(false));
  }, [user, month, poseurFilter]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const interventionsByDay = useMemo(() => {
    const map = new Map<string, Intervention[]>();
    for (const iv of interventions) {
      const key = format(new Date(iv.date_debut), 'yyyy-MM-dd');
      const list = map.get(key) || [];
      list.push(iv);
      map.set(key, list);
    }
    return map;
  }, [interventions]);

  if (loading || !user) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div></div>;
  }

  const selectedList = selectedDay ? interventionsByDay.get(format(selectedDay, 'yyyy-MM-dd')) || [] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planning</h1>
          <p className="text-gray-500 mt-1 capitalize">{format(month, 'MMMM yyyy', { locale: fr })}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {user.role === 'bureau' && poseurs.length > 0 && (
            <select
              value={poseurFilter}
              onChange={e => setPoseurFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Tous les poseurs</option>
              {poseurs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <div className="flex items-center gap-1">
            <button onClick={() => setMonth(subMonths(month, 1))} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"><ChevronLeft size={16} /></button>
            <button onClick={() => setMonth(new Date())} className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm font-medium">Aujourd&apos;hui</button>
            <button onClick={() => setMonth(addMonths(month, 1))} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"><ChevronRight size={16} /></button>
          </div>
          {user.role === 'bureau' && (
            <Link href="/interventions/new" className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm">
              <Plus size={16} /> Intervention
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
            <div key={d} className="p-2 text-center text-xs font-semibold text-gray-500">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map(day => {
            const key = format(day, 'yyyy-MM-dd');
            const dayInterventions = interventionsByDay.get(key) || [];
            const inMonth = isSameMonth(day, month);
            return (
              <button
                key={key}
                onClick={() => setSelectedDay(day)}
                className={`min-h-[90px] p-1.5 border-b border-r border-gray-100 text-left align-top hover:bg-amber-50 transition-colors ${!inMonth ? 'bg-gray-50' : ''} ${selectedDay && isSameDay(selectedDay, day) ? 'ring-2 ring-inset ring-amber-400' : ''}`}
              >
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${isToday(day) ? 'bg-amber-500 text-white' : inMonth ? 'text-gray-700' : 'text-gray-300'}`}>
                  {format(day, 'd')}
                </span>
                <div className="mt-1 space-y-1">
                  {dayInterventions.slice(0, 2).map(iv => (
                    <div key={iv.id} className={`text-[11px] px-1.5 py-0.5 rounded truncate ${INTERVENTION_TYPE_COLORS[iv.type]}`}>
                      {iv.titre}
                    </div>
                  ))}
                  {dayInterventions.length > 2 && (
                    <div className="text-[11px] text-gray-400 px-1.5">+{dayInterventions.length - 2} autre(s)</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {fetching && <p className="text-sm text-gray-400">Chargement...</p>}

      {selectedDay && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 capitalize">{format(selectedDay, 'EEEE d MMMM yyyy', { locale: fr })}</h2>
          {selectedList.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune intervention ce jour</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {selectedList.map(iv => (
                <Link key={iv.id} href={`/interventions/${iv.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${INTERVENTION_TYPE_COLORS[iv.type]}`}>{INTERVENTION_TYPE_LABELS[iv.type]}</span>
                      <span className="text-xs text-gray-500">{format(new Date(iv.date_debut), 'HH:mm')}</span>
                    </div>
                    <p className="font-medium text-gray-900">{iv.titre}</p>
                    <p className="text-xs text-gray-500">{iv.chantier_nom}{iv.poseur_nom ? ` — ${iv.poseur_nom}` : ''}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
