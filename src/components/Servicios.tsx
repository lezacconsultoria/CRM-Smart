import React, { useState, useEffect } from 'react';

interface Service {
  id: string;
  title: string;
  icon: string;
  tag: string;
  tagType: 'profitability' | 'operation' | 'entry' | 'continuity' | 'other';
  valueAdded: string;
  idealClient: string;
  avgTicket: string;
  objections: string[];
}

const INITIAL_SERVICES: Service[] = [
  {
    id: '1',
    title: 'Estrategia Digital',
    icon: 'strategy',
    tag: 'Alta Rentabilidad',
    tagType: 'profitability',
    valueAdded: 'Transformamos la incertidumbre tecnológica en una hoja de ruta financiera ejecutable, reduciendo el riesgo de inversión en un 40%.',
    idealClient: 'CEOs de empresas medianas con procesos manuales.',
    avgTicket: '$15k - $45k USD',
    objections: ['Es un gasto, no una inversión prioritaria ahora.', 'Ya tenemos un departamento de TI interno.']
  },
  {
    id: '2',
    title: 'Implementación CRM',
    icon: 'architecture',
    tag: 'Operativo',
    tagType: 'operation',
    valueAdded: 'Despliegue táctico que garantiza la adopción del equipo comercial al 90%, eliminando silos de información en 60 días.',
    idealClient: 'Direcciones comerciales con equipos de +10 personas.',
    avgTicket: '$8k - $20k USD',
    objections: ['El equipo no querrá usar una herramienta nueva.', 'Es muy complejo migrar nuestros Excels.']
  },
  {
    id: '3',
    title: 'Auditoría de Procesos',
    icon: 'fact_check',
    tag: 'Puerta de Entrada',
    tagType: 'entry',
    valueAdded: "Diagnóstico 'Rayos X' de la operación actual que identifica fugas de capital ocultas en el flujo de trabajo diario.",
    idealClient: 'Empresas en fase de escalamiento acelerado.',
    avgTicket: '$3k - $7k USD',
    objections: ['Ya sabemos lo que está mal, solo ocupamos manos.']
  },
  {
    id: '4',
    title: 'Capacitación Ejecutiva',
    icon: 'school',
    tag: 'Continuidad',
    tagType: 'continuity',
    valueAdded: 'Transferencia de know-how crítico para que la empresa no dependa externamente de consultores a largo plazo.',
    idealClient: 'Mandos medios que necesitan actualizar sus skills digitales.',
    avgTicket: '$5k - $12k USD',
    objections: ['Podemos ver tutoriales en YouTube o LinkedIn.']
  }
];

export default function Servicios() {
  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem('crm_smart_services');
    const data = saved ? JSON.parse(saved) : INITIAL_SERVICES;
    // Migration: ensure objects have all required fields for old saved data
    return data.map((s: any) => ({
      ...s,
      objections: s.objections || []
    }));
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<Partial<Service>>({});
  const [objectionInput, setObjectionInput] = useState('');

  useEffect(() => {
    localStorage.setItem('crm_smart_services', JSON.stringify(services));
  }, [services]);

  const generateId = () => {
    try {
      return crypto.randomUUID();
    } catch (e) {
      return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
    setFormData({});
    setObjectionInput('');
  };

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({ ...service });
    } else {
      setEditingService(null);
      setFormData({
        id: generateId(),
        title: '',
        icon: 'rocket_launch',
        tag: 'Nuevo',
        tagType: 'other',
        valueAdded: '',
        idealClient: '',
        avgTicket: '',
        objections: []
      });
    }
    setIsModalOpen(true);
  };

  const addObjection = () => {
    if (!objectionInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      objections: [...(prev.objections || []), objectionInput.trim()]
    }));
    setObjectionInput('');
  };

  const removeObjection = (index: number) => {
    setFormData(prev => ({
      ...prev,
      objections: prev.objections?.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    const title = formData.title?.trim();
    if (!title) {
      alert('El título del servicio es requerido');
      return;
    }
    
    if (editingService) {
      // Logic for editing existing service
      const updatedService: Service = {
        ...editingService,
        ...formData,
        id: editingService.id, // Ensure ID remains immutable
        title, // Use trimmed title
        objections: formData.objections || []
      } as Service;

      setServices(prev => prev.map(s => s.id === editingService.id ? updatedService : s));
    } else {
      // Logic for creating new service
      const newService: Service = {
        id: generateId(),
        title,
        icon: formData.icon || 'rocket_launch',
        tag: formData.tag || 'Nuevo',
        tagType: formData.tagType || 'other',
        valueAdded: formData.valueAdded || '',
        idealClient: formData.idealClient || '',
        avgTicket: formData.avgTicket || '',
        objections: formData.objections || []
      };
      setServices(prev => [...prev, newService]);
    }
    
    handleCloseModal();
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      setServices(prev => prev.filter(s => s.id !== deleteId));
      setDeleteId(null);
    }
  };

  const getTagStyles = (type: Service['tagType']) => {
    switch (type) {
      case 'profitability': return 'bg-secondary-container/10 text-secondary-container border-secondary-container/20';
      case 'operation': return 'bg-primary-container/10 text-primary-container border-primary-container/20';
      case 'entry': return 'bg-white/10 text-white border-white/20';
      case 'continuity': return 'bg-tertiary-container/10 text-tertiary-container border-tertiary-container/20';
      default: return 'bg-surface-variant/20 text-outline border-outline/20';
    }
  };

  return (
    <div className="pt-6 px-4 md:pt-8 md:px-8 pb-24 md:pb-12 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-12">
        <div>
          <h2 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Catálogo de Servicios</h2>
          <p className="text-on-surface-variant max-w-2xl font-body text-sm md:text-base">Ecosistema de soluciones consultivas diseñadas para la alta dirección. Use esta guía para articular valor y mitigar barreras en el ciclo de venta.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary text-on-primary-container px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Agregar Servicio
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        {/* Service Catalog Grid */}
        <section className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => (
              <div key={service.id} className="bg-surface-container rounded-2xl p-6 md:p-8 border border-outline-variant/10 hover:border-primary/20 transition-all duration-300 group relative">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl md:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{service.icon}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border text-center ${getTagStyles(service.tagType)}`}>
                      {service.tag}
                    </span>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleOpenModal(service)}
                        className="p-2 rounded-lg bg-surface-container-highest text-primary hover:bg-primary/20 transition-colors"
                        title="Editar"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(service.id)}
                        className="p-2 rounded-lg bg-surface-container-highest text-error hover:bg-error/20 transition-colors"
                        title="Eliminar"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <h3 className="font-headline text-xl md:text-2xl font-bold text-white mb-4">{service.title}</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest block mb-2">Valor Agregado</label>
                    <p className="text-sm text-on-surface-variant leading-relaxed italic line-clamp-3">"{service.valueAdded}"</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-outline uppercase tracking-widest block mb-2">Cliente Ideal</label>
                      <p className="text-xs text-on-surface line-clamp-2">{service.idealClient}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-outline uppercase tracking-widest block mb-2">Ticket Promedio</label>
                      <p className="text-xs text-primary font-bold">{service.avgTicket}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10">
                    <label className="text-[10px] font-bold text-error uppercase tracking-widest block mb-3">Objeciones Frecuentes</label>
                    <ul className="text-xs space-y-3 text-on-surface-variant">
                      {service.objections?.map((obj, i) => (
                        <li key={i} className="flex gap-2 items-start">
                          <span className="material-symbols-outlined text-error text-sm mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sidebar Strategic Insights */}
        <aside className="space-y-6">
          <div className="bg-surface-container/40 backdrop-blur-xl rounded-2xl p-6 border border-primary/10">
            <h4 className="font-headline text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">lightbulb</span>
              Cuándo ofrecerlo
            </h4>
            <div className="space-y-8">
              <div>
                <h5 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Señales de Estrategia</h5>
                <ul className="space-y-3">
                  <li className="flex gap-3 items-start text-sm text-on-surface-variant">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    El cliente menciona que "siente que la competencia le está ganando".
                  </li>
                  <li className="flex gap-3 items-start text-sm text-on-surface-variant">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    Hay presupuesto asignado pero no hay claridad en el retorno esperado.
                  </li>
                </ul>
              </div>
              
              <div>
                <h5 className="text-xs font-bold text-secondary-container uppercase tracking-wider mb-3">Señales de Implementación</h5>
                <ul className="space-y-3">
                  <li className="flex gap-3 items-start text-sm text-on-surface-variant">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary-container mt-1.5 flex-shrink-0"></div>
                    Quejas constantes sobre "datos perdidos" o "no sabemos qué hace ventas".
                  </li>
                  <li className="flex gap-3 items-start text-sm text-on-surface-variant">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary-container mt-1.5 flex-shrink-0"></div>
                    Dependencia absoluta de hojas de cálculo compartidas.
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-outline-variant/10">
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                <p className="text-[10px] font-bold text-primary uppercase mb-1">Tip de Consultor</p>
                <p className="text-xs text-on-surface-variant italic">"Siempre ancla el precio al valor del problema resuelto, no a las horas de trabajo estimadas."</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-high rounded-2xl p-6 border border-outline-variant/10 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-widest font-bold text-outline">KPI de Catálogo</span>
              <span className="material-symbols-outlined text-primary">trending_up</span>
            </div>
            <div className="text-3xl font-headline font-bold text-white mb-1">68%</div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">Tasa de conversión histórica al presentar una Auditoría como primer contacto.</p>
          </div>
        </aside>
      </div>

      {/* Footer Stats & Legend */}
      <footer className="mt-12 pt-8 border-t border-outline-variant/10 flex flex-col sm:flex-row gap-6 sm:gap-8 justify-between items-start sm:items-center">
        <div className="flex flex-wrap gap-4 sm:gap-8 opacity-60">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-secondary-container"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Margen Alto</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary-container"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Margen Medio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Entrada</span>
          </div>
        </div>
        <div className="text-[10px] text-outline italic">
          Lezac Strategic Catalog • Sistema Dinámico de Ventas v5.0
        </div>
      </footer>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-container rounded-3xl border border-outline-variant/20 w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-high">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined">{editingService ? 'edit_document' : 'add_circle'}</span>
                </div>
                <div>
                  <h2 className="text-xl font-headline font-bold text-white max-w-[400px] truncate">
                    {editingService ? `Editar: ${editingService.title}` : 'Nuevo Servicio'}
                  </h2>
                  <p className="text-[10px] text-outline uppercase tracking-widest font-bold">Configuración de Catálogo</p>
                </div>
              </div>
              <button 
                onClick={handleCloseModal}
                className="w-10 h-10 rounded-full flex items-center justify-center text-outline hover:text-white hover:bg-white/10 transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-8 scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Título del Servicio</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Estrategia Digital"
                    value={formData.title || ''}
                    onChange={e => setFormData(prev => ({...prev, title: e.target.value}))}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3.5 text-sm text-white focus:ring-2 focus:ring-primary/40 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Icono (Material Symbol)</label>
                  <input 
                    type="text" 
                    placeholder="Ej. rocket_launch"
                    value={formData.icon || ''}
                    onChange={e => setFormData(prev => ({...prev, icon: e.target.value}))}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3.5 text-sm font-mono text-white focus:ring-2 focus:ring-primary/40 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Etiqueta (Badge)</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Alta Rentabilidad"
                    value={formData.tag || ''}
                    onChange={e => setFormData(prev => ({...prev, tag: e.target.value}))}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3.5 text-sm text-white focus:ring-2 focus:ring-primary/40 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Categoría</label>
                  <select 
                    value={formData.tagType || 'other'}
                    onChange={e => setFormData(prev => ({...prev, tagType: e.target.value as any}))}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3.5 text-sm text-white focus:ring-2 focus:ring-primary/40 outline-none transition-all"
                  >
                    <option value="profitability">Margen Alto (Violeta)</option>
                    <option value="operation">Operativo (Azul)</option>
                    <option value="entry">Puerta de Entrada (Blanco)</option>
                    <option value="continuity">Continuidad (Verde)</option>
                    <option value="other">Otros (Gris)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Valor Agregado (Propuesta de Valor)</label>
                <textarea 
                  value={formData.valueAdded || ''}
                  onChange={e => setFormData(prev => ({...prev, valueAdded: e.target.value}))}
                  className="w-full h-24 bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3.5 text-sm text-white focus:ring-2 focus:ring-primary/40 outline-none transition-all resize-none"
                  placeholder="Describe el beneficio principal..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Cliente Ideal</label>
                  <input 
                    type="text" 
                    value={formData.idealClient || ''}
                    onChange={e => setFormData(prev => ({...prev, idealClient: e.target.value}))}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3.5 text-sm text-white focus:ring-2 focus:ring-primary/40 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Ticket Promedio</label>
                  <input 
                    type="text" 
                    placeholder="Ej. $10k - $20k"
                    value={formData.avgTicket || ''}
                    onChange={e => setFormData(prev => ({...prev, avgTicket: e.target.value}))}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3.5 text-sm text-white focus:ring-2 focus:ring-primary/40 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Objeciones Frecuentes</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={objectionInput}
                    onChange={e => setObjectionInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && addObjection()}
                    className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3.5 text-sm text-white outline-none"
                    placeholder="Escribe una objeción y enter..."
                  />
                  <button 
                    onClick={addObjection}
                    className="bg-primary/20 text-primary px-4 rounded-xl hover:bg-primary/30 transition-all font-bold"
                  >
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.objections?.map((obj, i) => (
                    <div key={i} className="bg-surface-container-highest border border-outline-variant/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                      <span className="text-xs text-on-surface-variant truncate max-w-[200px]">{obj}</span>
                      <button onClick={() => removeObjection(i)} className="text-error hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-surface-container-high border-t border-outline-variant/10 flex justify-end gap-4">
              <button 
                onClick={handleCloseModal}
                className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-outline hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="bg-primary text-on-primary-container px-10 py-3 rounded-xl font-bold text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">check</span>
                {editingService ? 'Actualizar' : 'Crear Servicio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-surface-container rounded-[2rem] border border-outline-variant/20 w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center text-error mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              </div>
              <h2 className="text-2xl font-headline font-bold text-white mb-3">¿Estás seguro?</h2>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
                Esta acción eliminará el servicio <strong>"{services.find(s => s.id === deleteId)?.title}"</strong> de forma permanente. No se puede deshacer.
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmDelete}
                  className="w-full py-4 rounded-2xl bg-error text-white font-bold text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-error/20 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">delete_forever</span>
                  Sí, eliminar para siempre
                </button>
                <button 
                  onClick={() => setDeleteId(null)}
                  className="w-full py-4 rounded-2xl bg-surface-container-highest text-on-surface font-bold text-sm hover:bg-surface-container-highest/80 active:scale-95 transition-all"
                >
                  No, mantener servicio
                </button>
              </div>
            </div>
            <div className="bg-error/5 py-3 text-center border-t border-error/10">
              <span className="text-[10px] text-error/60 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                <span className="w-1 h-1 rounded-full bg-error/40 animate-pulse"></span>
                Acción Irreversible
                <span className="w-1 h-1 rounded-full bg-error/40 animate-pulse"></span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
