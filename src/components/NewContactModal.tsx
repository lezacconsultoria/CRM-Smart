import React, { useState, useEffect } from 'react';
import { ContactData } from '../types';

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

  React.useEffect(() => {
    if (isOpen) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setFormData({
      firstName: '',
      lastName: '',
      company: '',
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
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Ejecutivo Asignado</label>
                <div className="relative">
                  <select 
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleChange}
                    className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                  >
                    <option value="Roberto M.">Roberto M.</option>
                    <option value="Elena R.">Elena R.</option>
                    <option value="Carlos L.">Carlos L.</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider">Email</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="juan@ejemplo.com"
                />
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
            className="px-5 py-2.5 rounded-lg text-sm font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            Guardar Contacto
          </button>
        </div>
      </div>
    </div>
  );
}
