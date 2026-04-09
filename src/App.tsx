import React, { useState, Suspense, lazy, useMemo, useEffect } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import { ContactData, User } from './types';
import { nocoService } from './services/nocoService';

// Lazy load components for code-splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const Contacts = lazy(() => import('./components/Contacts'));
const ContactDetails = lazy(() => import('./components/ContactDetails'));
const Servicios = lazy(() => import('./components/Servicios'));
const Plantillas = lazy(() => import('./components/Plantillas'));
const NewContactModal = lazy(() => import('./components/NewContactModal'));
const ImportContactModal = lazy(() => import('./components/ImportContactModal'));
const DeleteConfirmModal = lazy(() => import('./components/DeleteConfirmModal'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
  </div>
);

type ViewState = 'login' | 'dashboard' | 'contacts' | 'contact-details' | 'servicios' | 'plantillas';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(null);
  const [editingContact, setEditingContact] = useState<ContactData | null>(null);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contactsToDelete, setContactsToDelete] = useState<ContactData[]>([]);

  // Check local/session storage on mount and handle initial route
  useEffect(() => {
    const savedUser = localStorage.getItem('crmUser') || sessionStorage.getItem('crmUser');
    
    // Get actual view from Path
    const path = window.location.pathname.replace('/', '');
    const validViews = ['dashboard', 'contacts', 'servicios', 'plantillas'];
    const initialView = validViews.includes(path) ? (path as ViewState) : 'dashboard';

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser) as User;
        setCurrentUser(user);
        setCurrentView(initialView);
        
        // Ensure the URL matches the initial view
        if (path !== initialView) {
          window.history.replaceState({ view: initialView }, '', `/${initialView}`);
        }
      } catch (e) {
        console.error('Failed to restore user session', e);
        setCurrentView('login');
        window.history.replaceState({ view: 'login' }, '', '/');
      }
    } else {
      // If NOT logged in, we must be in login view
      setCurrentView('login');
      // Force root path if not there
      if (window.location.pathname !== '/') {
        window.history.replaceState({ view: 'login' }, '', '/');
      }
    }

    // Handle browser back/forward buttons
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
    // Sync with URL without reloading
    window.history.pushState({ view }, '', `/${view}`);
  };

  // Fetch true contacts on successful login
  useEffect(() => {
    if (currentUser) {
      const loadInitialData = async () => {
        setIsLoadingContacts(true);
        setLoadError(null);
        try {
          const dbContacts = await nocoService.getContacts();
          setContacts(dbContacts);
        } catch (e: any) {
          console.error("Failed loading from DB", e);
          const isNetwork = e.message === 'ERR_NETWORK' || (e.message || '').includes('ERR_NETWORK');
          setLoadError(isNetwork ? 'network' : 'unknown');
        } finally {
          setIsLoadingContacts(false);
        }
      };
      loadInitialData();
    }
  }, [currentUser, retryCount]);

  // RBAC Filtering -> Derived state of contacts based on the User's Role
  // Normal users ONLY see their assigned contacts (by name or email)
  const filteredContacts = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return contacts;
    return contacts.filter(c => 
      c.assignedTo === currentUser.email || 
      c.assignedTo === currentUser.name
    );
  }, [contacts, currentUser]);

  const handleSaveContact = async (contactData: ContactData) => {
    try {
      if (contactData.id) {
        // Update contact
        await nocoService.updateContact(contactData.id, contactData);
        setContacts(prev => prev.map(c => c.id === contactData.id ? contactData : c));
        if (selectedContact?.id === contactData.id) {
          setSelectedContact(contactData);
        }
      } else {
        // Create new contact
        const assignedTo = currentUser?.name || 'admin';
        const newContact = await nocoService.createContact({ ...contactData, assignedTo });
        setContacts(prev => [newContact, ...prev]);
      }
    } catch (e: any) {
      console.error("Error saving contact", e.response?.data || e);
      alert(`Error al guardar en la base de datos: ${e.response?.data?.msg || e.message || 'Error desconocido'}`);
    }
  };

  const handleDeleteContact = (id: string) => {
    const contact = contacts.find(c => c.id === id);
    if (contact) {
      setContactsToDelete([contact]);
      setIsDeleteModalOpen(true);
    }
  };

  const handleDeleteManyContacts = (ids: string[]) => {
    const selectedToDie = contacts.filter(c => ids.includes(c.id || ''));
    if (selectedToDie.length > 0) {
      setContactsToDelete(selectedToDie);
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDeleteContact = async () => {
    if (contactsToDelete.length === 0) return;
    try {
      const ids = contactsToDelete.map(c => c.id!).filter(Boolean);
      
      if (ids.length === 1) {
        await nocoService.deleteContact(ids[0]);
      } else {
        await nocoService.deleteBulkContacts(ids);
      }

      setContactsToDelete([]);
      setContacts(prev => prev.filter(c => !ids.includes(c.id || '')));
      
      if (selectedContact && ids.includes(selectedContact.id || '')) {
        setSelectedContact(null);
        setCurrentView('contacts');
      }
      
      setIsDeleteModalOpen(false);
    } catch (e: any) {
      console.error("Error deleting contact", e);
      alert("No se pudo eliminar el contacto.");
    }
  };

  const handleImportContacts = async (importedContacts: Partial<ContactData>[]) => {
    try {
      // Modify assignedTo based on RBAC logic before bulk insert
      const toInsert = importedContacts.map((c) => ({
        ...c,
        assignedTo: currentUser?.role === 'user' ? currentUser.name : (c.assignedTo || '')
      }));

      await nocoService.importBulkContacts(toInsert);
      
      // Reload contacts after import to make sure IDs match DB
      const refreshed = await nocoService.getContacts();
      setContacts(refreshed);
    } catch(e) {
      console.error("Import failed", e);
      alert("La importación masiva ha fallado..");
    }
  };

  const handleOpenNewContact = () => {
    setEditingContact(null);
    setIsNewContactModalOpen(true);
  };

  const handleOpenImportModal = () => {
    setIsImportModalOpen(true);
  };

  const handleEditContact = (contact: ContactData) => {
    setEditingContact(contact);
    setIsNewContactModalOpen(true);
  };

  const handleSelectContact = (contact: ContactData) => {
    setSelectedContact(contact);
    handleNavigate('contact-details');
  };

  const handleLogin = (user: User, rememberMe: boolean) => {
    setCurrentUser(user);
    if (rememberMe) {
      localStorage.setItem('crmUser', JSON.stringify(user));
    } else {
      sessionStorage.setItem('crmUser', JSON.stringify(user));
    }
    handleNavigate('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('crmUser');
    sessionStorage.removeItem('crmUser');
    setCurrentView('login');
    window.history.pushState({ view: 'login' }, '', '/');
  };

  if (currentView === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <>
      <Layout currentView={currentView} onNavigate={handleNavigate} onOpenNewContact={handleOpenNewContact} onLogout={handleLogout} user={currentUser}>
        <Suspense fallback={<LoadingFallback />}>
          {isLoadingContacts && (currentView === 'contacts' || currentView === 'dashboard') ? (
            <LoadingFallback />
          ) : loadError && (currentView === 'contacts' || currentView === 'dashboard') ? (
            <div className="flex items-center justify-center min-h-[60vh] p-8">
              <div className="bg-surface-container rounded-3xl border border-error/20 p-10 text-center max-w-md w-full shadow-xl">
                <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center text-error mx-auto mb-6">
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>wifi_off</span>
                </div>
                <h2 className="text-2xl font-headline font-bold text-white mb-3">Sin conexión al servidor</h2>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-2">
                  No se pudo conectar con la base de datos. Esto suele ser un problema temporal de red o certificado TLS.
                </p>
                <p className="text-outline text-xs mb-8">
                  Intenta nuevamente — el sistema reintentará automáticamente hasta 3 veces.
                </p>
                <button
                  onClick={() => {
                    nocoService.resetToken();
                    setRetryCount(c => c + 1);
                  }}
                  className="w-full py-4 rounded-2xl bg-primary text-on-primary-container font-bold text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Reintentar conexión
                </button>
              </div>
            </div>
          ) : (
            <>
              {currentView === 'dashboard' && <Dashboard onOpenNewContact={handleOpenNewContact} contacts={filteredContacts} user={currentUser} />}
              {currentView === 'contacts' && (
                <Contacts 
                  onViewChange={setCurrentView} 
                  onOpenNewContact={handleOpenNewContact} 
                  onOpenImportModal={handleOpenImportModal} 
                  onSelectContact={handleSelectContact} 
                  contacts={filteredContacts} 
                  onDeleteContact={handleDeleteContact} 
                  onDeleteMany={handleDeleteManyContacts}
                  onEditContact={handleEditContact} 
                  user={currentUser}
                />
              )}
              {currentView === 'contact-details' && (
                <ContactDetails 
                  contact={selectedContact} 
                  onEdit={() => selectedContact && handleEditContact(selectedContact)} 
                  onBack={() => handleNavigate('contacts')}
                  onUpdateContact={handleSaveContact} 
                  user={currentUser} 
                />
              )}
              {currentView === 'servicios' && <Servicios />}
              {currentView === 'plantillas' && <Plantillas />}
            </>
          )}
        </Suspense>
      </Layout>
      <Suspense fallback={null}>
        <NewContactModal isOpen={isNewContactModalOpen} onClose={() => setIsNewContactModalOpen(false)} onSave={handleSaveContact} initialData={editingContact} user={currentUser} />
        <ImportContactModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={handleImportContacts} />
        <DeleteConfirmModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => {setIsDeleteModalOpen(false); setContactsToDelete([]);}} 
        onConfirm={confirmDeleteContact}
        contactName={contactsToDelete.length === 1 ? `${contactsToDelete[0].firstName} ${contactsToDelete[0].lastName}` : undefined}
        count={contactsToDelete.length > 1 ? contactsToDelete.length : undefined}
      />
      </Suspense>
    </>
  );
}
