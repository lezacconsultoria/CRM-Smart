import React from 'react';
import { ContactData } from '../types';

interface ContactsProps {
  onViewChange?: (view: 'contact-details') => void;
  onOpenNewContact?: () => void;
  onOpenImportModal?: () => void;
  onSelectContact?: (contact: ContactData) => void;
  onEditContact?: (contact: ContactData) => void;
  onDeleteContact?: (id: string) => void;
  onDeleteMany?: (ids: string[]) => void;
  contacts?: ContactData[];
  user?: import('../types').User | null;
}

export default function Contacts({ onViewChange, onOpenNewContact, onOpenImportModal, onSelectContact, onEditContact, onDeleteContact, onDeleteMany, contacts = [], user }: ContactsProps) {
  const [statusFilter, setStatusFilter] = React.useState('Todos los Estados');
  const [sourceFilter, setSourceFilter] = React.useState('Todos los Orígenes');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [dbSourceFilter, setDbSourceFilter] = React.useState('Todas las Bases');
  const [activityFilter, setActivityFilter] = React.useState('Todas las Actividades');
  const [isValidEmailOnly, setIsValidEmailOnly] = React.useState(false);
  const [assignedUserFilter, setAssignedUserFilter] = React.useState('Todos los Usuarios');
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 50;

  // Clean up selection when contacts change (e.g., after deletion)
  React.useEffect(() => {
    const validIds = new Set(contacts.map(c => c.id).filter(Boolean));
    setSelectedIds(prev => {
      const newSet = new Set<string>();
      prev.forEach(id => {
        if (validIds.has(id)) newSet.add(id);
      });
      return newSet.size === prev.size ? prev : newSet;
    });
  }, [contacts]);
  
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
    // Check closed status first
    if (contact.status === 'won') return { label: 'Ganado', color: 'bg-green-500/10 text-green-500 border-green-500/30' };
    if (contact.status === 'lost') return { label: 'Perdido', color: 'bg-error/10 text-error border-error/30' };

    let activeStage = 0;
    contact.stages?.forEach(stage => {
      if ((stage.notes && stage.notes.length > 0) || (stage.id === 3 && contact.price && contact.price > 0)) {
        activeStage = Math.max(activeStage, stage.id);
      }
    });
    
    if (activeStage === 4) return { label: 'Cierre', color: 'bg-violet-500/10 text-violet-400 border-violet-500/30' };
    if (activeStage === 3) return { label: 'Negociación', color: 'bg-tertiary-container/20 text-tertiary-container border-tertiary-container/30' };
    if (activeStage === 2) return { label: 'Propuesta', color: 'bg-secondary-container/20 text-secondary-container border-secondary-container/30' };
    if (activeStage === 1) return { label: 'Descubrimiento', color: 'bg-primary-container/20 text-primary border-primary-container/30' };
    return { label: 'Nuevo', color: 'bg-surface-container-highest text-outline border-outline-variant/30' };
  };

  // Get unique values for filters
  const availableBases = React.useMemo(() => {
    const bases = new Set<string>();
    contacts.forEach(c => {
      if (c.dbSource) bases.add(c.dbSource);
    });
    return Array.from(bases).sort();
  }, [contacts]);

  const availableActivities = React.useMemo(() => {
    const activities = new Set<string>();
    contacts.forEach(c => {
      if (c.activity) activities.add(c.activity);
    });
    return Array.from(activities).sort();
  }, [contacts]);

  const availableAssignedUsers = React.useMemo(() => {
    const users = new Set<string>();
    contacts.forEach(c => {
      if (c.assignedTo) users.add(c.assignedTo);
    });
    return Array.from(users).sort();
  }, [contacts]);

  const filteredContacts = contacts.filter(contact => {
    // 1. Status Filter
    const state = getContactState(contact).label;
    const matchStatus = statusFilter === 'Todos los Estados' || state === statusFilter;
    
    // 2. Source Filter
    let sourceLabel = 'Directo';
    if (contact.source === 'linkedin') sourceLabel = 'LinkedIn';
    else if (contact.source === 'whatsapp') sourceLabel = 'WhatsApp';
    else if (contact.source === 'email') sourceLabel = 'Email';
    const matchSource = sourceFilter === 'Todos los Orígenes' || sourceLabel === sourceFilter;

    // 3. Search Query (Name, Company, Email)
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = !searchQuery || 
      `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchLower) ||
      contact.company.toLowerCase().includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower) ||
      (contact.jobTitle && contact.jobTitle.toLowerCase().includes(searchLower));

    // 4. Base Filter (dbSource)
    const matchBase = dbSourceFilter === 'Todas las Bases' || contact.dbSource === dbSourceFilter;

    // 5. Activity Filter
    const matchActivity = activityFilter === 'Todas las Actividades' || contact.activity === activityFilter;

    // 6. Valid Email Filter
    const matchEmailValid = !isValidEmailOnly || contact.isEmailValid;

    // 7. Assigned User Filter
    const matchUser = assignedUserFilter === 'Todos los Usuarios' || contact.assignedTo === assignedUserFilter;

    return matchStatus && matchSource && matchSearch && matchBase && matchActivity && matchEmailValid && matchUser;
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredContacts.length && filteredContacts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map(c => c.id!).filter(Boolean)));
    }
  };

  // Reset to first page when any individual filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, sourceFilter, searchQuery, dbSourceFilter, activityFilter, isValidEmailOnly, assignedUserFilter]);

  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

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
      <div className="space-y-4 mb-6">
        <div className="bg-surface-container p-4 rounded-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 border border-outline-variant/5">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
              <input 
                type="text"
                placeholder="Buscar por nombre, empresa o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-high border border-outline-variant/10 rounded-lg pl-10 pr-4 py-2 text-xs font-medium text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-outline/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-surface-container-high px-3 py-2 rounded-lg border border-outline-variant/10">
                <span className="text-[10px] text-outline whitespace-nowrap font-bold uppercase tracking-tight">Estado:</span>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 pr-8 text-on-surface-variant outline-none cursor-pointer appearance-none min-w-[120px]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23958e9f' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right center',
                    backgroundSize: '14px'
                  }}
                >
                  <option className="bg-[#2a2a2b] text-white">Todos los Estados</option>
                  <option className="bg-[#2a2a2b] text-white">Nuevo</option>
                  <option className="bg-[#2a2a2b] text-white">Descubrimiento</option>
                  <option className="bg-[#2a2a2b] text-white">Propuesta</option>
                  <option className="bg-[#2a2a2b] text-white">Negociación</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-surface-container-high px-3 py-2 rounded-lg border border-outline-variant/10">
                <span className="text-[10px] text-outline whitespace-nowrap font-bold uppercase tracking-tight">Base:</span>
                <select 
                  value={dbSourceFilter}
                  onChange={(e) => setDbSourceFilter(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 pr-8 text-on-surface-variant outline-none cursor-pointer appearance-none min-w-[120px]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23958e9f' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right center',
                    backgroundSize: '14px'
                  }}
                >
                  <option className="bg-[#2a2a2b] text-white">Todas las Bases</option>
                  {availableBases.map(base => (
                    <option key={base} value={base} className="bg-[#2a2a2b] text-white">{base}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 justify-end lg:ml-4">
            <button 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                showAdvancedFilters ? 'bg-primary/10 text-primary border border-primary/20' : 'text-outline hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              <span className="hidden sm:inline">Filtros Avanzados</span>
            </button>
            <div className="hidden md:block w-px h-6 bg-outline-variant/20 mx-1"></div>
            <button className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-outline hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span className="hidden sm:inline">Exportar</span>
            </button>
            <button 
              onClick={onOpenImportModal}
              className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold bg-surface-container-highest text-white rounded-lg hover:bg-surface-container-high transition-colors border border-outline-variant/20 ml-1"
            >
              <span className="material-symbols-outlined text-[18px]">upload</span>
              <span className="hidden sm:inline">Importar</span>
            </button>
            <button 
              onClick={onOpenNewContact}
              className="flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/10 active:scale-95 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span className="hidden sm:inline">Nuevo Contacto</span>
            </button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/10 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Actividad / Rubro</label>
                <select 
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  className="w-full bg-surface-container-high border border-outline-variant/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:border-primary/30"
                >
                  <option>Todas las Actividades</option>
                  {availableActivities.map(activity => (
                    <option key={activity} value={activity}>{activity}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Origen del Lead</label>
                <select 
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="w-full bg-surface-container-high border border-outline-variant/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:border-primary/30"
                >
                  <option>Todos los Orígenes</option>
                  <option>LinkedIn</option>
                  <option>WhatsApp</option>
                  <option>Email</option>
                  <option>Directo</option>
                </select>
              </div>

              {user?.role === 'admin' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Usuario Asignado</label>
                  <select 
                    value={assignedUserFilter}
                    onChange={(e) => setAssignedUserFilter(e.target.value)}
                    className="w-full bg-surface-container-high border border-outline-variant/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:border-primary/30"
                  >
                    <option>Todos los Usuarios</option>
                    <option value="">Sin Asignar</option>
                    {availableAssignedUsers.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col justify-end pb-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      checked={isValidEmailOnly}
                      onChange={(e) => setIsValidEmailOnly(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                      isValidEmailOnly ? 'bg-primary border-primary' : 'border-outline-variant group-hover:border-outline'
                    }`}>
                      {isValidEmailOnly && <span className="material-symbols-outlined text-[14px] text-on-primary font-bold">check</span>}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-on-surface-variant group-hover:text-white transition-colors">Solo Emails Verificados</span>
                </label>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-outline-variant/5 flex justify-between items-center">
              <button 
                onClick={() => {
                  setStatusFilter('Todos los Estados');
                  setSourceFilter('Todos los Orígenes');
                  setSearchQuery('');
                  setDbSourceFilter('Todas las Bases');
                  setActivityFilter('Todas las Actividades');
                  setIsValidEmailOnly(false);
                  setAssignedUserFilter('Todos los Usuarios');
                }}
                className="text-xs font-bold text-outline hover:text-primary transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                Limpiar todos los filtros
              </button>
              <p className="text-[10px] text-outline/50 italic">Mostrando {filteredContacts.length} de {contacts.length} contactos</p>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Floating Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[50] animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-surface-container-high border border-primary/20 shadow-2xl shadow-black/50 px-6 py-4 rounded-2xl flex items-center gap-6 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                {selectedIds.size}
              </div>
              <span className="text-sm font-medium text-white">Contactos seleccionados</span>
            </div>
            
            <div className="w-px h-6 bg-outline-variant/20"></div>
            
            <div className="flex items-center gap-3">
              {(!user || user.role === 'admin') && (
                <button 
                  onClick={() => onDeleteMany && onDeleteMany(Array.from(selectedIds))}
                  className="flex items-center gap-2 px-4 py-2 bg-error/10 text-error hover:bg-error/20 rounded-xl transition-all font-bold text-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  Eliminar Seleccionados
                </button>
              )}
              
              <button 
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-outline hover:text-white transition-colors px-2"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Contacts Table */}
      <div className="bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/10 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high/50 border-b border-outline-variant/10">
                <th className="px-4 py-3 w-10 text-center">
                  <div 
                    onClick={(e) => { e.stopPropagation(); toggleSelectAll(); }}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                      selectedIds.size > 0 && selectedIds.size === filteredContacts.length 
                      ? 'bg-primary border-primary' 
                      : 'border-outline-variant hover:border-outline'
                    }`}
                  >
                    {selectedIds.size > 0 && (
                      <span className="material-symbols-outlined text-[14px] text-on-primary font-bold">
                        {selectedIds.size === filteredContacts.length ? 'check' : 'remove'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-outline font-bold">Contacto</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-outline font-bold">Empresa / Tipo</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-outline font-bold">Vendedor</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-outline font-bold">Origen</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-outline font-bold">Base</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-outline font-bold">Ubicación</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-outline font-bold">Información</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-outline font-bold">Estado</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-outline font-bold">Próxima Acción</th>
                <th className="px-6 py-3 text-[10px] uppercase tracking-widest text-outline font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {paginatedContacts.map((contact) => (
                <tr 
                  key={contact.id}
                  className={`hover:bg-surface-container-highest/30 transition-colors group cursor-pointer ${selectedIds.has(contact.id!) ? 'bg-primary/5' : ''}`}
                  onClick={() => onSelectContact && onSelectContact(contact)}
                >
                  <td className="px-4 py-3 text-center">
                    <div 
                      onClick={(e) => toggleSelect(contact.id!, e)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                        selectedIds.has(contact.id!) 
                        ? 'bg-primary border-primary' 
                        : 'border-outline-variant group-hover:border-outline'
                      }`}
                    >
                      {selectedIds.has(contact.id!) && (
                        <span className="material-symbols-outlined text-[14px] text-on-primary font-bold">check</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-white leading-tight truncate">{contact.firstName} {contact.lastName}</p>
                          {contact.profileLink && (
                            <a 
                              href={contact.profileLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              onClick={(e) => e.stopPropagation()}
                              className="text-primary hover:scale-110 transition-transform"
                            >
                              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5 truncate">{contact.jobTitle || 'Sin cargo'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-on-surface-variant font-medium truncate max-w-[120px]">{contact.company || 'Sin empresa'}</span>
                      </div>
                      {contact.companyType && (
                        <span className="w-fit px-1.5 py-0.5 bg-outline-variant/10 text-outline text-[9px] font-bold uppercase rounded border border-outline-variant/20 italic">
                          {contact.companyType}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 min-w-[100px]">
                      <span className="material-symbols-outlined text-[14px] text-primary-fixed-dim">person</span>
                      <span className="text-xs text-on-surface-variant truncate max-w-[120px]" title={contact.assignedTo || 'Sin asignar'}>
                        {contact.assignedTo || '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-primary">
                        {contact.source === 'linkedin' ? 'link' : contact.source === 'whatsapp' ? 'chat' : contact.source === 'email' ? 'mail' : 'language'}
                      </span>
                      <span className="text-xs text-on-surface-variant capitalize">
                        {contact.source || 'Directo'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 min-w-[80px]">
                      {contact.dbSource ? (
                        <>
                          <span className="material-symbols-outlined text-[14px] text-secondary">database</span>
                          <span className="text-xs text-on-surface-variant truncate max-w-[110px]" title={contact.dbSource}>
                            {contact.dbSource}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-outline/30">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[14px] text-outline">location_on</span>
                      <span className="truncate max-w-[120px]">
                        {contact.province}{contact.province && contact.country ? ', ' : ''}{contact.country || (contact.province ? '' : 'Global')}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <span className="material-symbols-outlined text-[14px] text-outline">mail</span>
                        <span className="truncate max-w-[140px]" title={contact.email}>{contact.email || 'Sin email'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <span className="material-symbols-outlined text-[14px] text-outline">call</span>
                        <span>{contact.phone ? `${contact.countryCode} ${contact.phone}` : 'Sin teléfono'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getContactState(contact).color}`}>
                      {getContactState(contact).label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onSelectContact && onSelectContact(contact); }} 
                        className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-outline hover:text-primary hover:bg-primary/10 transition-colors" 
                        title="Ver detalles"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEditContact && onEditContact(contact); }} 
                        className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-outline hover:text-secondary hover:bg-secondary/10 transition-colors" 
                        title="Modificar"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      {(!user || user.role === 'admin') && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); contact.id && onDeleteContact && onDeleteContact(contact.id); }} 
                          className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-outline hover:text-error hover:bg-error/10 transition-colors" 
                          title="Eliminar"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-4 py-3 bg-surface-container-high/30 border-t border-outline-variant/10 flex items-center justify-between">
          <p className="text-xs text-outline">
            Mostrando <span className="text-white font-bold">{filteredContacts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredContacts.length)}</span> de <span className="text-white font-bold">{filteredContacts.length}</span> contactos
          </p>
          <div className="flex gap-1">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-2 rounded-lg hover:bg-surface-container-highest transition-colors text-outline disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            
            {/* Page number buttons - Show limited set if many pages */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = currentPage <= 3 ? i + 1 : 
                           currentPage >= totalPages - 2 ? totalPages - 4 + i :
                           currentPage - 2 + i;
              
              // Validation for small totalPages
              if (pageNum < 1 || pageNum > totalPages) return null;

              return (
                <button 
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${
                    currentPage === pageNum 
                    ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                    : 'bg-surface-container-highest text-outline hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-2 rounded-lg hover:bg-surface-container-highest transition-colors text-outline disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
