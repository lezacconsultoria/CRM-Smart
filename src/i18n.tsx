import React, { createContext, useContext, useState, useCallback } from 'react';

type Lang = 'es' | 'en';

const EN: Record<string, string> = {
  // Nav
  'nav.dashboard': 'Dashboard',
  'nav.contacts': 'Contacts',
  'nav.pipeline': 'Pipeline',
  'nav.activities': 'Activities',
  'nav.new_contact': 'New Contact',
  // Sidebar sections
  'nav.section.management': 'Management',
  'nav.section.sales': 'Sales',
  // Settings nav
  'settings.title': 'Settings',
  'settings.empresa': 'Company',
  'settings.sistema': 'System',
  'settings.etiquetas': 'Labels',
  'settings.cargos': 'Job Titles',
  'settings.usuarios': 'Users',
  // Settings - Empresa
  'settings.empresa.identity': 'Company Identity',
  'settings.empresa.name': 'Name',
  'settings.empresa.rubro': 'Industry',
  'settings.empresa.notes': 'Internal Notes',
  'settings.empresa.notes_placeholder': 'Additional info about the company or team...',
  // Settings - Sistema
  'settings.sistema.prefs': 'Preferences',
  'settings.sistema.budget_module': 'Budget Module',
  'settings.sistema.budget_desc': 'Visible in the Proposal stage',
  'settings.sistema.language': 'Language',
  'settings.sistema.language_desc': 'Interface language',
  // Settings - Etiquetas
  'settings.etiquetas.header': 'Note Classification',
  'settings.etiquetas.desc': 'Used to categorize follow-ups in sales stages.',
  'settings.etiquetas.placeholder': 'New label...',
  'settings.etiquetas.empty': 'No labels configured.',
  // Settings - Cargos
  'settings.cargos.header': 'Predefined Job Titles',
  'settings.cargos.desc': 'Shown as options when creating a new contact.',
  'settings.cargos.placeholder': 'CEO, Manager, Director...',
  'settings.cargos.empty': 'No job titles configured.',
  // Settings - Usuarios
  'settings.usuarios.header': 'CRM Users',
  'settings.usuarios.desc': 'Create users and assign them a role to access the system.',
  'settings.usuarios.new': 'New User',
  'settings.usuarios.name': 'Full name',
  'settings.usuarios.email': 'Email',
  'settings.usuarios.password': 'Password',
  'settings.usuarios.create': 'Create',
  'settings.usuarios.role_user': 'User',
  'settings.usuarios.role_admin': 'Admin',
  'settings.usuarios.empty': 'No users created.',
  // Common buttons
  'btn.save': 'Save',
  'btn.saved': 'Saved',
  'btn.cancel': 'Cancel',
  'btn.close': 'Close',
};

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, fallback: string) => string;
}

const Ctx = createContext<LangCtx>({ lang: 'es', setLang: () => {}, t: (_, f) => f });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('crm_lang') as Lang) || 'es');

  const setLang = (l: Lang) => {
    localStorage.setItem('crm_lang', l);
    setLangState(l);
  };

  const t = useCallback((key: string, fallback: string): string => {
    if (lang === 'es') return fallback;
    return EN[key] ?? fallback;
  }, [lang]);

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useLanguage = () => useContext(Ctx);
