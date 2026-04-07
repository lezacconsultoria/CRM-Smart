import React, { useState, useEffect } from 'react';
import { ContactData } from '../types';
import { nocoService } from '../services/nocoService';

interface NewContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: ContactData) => void;
  initialData?: ContactData | null;
}

export default function NewContactModal({ isOpen, onClose, onSave, initialData }: NewContactModalProps) {
  const [formData, setFormData] = useState<ContactData>({
    firstName: '',
    lastName: '',
    company: '',
    activity: '',
    dbSource: '',
    email: '',
    phone: '',
    countryCode: '+54',
    jobTitle: '',
    source: '',
    assignedTo: 'Roberto M.',
    tasks: [],
    stages: [
      { id: 1, name: 'Descubrimiento', notes: [] },
      { id: 2, name: 'Propuesta', notes: [] },
      { id: 3, name: 'Negociación', notes: [] },
    ]
  });

  const [initialNote, setInitialNote] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setInitialNote(''); // Clear on open
      setEmailError('');
      setIsCheckingEmail(false);
      if (initialData) {
        setFormData({ 
          ...initialData, 
          countryCode: initialData.countryCode || '+54',
          tasks: initialData.tasks || [],
          stages: initialData.stages || [
            { id: 1, name: 'Descubrimiento', notes: [] },
            { id: 2, name: 'Propuesta', notes: [] },
            { id: 3, name: 'Negociación', notes: [] },
          ]
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          company: '',
          activity: '',
          dbSource: '',
          email: '',
          phone: '',
          countryCode: '+54',
          jobTitle: '',
          source: '',
          assignedTo: 'Roberto M.',
          tasks: [],
          stages: [
            { id: 1, name: 'Descubrimiento', notes: [] },
            { id: 2, name: 'Propuesta', notes: [] },
            { id: 3, name: 'Negociación', notes: [] },
          ]
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      onSaveProcess();
      return;
    }

    // Double check before saving
    setIsCheckingEmail(true);
    setEmailError('');
    try {
      const isDuplicate = await nocoService.isEmailDuplicate(formData.email, initialData?.id);
      if (isDuplicate) {
        setEmailError('Este email ya está registrado en la base de datos.');
        setIsCheckingEmail(false);
        return;
      }
    } catch (err) {
      console.error(err);
    }
    setIsCheckingEmail(false);

    onSaveProcess();
  };

  const onSaveProcess = () => {
    
    // If there's an initial note, add it to the first stage
    let finalData = { ...formData };
    if (initialNote.trim() && !initialData) {
      const updatedStages = [...(finalData.stages || [])];
      
      const newNote = {
        id: Date.now().toString(),
        text: initialNote.trim(),
        date: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
        tag: 'Importante'
      };

      if (updatedStages.length > 0) {
        updatedStages[0] = { ...updatedStages[0], notes: [newNote, ...(updatedStages[0].notes || [])] };
      } else {
        updatedStages.push({ id: 1, name: 'Descubrimiento', notes: [newNote] });
      }
      finalData.stages = updatedStages;
    }

    onSave(finalData);
    setFormData({
      firstName: '',
      lastName: '',
      company: '',
      activity: '',
      dbSource: '',
      email: '',
      phone: '',
      countryCode: '+54',
      jobTitle: '',
      source: '',
      assignedTo: 'Roberto M.',
      tasks: [],
      stages: [
        { id: 1, name: 'Descubrimiento', notes: [] },
        { id: 2, name: 'Propuesta', notes: [] },
        { id: 3, name: 'Negociación', notes: [] },
      ]
    });
    setInitialNote('');
    setEmailError('');
    onClose();
  };

  const handleEmailBlur = async () => {
    if (!formData.email || (initialData && formData.email === initialData.email)) {
      setEmailError('');
      return;
    }
    
    setIsCheckingEmail(true);
    setEmailError('');
    try {
      const isDuplicate = await nocoService.isEmailDuplicate(formData.email, initialData?.id);
      if (isDuplicate) {
        setEmailError('Este email ya está registrado en la base de datos.');
      }
    } catch (err) {
      console.error(err);
    }
    setIsCheckingEmail(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'initialNote') {
      setInitialNote(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-container w-full max-w-xl rounded-2xl border border-outline-variant/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low">
          <div>
            <h2 className="text-xl font-bold font-headline text-white">
              {initialData ? 'Editar Contacto' : 'Nuevo Contacto'}
            </h2>
            <p className="text-xs text-outline mt-1">
              {initialData ? 'Modificar los datos del contacto' : 'Añadir un nuevo contacto a la base de datos'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-outline hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="new-contact-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Nombre</label>
                <input 
                  type="text" 
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Ej. Juan"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Apellido</label>
                <input 
                  type="text" 
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Ej. Pérez"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Empresa</label>
                <input 
                  type="text" 
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Ej. Acme Corp"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Cargo</label>
                <input 
                  type="text" 
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Ej. Director de Ventas"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Actividad</label>
                <input 
                  type="text" 
                  name="activity"
                  value={formData.activity}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Ej. SaaS / Consultoría"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Base Origen</label>
                <input 
                  type="text" 
                  name="dbSource"
                  value={formData.dbSource}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Ej. LinkedIn Q1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Origen</label>
                <div className="relative">
                  <select 
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                  >
                    <option value="" disabled>Selecciona el origen</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]">
                    expand_more
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Tipo de Empresa</label>
                <div className="relative">
                  <select 
                    name="companyType"
                    value={formData.companyType || ''}
                    onChange={handleChange}
                    className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                  >
                    <option value="">No clasificado</option>
                    <option value="Corporación">Corporación</option>
                    <option value="PyME">PyME</option>
                    <option value="Mayorista">Mayorista</option>
                    <option value="Distribuidor">Distribuidor</option>
                    <option value="Startup">Startup</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Link de Perfil / Red Social</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-[18px]">open_in_new</span>
                </div>
                <input 
                  type="url" 
                  name="profileLink"
                  value={formData.profileLink || ''}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="https://www.linkedin.com/in/... o Instagram/Web"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Email</label>
                <div className="relative">
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleEmailBlur}
                    className={`w-full bg-surface-container-highest border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none transition-all ${
                      emailError ? 'border-error/50 focus:border-error focus:ring-1 focus:ring-error' : 'border-outline-variant/20 focus:border-primary focus:ring-1 focus:ring-primary'
                    }`}
                    placeholder="juan@ejemplo.com"
                  />
                  {isCheckingEmail && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                {emailError && (
                  <p className="text-[11px] text-error font-medium mt-1 animate-in fade-in slide-in-from-top-1">
                    {emailError}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Teléfono</label>
                <div className="flex gap-2">
                  <div className="relative w-[100px]">
                    <select
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleChange}
                      className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg pl-3 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                    >
                      <option value="+54">🇦🇷 +54</option>
                      <option value="+34">🇪🇸 +34</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+52">🇲🇽 +52</option>
                      <option value="+56">🇨🇱 +56</option>
                      <option value="+57">🇨🇴 +57</option>
                      <option value="+51">🇵🇪 +51</option>
                      <option value="+44">🇬🇧 +44</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">
                      expand_more
                    </span>
                  </div>
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="flex-1 min-w-0 bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="11 1234 5678"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Provincia</label>
                <input 
                  type="text" 
                  name="province"
                  value={formData.province || ''}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Ej. Buenos Aires"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider">País</label>
                <input 
                  type="text" 
                  name="country"
                  value={formData.country || ''}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Ej. Argentina"
                />
              </div>
            </div>

            {!initialData && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Observaciones Iniciales</label>
                <textarea 
                  name="initialNote"
                  value={initialNote}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none min-h-[80px]"
                  placeholder="Ej. Lo conocí en el evento X..."
                />
              </div>
            )}
          </form>
        </div>
        
        <div className="p-6 border-t border-outline-variant/10 bg-surface-container-low flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-bold text-outline hover:text-white hover:bg-surface-container-highest transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            form="new-contact-form"
            disabled={isCheckingEmail || !!emailError}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg ${
              isCheckingEmail || !!emailError 
                ? 'bg-outline-variant/20 text-outline cursor-not-allowed' 
                : 'bg-primary text-on-primary hover:bg-primary/90 shadow-primary/20'
            }`}
          >
            {isCheckingEmail ? 'Verificando...' : 'Guardar Contacto'}
          </button>
        </div>
      </div>
    </div>
  );
}
