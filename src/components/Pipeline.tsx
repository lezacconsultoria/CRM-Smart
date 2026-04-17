import React, { useMemo, useState } from 'react';
import { ContactData } from '../types';

interface PipelineProps {
  contacts: ContactData[];
  onSelectContact: (contact: ContactData) => void;
  onOpenNewContact: () => void;
  user: import('../types').User | null;
}

const STAGES = [
  { id: 1, name: 'Descubrimiento', icon: 'search', color: 'text-blue-400', bgColor: 'bg-blue-400/10', borderColor: 'border-blue-400/20' },
  { id: 2, name: 'Propuesta', icon: 'description', color: 'text-violet-400', bgColor: 'bg-violet-400/10', borderColor: 'border-violet-400/20' },
  { id: 3, name: 'Negociación', icon: 'handshake', color: 'text-amber-400', bgColor: 'bg-amber-400/10', borderColor: 'border-amber-400/20' },
  { id: 4, name: 'Cierre', icon: 'trophy', color: 'text-green-400', bgColor: 'bg-green-400/10', borderColor: 'border-green-400/20' },
];

function getContactCurrentStage(contact: ContactData): number {
  if (!contact.stages || contact.stages.length === 0) return 1;
  let maxStage = 0;
  for (const stage of contact.stages) {
    if (stage.notes && stage.notes.length > 0) {
      maxStage = Math.max(maxStage, stage.id);
    }
  }
  return maxStage > 0 ? maxStage : 1;
}

function getContactValue(contact: ContactData): number | null {
  if (contact.price) return contact.price;
  if (contact.stages) {
    for (const stage of [...contact.stages].reverse()) {
      if (stage.price) return stage.price;
      if (stage.budget) return stage.budget;
    }
  }
  return null;
}

function getLastActivityDate(contact: ContactData): string | null {
  let lastTimestamp = 0;
  let lastDate = '';
  if (contact.stages) {
    for (const stage of contact.stages) {
      for (const note of stage.notes) {
        if (note.date) {
          const ts = new Date(note.date).getTime();
          if (!isNaN(ts) && ts > lastTimestamp) {
            lastTimestamp = ts;
            lastDate = note.date;
          }
        }
      }
    }
  }
  if (!lastDate) return null;
  return new Date(lastDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

export default function Pipeline({ contacts, onSelectContact, onOpenNewContact, user }: PipelineProps) {
  const [userFilter, setUserFilter] = useState('Todos');

  const activeContacts = useMemo(() => {
    return contacts.filter(c =>
      c.status !== 'won' &&
      c.status !== 'lost' &&
      c.stages &&
      c.stages.length > 0
    );
  }, [contacts]);

  const allUsers = useMemo(() => {
    const users = new Set(activeContacts.map(c => c.assignedTo).filter(Boolean) as string[]);
    return ['Todos', ...Array.from(users)];
  }, [activeContacts]);

  const filtered = useMemo(() => {
    if (userFilter === 'Todos') return activeContacts;
    return activeContacts.filter(c => c.assignedTo === userFilter);
  }, [activeContacts, userFilter]);

  const columns = useMemo(() => {
    return STAGES.map(stage => {
      const cards = filtered.filter(c => getContactCurrentStage(c) === stage.id);
      const totalValue = cards.reduce((sum, c) => sum + (getContactValue(c) || 0), 0);
      return { ...stage, cards, totalValue };
    });
  }, [filtered]);

  const totalPipeline = columns.reduce((sum, col) => sum + col.totalValue, 0);

  return (
    <div className="pt-6 px-4 md:pt-8 md:px-8 pb-24 md:pb-12 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-headline font-bold">Pipeline de Ventas</h1>
          <p className="text-outline text-sm mt-1">
            {filtered.length} oportunidades activas
            {totalPipeline > 0 && (
              <span> · <span className="text-primary font-semibold">${totalPipeline.toLocaleString('es-AR')}</span> en pipeline</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {allUsers.length > 2 && (
            <select
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              className="bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary/50"
            >
              {allUsers.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          )}
          <button
            onClick={onOpenNewContact}
            className="bg-intelligence text-on-primary px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/10"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Nuevo Contacto
          </button>
        </div>
      </div>

      {activeContacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>view_kanban</span>
          </div>
          <h3 className="text-xl font-headline font-bold mb-2">Pipeline vacío</h3>
          <p className="text-outline text-sm mb-6 max-w-xs">
            Agregá contactos e iniciá un seguimiento para ver el pipeline de ventas.
          </p>
          <button
            onClick={onOpenNewContact}
            className="bg-intelligence text-on-primary px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all"
          >
            + Agregar primer contacto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {columns.map(col => (
            <div key={col.id} className="flex flex-col">
              <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${col.bgColor} border ${col.borderColor} mb-2`}>
                <div className="flex items-center gap-2">
                  <span
                    className={`material-symbols-outlined text-[18px] ${col.color}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {col.icon}
                  </span>
                  <span className={`font-bold text-sm ${col.color}`}>{col.name}</span>
                </div>
                <span className="text-xs bg-white/10 rounded-full px-2 py-0.5 font-bold text-on-surface">
                  {col.cards.length}
                </span>
              </div>

              {col.totalValue > 0 && (
                <p className={`text-xs ${col.color} font-semibold mb-2 px-1`}>
                  ${col.totalValue.toLocaleString('es-AR')}
                </p>
              )}

              <div className="space-y-2 flex-1">
                {col.cards.length === 0 ? (
                  <div className="border-2 border-dashed border-outline-variant/20 rounded-xl p-6 text-center">
                    <span className="material-symbols-outlined text-outline/30 text-3xl block mb-1">inbox</span>
                    <p className="text-outline/50 text-xs">Sin contactos</p>
                  </div>
                ) : (
                  col.cards.map(contact => {
                    const value = getContactValue(contact);
                    const lastActivity = getLastActivityDate(contact);
                    return (
                      <button
                        key={contact.id}
                        onClick={() => onSelectContact(contact)}
                        className="w-full text-left bg-surface-container hover:bg-surface-container-high border border-outline-variant/10 hover:border-primary/20 rounded-xl p-4 transition-all duration-200 group"
                      >
                        <p className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors leading-tight mb-0.5">
                          {contact.firstName} {contact.lastName}
                        </p>
                        <p className="text-xs text-outline mb-3 truncate">{contact.company}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {contact.assignedTo && (
                              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-primary text-[9px] font-bold">
                                  {contact.assignedTo.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            {lastActivity && (
                              <span className="text-[10px] text-outline">{lastActivity}</span>
                            )}
                          </div>
                          {value !== null && (
                            <span className="text-xs font-bold text-primary">
                              ${value.toLocaleString('es-AR')}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
