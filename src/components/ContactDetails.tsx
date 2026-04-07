import React, { useState, useEffect } from 'react';
import { ContactData, Note, Task, StageData, User } from '../types';

interface ContactDetailsProps {
  contact: ContactData | null;
  onEdit: () => void;
  onUpdateContact: (contact: ContactData) => void;
  user?: User | null;
}

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

export default function ContactDetails({ contact, onEdit, onUpdateContact, user }: ContactDetailsProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [currentDate, setCurrentDate] = useState(new Date());
  const defaultStages = [
    { id: 1, name: 'Descubrimiento', notes: [] },
    { id: 2, name: 'Propuesta', notes: [] },
    { id: 3, name: 'Negociación', notes: [] },
    { id: 4, name: 'Cierre', notes: [] },
    { id: 5, name: 'Post-Venta', notes: [] },
  ];

  const [stages, setStages] = useState<StageData[]>(() => {
    let initial = (contact?.stages && contact.stages.length > 0) ? contact.stages : defaultStages;
    if (initial.length < 5) initial = [...initial, ...defaultStages.slice(initial.length)];
    return initial;
  });
  const [noteInput, setNoteInput] = useState('');
  const [selectedReminder, setSelectedReminder] = useState<number | null>(null);
  const [selectedReminderDate, setSelectedReminderDate] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const canViewItem = (createdBy?: string) => {
    if (!user) return true;
    if (user.role === 'admin') return true;
    return !createdBy || createdBy === user.name;
  };

  const NOTE_TAGS = ['Llamada', 'Reunión', 'Email', 'Seguimiento', 'Importante'];

  const [tasks, setTasks] = useState<Task[]>(contact?.tasks || []);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');

  useEffect(() => {
    if (contact) {
      let initial = (contact.stages && contact.stages.length > 0) ? contact.stages : defaultStages;
      if (initial.length < 5) initial = [...initial, ...defaultStages.slice(initial.length)];
      setStages(initial);
      setTasks(contact.tasks || []);
    }
  }, [contact]);

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    setTasks(updatedTasks);
    if (contact) {
      onUpdateContact({ ...contact, tasks: updatedTasks });
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    const targetDate = newTaskDate ? new Date(newTaskDate) : new Date();
    if (newTaskDate) {
      targetDate.setMinutes(targetDate.getMinutes() + targetDate.getTimezoneOffset());
    }
    
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      dueDate: targetDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      dueDateTimestamp: targetDate.getTime(),
      completed: false,
      createdBy: user?.name,
    };
    
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    if (contact) {
      onUpdateContact({ ...contact, tasks: updatedTasks });
    }
    setNewTaskTitle('');
    setNewTaskDate('');
    setIsAddingTask(false);
  };

  const handleAddNote = () => {
    if (!noteInput.trim()) return;

    let reminderDateStr = undefined;
    let reminderTimestamp = undefined;
    let reminderDays = undefined;

    if (selectedReminder) {
      const targetDate = new Date();
      let addedDays = 0;
      while (addedDays < selectedReminder) {
        targetDate.setDate(targetDate.getDate() + 1);
        // 0 is Sunday, 6 is Saturday
        if (targetDate.getDay() !== 0 && targetDate.getDay() !== 6) {
          addedDays++;
        }
      }
      reminderDateStr = targetDate.toLocaleDateString('es-ES', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
      reminderTimestamp = targetDate.getTime();
      reminderDays = selectedReminder;
    } else if (selectedReminderDate) {
      const targetDate = new Date(selectedReminderDate);
      targetDate.setMinutes(targetDate.getMinutes() + targetDate.getTimezoneOffset());
      reminderDateStr = targetDate.toLocaleDateString('es-ES', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
      reminderTimestamp = targetDate.getTime();
      
      const diffTime = Math.abs(targetDate.getTime() - new Date().getTime());
      reminderDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const newNote: Note = {
      id: Date.now().toString(),
      text: noteInput,
      date: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      tag: selectedTag || undefined,
      reminderDays: reminderDays,
      reminderDate: reminderDateStr,
      reminderTimestamp,
      createdBy: user?.name,
    };

    const updatedStages = stages.map(stage => {
      if (stage.id === currentStage) {
        return { ...stage, notes: [newNote, ...stage.notes] };
      }
      return stage;
    });

    setStages(updatedStages);
    if (contact) {
      onUpdateContact({ ...contact, stages: updatedStages });
    }
    setNoteInput('');
    setSelectedReminder(null);
    setSelectedReminderDate('');
    setSelectedTag(null);
  };

  const handleNextStage = () => {
    if (currentStage < 5) {
      setCurrentStage(prev => prev + 1);
    }
  };

  if (!contact) {
    return (
      <div className="pt-8 px-8 pb-12 min-h-screen flex items-center justify-center">
        <p className="text-outline">Selecciona un contacto para ver sus detalles.</p>
      </div>
    );
  }

  return (
    <div className="pt-6 px-4 md:pt-8 md:px-8 pb-24 md:pb-12 min-h-screen">
      {/* Executive Header Block */}
      <section className="mb-8 md:mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 md:gap-8">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center w-full md:w-auto">
            <div className="relative shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl shadow-2xl bg-surface-container-highest flex items-center justify-center text-primary border border-outline-variant/20">
                <span className="material-symbols-outlined text-4xl md:text-5xl">person</span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center border-4 border-surface shadow-lg" title="Salud del Lead: Alta">
                <span className="material-symbols-outlined text-[16px] text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              </div>
            </div>
            <div className="w-full min-w-0">
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-headline truncate">{contact.firstName} {contact.lastName}</h2>
                <span className="px-3 py-0.5 bg-secondary-container/10 text-secondary-container text-[10px] font-bold uppercase tracking-widest rounded-full border border-secondary-container/20 whitespace-nowrap">
                  {contact.id === '1' ? 'Platinum Client' : 'Lead'}
                </span>
                {contact.isEmailValid && (
                  <span className="px-3 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-widest rounded-full border border-green-500/20 whitespace-nowrap flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">verified</span>
                    Email Válido
                  </span>
                )}
              </div>
              <p className="text-on-surface-variant font-medium mb-3 text-sm md:text-base truncate">
                {contact.jobTitle || 'Sin cargo'} @ {contact.company}
                {contact.companyType && (
                  <span className="ml-2 px-2 py-0.5 bg-outline-variant/10 text-outline text-[9px] font-bold uppercase rounded border border-outline-variant/20 italic">
                    {contact.companyType}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-4 md:gap-6">
                <div className="flex items-center gap-2 text-outline">
                  <span className="material-symbols-outlined text-sm shrink-0">mail</span>
                  <span className="text-xs truncate">{contact.email}</span>
                </div>
                {contact.phone && (
                  <div className="flex items-center gap-2 text-outline">
                    <span className="material-symbols-outlined text-sm shrink-0">phone</span>
                    <span className="text-xs whitespace-nowrap">{contact.countryCode} {contact.phone}</span>
                  </div>
                )}
                {(contact.province || contact.country) && (
                  <div className="flex items-center gap-2 text-outline">
                    <span className="material-symbols-outlined text-sm shrink-0">location_on</span>
                    <span className="text-xs truncate">
                      {contact.province}{contact.province && contact.country ? ', ' : ''}{contact.country}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-outline">
                    <span className="material-symbols-outlined text-sm shrink-0">
                      {contact.source === 'linkedin' ? 'link' : contact.source === 'whatsapp' ? 'chat' : 'mail'}
                    </span>
                    <span className="text-xs capitalize">{contact.source || 'Directo'}</span>
                  </div>
                  {contact.profileLink && (
                    <a 
                      href={contact.profileLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-md border border-primary/20 transition-all group"
                      title="Ver perfil o red social"
                    >
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      <span className="text-[10px] font-bold group-hover:underline">Ver Perfil</span>
                    </a>
                  )}
                </div>
                {contact.activity && (
                  <div className="flex items-center gap-2 text-outline bg-surface-container-high/50 px-2.5 py-1 rounded-md border border-outline-variant/10">
                    <span className="material-symbols-outlined text-[14px] text-primary">work</span>
                    <span className="text-[11px] font-medium">{contact.activity}</span>
                  </div>
                )}
                {contact.dbSource && (
                  <div className="flex items-center gap-2 text-outline bg-surface-container-high/50 px-2.5 py-1 rounded-md border border-outline-variant/10">
                    <span className="material-symbols-outlined text-[14px] text-secondary">database</span>
                    <span className="text-[11px] font-medium">{contact.dbSource}</span>
                  </div>
                )}
                {contact.externalId && (
                  <div className="flex items-center gap-2 text-outline/50 px-2.5 py-1">
                    <span className="text-[10px] font-mono">ID: {contact.externalId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-stretch gap-3 w-full md:w-auto mt-2 md:mt-0">
            <div className="bg-surface-container-low px-4 md:px-5 py-2 rounded-xl border border-outline-variant/10 flex flex-col justify-center flex-1 md:flex-none">
              <div className="text-center">
                <p className="text-[10px] text-outline uppercase font-bold tracking-tighter">Última Interacción</p>
                <p className="text-base md:text-lg font-extrabold text-white leading-tight">Ayer</p>
              </div>
            </div>
            <button 
              onClick={onEdit}
              className="px-4 md:px-5 py-2 bg-surface-container-high text-on-surface-variant rounded-xl border border-outline-variant/10 text-sm font-semibold hover:bg-surface-bright transition-all flex items-center justify-center flex-1 md:flex-none"
            >
              Editar Ficha
            </button>
          </div>
        </div>
      </section>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Timeline & Traceability (360 view) */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Stages Tracker */}
          <div className="bg-surface-container p-4 md:p-6 rounded-xl border border-outline-variant/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 font-headline">
                <span className="material-symbols-outlined text-primary text-xl">route</span>
                Seguimiento por Etapas
              </h3>
              {contact.status === 'won' && (
                <span className="w-full sm:w-auto text-center px-4 py-2 bg-green-500/10 text-green-500 rounded-lg text-xs font-bold border border-green-500/20 flex items-center gap-2 justify-center">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Contacto Ganado
                </span>
              )}
              {contact.status === 'lost' && (
                <span className="w-full sm:w-auto text-center px-4 py-2 bg-error/10 text-error rounded-lg text-xs font-bold border border-error/20 flex items-center gap-2 justify-center">
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  Contacto Perdido
                </span>
              )}
              {(!contact.status || contact.status === 'active') && (
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  {currentStage < 5 ? (
                    <button 
                      onClick={handleNextStage}
                      className="w-full sm:w-auto px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-bold transition-colors border border-primary/20"
                    >
                      Cerrar Etapa {currentStage} y Avanzar
                    </button>
                  ) : (
                    <span className="w-full sm:w-auto text-center px-4 py-2 bg-secondary/10 text-secondary rounded-lg text-xs font-bold border border-secondary/20">
                      Etapa Final Activa
                    </span>
                  )}
                  
                  <button 
                    onClick={() => {
                        if (contact) onUpdateContact({ ...contact, status: 'won' });
                    }}
                    className="w-full sm:w-auto px-3 py-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg text-xs font-bold transition-colors border border-green-500/20 flex items-center gap-1 justify-center"
                    title="Marcar como Cerrado/Ganado"
                  >
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    Ganado
                  </button>
                  <button 
                    onClick={() => {
                        if (contact) onUpdateContact({ ...contact, status: 'lost' });
                    }}
                    className="w-full sm:w-auto px-3 py-2 bg-error/10 text-error hover:bg-error/20 rounded-lg text-xs font-bold transition-colors border border-error/20 flex items-center gap-1 justify-center"
                    title="Marcar como Perdido"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                    Perdido
                  </button>
                </div>
              )}
            </div>

            {/* Stages Tabs/Headers */}
            <div className="flex flex-col sm:flex-row gap-2 mb-6">
              {stages.map(stage => (
                <div 
                  key={stage.id}
                  className={`flex-1 p-3 rounded-lg border ${
                    currentStage === stage.id 
                      ? 'bg-primary/10 border-primary/30 text-primary' 
                      : currentStage > stage.id
                        ? 'bg-surface-container-high border-outline-variant/20 text-outline'
                        : 'bg-surface-container-lowest border-outline-variant/5 text-outline/50'
                  } transition-all`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Etapa {stage.id}</span>
                    {currentStage > stage.id && <span className="material-symbols-outlined text-[14px] text-secondary">check_circle</span>}
                    {currentStage === stage.id && <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>}
                  </div>
                  <p className="text-sm font-medium">{stage.name}</p>
                </div>
              ))}
            </div>

            {/* Input Area (Only for active stage) */}
            <div className="mb-8 bg-surface-container-lowest border border-outline-variant/10 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-primary/30 transition-all">
              <textarea 
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddNote();
                  }
                }}
                className="w-full bg-transparent border-none p-4 text-sm text-on-surface-variant placeholder:text-outline/50 resize-none outline-none min-h-[100px]" 
                placeholder={`Escribe una observación para la Etapa ${currentStage} y presiona Enter...`}
              ></textarea>
              
              <div className="px-4 py-2 bg-surface-container-low border-t border-outline-variant/10 flex items-center gap-2 overflow-x-auto">
                <span className="text-[11px] font-bold text-outline uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">label</span>
                  Etiqueta:
                </span>
                <div className="flex gap-1.5">
                  {NOTE_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors border ${
                        selectedTag === tag 
                          ? 'bg-primary/20 text-primary border-primary/30' 
                          : 'bg-transparent text-outline border-outline-variant/30 hover:border-outline/50 hover:text-white'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="px-4 py-3 bg-surface-container-low border-t border-outline-variant/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                  <span className="text-[11px] font-bold text-outline uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <span className="material-symbols-outlined text-[14px]">alarm</span>
                    Recordatorio:
                  </span>
                  <div className="flex flex-wrap gap-1.5 items-center w-full sm:w-auto">
                    {[3, 5, 7, 10, 30].map(days => (
                      <button
                        key={days}
                        onClick={() => {
                          setSelectedReminder(selectedReminder === days ? null : days);
                          setSelectedReminderDate('');
                        }}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors ${
                          selectedReminder === days 
                            ? 'bg-primary text-on-primary' 
                            : 'bg-surface-container-highest text-outline hover:text-white'
                        }`}
                      >
                        {days}d
                      </button>
                    ))}
                    <div className={`relative flex items-center w-28 rounded-md focus-within:ring-1 focus-within:ring-primary transition-all ml-1 ${selectedReminderDate ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-outline'}`}>
                      <input
                        type="date"
                        value={selectedReminderDate}
                        onChange={(e) => {
                          setSelectedReminderDate(e.target.value);
                          setSelectedReminder(null);
                        }}
                        className="w-full bg-transparent px-2 py-1 text-[10px] font-bold focus:outline-none cursor-pointer relative z-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        style={{ colorScheme: 'dark' }}
                      />
                      <span className="material-symbols-outlined absolute right-2 text-[12px] z-0 pointer-events-none">calendar_month</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleAddNote}
                  className="w-full sm:w-8 h-10 sm:h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center hover:bg-primary/90 transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span className="sm:hidden ml-2 font-bold text-sm">Enviar Observación</span>
                </button>
              </div>
            </div>

            {/* Timeline for Current Stage */}
            <div className="space-y-6">
              <h4 className="text-sm font-bold text-white mb-4">
                Línea de tiempo - Etapa {currentStage}
              </h4>
              
              {stages.find(s => s.id === currentStage)?.notes.filter(n => canViewItem(n.createdBy)).length === 0 ? (
                <div className="text-center py-8 border border-dashed border-outline-variant/20 rounded-xl">
                  <p className="text-sm text-outline">No hay observaciones en esta etapa todavía.</p>
                </div>
              ) : (
                <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:via-outline-variant/20 before:to-transparent">
                  {stages.find(s => s.id === currentStage)?.notes.filter(n => canViewItem(n.createdBy)).map((note) => (
                    <div key={note.id} className="relative flex items-start gap-6 group animate-in fade-in slide-in-from-bottom-2">
                      <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-high border border-primary/40 text-primary shadow-xl">
                        <span className="material-symbols-outlined text-sm">edit_note</span>
                      </div>
                      <div className="flex-1 bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 group-hover:bg-surface-bright transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary uppercase tracking-widest">Observación</span>
                            {note.tag && (
                              <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-[9px] font-bold border border-outline-variant/20">
                                {note.tag}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-outline">{note.date}</span>
                        </div>
                        <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{note.text}</p>
                        {note.reminderDate && (
                          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary-container/10 border border-secondary-container/20 text-secondary-container text-[10px] font-bold">
                            <span className="material-symbols-outlined text-[12px]">notification_important</span>
                            Recordatorio: {note.reminderDate} ({note.reminderDays} días hábiles)
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Show previous stages history if any */}
            {currentStage > 1 && (
              <div className="mt-12 pt-8 border-t border-outline-variant/10">
                <h4 className="text-sm font-bold text-outline mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">history</span>
                  Historial de Etapas Anteriores
                </h4>
                <div className="space-y-8 opacity-70">
                  {stages.filter(s => s.id < currentStage).reverse().map(stage => (
                    <div key={stage.id} className="space-y-4">
                      <h5 className="text-xs font-bold text-white uppercase tracking-wider bg-surface-container-high inline-block px-3 py-1 rounded-lg">
                        Etapa {stage.id}: {stage.name}
                      </h5>
                      {stage.notes.filter(n => canViewItem(n.createdBy)).length === 0 ? (
                        <p className="text-xs text-outline italic ml-4">Sin observaciones visibles</p>
                      ) : (
                        <div className="relative space-y-4 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-px before:bg-outline-variant/20">
                          {stage.notes.filter(n => canViewItem(n.createdBy)).map(note => (
                            <div key={note.id} className="relative flex items-start gap-4 ml-1">
                              <div className="relative z-10 w-6 h-6 rounded-full bg-surface-container border border-outline-variant/30 flex items-center justify-center mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-outline"></div>
                              </div>
                              <div className="flex-1 bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/5">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-[10px] text-outline">{note.date}</p>
                                  {note.tag && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-[8px] font-bold border border-outline-variant/20">
                                      {note.tag}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-on-surface-variant whitespace-pre-wrap">{note.text}</p>
                                {note.reminderDate && (
                                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary-container/10 border border-secondary-container/20 text-secondary-container text-[9px] font-bold">
                                    <span className="material-symbols-outlined text-[10px]">notification_important</span>
                                    Recordatorio: {note.reminderDate}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* Right Column: Sidebar Intelligence */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Pending Tasks */}
          <div className="bg-surface-container-high rounded-2xl p-6 border border-outline-variant/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-lg">task_alt</span>
                Tareas Pendientes
              </h3>
              <button className="text-primary text-[11px] font-bold hover:underline">Ver todas</button>
            </div>
            <div className="space-y-4">
              {tasks.filter(t => canViewItem(t.createdBy)).map(task => (
                <div key={task.id} className={`flex items-start gap-3 p-3 rounded-lg bg-surface-container border border-outline-variant/5 transition-opacity ${task.completed ? 'opacity-50' : 'opacity-100'}`}>
                  <input 
                    className="mt-1 w-4 h-4 rounded border-outline-variant bg-transparent text-primary focus:ring-primary/20 cursor-pointer" 
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task.id)}
                  />
                  <div className={`flex-1 ${task.completed ? 'line-through text-outline' : ''}`}>
                    <p className={`text-xs font-semibold ${task.completed ? 'text-outline' : 'text-on-surface'}`}>{task.title}</p>
                    <p className={`text-[10px] flex items-center gap-1 mt-1 ${task.isOverdue && !task.completed ? 'text-error' : 'text-outline'}`}>
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      {task.dueDate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {isAddingTask ? (
              <form onSubmit={handleAddTask} className="mt-4 space-y-3">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Título de la tarea..."
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  autoFocus
                />
                <div className="relative flex items-center w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                  <input
                    type="date"
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                    className="w-full bg-transparent px-3 py-2 text-xs text-white focus:outline-none cursor-pointer relative z-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  />
                  <span className="material-symbols-outlined absolute right-3 text-outline text-[16px] z-0">calendar_month</span>
                </div>
                <div className="flex gap-2 justify-end">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsAddingTask(false);
                      setNewTaskTitle('');
                      setNewTaskDate('');
                    }}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-outline hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={!newTaskTitle.trim()}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            ) : (
              <button 
                onClick={() => setIsAddingTask(true)}
                className="w-full mt-4 py-2 bg-surface-container-lowest text-on-surface-variant text-[11px] font-bold rounded-lg border border-outline-variant/10 hover:bg-surface transition-colors"
              >
                + Nueva Tarea
              </button>
            )}
          </div>

          {/* Calendar Widget */}
          <div className="bg-surface-container-high rounded-2xl p-6 border border-outline-variant/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">calendar_month</span>
                Calendario de Actividades
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                  className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-bright text-outline"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <span className="text-xs font-bold text-white capitalize w-24 text-center">
                  {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                  className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-bright text-outline"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} className="text-[10px] font-bold text-outline text-center uppercase">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1 justify-items-center">
              {Array.from({ length: getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8"></div>
              ))}
              
              {Array.from({ length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => {
                const day = i + 1;
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const isToday = new Date().toDateString() === date.toDateString();
                
                const dayEvents: { title: string, type: string }[] = [];
                stages.forEach(stage => {
                  stage.notes.forEach(note => {
                    if (!canViewItem(note.createdBy)) return;
                    if (note.reminderTimestamp && new Date(note.reminderTimestamp).toDateString() === date.toDateString()) {
                      dayEvents.push({ title: `Recordatorio: Etapa ${stage.id}`, type: 'note' });
                    }
                  });
                });
                
                tasks.forEach(task => {
                  if (!canViewItem(task.createdBy)) return;
                  if (task.dueDateTimestamp && !task.completed && new Date(task.dueDateTimestamp).toDateString() === date.toDateString()) {
                    dayEvents.push({ title: `Tarea: ${task.title}`, type: 'task' });
                  }
                });
                
                const hasNote = dayEvents.some(e => e.type === 'note');
                const hasTask = dayEvents.some(e => e.type === 'task');
                
                let dayClasses = "h-8 w-8 flex items-center justify-center rounded-full text-xs relative cursor-pointer transition-all duration-300 ";
                let textClasses = "text-on-surface ";

                if (isToday) {
                  dayClasses += "bg-white text-black font-bold shadow-lg shadow-white/10 scale-110 z-10 ";
                } else if (hasNote && hasTask) {
                  dayClasses += "bg-gradient-to-br from-secondary to-error text-white font-bold ";
                } else if (hasNote) {
                  dayClasses += "bg-secondary/40 text-secondary border border-secondary/30 font-bold ";
                } else if (hasTask) {
                  dayClasses += "bg-error/40 text-error border border-error/30 font-bold ";
                } else {
                  dayClasses += "hover:bg-surface-bright text-on-surface ";
                }

                return (
                  <div 
                    key={day} 
                    className={dayClasses}
                    title={dayEvents.map(e => e.title).join('\n')}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 pt-4 border-t border-outline-variant/10 flex flex-wrap items-center gap-x-4 gap-y-2 justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-secondary/40 border border-secondary/30"></div>
                <span className="text-[10px] text-outline font-medium">Recordatorios</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-error/40 border border-error/30"></div>
                <span className="text-[10px] text-outline font-medium">Tareas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-secondary to-error"></div>
                <span className="text-[10px] text-outline font-medium">Ambos</span>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
