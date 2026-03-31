import React from 'react';
import { ContactData } from '../types';

interface ContactsProps {
  onViewChange?: (view: 'contact-details') => void;
  onOpenNewContact?: () => void;
  onSelectContact?: (contact: ContactData) => void;
  contacts?: ContactData[];
}

export default function Contacts({ onViewChange, onOpenNewContact, onSelectContact, contacts = [] }: ContactsProps) {
  const [statusFilter, setStatusFilter] = React.useState('Todos los Estados');
  const [sourceFilter, setSourceFilter] = React.useState('Todos los Orígenes');
  
  const getNextAction = (contact: ContactData) => {
    let nextAction = null;
    let nextDate = Infinity;

    // Check tasks
    contact.tasks?.forEach(task => {
      if (!task.completed && task.dueDateTimestamp && task.dueDateTimestamp < nextDate) {
        nextDate = task.dueDateTimestamp;
        nextAction = { type: 'task', title: task.title, date: task.dueDate, timestamp: task.dueDateTimestamp };
      }
    });

    // Check reminders
    contact.stages?.forEach(stage => {
      stage.notes.forEach(note => {
        if (note.reminderTimestamp && note.reminderTimestamp < nextDate) {
          nextDate = note.reminderTimestamp;
          nextAction = { type: 'reminder', title: 'Recordatorio', date: note.reminderDate, timestamp: note.reminderTimestamp };
        }
      });
    });

    return nextAction;
  };

  const getContactState = (contact: ContactData) => {
    let activeStage = 0;
    contact.stages?.forEach(stage => {
      if (stage.notes && stage.notes.length > 0) {
        activeStage = Math.max(activeStage, stage.id);
      }
    });
    
    if (activeStage === 3) return { label: 'Negociación', color: 'bg-tertiary-container/20 text-tertiary-container border-tertiary-container/30' };
    if (activeStage === 2) return { label: 'Propuesta', color: 'bg-secondary-container/20 text-secondary-container border-secondary-container/30' };
    if (activeStage === 1) return { label: 'Descubrimiento', color: 'bg-primary-container/20 text-primary border-primary-container/30' };
    return { label: 'Nuevo', color: 'bg-surface-container-highest text-outline border-outline-variant/30' };
  };

  const filteredContacts = contacts.filter(contact => {
    const state = getContactState(contact).label;
    const matchStatus = statusFilter === 'Todos los Estados' || state === statusFilter;
    
    let sourceLabel = 'Directo';
    if (contact.source === 'linkedin') sourceLabel = 'LinkedIn';
    else if (contact.source === 'whatsapp') sourceLabel = 'WhatsApp';
    else if (contact.source === 'email') sourceLabel = 'Email';
    
    const matchSource = sourceFilter === 'Todos los Orígenes' || sourceLabel === sourceFilter;

    return matchStatus && matchSource;
  });

  return (
    <div className="pt-6 px-4 md:pt-8 md:px-8 pb-24 md:pb-12 min-h-screen">
      {/* Header & Statistics (Strategic Asymmetry) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8 mb-8 md:mb-10">
        <div className="max-w-2xl">
          <nav className="flex items-center gap-2 text-[10px] text-outline uppercase tracking-widest mb-3">
            <span>Ecosistema</span>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="text-primary-fixed-dim">Gestión de Contactos</span>
          </nav>
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-white mb-2">Base Viva de Contactos</h2>
          <p className="text-on-surface-variant max-w-lg leading-relaxed">Gestione la inteligencia relacional de su firma. Filtrado avanzado para detección de oportunidades y seguimiento estratégico.</p>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div className="bg-surface-container-low p-4 md:p-5 rounded-xl border border-outline-variant/10 flex-1 md:min-w-[160px]">
            <p className="text-[10px] uppercase tracking-wider text-outline mb-1">Total Contactos</p>
            <p className="text-2xl font-bold font-headline">{contacts.length}</p>
            <div className="mt-2 flex items-center gap-1 text-secondary text-[11px]">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>+12% este mes</span>
            </div>
          </div>
          <div className="bg-surface-container-low p-4 md:p-5 rounded-xl border border-outline-variant/10 flex-1 md:min-w-[160px]">
            <p className="text-[10px] uppercase tracking-wider text-outline mb-1">Tasa Conversión</p>
            <p className="text-2xl font-bold font-headline">24.8%</p>
            <div className="mt-2 flex items-center gap-1 text-primary text-[11px]">
              <span className="material-symbols-outlined text-[14px]">target</span>
              <span>Objetivo Q3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar (Glassmorphism inspired) */}
      <div className="bg-surface-container p-4 rounded-xl mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border border-outline-variant/5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-container-high px-3 py-2 rounded-lg border border-outline-variant/10 flex-1">
            <span className="text-xs text-outline whitespace-nowrap">Estado:</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 pr-6 text-on-surface-variant outline-none w-full"
            >
              <option>Todos los Estados</option>
              <option>Nuevo</option>
              <option>Descubrimiento</option>
              <option>Propuesta</option>
              <option>Negociación</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-surface-container-high px-3 py-2 rounded-lg border border-outline-variant/10 flex-1">
            <span className="text-xs text-outline whitespace-nowrap">Origen:</span>
            <select 
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 pr-6 text-on-surface-variant outline-none w-full"
            >
              <option>Todos los Orígenes</option>
              <option>LinkedIn</option>
              <option>WhatsApp</option>
              <option>Email</option>
              <option>Directo</option>
            </select>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 justify-end">
          <button className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-outline hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            <span className="hidden sm:inline">Filtros Avanzados</span>
          </button>
          <div className="w-px h-6 bg-outline-variant/20 mx-1"></div>
          <button className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-outline hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button 
            onClick={onOpenNewContact}
            className="flex items-center justify-center gap-2 w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 text-xs font-bold bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 ml-1"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="hidden sm:inline">Nuevo Contacto</span>
          </button>
        </div>
      </div>

      {/* Main Contacts Table */}
      <div className="bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/10 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high/50 border-b border-outline-variant/10">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-outline font-bold">Contacto</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-outline font-bold">Empresa</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-outline font-bold">Origen</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-outline font-bold">Ejecutivo</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-outline font-bold">Información</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-outline font-bold">Estado</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-outline font-bold">Próxima Acción</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-outline font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {filteredContacts.map((contact) => (
                <tr 
                  key={contact.id}
                  className="hover:bg-surface-container-highest/30 transition-colors group cursor-pointer"
                  onClick={() => onSelectContact && onSelectContact(contact)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-bold border border-outline-variant/20 shadow-inner">
                        {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white leading-tight">{contact.firstName} {contact.lastName}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">{contact.jobTitle || 'Sin cargo'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-surface-container-highest flex items-center justify-center text-outline">
                        <span className="material-symbols-outlined text-[14px]">domain</span>
                      </div>
                      <span className="text-sm text-on-surface-variant font-medium">{contact.company || 'Sin empresa'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-primary">
                        {contact.source === 'linkedin' ? 'link' : contact.source === 'whatsapp' ? 'chat' : contact.source === 'email' ? 'mail' : 'language'}
                      </span>
                      <span className="text-xs text-on-surface-variant capitalize">
                        {contact.source || 'Directo'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-outline border border-outline-variant/20">
                        {contact.assignedTo ? contact.assignedTo.substring(0, 2).toUpperCase() : 'SA'}
                      </div>
                      <span className="text-xs text-on-surface-variant">
                        {contact.assignedTo || 'Sin asignar'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <span className="material-symbols-outlined text-[14px] text-outline">mail</span>
                        <span className="truncate max-w-[150px]" title={contact.email}>{contact.email || 'Sin email'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <span className="material-symbols-outlined text-[14px] text-outline">call</span>
                        <span>{contact.phone ? `${contact.countryCode} ${contact.phone}` : 'Sin teléfono'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getContactState(contact).color}`}>
                      {getContactState(contact).label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const nextAction = getNextAction(contact);
                      if (!nextAction) {
                        return (
                          <span className="text-xs text-outline italic flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            Al día
                          </span>
                        );
                      }
                      
                      const isOverdue = nextAction.timestamp < new Date().getTime() && new Date(nextAction.timestamp).toDateString() !== new Date().toDateString();
                      const isToday = new Date(nextAction.timestamp).toDateString() === new Date().toDateString();
                      
                      let colorClass = "text-on-surface-variant";
                      let iconColor = "text-primary";
                      
                      if (isOverdue) {
                        colorClass = "text-error font-medium";
                        iconColor = "text-error";
                      } else if (isToday) {
                        colorClass = "text-secondary font-medium";
                        iconColor = "text-secondary";
                      }

                      return (
                        <div className="flex flex-col gap-0.5">
                          <div className={`flex items-center gap-1.5 text-xs ${colorClass}`}>
                            <span className={`material-symbols-outlined text-[14px] ${iconColor}`}>
                              {nextAction.type === 'task' ? 'task_alt' : 'alarm'}
                            </span>
                            <span className="truncate max-w-[150px]" title={nextAction.title}>{nextAction.title}</span>
                          </div>
                          <span className="text-[10px] text-outline ml-5">{nextAction.date}</span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {contact.email && (
                        <a 
                          href={`mailto:${contact.email}`} 
                          onClick={(e) => e.stopPropagation()} 
                          className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-outline hover:text-primary hover:bg-primary/10 transition-colors" 
                          title="Enviar email"
                        >
                          <span className="material-symbols-outlined text-[16px]">mail</span>
                        </a>
                      )}
                      {contact.phone && (
                        <a 
                          href={`https://wa.me/${contact.countryCode?.replace('+', '')}${contact.phone?.replace(/\s/g, '')}`} 
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()} 
                          className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-outline hover:text-secondary hover:bg-secondary/10 transition-colors" 
                          title="Enviar WhatsApp"
                        >
                          <span className="material-symbols-outlined text-[16px]">chat</span>
                        </a>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); onSelectContact && onSelectContact(contact); }} 
                        className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-outline hover:text-primary hover:bg-primary/10 transition-colors" 
                        title="Ver detalles"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 bg-surface-container-high/30 border-t border-outline-variant/10 flex items-center justify-between">
          <p className="text-xs text-outline">Mostrando <span className="text-white font-bold">{filteredContacts.length > 0 ? 1 : 0}-{filteredContacts.length}</span> de <span className="text-white font-bold">{filteredContacts.length}</span> contactos</p>
          <div className="flex gap-1">
            <button className="p-2 rounded-lg hover:bg-surface-container-highest transition-colors text-outline">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded-lg bg-intelligence text-on-primary-container font-bold text-xs">1</button>
            <button className="p-2 rounded-lg hover:bg-surface-container-highest transition-colors text-outline">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
