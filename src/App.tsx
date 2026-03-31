import React, { useState } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Contacts from './components/Contacts';
import ContactDetails from './components/ContactDetails';
import Servicios from './components/Servicios';
import Plantillas from './components/Plantillas';
import NewContactModal from './components/NewContactModal';
import { ContactData } from './types';

type ViewState = 'login' | 'dashboard' | 'contacts' | 'contact-details' | 'servicios' | 'plantillas';

const INITIAL_CONTACTS: ContactData[] = [
  {
    id: '1',
    firstName: 'Mikel',
    lastName: 'Arteta',
    company: 'Arsenal Holdings PLC',
    jobTitle: 'Chief Operating Officer',
    email: 'mikel@arsenal.com',
    phone: '20 7619 5000',
    countryCode: '+44',
    source: 'linkedin',
    assignedTo: 'Roberto M.',
    stages: [
      { id: 1, name: 'Descubrimiento', notes: [{ id: '1', text: 'Initial contact', date: '2023-10-01' }] },
      { id: 2, name: 'Propuesta', notes: [{ id: '2', text: 'Sent proposal', date: '2023-10-05' }] },
      { id: 3, name: 'Negociación', notes: [{ id: '3', text: 'Negotiating terms', date: '2023-10-10' }] }
    ]
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Sterling',
    company: 'Fintech Global Solutions',
    jobTitle: 'VP Partnership',
    email: 'sarah@fintech.com',
    phone: '555 0198',
    countryCode: '+1',
    source: 'whatsapp',
    assignedTo: 'Elena R.',
    stages: [
      { id: 1, name: 'Descubrimiento', notes: [{ id: '1', text: 'Initial contact', date: '2023-10-01' }] },
      { id: 2, name: 'Propuesta', notes: [{ id: '2', text: 'Sent proposal', date: '2023-10-05' }] },
      { id: 3, name: 'Negociación', notes: [] }
    ]
  },
  {
    id: '3',
    firstName: 'Beatriz',
    lastName: 'Ramos',
    company: 'Logistics North SL',
    jobTitle: 'Head of Procurement',
    email: 'beatriz@logistics.com',
    phone: '912 345 678',
    countryCode: '+34',
    source: 'email',
    assignedTo: 'Roberto M.',
    stages: [
      { id: 1, name: 'Descubrimiento', notes: [{ id: '1', text: 'Initial contact', date: '2023-10-01' }] },
      { id: 2, name: 'Propuesta', notes: [] },
      { id: 3, name: 'Negociación', notes: [] }
    ]
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('login');
  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);
  const [contacts, setContacts] = useState<ContactData[]>(INITIAL_CONTACTS);
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(null);
  const [editingContact, setEditingContact] = useState<ContactData | null>(null);

  const handleSaveContact = (newContact: ContactData) => {
    if (newContact.id) {
      setContacts(prev => prev.map(c => c.id === newContact.id ? newContact : c));
      if (selectedContact?.id === newContact.id) {
        setSelectedContact(newContact);
      }
    } else {
      setContacts(prev => [{ ...newContact, id: Date.now().toString() }, ...prev]);
    }
  };

  const handleOpenNewContact = () => {
    setEditingContact(null);
    setIsNewContactModalOpen(true);
  };

  const handleEditContact = (contact: ContactData) => {
    setEditingContact(contact);
    setIsNewContactModalOpen(true);
  };

  const handleSelectContact = (contact: ContactData) => {
    setSelectedContact(contact);
    setCurrentView('contact-details');
  };

  const handleLogin = () => {
    setCurrentView('dashboard');
  };

  const handleNavigate = (view: 'dashboard' | 'contacts' | 'contact-details' | 'servicios' | 'plantillas') => {
    setCurrentView(view);
  };

  if (currentView === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <>
      <Layout currentView={currentView} onNavigate={handleNavigate} onOpenNewContact={handleOpenNewContact}>
        {currentView === 'dashboard' && <Dashboard onOpenNewContact={handleOpenNewContact} contacts={contacts} />}
        {currentView === 'contacts' && <Contacts onViewChange={setCurrentView} onOpenNewContact={handleOpenNewContact} onSelectContact={handleSelectContact} contacts={contacts} />}
        {currentView === 'contact-details' && <ContactDetails contact={selectedContact} onEdit={() => selectedContact && handleEditContact(selectedContact)} onUpdateContact={handleSaveContact} />}
        {currentView === 'servicios' && <Servicios />}
        {currentView === 'plantillas' && <Plantillas />}
      </Layout>
      <NewContactModal isOpen={isNewContactModalOpen} onClose={() => setIsNewContactModalOpen(false)} onSave={handleSaveContact} initialData={editingContact} />
    </>
  );
}
