import React, { useState, useEffect } from 'react';

interface Template {
  id: number;
  title: string;
  icon: string;
  readTime: string;
  tagLabel: string;
  tagIcon: string;
  tagColorClass: string;
  content: string;
}

const STORAGE_KEY = 'crm_smart_templates_v1';

const INITIAL_TEMPLATES: Template[] = [
  {
    id: 1,
    title: 'Introducción Servicios Consultoría',
    icon: 'chat_bubble',
    readTime: '1 min',
    tagLabel: 'Alta Conversión',
    tagIcon: 'bolt',
    tagColorClass: 'text-secondary',
    content: `Hola {{Nombre_Contacto}},\n\nEs un gusto saludarte. He estado siguiendo de cerca el crecimiento de {{Empresa}} y noto un gran potencial para optimizar sus procesos de inteligencia estratégica.\n\nEn Lezac Consultoría, nos especializamos en {{Servicio_Interes}} ayudando a empresas del sector a incrementar su eficiencia operativa en un 30%.\n\n¿Tendrías 10 minutos la próxima semana para una breve llamada de exploración? Me encantaría compartirte algunos insights específicos para tu modelo de negocio.\n\nSaludos cordiales,\n{{Consultor_Asignado}}`
  },
  {
    id: 2,
    title: 'Seguimiento LinkedIn - Lead Tibio',
    icon: 'forward_to_inbox',
    readTime: '45 seg',
    tagLabel: 'LinkedIn Standard',
    tagIcon: 'language',
    tagColorClass: '',
    content: `Hola {{Nombre_Contacto}}, gracias por conectar.\n\nVi que compartiste contenido sobre la transformación digital en {{Empresa}} y me pareció muy alineado a lo que estamos construyendo en Lezac.\n\nQuedo a tu disposición si en algún momento necesitas una perspectiva externa sobre {{Servicio_Interes}}. ¡Seguimos en contacto por aquí!`
  },
  {
    id: 3,
    title: 'Resumen Post-Reunión y Siguientes Pasos',
    icon: 'mark_email_read',
    readTime: '2 min',
    tagLabel: 'Crítico',
    tagIcon: 'priority_high',
    tagColorClass: 'text-secondary',
    content: `Estimado {{Nombre_Contacto}},\n\nMuchas gracias por el tiempo brindado hoy {{Fecha_Reunion}}. Me ha quedado muy clara la visión de {{Empresa}}.\n\nTal como acordamos, los siguientes pasos son:\n- Envío de propuesta técnica personalizada.\n- Validación de presupuestos con dirección.\n- Agendar demo técnica para el equipo.\n\nQuedo atento a cualquier duda adicional.`
  }
];

export default function Plantillas() {
  const [templates, setTemplates] = useState<Template[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_TEMPLATES;
  });
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  const [editForm, setEditForm] = useState({ 
    title: '', 
    content: '',
    icon: 'chat_bubble',
    tagLabel: 'General',
    tagIcon: 'label',
    readTime: '1 min'
  });

  // State for Custom Confirm Modal
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  }, [templates]);

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEditClick = (template: Template) => {
    setIsNew(false);
    setEditingTemplate(template);
    setEditForm({ 
      title: template.title, 
      content: template.content,
      icon: template.icon,
      tagLabel: template.tagLabel,
      tagIcon: template.tagIcon,
      readTime: template.readTime
    });
  };

  const handleAddNew = () => {
    setIsNew(true);
    setEditingTemplate({
      id: Date.now(),
      title: '',
      content: '',
      icon: 'chat_bubble',
      tagLabel: 'Nuevo',
      tagIcon: 'new_releases',
      tagColorClass: 'text-primary',
      readTime: '1 min'
    });
    setEditForm({
      title: '',
      content: '',
      icon: 'chat_bubble',
      tagLabel: 'Nuevo',
      tagIcon: 'new_releases',
      readTime: '1 min'
    });
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;
    if (!editForm.title.trim()) {
      alert('El título es requerido');
      return;
    }
    
    if (isNew) {
      const newTemplate: Template = {
        ...editingTemplate,
        id: Date.now(),
        title: editForm.title,
        content: editForm.content,
        icon: editForm.icon,
        tagLabel: editForm.tagLabel,
        tagIcon: editForm.tagIcon,
        readTime: editForm.readTime
      };
      setTemplates(prev => [newTemplate, ...prev]);
    } else {
      setTemplates(prev => prev.map(t => 
        t.id === editingTemplate.id 
          ? { 
              ...t, 
              title: editForm.title, 
              content: editForm.content,
              icon: editForm.icon,
              tagLabel: editForm.tagLabel,
              tagIcon: editForm.tagIcon,
              readTime: editForm.readTime
            }
          : t
      ));
    }
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      setTemplates(templates.filter(t => t.id !== deleteId));
      setDeleteId(null);
      setEditingTemplate(null);
    }
  };

  const renderContent = (text: string) => {
    return text.split('\n\n').map((paragraph, i) => (
      <p key={i} className="mb-4 whitespace-pre-wrap">
        {paragraph.split(/(\{\{[^}]+\}\})/g).map((part, j) => {
          if (part.startsWith('{{') && part.endsWith('}}')) {
            return <span key={j} className="bg-primary/20 text-primary-fixed-dim px-1 rounded font-mono">{part}</span>;
          }
          return part;
        })}
      </p>
    ));
  };

  return (
    <div className="pt-6 px-4 md:pt-8 md:px-8 pb-24 md:pb-12 min-h-screen relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-10">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface mb-2">Plantillas / Speech Comercial</h1>
          <p className="text-on-surface-variant max-w-2xl text-base md:text-lg">Estandarización de comunicaciones estratégicas para el equipo comercial de Lezac Consultoría.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-primary text-on-primary-container px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Nueva Plantilla
        </button>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Left Column: Categories and Search (Asymmetric narrow) */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10">
            <div className="mb-6">
              <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1 mb-2 block">Buscar Plantilla</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
                <input 
                  type="text" 
                  placeholder="Ej: Seguimiento..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:ring-1 focus:ring-primary/50 outline-none transition-all font-body"
                />
              </div>
            </div>

            <h3 className="font-headline font-bold text-sm uppercase tracking-widest text-outline mb-4">Categorías</h3>
            <div className="space-y-1">
              {[
                { name: 'All', label: 'Todas', icon: 'apps' },
                { name: 'Primer Contacto', label: 'Primer Contacto', icon: 'handshake' },
                { name: 'Seguimiento', label: 'Seguimientoo', icon: 'rebase_edit' },
                { name: 'Post Reunión', label: 'Post Reunión', icon: 'groups' },
                { name: 'Cierre', label: 'Cierre de Trato', icon: 'verified' }
              ].map(cat => (
                <button 
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                    activeCategory === cat.name 
                      ? 'bg-primary/20 text-primary font-bold border border-primary/20' 
                      : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: activeCategory === cat.name ? "'FILL' 1" : "'FILL' 0" }}>{cat.icon}</span>
                    <span className="text-sm">{cat.label}</span>
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${activeCategory === cat.name ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-outline'}`}>
                    {cat.name === 'All' ? templates.length : templates.filter(t => t.tagLabel === cat.name || (cat.name === 'Cierre' && t.tagLabel === 'Cierre de Trato')).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
            <h3 className="font-headline font-bold text-sm uppercase tracking-widest text-outline mb-4">Variables Dinámicas</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-surface-container-highest rounded-full text-xs text-primary-fixed-dim font-mono">{`{{Nombre_Contacto}}`}</span>
              <span className="px-3 py-1 bg-surface-container-highest rounded-full text-xs text-primary-fixed-dim font-mono">{`{{Empresa}}`}</span>
              <span className="px-3 py-1 bg-surface-container-highest rounded-full text-xs text-primary-fixed-dim font-mono">{`{{Servicio_Interes}}`}</span>
              <span className="px-3 py-1 bg-surface-container-highest rounded-full text-xs text-primary-fixed-dim font-mono">{`{{Fecha_Reunion}}`}</span>
              <span className="px-3 py-1 bg-surface-container-highest rounded-full text-xs text-primary-fixed-dim font-mono">{`{{Consultor_Asignado}}`}</span>
            </div>
            <p className="mt-4 text-[11px] text-outline leading-relaxed italic">Las variables se autocompletarán con la información del CRM al copiar.</p>
          </div>
        </div>

        {/* Right Column: Templates Feed (Asymmetric wide) */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          {(() => {
            const filtered = templates.filter(t => {
              const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                   t.content.toLowerCase().includes(searchQuery.toLowerCase());
              const matchesCategory = activeCategory === 'All' || 
                                     t.tagLabel === activeCategory || 
                                     (activeCategory === 'Cierre' && t.tagLabel === 'Cierre de Trato');
              return matchesSearch && matchesCategory;
            });

            if (filtered.length === 0) {
              return (
                <div className="bg-surface-container/50 border-2 border-dashed border-outline-variant/20 rounded-2xl p-20 text-center">
                  <span className="material-symbols-outlined text-6xl text-outline mb-4">search_off</span>
                  <h3 className="text-xl font-headline font-bold text-on-surface mb-2">Sin resultados</h3>
                  <p className="text-outline max-w-sm mx-auto mb-8">No encontramos ninguna plantilla que coincida con tus filtros actuales.</p>
                  <button 
                    onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                    className="text-primary font-bold hover:underline"
                  >
                    Limpiar filtros
                  </button>
                </div>
              );
            }

            return filtered.map(template => (
              <div key={template.id} className="bg-surface-container rounded-xl overflow-hidden border border-outline-variant/5 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                <div className="p-4 md:p-6 border-b border-outline-variant/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-start sm:items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{template.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-base md:text-lg text-on-surface">{template.title}</h4>
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs text-outline mt-0.5">
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span> Lectura {template.readTime}</span>
                        <span className={`flex items-center gap-1 ${template.tagColorClass || 'text-outline'}`}>
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{template.tagIcon}</span> 
                          {template.tagLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <button 
                      onClick={() => handleEditClick(template)}
                      className="flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-lg border border-primary/20 text-primary-fixed-dim text-xs md:text-sm font-semibold hover:bg-primary/5 transition-colors flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px] sm:hidden">edit</span>
                      <span className="hidden sm:inline">Editar</span>
                      <span className="sm:hidden">Editar</span>
                    </button>
                    <button 
                      onClick={() => handleCopy(template.id, template.content)}
                      className="flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-lg bg-primary text-on-primary-container text-xs md:text-sm font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">{copiedId === template.id ? 'check' : 'content_copy'}</span>
                      {copiedId === template.id ? 'Copiado!' : <><span className="hidden sm:inline">Copiar Speech</span><span className="sm:hidden">Copiar</span></>}
                    </button>
                  </div>
                </div>
                <div className="p-4 md:p-8 bg-surface-container-lowest/40 font-body text-sm md:text-base text-on-surface-variant leading-relaxed">
                  {renderContent(template.content)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container rounded-2xl border border-outline-variant/20 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-high">
              <h2 className="text-xl font-headline font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  {isNew ? 'add_circle' : 'edit_document'}
                </span>
                {isNew ? 'Nueva Plantilla' : 'Editar Plantilla'}
              </h2>
              <button onClick={() => setEditingTemplate(null)} className="text-outline hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Título de la Plantilla</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Seguimiento WhatsApp"
                    value={editForm.title}
                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-3 text-sm text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Etiqueta (Tag)</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Alta Conversión"
                    value={editForm.tagLabel}
                    onChange={e => setEditForm({...editForm, tagLabel: e.target.value})}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-3 text-sm text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Tiempo de Lectura</label>
                  <input 
                    type="text" 
                    placeholder="Ej: 1 min"
                    value={editForm.readTime}
                    onChange={e => setEditForm({...editForm, readTime: e.target.value})}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-3 text-sm text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider">Contenido del Speech</label>
                  <span className="text-[10px] text-primary-fixed-dim bg-primary/10 px-2 py-1 rounded">Usa {`{{Variable}}`} para campos dinámicos</span>
                </div>
                <textarea 
                  placeholder="Escribe el speech aquí..."
                  value={editForm.content}
                  onChange={e => setEditForm({...editForm, content: e.target.value})}
                  rows={8}
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-3 text-sm text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all outline-none font-body leading-relaxed resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-outline-variant/10 bg-surface-container-high flex justify-between items-center">
              {!isNew && (
                <button 
                  onClick={() => handleDeleteTemplate(editingTemplate.id)}
                  className="px-4 py-2 rounded-lg font-semibold text-sm text-error hover:bg-error/10 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  Eliminar
                </button>
              )}
              <div className="flex gap-3 ml-auto">
                <button 
                  onClick={() => setEditingTemplate(null)}
                  className="px-6 py-2.5 rounded-lg font-semibold text-sm text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveTemplate}
                  className="px-6 py-2.5 rounded-lg font-bold text-sm bg-primary text-on-primary-container hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-surface-container rounded-3xl border border-error/20 w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center text-error mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              </div>
              <h2 className="text-2xl font-headline font-bold text-white mb-3">¿Estás seguro?</h2>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
                Esta acción eliminará permanentemente la plantilla <strong>"{templates.find(t => t.id === deleteId)?.title}"</strong> y no podrá ser recuperada.
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
                  No, mantener plantilla
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
