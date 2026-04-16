import React, { useState, useEffect } from 'react';
import { ContactData, Note, StageData, User, CompetitionData, TrackingRecord, ContactRelation, CompanyConfig } from '../types';
import { pbService } from '../services/pbService';

interface ContactDetailsProps {
  contact: ContactData | null;
  onEdit: () => void;
  onBack: () => void;
  onUpdateContact: (contact: ContactData) => void;
  user?: User | null;
  allContacts?: ContactData[];
}

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const RELATION_TYPES = ['Jefe', 'Colega', 'Subordinado', 'Mismo equipo', 'Socio', 'Referencia', 'Otro'];

export default function ContactDetails({ contact, onEdit, onBack, onUpdateContact, user, allContacts = [] }: ContactDetailsProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [currentDate, setCurrentDate] = useState(new Date());
  const defaultStages: StageData[] = [
    { id: 1, name: 'Descubrimiento', notes: [] },
    { id: 2, name: 'Propuesta', notes: [] },
    { id: 3, name: 'Negociación', notes: [] },
    { id: 4, name: 'Cierre', notes: [] },
  ];

  // Stage & Price state
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [stages, setStages] = useState<StageData[]>(() => {
    let initial = (contact?.stages && contact.stages.length > 0) ? contact.stages : defaultStages;
    if (initial.length < 4) initial = [...initial, ...defaultStages.slice(initial.length)];
    return initial;
  });
  const [priceInput, setPriceInput] = useState<string>(contact?.price?.toString() || '');
  const [priceError, setPriceError] = useState<string>('');
  
  // Budget state (Stage 2)
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState<string>('');
  const [budgetDescInput, setBudgetDescInput] = useState<string>('');

  // Notes/observations state
  const [noteInput, setNoteInput] = useState('');
  const [selectedReminder, setSelectedReminder] = useState<number | null>(null);
  const [selectedReminderDate, setSelectedReminderDate] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Competition state (Stage 3 close)
  const [showCompetitionForm, setShowCompetitionForm] = useState(false);
  const [competitionAction, setCompetitionAction] = useState<'won' | 'lost'>('won');
  const [competitionData, setCompetitionData] = useState<CompetitionData>({
    hadCompetition: false,
    competitors: '',
    lossReason: '',
    notes: '',
  });

  // New Tracking state
  const [showNewTrackingForm, setShowNewTrackingForm] = useState(false);
  const [newTrackingCompany, setNewTrackingCompany] = useState('');
  const [newTrackingJobTitle, setNewTrackingJobTitle] = useState('');

  // Relations state
  const [showRelationSearch, setShowRelationSearch] = useState(false);
  const [relationSearchQuery, setRelationSearchQuery] = useState('');
  const [selectedRelationType, setSelectedRelationType] = useState('Colega');

  // Expanded tracking history
  const [expandedTracking, setExpandedTracking] = useState<string | null>(null);

  const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await pbService.getConfig();
        if (config) {
          setCompanyConfig(config);
        }
      } catch (error) {
        console.error('Error fetching config:', error);
      }
    };
    fetchConfig();
  }, []);

  const canViewItem = (createdBy?: string) => {
    if (!user) return true;
    if (user.role === 'admin') return true;
    return !createdBy || createdBy === user.name;
  };

  const NOTE_TAGS = companyConfig?.tags && companyConfig.tags.length > 0 
    ? companyConfig.tags 
    : ['Llamada', 'Reunión', 'Email', 'Seguimiento', 'Importante'];

  useEffect(() => {
    if (contact) {
      let initial = (contact.stages && contact.stages.length > 0) ? contact.stages : defaultStages;
      if (initial.length < 4) initial = [...initial, ...defaultStages.slice(initial.length)];
      setStages(initial);
      setPriceInput(contact.price?.toString() || '');
      setPriceError('');
      
      // Budget from stage 2
      const stage2 = initial.find(s => s.id === 2);
      setBudgetInput(stage2?.budget?.toString() || '');
      setBudgetDescInput(stage2?.budgetDescription || '');

      if (contact.status === 'won' || contact.status === 'lost') {
        setCurrentStage(4);
      } else {
        const highestStage = initial.slice().reverse().find(s => 
          (s.notes && s.notes.length > 0) || (s.id === 3 && contact.price && contact.price > 0) || (s.id === 2 && s.budget && s.budget > 0)
        );
        setCurrentStage(highestStage ? highestStage.id : 1);
      }
    }
  }, [contact]);

  // --- Note Handlers ---
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
        if (targetDate.getDay() !== 0 && targetDate.getDay() !== 6) {
          addedDays++;
        }
      }
      reminderDateStr = targetDate.toLocaleDateString('es-ES', { 
        weekday: 'short', day: 'numeric', month: 'short' 
      });
      reminderTimestamp = targetDate.getTime();
      reminderDays = selectedReminder;
    } else if (selectedReminderDate) {
      const targetDate = new Date(selectedReminderDate);
      targetDate.setMinutes(targetDate.getMinutes() + targetDate.getTimezoneOffset());
      reminderDateStr = targetDate.toLocaleDateString('es-ES', { 
        weekday: 'short', day: 'numeric', month: 'short' 
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
      reminderDays,
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
    if (currentStage < 4) {
      setCurrentStage(prev => prev + 1);
    }
  };

  // --- Budget Handlers (Stage 2) ---
  const handleSaveBudget = () => {
    const budgetNum = budgetInput ? Number(budgetInput) : undefined;
    const updatedStages = stages.map(s =>
      s.id === 2 ? { ...s, budget: budgetNum, budgetDescription: budgetDescInput || undefined } : s
    );
    setStages(updatedStages);
    if (contact) {
      onUpdateContact({ ...contact, stages: updatedStages });
    }
    setIsEditingBudget(false);
  };

  // --- Price Handlers (Stage 3) ---
  const handleSavePrice = () => {
    if (!priceInput || isNaN(Number(priceInput)) || Number(priceInput) <= 0) {
      setPriceError('El precio debe ser mayor a 0');
      return;
    }
    setPriceError('');
    const price = Number(priceInput);
    const updatedStages = stages.map(s =>
      s.id === 3 ? { ...s, price } : s
    );
    setStages(updatedStages);
    if (contact) {
      onUpdateContact({ ...contact, stages: updatedStages, price });
    }
    setIsEditingPrice(false);
  };

  // --- Competition / Close Stage 3 ---
  const handleOpenCompetitionForm = (status: 'won' | 'lost') => {
    if (!priceInput || isNaN(Number(priceInput)) || Number(priceInput) <= 0) {
      setPriceError('El precio es obligatorio y debe ser mayor a 0');
      return;
    }
    setPriceError('');
    setCompetitionAction(status);
    setCompetitionData({ hadCompetition: false, competitors: '', lossReason: '', notes: '' });
    setShowCompetitionForm(true);
  };

  const handleConfirmClose = () => {
    const price = Number(priceInput);
    const updatedStages = stages.map(s =>
      s.id === 3 ? { ...s, price } : s
    );
    setStages(updatedStages);
    setCurrentStage(4);
    setShowCompetitionForm(false);
    if (contact) {
      onUpdateContact({
        ...contact,
        stages: updatedStages,
        status: competitionAction,
        price,
        competition: competitionData,
      });
    }
  };

  // --- New Tracking ---
  const handleStartNewTracking = () => {
    if (!contact) return;
    
    // Archive current tracking
    const trackingRecord: TrackingRecord = {
      id: Date.now().toString(),
      company: contact.company,
      jobTitle: contact.jobTitle,
      startDate: contact.importDate || new Date().toISOString(),
      endDate: new Date().toISOString(),
      status: contact.status || 'archived',
      stages: [...stages],
      price: contact.price,
      competition: contact.competition,
    };
    
    const history = [...(contact.trackingHistory || []), trackingRecord];
    const freshStages = defaultStages.map(s => ({ ...s, notes: [] }));
    
    setStages(freshStages);
    setCurrentStage(1);
    setPriceInput('');
    setBudgetInput('');
    setBudgetDescInput('');
    setShowNewTrackingForm(false);

    onUpdateContact({
      ...contact,
      company: newTrackingCompany || contact.company,
      jobTitle: newTrackingJobTitle || contact.jobTitle,
      stages: freshStages,
      status: 'active',
      price: undefined,
      competition: undefined,
      trackingHistory: history,
    });
  };

  // --- Relations ---
  const handleAddRelation = (targetContact: ContactData) => {
    if (!contact || !targetContact.id || !contact.id) return;
    
    const newRelation: ContactRelation = {
      contactId: targetContact.id,
      contactName: `${targetContact.firstName} ${targetContact.lastName}`,
      company: targetContact.company,
      relationType: selectedRelationType,
    };

    const reverseRelation: ContactRelation = {
      contactId: contact.id,
      contactName: `${contact.firstName} ${contact.lastName}`,
      company: contact.company,
      relationType: selectedRelationType === 'Jefe' ? 'Subordinado' 
        : selectedRelationType === 'Subordinado' ? 'Jefe' 
        : selectedRelationType,
    };

    const currentRelations = contact.relations || [];
    if (currentRelations.some(r => r.contactId === targetContact.id)) {
      setShowRelationSearch(false);
      return;
    }

    // Update current contact
    onUpdateContact({
      ...contact,
      relations: [...currentRelations, newRelation],
    });

    // Update target contact (bidirectional)
    const targetRelations = targetContact.relations || [];
    if (!targetRelations.some(r => r.contactId === contact.id)) {
      onUpdateContact({
        ...targetContact,
        relations: [...targetRelations, reverseRelation],
      });
    }

    setShowRelationSearch(false);
    setRelationSearchQuery('');
  };

  const handleRemoveRelation = (relationContactId: string) => {
    if (!contact) return;
    const updatedRelations = (contact.relations || []).filter(r => r.contactId !== relationContactId);
    onUpdateContact({ ...contact, relations: updatedRelations });

    // Also remove reverse relation
    const targetContact = allContacts.find(c => c.id === relationContactId);
    if (targetContact) {
      const targetRelations = (targetContact.relations || []).filter(r => r.contactId !== contact.id);
      onUpdateContact({ ...targetContact, relations: targetRelations });
    }
  };

  const filteredRelationContacts = allContacts.filter(c => {
    if (!contact || c.id === contact.id) return false;
    if (!relationSearchQuery.trim()) return false;
    const q = relationSearchQuery.toLowerCase();
    return (
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  }).slice(0, 8);

  if (!contact) {
    return (
      <div className="pt-8 px-8 pb-12 min-h-screen flex items-center justify-center">
        <p className="text-outline">Selecciona un contacto para ver sus detalles.</p>
      </div>
    );
  }

  return (
    <div className="pt-6 px-4 md:pt-8 md:px-8 pb-24 md:pb-12 min-h-screen">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-high/50 text-outline hover:text-white hover:bg-surface-container-highest transition-all group border border-outline-variant/10"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span className="text-sm font-bold">Volver a la lista</span>
        </button>
        
        <div className="flex items-center gap-3">
          {(contact.trackingHistory && contact.trackingHistory.length > 0) && (
            <span className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[14px]">history</span>
              {contact.trackingHistory.length} seguimiento{contact.trackingHistory.length > 1 ? 's' : ''} anterior{contact.trackingHistory.length > 1 ? 'es' : ''}
            </span>
          )}
          <div className="hidden md:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] text-outline font-bold uppercase tracking-widest italic">Visualización Activa</span>
          </div>
        </div>
      </div>

      {/* Executive Header Block - Refined & Minimal */}
      <section className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-end w-full">
            <div className="relative shrink-0 group">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl shadow-2xl bg-gradient-to-br from-surface-container-highest to-surface-container flex items-center justify-center text-primary border border-outline-variant/20 group-hover:border-primary/40 transition-all duration-500">
                <span className="material-symbols-outlined text-5xl md:text-6xl group-hover:scale-110 transition-transform duration-500">person</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-2xl bg-primary text-on-primary flex items-center justify-center border-4 border-surface shadow-xl" title="Salud del Lead: Alta">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white font-headline">
                  {contact.firstName} {contact.lastName}
                </h1>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${
                    contact.status === 'won' ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                    : contact.status === 'lost' ? 'bg-error/10 text-error border-error/20' 
                    : 'bg-primary/10 text-primary border-primary/20'
                  }`}>
                    {contact.status === 'won' ? 'Cliente' : contact.status === 'lost' ? 'Perdido' : 'Lead Activo'}
                  </span>
                </div>
              </div>
              <p className="text-xl text-outline font-medium max-w-2xl">
                {contact.jobTitle || 'Especialista'} en <span className="text-white font-bold">{contact.company}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={onEdit}
                className="px-6 py-3 bg-white text-black rounded-2xl text-sm font-black hover:bg-primary hover:text-on-primary transition-all shadow-xl shadow-white/5 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Editar Perfil
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column: Timeline & Traceability */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Stages Tracker */}
          <div className="bg-surface-container p-4 md:p-6 rounded-xl border border-outline-variant/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 font-headline">
                <span className="material-symbols-outlined text-primary text-xl">route</span>
                Seguimiento por Etapas
              </h3>
              {contact.status === 'won' && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="flex-1 sm:flex-none text-center px-4 py-2 bg-green-500/10 text-green-500 rounded-lg text-xs font-bold border border-green-500/20 flex items-center gap-2 justify-center">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Contacto Ganado
                  </span>
                  <button
                    onClick={() => setShowNewTrackingForm(true)}
                    className="px-3 py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold border border-primary/20 hover:bg-primary/20 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    title="Iniciar un nuevo ciclo de seguimiento"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    Nuevo Seguimiento
                  </button>
                </div>
              )}
              {contact.status === 'lost' && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="flex-1 sm:flex-none text-center px-4 py-2 bg-error/10 text-error rounded-lg text-xs font-bold border border-error/20 flex items-center gap-2 justify-center">
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    Contacto Perdido
                  </span>
                  <button
                    onClick={() => setShowNewTrackingForm(true)}
                    className="px-3 py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold border border-primary/20 hover:bg-primary/20 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    title="Iniciar un nuevo ciclo de seguimiento"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    Nuevo Seguimiento
                  </button>
                </div>
              )}
              {(!contact.status || contact.status === 'active') && (
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  {currentStage === 3 ? (
                    <>
                      <button 
                        onClick={() => handleOpenCompetitionForm('won')}
                        className="w-full sm:w-auto px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg text-xs font-bold transition-colors border border-green-500/20 flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        Ganado
                      </button>
                      <button 
                        onClick={() => handleOpenCompetitionForm('lost')}
                        className="w-full sm:w-auto px-4 py-2 bg-error/10 text-error hover:bg-error/20 rounded-lg text-xs font-bold transition-colors border border-error/20 flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                        Perdido
                      </button>
                    </>
                  ) : currentStage < 4 ? (
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
                </div>
              )}
            </div>

            {/* Stages Tabs */}
            <div className="flex flex-col sm:flex-row gap-2 mb-6">
              {stages.map(stage => (
                <div 
                  key={stage.id}
                  onClick={() => !contact.status && stage.id <= currentStage && setCurrentStage(stage.id)}
                  className={`flex-1 p-3 rounded-lg border cursor-pointer ${
                    currentStage === stage.id && stage.id === 4 && contact.status === 'won'
                      ? 'bg-green-500/10 border-green-500/40 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                      : currentStage === stage.id && stage.id === 4 && contact.status === 'lost'
                        ? 'bg-error/10 border-error/40 text-error'
                        : currentStage === stage.id 
                          ? 'bg-primary/10 border-primary/30 text-primary' 
                          : currentStage > stage.id || (stage.id === 4 && contact.status)
                            ? 'bg-surface-container-high border-outline-variant/20 text-outline hover:bg-surface-container-highest'
                            : 'bg-surface-container-lowest border-outline-variant/5 text-outline/50'
                  } transition-all`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Etapa {stage.id}</span>
                    {(currentStage > stage.id || (stage.id === 4 && contact.status)) && <span className="material-symbols-outlined text-[14px] text-secondary">check_circle</span>}
                    {currentStage === stage.id && !contact.status && <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>}
                  </div>
                  <p className="text-sm font-medium">{stage.name}</p>
                </div>
              ))}
            </div>

            {/* Budget Form (Stage 2 only) */}
            {companyConfig?.showBudget !== false && currentStage === 2 && (
              <div className={`mb-6 border rounded-xl overflow-hidden p-5 relative transition-all duration-300 ${
                !isEditingBudget && stages.find(s => s.id === 2)?.budget ? 'bg-black/20 border-secondary/20' : 'bg-surface-container-lowest border-outline-variant/10'
              }`}>
                <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${!isEditingBudget && stages.find(s => s.id === 2)?.budget ? 'bg-secondary/40' : 'bg-secondary'}`}></div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[18px]">request_quote</span>
                    Presupuesto <span className="text-outline font-normal normal-case tracking-normal">(opcional)</span>
                  </label>
                  {!isEditingBudget && stages.find(s => s.id === 2)?.budget && (
                    <span className="px-2 py-0.5 rounded bg-secondary/20 text-secondary text-[10px] font-bold border border-secondary/30">
                      Presupuesto Cargado
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold text-lg transition-colors ${!isEditingBudget && stages.find(s => s.id === 2)?.budget ? 'text-outline' : 'text-on-surface-variant'}`}>$</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={budgetInput}
                        readOnly={!isEditingBudget && !!stages.find(s => s.id === 2)?.budget}
                        onChange={(e) => setBudgetInput(e.target.value)}
                        className={`w-full border rounded-xl py-3 pl-10 pr-4 text-base font-medium transition-all ${
                          !isEditingBudget && stages.find(s => s.id === 2)?.budget
                            ? 'bg-transparent border-transparent text-outline cursor-default' 
                            : 'bg-surface-container border border-outline-variant/40 focus:border-secondary focus:ring-1 focus:ring-secondary text-white'
                        }`}
                      />
                    </div>
                    {!isEditingBudget && stages.find(s => s.id === 2)?.budget ? (
                      <button 
                        onClick={() => setIsEditingBudget(true)}
                        className="w-12 h-12 rounded-xl bg-surface-container-highest text-outline flex items-center justify-center hover:bg-surface-bright hover:text-white transition-all shrink-0 border border-outline-variant/20"
                        title="Editar Presupuesto"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                    ) : (
                      <button 
                        onClick={handleSaveBudget}
                        className="w-12 h-12 rounded-xl bg-secondary text-on-secondary flex items-center justify-center hover:bg-secondary/90 transition-all shrink-0 shadow-lg shadow-secondary/10"
                        title="Confirmar Presupuesto"
                      >
                        <span className="material-symbols-outlined">check_circle</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Descripción del presupuesto (ej: Casa 3 ambientes, Oficina piso 2...)"
                    value={budgetDescInput}
                    readOnly={!isEditingBudget && !!stages.find(s => s.id === 2)?.budget}
                    onChange={(e) => setBudgetDescInput(e.target.value)}
                    className={`w-full border rounded-xl py-2.5 px-4 text-sm transition-all ${
                      !isEditingBudget && stages.find(s => s.id === 2)?.budget
                        ? 'bg-transparent border-transparent text-outline cursor-default' 
                        : 'bg-surface-container border border-outline-variant/40 focus:border-secondary focus:ring-1 focus:ring-secondary text-white placeholder:text-outline/40'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-outline mt-2">
                  {!isEditingBudget && stages.find(s => s.id === 2)?.budget 
                    ? 'El presupuesto está registrado. Haz clic en el lápiz para modificarlo.' 
                    : 'Campo opcional. Registra el presupuesto asociado a esta propuesta.'}
                </p>
              </div>
            )}

            {/* Price Form (Stage 3 only) */}
            {currentStage === 3 && (
              <div className={`mb-6 border rounded-xl overflow-hidden p-6 shadow-inner relative transition-all duration-300 ${
                !isEditingPrice && contact.price ? 'bg-black/20 border-primary/20' : 'bg-surface-container-lowest border-outline-variant/10'
              }`}>
                <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${!isEditingPrice && contact.price ? 'bg-primary/40' : 'bg-primary'}`}></div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">payments</span>
                    Precio Proyectado de Negociación <span className="text-error">*</span>
                  </label>
                  {!isEditingPrice && contact.price && (
                    <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold border border-primary/30 animate-in fade-in zoom-in duration-300">
                      Precio Confirmado
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold text-lg transition-colors ${!isEditingPrice && contact.price ? 'text-outline' : 'text-on-surface-variant'}`}>$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={priceInput}
                      readOnly={!isEditingPrice && contact.price ? true : false}
                      onChange={(e) => {
                        setPriceInput(e.target.value);
                        if (e.target.value && Number(e.target.value) > 0) setPriceError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSavePrice();
                        }
                      }}
                      className={`w-full border rounded-xl py-3 pl-10 pr-4 text-base font-medium transition-all ${
                        !isEditingPrice && contact.price 
                          ? 'bg-transparent border-transparent text-outline cursor-default' 
                          : `bg-surface-container border ${priceError ? 'border-error ring-1 ring-error' : 'border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary'} text-white`
                      }`}
                    />
                  </div>
                  {!isEditingPrice && contact.price ? (
                    <button 
                      onClick={() => setIsEditingPrice(true)}
                      className="w-12 h-12 rounded-xl bg-surface-container-highest text-outline flex items-center justify-center hover:bg-surface-bright hover:text-white transition-all shrink-0 border border-outline-variant/20"
                      title="Editar Precio"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                  ) : (
                    <button 
                      onClick={handleSavePrice}
                      className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center hover:bg-primary/90 transition-all shrink-0 shadow-lg shadow-primary/10"
                      title="Confirmar Precio"
                    >
                      <span className="material-symbols-outlined">check_circle</span>
                    </button>
                  )}
                </div>
                
                {priceError && <p className="text-error text-xs mt-2 flex items-center gap-1 font-medium"><span className="material-symbols-outlined text-[14px]">error</span>{priceError}</p>}
                <p className="text-[11px] text-outline mt-3">
                  {!isEditingPrice && contact.price 
                    ? 'El precio está bloqueado. Haz clic en el lápiz para modificarlo.' 
                    : 'Presiona Enter o el botón de check para confirmar el ingreso proyectado.'}
                </p>

                {/* Competition info (if already set) */}
                {contact.competition && (
                  <div className="mt-4 p-3 rounded-lg bg-surface-container border border-outline-variant/10">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">swords</span>
                      Información de Competencia
                    </p>
                    <div className="space-y-1 text-xs text-on-surface-variant">
                      <p>Competencia: <span className="font-semibold text-white">{contact.competition.hadCompetition ? 'Sí' : 'No'}</span></p>
                      {contact.competition.hadCompetition && contact.competition.competitors && (
                        <p>Competidores: <span className="font-semibold text-white">{contact.competition.competitors}</span></p>
                      )}
                      {contact.competition.lossReason && (
                        <p>Razón de pérdida: <span className="font-semibold text-white">{contact.competition.lossReason}</span></p>
                      )}
                      {contact.competition.notes && (
                        <p>Notas: <span className="text-white">{contact.competition.notes}</span></p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Competition Form Modal */}
            {showCompetitionForm && (
              <div className="mb-6 bg-surface-container-lowest border border-primary/30 rounded-xl p-5 animate-in fade-in slide-in-from-top-2 duration-300 shadow-xl shadow-primary/5">
                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">swords</span>
                  {competitionAction === 'won' ? 'Cerrar como Ganado' : 'Cerrar como Perdido'}
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-outline uppercase tracking-wider mb-2 block">¿Hubo competencia?</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCompetitionData(prev => ({ ...prev, hadCompetition: true }))}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all border ${
                          competitionData.hadCompetition 
                            ? 'bg-primary/20 text-primary border-primary/30' 
                            : 'bg-surface-container text-outline border-outline-variant/20 hover:border-outline/50'
                        }`}
                      >
                        Sí, hubo competencia
                      </button>
                      <button
                        onClick={() => setCompetitionData(prev => ({ ...prev, hadCompetition: false, competitors: '' }))}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all border ${
                          !competitionData.hadCompetition 
                            ? 'bg-primary/20 text-primary border-primary/30' 
                            : 'bg-surface-container text-outline border-outline-variant/20 hover:border-outline/50'
                        }`}
                      >
                        No, sin competencia
                      </button>
                    </div>
                  </div>

                  {competitionData.hadCompetition && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="text-xs font-bold text-outline uppercase tracking-wider mb-2 block">¿Contra quién competiste?</label>
                      <input
                        type="text"
                        value={competitionData.competitors || ''}
                        onChange={(e) => setCompetitionData(prev => ({ ...prev, competitors: e.target.value }))}
                        placeholder="Nombre(s) de la competencia..."
                        className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-outline/40"
                      />
                    </div>
                  )}

                  {competitionAction === 'lost' && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="text-xs font-bold text-outline uppercase tracking-wider mb-2 block">Razón de la pérdida</label>
                      <input
                        type="text"
                        value={competitionData.lossReason || ''}
                        onChange={(e) => setCompetitionData(prev => ({ ...prev, lossReason: e.target.value }))}
                        placeholder="Mejor precio, mejor servicio, relaciones previas..."
                        className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-outline/40"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-outline uppercase tracking-wider mb-2 block">Notas adicionales <span className="font-normal normal-case">(opcional)</span></label>
                    <textarea
                      value={competitionData.notes || ''}
                      onChange={(e) => setCompetitionData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Cualquier detalle relevante..."
                      rows={2}
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none placeholder:text-outline/40"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setShowCompetitionForm(false)}
                      className="flex-1 py-2.5 rounded-lg text-xs font-bold text-outline hover:text-white bg-surface-container border border-outline-variant/20 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmClose}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                        competitionAction === 'won' 
                          ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20' 
                          : 'bg-error text-white hover:bg-error/90 shadow-lg shadow-error/20'
                      }`}
                    >
                      Confirmar {competitionAction === 'won' ? 'Ganado' : 'Perdido'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* New Tracking Form */}
            {showNewTrackingForm && (
              <div className="mb-6 bg-surface-container-lowest border border-primary/30 rounded-xl p-5 animate-in fade-in slide-in-from-top-2 duration-300 shadow-xl shadow-primary/5">
                <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">add_circle</span>
                  Nuevo Seguimiento
                </h4>
                <p className="text-xs text-outline mb-4">
                  El seguimiento actual se archivará y se iniciará uno nuevo. Puedes cambiar la empresa/cargo o mantenerlos.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-outline uppercase tracking-wider mb-1.5 block">Empresa</label>
                    <input
                      type="text"
                      value={newTrackingCompany}
                      onChange={(e) => setNewTrackingCompany(e.target.value)}
                      placeholder={contact.company}
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-outline/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-outline uppercase tracking-wider mb-1.5 block">Cargo</label>
                    <input
                      type="text"
                      value={newTrackingJobTitle}
                      onChange={(e) => setNewTrackingJobTitle(e.target.value)}
                      placeholder={contact.jobTitle}
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-outline/40"
                    />
                  </div>
                  <p className="text-[10px] text-outline italic">Dejá en blanco para mantener los datos actuales.</p>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setShowNewTrackingForm(false)}
                      className="flex-1 py-2.5 rounded-lg text-xs font-bold text-outline hover:text-white bg-surface-container border border-outline-variant/20 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleStartNewTracking}
                      className="flex-1 py-2.5 rounded-lg text-xs font-bold bg-primary text-on-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                      Archivar y Comenzar Nuevo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Input Area (Only for active stages) */}
            {(!contact.status || contact.status === 'active') && (
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
            )}

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

        {/* Right Column: Sidebar */}
        {/* Right Column: Sidebar (Sticky) */}
        <div className="col-span-12 lg:col-span-4 space-y-6 lg:sticky lg:top-8 self-start">
          {/* Quick Contact Info Card */}
          <div className="bg-surface-container-high rounded-3xl p-6 border border-outline-variant/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-colors" />
            
            <h3 className="text-xs font-black text-outline uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-1 h-3 bg-primary rounded-full"></span>
              Detalles del Contacto
            </h3>

            <div className="space-y-5">
              {/* Email */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-outline shrink-0">
                  <span className="material-symbols-outlined text-lg">mail</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-0.5">Email</p>
                  <p className="text-sm text-white font-medium truncate">{contact.email}</p>
                </div>
                {contact.isEmailValid && (
                  <span className="material-symbols-outlined text-green-500 text-sm" title="Verificado">verified</span>
                )}
              </div>

              {/* Phone */}
              {contact.phone && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-outline shrink-0">
                    <span className="material-symbols-outlined text-lg">phone</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-0.5">Celular</p>
                    <p className="text-sm text-white font-medium">{contact.countryCode} {contact.phone}</p>
                  </div>
                </div>
              )}

              {/* Location */}
              {(contact.province || contact.country) && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-outline shrink-0">
                    <span className="material-symbols-outlined text-lg">location_on</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-0.5">Ubicación</p>
                    <p className="text-sm text-white font-medium truncate">
                      {contact.province}{contact.province && contact.country ? ', ' : ''}{contact.country}
                    </p>
                  </div>
                </div>
              )}

              {/* Company Data */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-outline shrink-0">
                  <span className="material-symbols-outlined text-lg">business</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-0.5">Empresa</p>
                  <p className="text-sm text-white font-medium truncate">{contact.company}</p>
                  {contact.companyType && (
                    <span className="text-[9px] text-outline font-medium italic">{contact.companyType}</span>
                  )}
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-outline-variant/10">
                <a 
                  href={`https://wa.me/${(contact.countryCode || '54').replace('+', '')}${contact.phone?.replace(/\s/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-[#25D366]/5 hover:bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 transition-all group"
                >
                  <span className="material-symbols-outlined text-xl group-hover:scale-125 transition-transform">chat</span>
                  <span className="text-[9px] font-black uppercase">WhatsApp</span>
                </a>
                <a 
                  href={`mailto:${contact.email}`}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 transition-all group"
                >
                  <span className="material-symbols-outlined text-xl group-hover:scale-125 transition-transform">alternate_email</span>
                  <span className="text-[9px] font-black uppercase">Email</span>
                </a>
                <a 
                  href={`tel:${contact.countryCode}${contact.phone}`}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-secondary/5 hover:bg-secondary/10 text-secondary border border-secondary/20 transition-all group"
                >
                  <span className="material-symbols-outlined text-xl group-hover:scale-125 transition-transform">call</span>
                  <span className="text-[9px] font-black uppercase">Llamar</span>
                </a>
              </div>
            </div>

            {/* LinkedIn / Profile Link if exists */}
            {contact.profileLink && (
              <a 
                href={contact.profileLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-surface-container-highest text-white text-xs font-bold border border-outline-variant/10 hover:border-primary/40 transition-all group"
              >
                <span className="material-symbols-outlined text-sm">link</span>
                Ver Perfil Profesional
              </a>
            )}

            {/* Additional Links */}
            {contact.additionalLinks && contact.additionalLinks.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {contact.additionalLinks.filter(l => l.trim()).map((link, idx) => (
                  <a 
                    key={idx}
                    href={link.startsWith('http') ? link : `https://${link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-white/5 text-outline text-[10px] font-bold border border-outline-variant/5 hover:border-white/20 hover:text-white transition-all group"
                  >
                    <span className="material-symbols-outlined text-[14px]">link</span>
                    Link Adicional {idx + 1}
                  </a>
                ))}
              </div>
            )}
          </div>
          {/* Compact Timeline Widget */}
          <div className="bg-surface-container-high rounded-2xl p-5 border border-outline-variant/10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">schedule</span>
                Próximos Eventos
              </h3>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-bright text-outline transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-bright text-outline transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-1 px-1">
              {Array.from({ length: 14 }).map((_, i) => {
                const date = new Date(currentDate);
                date.setDate(currentDate.getDate() - 3 + i);
                const isToday = new Date().toDateString() === date.toDateString();
                const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
                const dayNum = date.getDate();
                
                const hasReminder = stages.some(stage => 
                  stage.notes.some(note => 
                    canViewItem(note.createdBy) && 
                    note.reminderTimestamp && 
                    new Date(note.reminderTimestamp).toDateString() === date.toDateString()
                  )
                );

                return (
                  <div 
                    key={i}
                    className={`flex flex-col items-center justify-center min-w-[42px] h-16 rounded-xl border transition-all duration-300 ${
                      isToday 
                        ? 'bg-white border-white text-black shadow-lg scale-105 z-10' 
                        : hasReminder
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-surface-container border-outline-variant/5 text-outline hover:border-outline-variant/30'
                    }`}
                  >
                    <span className={`text-[9px] font-bold uppercase mb-1 ${isToday ? 'text-black/60' : 'text-outline'}`}>
                      {dayName}
                    </span>
                    <span className="text-sm font-black">
                      {dayNum}
                    </span>
                    {hasReminder && !isToday && (
                      <div className="mt-1 w-1 h-1 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* List of upcoming reminders for the selected range */}
            <div className="mt-4 space-y-3">
              {(() => {
                const upcomingReminders = [];
                stages.forEach(stage => {
                  stage.notes.forEach(note => {
                    if (note.reminderTimestamp && canViewItem(note.createdBy)) {
                      const rDate = new Date(note.reminderTimestamp);
                      if (rDate >= new Date(new Date().setHours(0,0,0,0))) {
                        upcomingReminders.push({ ...note, stageId: stage.id, dateObj: rDate });
                      }
                    }
                  });
                });
                
                upcomingReminders.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
                
                if (upcomingReminders.length === 0) {
                  return <p className="text-[10px] text-outline text-center py-2">No hay recordatorios próximos</p>;
                }

                return upcomingReminders.slice(0, 3).map((rem, idx) => (
                  <div key={idx} className="flex gap-3 items-center group">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 group-hover:scale-150 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-white truncate">{rem.text.substring(0, 40)}...</p>
                      <p className="text-[9px] text-outline">
                        {rem.dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} · Etapa {rem.stageId}
                      </p>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>


          {/* Contact Relations */}
          <div className="bg-surface-container-high rounded-2xl p-5 border border-outline-variant/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">group</span>
                Contactos Relacionados
              </h3>
              <span className="text-[10px] text-outline font-bold">{(contact.relations || []).length}</span>
            </div>
            
            {(contact.relations || []).length > 0 && (
              <div className="space-y-2 mb-4">
                {(contact.relations || []).map(rel => (
                  <div key={rel.contactId} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-container border border-outline-variant/5 group hover:border-primary/20 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[16px]">person</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-on-surface truncate">{rel.contactName}</p>
                      <p className="text-[10px] text-outline truncate">{rel.relationType} · {rel.company}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveRelation(rel.contactId)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded flex items-center justify-center text-outline hover:text-error hover:bg-error/10"
                      title="Quitar relación"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {showRelationSearch ? (
              <div className="space-y-3 animate-in fade-in duration-200">
                <input
                  type="text"
                  value={relationSearchQuery}
                  onChange={(e) => setRelationSearchQuery(e.target.value)}
                  placeholder="Buscar contacto por nombre, empresa..."
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  autoFocus
                />
                <select
                  value={selectedRelationType}
                  onChange={(e) => setSelectedRelationType(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                >
                  {RELATION_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {filteredRelationContacts.length > 0 && (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {filteredRelationContacts.map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleAddRelation(c)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg bg-surface-container-lowest hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-surface-container-highest flex items-center justify-center text-outline shrink-0">
                          <span className="material-symbols-outlined text-[14px]">person</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-on-surface truncate">{c.firstName} {c.lastName}</p>
                          <p className="text-[10px] text-outline truncate">{c.jobTitle} · {c.company}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {relationSearchQuery && filteredRelationContacts.length === 0 && (
                  <p className="text-xs text-outline text-center py-3">No se encontraron contactos</p>
                )}
                <button
                  onClick={() => { setShowRelationSearch(false); setRelationSearchQuery(''); }}
                  className="w-full py-2 text-[11px] font-bold text-outline hover:text-white transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowRelationSearch(true)}
                className="w-full py-2.5 bg-surface-container-lowest text-on-surface-variant text-[11px] font-bold rounded-lg border border-outline-variant/10 hover:bg-surface hover:border-primary/20 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[14px]">link</span>
                Vincular Contacto
              </button>
            )}
          </div>

          {/* Tracking History */}
          {(contact.trackingHistory && contact.trackingHistory.length > 0) && (
            <div className="bg-surface-container-high rounded-2xl p-5 border border-outline-variant/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-lg">history</span>
                Seguimientos Anteriores
              </h3>
              <div className="space-y-2">
                {[...contact.trackingHistory].reverse().map((track) => (
                  <div key={track.id} className="rounded-lg border border-outline-variant/10 overflow-hidden transition-all">
                    <button
                      onClick={() => setExpandedTracking(expandedTracking === track.id ? null : track.id)}
                      className="w-full flex items-center gap-3 p-3 bg-surface-container hover:bg-surface-container-highest transition-colors text-left"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        track.status === 'won' ? 'bg-green-500/10 text-green-500' 
                        : track.status === 'lost' ? 'bg-error/10 text-error' 
                        : 'bg-outline-variant/10 text-outline'
                      }`}>
                        <span className="material-symbols-outlined text-[16px]">
                          {track.status === 'won' ? 'check_circle' : track.status === 'lost' ? 'cancel' : 'archive'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-on-surface truncate">{track.company}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold ${
                            track.status === 'won' ? 'text-green-500' : track.status === 'lost' ? 'text-error' : 'text-outline'
                          }`}>
                            {track.status === 'won' ? 'Ganado' : track.status === 'lost' ? 'Perdido' : 'Archivado'}
                          </span>
                          {track.price && (
                            <span className="text-[10px] text-outline">· ${track.price.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[16px] text-outline transition-transform" style={{ transform: expandedTracking === track.id ? 'rotate(180deg)' : 'none' }}>
                        expand_more
                      </span>
                    </button>
                    
                    {expandedTracking === track.id && (
                      <div className="px-3 pb-3 bg-surface-container-lowest animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="pt-3 space-y-2 text-xs text-on-surface-variant">
                          {track.jobTitle && <p>Cargo: <span className="text-white font-medium">{track.jobTitle}</span></p>}
                          <p>Período: <span className="text-white font-medium">
                            {new Date(track.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {track.endDate && ` — ${new Date(track.endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                          </span></p>
                          {track.competition && (
                            <div className="pt-2 border-t border-outline-variant/10">
                              <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Competencia</p>
                              <p>¿Hubo competencia? <span className="text-white font-medium">{track.competition.hadCompetition ? 'Sí' : 'No'}</span></p>
                              {track.competition.competitors && <p>Competidores: <span className="text-white font-medium">{track.competition.competitors}</span></p>}
                              {track.competition.lossReason && <p>Razón de pérdida: <span className="text-white font-medium">{track.competition.lossReason}</span></p>}
                            </div>
                          )}
                          <div className="pt-2 border-t border-outline-variant/10">
                            <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Observaciones ({track.stages.reduce((acc, s) => acc + s.notes.length, 0)})</p>
                            {track.stages.filter(s => s.notes.length > 0).map(s => (
                              <p key={s.id} className="text-[10px] text-outline">
                                Etapa {s.id} ({s.name}): {s.notes.length} obs.
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
