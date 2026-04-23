import React, { useState, useEffect } from 'react';
import { CompanyConfig, User } from '../types';
import { pbService } from '../services/pbService';
import { useLanguage } from '../i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig?: CompanyConfig | null;
  onUpdate?: (config: CompanyConfig) => void;
  user: User | null;
}

type Section = 'empresa' | 'sistema' | 'etiquetas' | 'cargos' | 'usuarios';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, initialConfig, onUpdate, user }) => {
  const { lang, setLang, t } = useLanguage();
  const isAdmin = user?.role === 'admin';

  const NAV: { id: Section; icon: string; label: string }[] = [
    { id: 'empresa',   icon: 'business', label: t('settings.empresa',   'Empresa')   },
    { id: 'sistema',   icon: 'tune',     label: t('settings.sistema',   'Sistema')   },
    { id: 'etiquetas', icon: 'label',    label: t('settings.etiquetas', 'Etiquetas') },
    { id: 'cargos',    icon: 'badge',    label: t('settings.cargos',    'Cargos')    },
    { id: 'usuarios',  icon: 'group',    label: t('settings.usuarios',  'Usuarios')  },
  ].filter(item => item.id !== 'usuarios' || isAdmin);
  const [config, setConfig] = useState<CompanyConfig>({ name: '', rubro: '', tags: [], jobTitles: [], extraInfo: '', showBudget: true });
  const [section, setSection] = useState<Section>('empresa');
  const [newTag, setNewTag] = useState('');
  const [newJobTitle, setNewJobTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Usuarios
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' as 'admin' | 'user' });
  const [userError, setUserError] = useState('');
  const [userSaving, setUserSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSaved(false);
    if (initialConfig) {
      setConfig({ ...initialConfig, tags: initialConfig.tags || [], jobTitles: initialConfig.jobTitles || [] });
    } else {
      loadConfig();
    }
  }, [isOpen, initialConfig]);

  useEffect(() => {
    if (isOpen && section === 'usuarios') loadUsers();
  }, [isOpen, section]);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const list = await pbService.getUsers();
      setUsers(list);
    } catch {}
    finally { setUsersLoading(false); }
  };

  const handleCreateUser = async () => {
    setUserError('');
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      setUserError('Nombre, email y contraseña son obligatorios.');
      return;
    }
    setUserSaving(true);
    try {
      const created = await pbService.createUser(newUser.name.trim(), newUser.email.trim(), newUser.password, newUser.role);
      setUsers(u => [created, ...u]);
      setNewUser({ name: '', email: '', password: '', role: 'user' });
    } catch (e: any) {
      setUserError(e?.data?.message || e?.message || 'Error al crear usuario.');
    } finally { setUserSaving(false); }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await pbService.deleteUser(id);
      setUsers(u => u.filter(x => x.id !== id));
    } catch (e: any) {
      setUserError(e?.data?.message || e?.message || 'Error al eliminar usuario.');
    }
  };

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const data = await pbService.getConfig();
      if (data) setConfig({ ...data, tags: data.tags || [], jobTitles: data.jobTitles || [] });
    } catch {}
    finally { setIsLoading(false); }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await pbService.updateConfig(config);
      if (onUpdate) onUpdate(config);
      setSaved(true);
      setTimeout(() => { onClose(); setSaved(false); }, 1200);
    } catch {}
    finally { setIsLoading(false); }
  };

  const addTag = () => {
    const t = newTag.trim();
    if (t && !config.tags.includes(t)) { setConfig(c => ({ ...c, tags: [...c.tags, t] })); setNewTag(''); }
  };
  const removeTag = (t: string) => setConfig(c => ({ ...c, tags: c.tags.filter(x => x !== t) }));

  const addJob = () => {
    const t = newJobTitle.trim();
    if (t && !(config.jobTitles || []).includes(t)) { setConfig(c => ({ ...c, jobTitles: [...(config.jobTitles || []), t] })); setNewJobTitle(''); }
  };
  const removeJob = (t: string) => setConfig(c => ({ ...c, jobTitles: (config.jobTitles || []).filter(x => x !== t) }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Panel */}
      <div className="bg-[#1C1B1C] w-full sm:max-w-2xl sm:rounded-3xl overflow-hidden flex flex-col border border-[#4A4453]/20 shadow-2xl shadow-black/60"
           style={{ height: '600px', maxHeight: '92vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#4A4453]/15">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-none">Configuración</h2>
              <p className="text-[10px] text-outline mt-0.5 uppercase tracking-widest">{config.name || 'Sin nombre'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-white hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar nav — desktop only */}
          <nav className="hidden sm:flex flex-col w-44 border-r border-[#4A4453]/15 p-3 gap-0.5 flex-shrink-0">
            {NAV.map(n => (
              <button key={n.id} onClick={() => setSection(n.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
                  section === n.id ? 'bg-primary/10 text-primary font-semibold' : 'text-[#958E9F] hover:text-[#CCC3D6] hover:bg-white/5'
                }`}>
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: section === n.id ? "'FILL' 1" : "'FILL' 0" }}>{n.icon}</span>
                {n.label}
              </button>
            ))}
          </nav>

          {/* Mobile tab strip */}
          <div className="sm:hidden absolute left-0 right-0 bg-[#1C1B1C] z-10" style={{ top: '65px' }}>
            <div className="flex border-b border-[#4A4453]/15 px-2 overflow-x-auto no-scrollbar">
              {NAV.map(n => (
                <button key={n.id} onClick={() => setSection(n.id)}
                  className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                    section === n.id ? 'text-primary border-b-2 border-primary' : 'text-outline'
                  }`}>
                  {n.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto sm:pt-0 pt-12">
            {isLoading && !config.name ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <div className="p-5 space-y-1">

                {section === 'empresa' && (
                  <>
                    <SectionHeader label="Identidad de la empresa" />
                    <Row label="Nombre" icon="domain">
                      <input value={config.name} onChange={e => setConfig(c => ({ ...c, name: e.target.value }))}
                        disabled={!isAdmin}
                        className="bg-transparent text-right text-sm text-white placeholder:text-outline/40 outline-none w-full max-w-[200px] disabled:opacity-50"
                        placeholder="Mi Empresa S.A." />
                    </Row>
                    <Row label="Rubro / Sector" icon="category">
                      <input value={config.rubro} onChange={e => setConfig(c => ({ ...c, rubro: e.target.value }))}
                        disabled={!isAdmin}
                        className="bg-transparent text-right text-sm text-white placeholder:text-outline/40 outline-none w-full max-w-[200px] disabled:opacity-50"
                        placeholder="Ej: Tecnología" />
                    </Row>
                    <div className="pt-4 pb-1">
                      <p className="text-[10px] uppercase tracking-widest text-outline/50 font-semibold px-1 mb-2">Notas internas</p>
                      <textarea value={config.extraInfo} onChange={e => setConfig(c => ({ ...c, extraInfo: e.target.value }))}
                        rows={4}
                        disabled={!isAdmin}
                        className="w-full bg-[#131314] text-sm text-[#CCC3D6] placeholder:text-outline/30 outline-none rounded-2xl px-4 py-3 resize-none border border-[#4A4453]/20 focus:border-primary/40 transition-colors disabled:opacity-50"
                        placeholder="Información adicional sobre la empresa o el equipo..." />
                    </div>
                  </>
                )}

                {section === 'sistema' && (
                  <>
                    <SectionHeader label={t('settings.sistema.prefs', 'Preferencias')} />
                    <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-[#131314] border border-[#4A4453]/15">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[20px] text-outline" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                        <div>
                          <p className="text-sm font-medium text-white">{t('settings.sistema.budget_module', 'Módulo de Presupuesto')}</p>
                          <p className="text-[11px] text-outline mt-0.5">{t('settings.sistema.budget_desc', 'Visible en la etapa Propuesta')}</p>
                        </div>
                      </div>
                      <button type="button" 
                        onClick={() => isAdmin && setConfig(c => ({ ...c, showBudget: !c.showBudget }))}
                        disabled={!isAdmin}
                        className={`relative inline-flex h-6 w-11 rounded-full transition-colors flex-shrink-0 ${config.showBudget ? 'bg-primary' : 'bg-[#4A4453]/50'} disabled:opacity-50`}>
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${config.showBudget ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-[#131314] border border-[#4A4453]/15 mt-2">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[20px] text-outline" style={{ fontVariationSettings: "'FILL' 1" }}>translate</span>
                        <div>
                          <p className="text-sm font-medium text-white">{t('settings.sistema.language', 'Idioma')}</p>
                          <p className="text-[11px] text-outline mt-0.5">{t('settings.sistema.language_desc', 'Idioma de la interfaz')}</p>
                        </div>
                      </div>
                      <div className="flex rounded-xl overflow-hidden border border-[#4A4453]/20">
                        {(['es', 'en'] as const).map(l => (
                          <button key={l} type="button" 
                            onClick={() => isAdmin && setLang(l)}
                            disabled={!isAdmin}
                            className={`px-3 py-1.5 text-xs font-bold transition-colors ${lang === l ? 'bg-primary text-on-primary' : 'text-outline hover:text-white hover:bg-white/5'} disabled:opacity-50`}>
                            {l.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {section === 'etiquetas' && (
                  <>
                    <SectionHeader label="Clasificación de notas" />
                    <p className="text-[11px] text-outline px-1 pb-2">Usadas para categorizar seguimientos en las etapas de venta.</p>
                    <div className="flex gap-2 mb-3">
                      <input value={newTag} onChange={e => setNewTag(e.target.value)}
                        disabled={!isAdmin}
                        onKeyDown={e => e.key === 'Enter' && isAdmin && (e.preventDefault(), addTag())}
                        className="flex-1 bg-[#131314] border border-[#4A4453]/20 focus:border-primary/40 transition-colors text-sm text-white placeholder:text-outline/30 rounded-xl px-4 py-2.5 outline-none disabled:opacity-50"
                        placeholder="Nueva etiqueta..." />
                      <button type="button" onClick={addTag}
                        disabled={!isAdmin}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/15 text-primary hover:bg-primary/25 transition-colors flex-shrink-0 disabled:opacity-50">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {config.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-primary/10 text-primary text-sm rounded-full border border-primary/15 group">
                          {tag}
                          {isAdmin && (
                            <button type="button" onClick={() => removeTag(tag)}
                              className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-error/20 hover:text-error transition-colors">
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          )}
                        </span>
                      ))}
                      {config.tags.length === 0 && <p className="text-outline/40 text-sm italic px-1">Sin etiquetas configuradas.</p>}
                    </div>
                  </>
                )}

                {section === 'usuarios' && (
                  <>
                    <SectionHeader label="Usuarios del CRM" />
                    <p className="text-[11px] text-outline px-1 pb-3">Creá usuarios y asignales un rol para acceder al sistema.</p>

                    {/* Formulario nuevo usuario */}
                    <div className="bg-[#131314] border border-[#4A4453]/20 rounded-2xl p-4 space-y-3 mb-4">
                      <p className="text-[11px] uppercase tracking-widest text-outline/50 font-bold">Nuevo usuario</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input value={newUser.name} onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))}
                          className="sm:col-span-2 bg-[#1C1B1C] border border-[#4A4453]/20 focus:border-primary/40 transition-colors text-sm text-white placeholder:text-outline/30 rounded-xl px-3 py-2.5 outline-none"
                          placeholder="Nombre completo" />
                        <input value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))}
                          type="email"
                          className="bg-[#1C1B1C] border border-[#4A4453]/20 focus:border-primary/40 transition-colors text-sm text-white placeholder:text-outline/30 rounded-xl px-3 py-2.5 outline-none"
                          placeholder="Email" />
                        <input value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))}
                          type="password"
                          className="bg-[#1C1B1C] border border-[#4A4453]/20 focus:border-primary/40 transition-colors text-sm text-white placeholder:text-outline/30 rounded-xl px-3 py-2.5 outline-none"
                          placeholder="Contraseña" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex rounded-xl overflow-hidden border border-[#4A4453]/20 flex-1">
                          {(['user', 'admin'] as const).map(r => (
                            <button key={r} type="button"
                              onClick={() => setNewUser(u => ({ ...u, role: r }))}
                              className={`flex-1 py-2 text-xs font-semibold transition-colors ${newUser.role === r ? 'bg-primary text-on-primary' : 'text-outline hover:text-white hover:bg-white/5'}`}>
                              {r === 'admin' ? 'Admin' : 'Usuario'}
                            </button>
                          ))}
                        </div>
                        <button type="button" onClick={handleCreateUser} disabled={userSaving}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50 flex-shrink-0">
                          {userSaving
                            ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                            : <span className="material-symbols-outlined text-[16px]">person_add</span>}
                          Crear
                        </button>
                      </div>
                      {userError && <p className="text-xs text-red-400 px-1">{userError}</p>}
                    </div>

                    {/* Lista de usuarios */}
                    {usersLoading ? (
                      <div className="flex items-center justify-center h-20">
                        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {users.map(u => (
                          <div key={u.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#131314] border border-[#4A4453]/15">
                            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                              <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{u.name}</p>
                              <p className="text-[11px] text-outline truncate">{u.email}</p>
                            </div>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-amber-500/15 text-amber-400' : 'bg-primary/10 text-primary'}`}>
                              {u.role === 'admin' ? 'Admin' : 'Usuario'}
                            </span>
                            <button type="button" onClick={() => handleDeleteUser(u.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-outline hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0">
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        ))}
                        {users.length === 0 && <p className="text-outline/40 text-sm italic px-1">Sin usuarios creados.</p>}
                      </div>
                    )}
                  </>
                )}

                {section === 'cargos' && (
                  <>
                    <SectionHeader label="Cargos predefinidos" />
                    <p className="text-[11px] text-outline px-1 pb-2">Se muestran como opciones al crear un nuevo contacto.</p>
                    <div className="flex gap-2 mb-3">
                      <input value={newJobTitle} onChange={e => setNewJobTitle(e.target.value)}
                        disabled={!isAdmin}
                        onKeyDown={e => e.key === 'Enter' && isAdmin && (e.preventDefault(), addJob())}
                        className="flex-1 bg-[#131314] border border-[#4A4453]/20 focus:border-primary/40 transition-colors text-sm text-white placeholder:text-outline/30 rounded-xl px-4 py-2.5 outline-none disabled:opacity-50"
                        placeholder="CEO, Gerente, Director..." />
                      <button type="button" onClick={addJob}
                        disabled={!isAdmin}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-secondary/15 text-secondary hover:bg-secondary/25 transition-colors flex-shrink-0 disabled:opacity-50">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(config.jobTitles || []).map(title => (
                        <span key={title} className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-secondary/10 text-secondary text-sm rounded-full border border-secondary/15">
                          {title}
                          {isAdmin && (
                            <button type="button" onClick={() => removeJob(title)}
                              className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-error/20 hover:text-error transition-colors">
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          )}
                        </span>
                      ))}
                      {(!config.jobTitles || config.jobTitles.length === 0) && <p className="text-outline/40 text-sm italic px-1">Sin cargos configurados.</p>}
                    </div>
                  </>
                )}

              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#4A4453]/15 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl text-sm text-outline hover:text-white hover:bg-white/5 transition-colors font-medium">
            {section === 'usuarios' || !isAdmin ? 'Cerrar' : 'Cancelar'}
          </button>
          {section !== 'usuarios' && isAdmin && <button onClick={handleSave} disabled={isLoading}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-lg ${
              saved ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-primary text-on-primary hover:brightness-110 active:scale-95 shadow-primary/10'
            } disabled:opacity-50 disabled:pointer-events-none`}>
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : saved ? (
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            ) : (
              <span className="material-symbols-outlined text-[16px]">save</span>
            )}
            {saved ? 'Guardado' : 'Guardar'}
          </button>}
        </div>
      </div>
    </div>
  );
};

function SectionHeader({ label }: { label: string }) {
  return <p className="text-[10px] uppercase tracking-widest text-outline/50 font-bold px-1 pt-1 pb-2">{label}</p>;
}

function Row({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-white/3 transition-colors group">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-[18px] text-outline/60">{icon}</span>
        <span className="text-sm text-[#CCC3D6]">{label}</span>
      </div>
      <div className="flex items-center gap-1 text-outline/60 group-focus-within:text-white transition-colors">
        {children}
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
      </div>
    </div>
  );
}
