import React, { useMemo, useState } from 'react';
import { ContactData } from '../types';

interface ActivityItem {
  noteId: string;
  text: string;
  reminderDate: string;
  reminderTimestamp: number;
  tag?: string;
  contactId: string;
  contactName: string;
  company: string;
  stageName: string;
  assignedTo?: string;
}

interface ActividadesProps {
  contacts: ContactData[];
  onSelectContact: (contact: ContactData) => void;
  user: import('../types').User | null;
  onUpdateContact?: (contact: ContactData) => Promise<void>;
}

type Tab = 'hoy' | 'semana' | 'proximos' | 'vencidos';

function startOfDay(d: Date): number {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime();
}
function endOfDay(d: Date): number {
  const x = new Date(d); x.setHours(23, 59, 59, 999); return x.getTime();
}

export default function Actividades({ contacts, onSelectContact, user, onUpdateContact }: ActividadesProps) {
  const [activeTab, setActiveTab] = useState<Tab>('hoy');
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState('Todos');

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const weekEnd = todayEnd + 6 * 24 * 60 * 60 * 1000;

  const handleToggleReminderCompleted = async (contactId: string, noteId: string) => {
    if (!onUpdateContact) return;
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    const updatedStages = contact.stages?.map(stage => ({
      ...stage,
      notes: stage.notes.map(note => 
        note.id === noteId ? { 
          ...note, 
          reminderCompleted: true,
          reminderCompletedAt: new Date().toISOString()
        } : note
      )
    }));

    await onUpdateContact({ ...contact, stages: updatedStages });
  };

  const allActivities = useMemo<ActivityItem[]>(() => {
    return contacts.flatMap(c =>
      (c.stages || []).flatMap(s =>
        s.notes
          .filter(n => n.reminderDate && n.reminderTimestamp && !n.reminderCompleted)
          .map(n => ({
            noteId: n.id,
            text: n.text,
            reminderDate: n.reminderDate!,
            reminderTimestamp: n.reminderTimestamp!,
            tag: n.tag,
            contactId: c.id || '',
            contactName: `${c.firstName} ${c.lastName}`,
            company: c.company,
            stageName: s.name,
            assignedTo: c.assignedTo,
          }))
      )
    );
  }, [contacts]);

  const allUsers = useMemo(() => {
    const users = new Set(allActivities.map(a => a.assignedTo).filter(Boolean) as string[]);
    return ['Todos', ...Array.from(users)];
  }, [allActivities]);

  const filtered = useMemo(() => {
    return allActivities.filter(a => {
      if (userFilter !== 'Todos' && a.assignedTo !== userFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !a.contactName.toLowerCase().includes(q) &&
          !a.company.toLowerCase().includes(q) &&
          !a.text.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [allActivities, userFilter, searchQuery]);

  const tabs = useMemo(() => ({
    hoy: filtered
      .filter(a => a.reminderTimestamp >= todayStart && a.reminderTimestamp <= todayEnd)
      .sort((a, b) => a.reminderTimestamp - b.reminderTimestamp),
    semana: filtered
      .filter(a => a.reminderTimestamp > todayEnd && a.reminderTimestamp <= weekEnd)
      .sort((a, b) => a.reminderTimestamp - b.reminderTimestamp),
    proximos: filtered
      .filter(a => a.reminderTimestamp > weekEnd)
      .sort((a, b) => a.reminderTimestamp - b.reminderTimestamp),
    vencidos: filtered
      .filter(a => a.reminderTimestamp < todayStart)
      .sort((a, b) => b.reminderTimestamp - a.reminderTimestamp),
  }), [filtered, todayStart, todayEnd, weekEnd]);

  const currentItems = tabs[activeTab];

  const tabConfig: { key: Tab; label: string; count: number }[] = [
    { key: 'hoy', label: 'Hoy', count: tabs.hoy.length },
    { key: 'semana', label: 'Esta semana', count: tabs.semana.length },
    { key: 'proximos', label: 'Próximos', count: tabs.proximos.length },
    { key: 'vencidos', label: 'Vencidos', count: tabs.vencidos.length },
  ];

  return (
    <div className="pt-6 px-4 md:pt-8 md:px-8 pb-24 md:pb-12 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-headline font-bold">Actividades</h1>
          <p className="text-outline text-[11px] md:text-sm mt-0.5 md:mt-1">
            {allActivities.length} seguimientos programados
            {tabs.vencidos.length > 0 && (
              <span className="text-error font-semibold ml-1"> · {tabs.vencidos.length} vencidos</span>
            )}
          </p>
        </div>
        {allUsers.length > 2 && (
          <select
            value={userFilter}
            onChange={e => setUserFilter(e.target.value)}
            className="w-full sm:w-auto bg-surface-container border border-outline-variant/30 rounded-lg px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm text-on-surface focus:outline-none focus:border-primary/50"
          >
            {allUsers.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
          <input
            type="text"
            placeholder="Buscar por contacto, empresa o nota..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl text-sm text-on-surface placeholder-outline focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1 border border-outline-variant/20 overflow-x-auto no-scrollbar scroll-smooth">
          {tabConfig.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.key
                  ? tab.key === 'vencidos'
                    ? 'bg-error/15 text-error'
                    : 'bg-primary/15 text-primary'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === tab.key
                      ? tab.key === 'vencidos'
                        ? 'bg-error/20 text-error'
                        : 'bg-primary/20 text-primary'
                      : 'bg-outline/20 text-outline'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {currentItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span
            className="material-symbols-outlined text-outline/30 text-5xl mb-4"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {activeTab === 'vencidos' ? 'check_circle' : 'event_available'}
          </span>
          <p className="text-on-surface font-semibold mb-1">
            {activeTab === 'hoy' && 'Sin actividades para hoy'}
            {activeTab === 'semana' && 'Sin actividades esta semana'}
            {activeTab === 'proximos' && 'Sin actividades próximas'}
            {activeTab === 'vencidos' && '¡Todo al día!'}
          </p>
          <p className="text-outline text-sm max-w-xs">
            {activeTab === 'vencidos'
              ? 'No tenés recordatorios vencidos.'
              : 'Los recordatorios aparecen aquí cuando los agregás desde los contactos.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {currentItems.map(item => {
            const contact = contacts.find(c => c.id === item.contactId);
            const isVencido = activeTab === 'vencidos';
            return (
              <button
                key={`${item.contactId}-${item.noteId}`}
                onClick={() => contact && onSelectContact(contact)}
                className={`w-full text-left bg-surface-container hover:bg-surface-container-high border rounded-xl px-4 py-3 transition-all duration-200 group flex items-start gap-4 ${
                  isVencido
                    ? 'border-error/20 hover:border-error/40'
                    : 'border-outline-variant/10 hover:border-primary/20'
                }`}
              >
                <div
                  className={`mt-2 w-2 h-2 rounded-full flex-shrink-0 ${
                    isVencido
                      ? 'bg-error'
                      : activeTab === 'hoy'
                      ? 'bg-primary animate-pulse'
                      : 'bg-outline/40'
                  }`}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <span className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors">
                        {item.contactName}
                      </span>
                      <span className="text-outline text-xs ml-2 truncate">{item.company}</span>
                    </div>
                    <span className={`text-xs font-semibold flex-shrink-0 ${isVencido ? 'text-error' : 'text-outline'}`}>
                      {item.reminderDate}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant line-clamp-1 mb-2">{item.text}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-outline bg-surface-container-high rounded-full px-2 py-0.5">
                      {item.stageName}
                    </span>
                    {item.tag && (
                      <span className="text-[10px] text-primary bg-primary/10 rounded-full px-2 py-0.5">
                        {item.tag}
                      </span>
                    )}
                    {item.assignedTo && (
                      <span className="text-[10px] text-outline">{item.assignedTo}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2 mt-1">
                  <span className="material-symbols-outlined text-outline/30 group-hover:text-primary/50 text-[18px] transition-colors">
                    chevron_right
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleReminderCompleted(item.contactId, item.noteId);
                    }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      isVencido 
                        ? 'bg-error/10 text-error hover:bg-error hover:text-white' 
                        : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                    }`}
                    title="Marcar como realizado"
                  >
                    <span className="material-symbols-outlined text-[16px]">done</span>
                  </button>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
