import React from 'react';
import { User } from '../types';
import { useLanguage } from '../i18n';

type NavView = 'dashboard' | 'contacts' | 'contact-details' | 'pipeline' | 'actividades';

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  onOpenNewContact: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  isOpen?: boolean;
  user: User | null;
}

export default function Sidebar({ currentView, onNavigate, onOpenNewContact, onOpenSettings, onLogout, isOpen = false, user }: SidebarProps) {
  const { t } = useLanguage();
  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  const navItem = (
    view: NavView,
    icon: string,
    label: string,
    extraActive?: NavView[]
  ) => {
    const isActive = currentView === view || extraActive?.includes(currentView);
    return (
      <button
        onClick={() => onNavigate(view)}
        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
          isActive
            ? 'text-[#D2BBFF] bg-primary/10 font-semibold'
            : 'text-[#958E9F] hover:text-[#CCC3D6] hover:bg-[#201F20]'
        }`}
      >
        <span
          className="material-symbols-outlined text-[20px]"
          style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
        >
          {icon}
        </span>
        <span className="text-sm">{label}</span>
        {isActive && <div className="ml-auto w-1 h-4 rounded-full bg-primary/60" />}
      </button>
    );
  };

  const sectionLabel = (label: string) => (
    <p className="px-3 pt-4 pb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-outline/50 select-none">
      {label}
    </p>
  );

  return (
    <aside className={`fixed md:sticky left-0 top-0 h-screen flex flex-col z-40 w-64 flex-shrink-0 border-r border-[#4A4453]/15 bg-[#1C1B1C] transition-transform duration-300 shadow-2xl shadow-black/40 font-['Manrope'] tracking-tight ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="p-5 flex-1 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-intelligence flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
            <span className="material-symbols-outlined text-on-primary-container text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>architecture</span>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-br from-[#D2BBFF] to-[#A376FF] bg-clip-text text-transparent leading-none">CRM Smart</h1>
            <p className="text-[9px] uppercase tracking-[0.2em] text-outline mt-0.5 font-semibold">Strategic Intelligence</p>
          </div>
        </div>

        <button
          onClick={onOpenNewContact}
          className="w-full bg-intelligence text-on-primary px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mb-5 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/10"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          {t('nav.new_contact', 'Nuevo Contacto')}
        </button>

        <nav>
          {sectionLabel('Principal')}
          {navItem('dashboard', 'dashboard', t('nav.dashboard', 'Dashboard'))}

          <div className="my-3 border-t border-[#4A4453]/15" />

          {sectionLabel(t('nav.section.management', 'Gestión'))}
          {navItem('pipeline', 'view_kanban', t('nav.pipeline', 'Pipeline'))}
          {navItem('contacts', 'person', t('nav.contacts', 'Contactos'), ['contact-details'])}

          <div className="my-3 border-t border-[#4A4453]/15" />

          {sectionLabel(t('nav.section.sales', 'Seguimiento'))}
          {navItem('actividades', 'event_note', t('nav.activities', 'Actividades'))}

          <div className="my-3 border-t border-[#4A4453]/15" />

          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-[#958E9F] hover:text-[#CCC3D6] hover:bg-[#201F20]"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span className="text-sm">{t('settings.title', 'Configuración')}</span>
          </button>
        </nav>
      </div>

      <div className="p-5 border-t border-[#4A4453]/15">
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all flex-shrink-0">
              <span className="text-primary text-xs font-bold">{user ? getInitials(user.name) : '??'}</span>
            </div>
            <div className="overflow-hidden text-left min-w-0">
              <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{user?.name || 'Usuario'}</p>
              <p className="text-[10px] text-outline truncate uppercase tracking-wider">{user?.role === 'admin' ? 'Strategic Admin' : 'Sales Executive'}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:bg-error/10 hover:text-error transition-colors flex-shrink-0"
            title="Cerrar Sesión"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
