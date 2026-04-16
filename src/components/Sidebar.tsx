import React from 'react';
import { User } from '../types';

interface SidebarProps {
  currentView: 'dashboard' | 'contacts' | 'contact-details' | 'servicios' | 'plantillas';
  onNavigate: (view: 'dashboard' | 'contacts' | 'contact-details' | 'servicios' | 'plantillas') => void;
  onOpenNewContact: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  isOpen?: boolean;
  user: User | null;
}

export default function Sidebar({ currentView, onNavigate, onOpenNewContact, onOpenSettings, onLogout, isOpen = false, user }: SidebarProps) {
  // Get initials from user name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <aside className={`fixed left-0 top-0 h-screen flex flex-col z-40 w-64 border-r border-[#4A4453]/15 bg-[#1C1B1C] transition-transform duration-300 shadow-2xl shadow-black/40 font-['Manrope'] tracking-tight ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-intelligence flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>architecture</span>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-br from-[#D2BBFF] to-[#A376FF] bg-clip-text text-transparent leading-none">CRM Smart</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-outline mt-1 font-semibold">Strategic Intelligence</p>
          </div>
        </div>
        
        <button 
          onClick={onOpenNewContact}
          className="w-full bg-intelligence text-on-primary px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mb-8 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/10"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Nuevo Contacto
        </button>
        
        <nav className="space-y-1">
          <button 
            onClick={() => onNavigate('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
              currentView === 'dashboard' 
                ? 'text-[#D2BBFF] bg-[#2A2A2B] font-semibold border-r-2 border-[#A071FF] rounded-r-none' 
                : 'text-[#958E9F] hover:text-[#CCC3D6] hover:bg-[#201F20]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span className="text-sm">Dashboard</span>
          </button>
          
          <button 
            onClick={() => onNavigate('contacts')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
              (currentView === 'contacts' || currentView === 'contact-details')
                ? 'text-[#D2BBFF] bg-[#2A2A2B] font-semibold border-r-2 border-[#A071FF] rounded-r-none' 
                : 'text-[#958E9F] hover:text-[#CCC3D6] hover:bg-[#201F20]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: (currentView === 'contacts' || currentView === 'contact-details') ? "'FILL' 1" : "'FILL' 0" }}>person</span>
            <span className="text-sm">Contactos</span>
          </button>
          
          <button 
            onClick={() => onNavigate('servicios')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
              currentView === 'servicios'
                ? 'text-[#D2BBFF] bg-[#2A2A2B] font-semibold border-r-2 border-[#A071FF] rounded-r-none' 
                : 'text-[#958E9F] hover:text-[#CCC3D6] hover:bg-[#201F20]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: currentView === 'servicios' ? "'FILL' 1" : "'FILL' 0" }}>design_services</span>
            <span className="text-sm">Servicios</span>
          </button>
          
          <button 
            onClick={() => onNavigate('plantillas')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
              currentView === 'plantillas'
                ? 'text-[#D2BBFF] bg-[#2A2A2B] font-semibold border-r-2 border-[#A071FF] rounded-r-none' 
                : 'text-[#958E9F] hover:text-[#CCC3D6] hover:bg-[#201F20]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: currentView === 'plantillas' ? "'FILL' 1" : "'FILL' 0" }}>description</span>
            <span className="text-sm">Plantillas</span>
          </button>

          <button 
            onClick={onOpenSettings}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group text-[#958E9F] hover:text-[#CCC3D6] hover:bg-[#201F20]`}
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span className="text-sm">Configuración</span>
          </button>
        </nav>
      </div>
      
      <div className="mt-auto p-6 border-t border-[#4A4453]/15">
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all overflow-hidden relative">
              <span className="text-primary text-xs font-bold">{user ? getInitials(user.name) : '??'}</span>
            </div>
            <div className="overflow-hidden text-left">
              <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{user?.name || 'Usuario'}</p>
              <p className="text-[10px] text-outline truncate uppercase tracking-wider">{user?.role === 'admin' ? 'Strategic Admin' : 'Sales Executive'}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:bg-error/10 hover:text-error transition-colors"
            title="Cerrar Sesión"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
