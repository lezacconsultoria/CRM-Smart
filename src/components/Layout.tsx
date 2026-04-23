import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: 'dashboard' | 'contacts' | 'contact-details' | 'pipeline' | 'actividades';
  onNavigate: (view: 'dashboard' | 'contacts' | 'contact-details' | 'pipeline' | 'actividades') => void;
  onOpenNewContact: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  user: User | null;
}

export default function Layout({ children, currentView, onNavigate, onOpenNewContact, onOpenSettings, onLogout, user }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-[#1C1B1C] border-b border-[#4A4453]/15 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-intelligence flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-on-primary-container text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>architecture</span>
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-br from-[#D2BBFF] to-[#A376FF] bg-clip-text text-transparent leading-none">CRM Smart</h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-outline hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-[28px]">{isMobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      <Sidebar 
        currentView={currentView} 
        onNavigate={(view) => {
          onNavigate(view);
          setIsMobileMenuOpen(false);
        }} 
        onOpenNewContact={() => {
          onOpenNewContact();
          setIsMobileMenuOpen(false);
        }}
        onOpenSettings={() => {
          onOpenSettings();
          setIsMobileMenuOpen(false);
        }}
        onLogout={onLogout}
        isOpen={isMobileMenuOpen}
        user={user}
      />
      
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className="flex-1 min-w-0 min-h-screen">
        {children}
      </main>
      
      {/* Floating Action Button (Mobile Only) */}
      <button
        onClick={onOpenNewContact}
        className="md:hidden fixed bottom-4 right-3 w-10 h-10 bg-primary text-on-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all z-40"
        title="Nuevo Contacto"
      >
        <span className="material-symbols-outlined text-[20px]">add</span>
      </button>
    </div>
  );
}
