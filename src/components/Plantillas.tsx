import React, { useState } from 'react';

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
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '' });

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEditClick = (template: Template) => {
    setEditingTemplate(template);
    setEditForm({ title: template.title, content: template.content });
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;
    setTemplates(templates.map(t => 
      t.id === editingTemplate.id 
        ? { ...t, title: editForm.title, content: editForm.content }
        : t
    ));
    setEditingTemplate(null);
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
      <div className="flex flex-col mb-8 md:mb-10">
        <h1 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface mb-2">Plantillas / Speech Comercial</h1>
        <p className="text-on-surface-variant max-w-2xl text-base md:text-lg">Estandarización de comunicaciones estratégicas para el equipo comercial de Lezac Consultoría.</p>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Left Column: Categories and Search (Asymmetric narrow) */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10">
            <h3 className="font-headline font-bold text-sm uppercase tracking-widest text-outline mb-6">Categorías</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-surface-container-high text-primary font-semibold transition-all">
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>handshake</span>
                  Primer Contacto
                </span>
                <span className="text-xs bg-primary-container/20 px-2 py-0.5 rounded text-primary">12</span>
              </button>
              <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-all">
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-sm">rebase_edit</span>
                  Seguimiento
                </span>
                <span className="text-xs bg-surface-container-highest px-2 py-0.5 rounded text-outline">08</span>
              </button>
              <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-all">
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-sm">groups</span>
                  Post Reunión
                </span>
                <span className="text-xs bg-surface-container-highest px-2 py-0.5 rounded text-outline">05</span>
              </button>
              <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-all">
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  Cierre de Trato
                </span>
                <span className="text-xs bg-surface-container-highest px-2 py-0.5 rounded text-outline">03</span>
              </button>
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
          {templates.map(template => (
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
                      <span className={`flex items-center gap-1 ${template.tagColorClass}`}>
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
                    <span className="hidden sm:inline">Editar Plantilla</span>
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
          ))}
        </div>
      </div>

      {/* Edit Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container rounded-2xl border border-outline-variant/20 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-high">
              <h2 className="text-xl font-headline font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_document</span>
                Editar Plantilla
              </h2>
              <button onClick={() => setEditingTemplate(null)} className="text-outline hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Título de la Plantilla</label>
                <input 
                  type="text" 
                  value={editForm.title}
                  onChange={e => setEditForm({...editForm, title: e.target.value})}
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-3 text-sm text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all outline-none"
                />
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider">Contenido del Speech</label>
                  <span className="text-[10px] text-primary-fixed-dim bg-primary/10 px-2 py-1 rounded">Usa {`{{Variable}}`} para campos dinámicos</span>
                </div>
                <textarea 
                  value={editForm.content}
                  onChange={e => setEditForm({...editForm, content: e.target.value})}
                  rows={12}
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-3 text-sm text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all outline-none font-body leading-relaxed resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant/10 bg-surface-container-high flex justify-end gap-3">
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
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
