import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { CompanyConfig } from '../types';
import { pbService } from '../services/pbService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig?: CompanyConfig | null;
  onUpdate?: (config: CompanyConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, initialConfig, onUpdate }) => {
  const [config, setConfig] = useState<CompanyConfig>({
    name: '',
    rubro: '',
    tags: [],
    jobTitles: [],
    extraInfo: '',
    showBudget: true
  });
  const [newTag, setNewTag] = useState('');
  const [newJobTitle, setNewJobTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialConfig) {
        setConfig({
          ...initialConfig,
          tags: initialConfig.tags || [],
          jobTitles: initialConfig.jobTitles || []
        });
      } else {
        loadConfig();
      }
    }
  }, [isOpen, initialConfig]);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const data = await pbService.getConfig();
      if (data) {
        setConfig({
          ...data,
          tags: data.tags || [],
          jobTitles: data.jobTitles || []
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    try {
      await pbService.updateConfig(config);
      setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
      if (onUpdate) onUpdate(config);
      // Optional: close after delay
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 1500);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar la configuración' });
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !config.tags.includes(newTag.trim())) {
      setConfig({ ...config, tags: [...config.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setConfig({ ...config, tags: config.tags.filter(t => t !== tagToRemove) });
  };

  const addJobTitle = () => {
    if (newJobTitle.trim() && !config.jobTitles.includes(newJobTitle.trim())) {
      setConfig({ ...config, jobTitles: [...config.jobTitles, newJobTitle.trim()] });
      setNewJobTitle('');
    }
  };

  const removeJobTitle = (titleToRemove: string) => {
    setConfig({ ...config, jobTitles: config.jobTitles.filter(t => t !== titleToRemove) });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-low rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-outline-variant/10">
        <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-high text-white">
          <div>
            <h2 className="text-2xl font-bold">Configuración de la Empresa</h2>
            <p className="text-outline text-sm">Gestiona la información básica y etiquetas del CRM</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8">
          {message && (
            <div className={`p-4 rounded-xl flex items-center gap-3 ${
              message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-error/10 text-error border border-error/20'
            }`}>
              <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-green-500' : 'bg-error'}`} />
              <p className="font-medium text-sm">{message.text}</p>
            </div>
          )}

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full" />
              Información Básica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-outline">Nombre de la Empresa</label>
                <input
                  type="text"
                  value={config.name}
                  onChange={e => setConfig({ ...config, name: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-container border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-white placeholder:text-outline/40"
                  placeholder="Ej: Mi Empresa S.A."
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-outline">Rubro / Sector</label>
                <input
                  type="text"
                  value={config.rubro}
                  onChange={e => setConfig({ ...config, rubro: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-container border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-white placeholder:text-outline/40"
                  placeholder="Ej: Tecnología, Salud, etc."
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-outline">Información Adicional</label>
                <textarea
                  value={config.extraInfo}
                  onChange={e => setConfig({ ...config, extraInfo: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-container border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none min-h-[100px] text-white placeholder:text-outline/40"
                  placeholder="Cualquier otro dato relevante..."
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full" />
              Preferencias del Sistema
            </h3>
            <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white">Habilitar Presupuesto</h4>
                  <p className="text-sm text-outline">Mostrar la sección de presupuesto en la etapa de Propuesta</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, showBudget: !config.showBudget })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    config.showBudget ? 'bg-primary' : 'bg-outline-variant/40'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.showBudget ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full" />
              Etiquetas para Observaciones
            </h3>
            <p className="text-sm text-outline">Estas etiquetas se utilizarán para clasificar las notas en las etapas de venta.</p>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-4 py-3 bg-surface-container border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-white placeholder:text-outline/40"
                placeholder="Nueva etiqueta..."
              />
              <button
                type="button"
                onClick={addTag}
                className="bg-primary text-on-primary px-6 py-3 rounded-xl font-semibold hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-primary/10"
              >
                <Plus size={20} />
                Agregar
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {config.tags.map(tag => (
                <span 
                  key={tag}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full group hover:bg-error/10 hover:text-error transition-all cursor-default border border-primary/20 hover:border-error/20"
                >
                  <span className="font-medium">{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="p-0.5 rounded-full hover:bg-error/20 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              ))}
              {config.tags.length === 0 && (
                <p className="text-gray-400 italic text-sm">No hay etiquetas configuradas.</p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full" />
              Cargos Predefinidos
            </h3>
            <p className="text-sm text-outline">Define los cargos que se podrán seleccionar al crear un nuevo contacto.</p>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newJobTitle}
                onChange={e => setNewJobTitle(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addJobTitle())}
                className="flex-1 px-4 py-3 bg-surface-container border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-white placeholder:text-outline/40"
                placeholder="Nuevo cargo (ej: CEO, Gerente...)"
              />
              <button
                type="button"
                onClick={addJobTitle}
                className="bg-primary text-on-primary px-6 py-3 rounded-xl font-semibold hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-primary/10"
              >
                <Plus size={20} />
                Agregar
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {config.jobTitles?.map(title => (
                <span 
                  key={title}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-full group hover:bg-error/10 hover:text-error transition-all cursor-default border border-secondary/20 hover:border-error/20"
                >
                  <span className="font-medium">{title}</span>
                  <button
                    type="button"
                    onClick={() => removeJobTitle(title)}
                    className="p-0.5 rounded-full hover:bg-error/20 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              ))}
              {(!config.jobTitles || config.jobTitles.length === 0) && (
                <p className="text-outline/60 italic text-sm">No hay cargos configurados.</p>
              )}
            </div>
          </section>
        </form>

        <div className="p-6 border-t border-outline-variant/10 bg-surface-container-low flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-outline font-semibold hover:bg-surface-container-high rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            ) : (
              <Save size={20} />
            )}
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};
