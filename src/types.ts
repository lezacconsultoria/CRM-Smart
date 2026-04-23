export interface CompanyConfig {
  id?: string;
  name: string;
  rubro: string;
  tags: string[];
  jobTitles: string[];
  extraInfo?: string;
  showBudget: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface Note {
  id: string;
  text: string;
  date: string;
  tag?: string;
  reminderDays?: number;
  reminderDate?: string;
  reminderTimestamp?: number;
  reminderCompleted?: boolean;
  reminderCompletedAt?: string;
  createdBy?: string;
}

export interface StageData {
  id: number;
  name: string;
  notes: Note[];
  price?: number;
  budget?: number;            // Presupuesto (solo para Etapa 2 - Propuesta)
  budgetDescription?: string; // Descripción del presupuesto
}

// Datos de competencia al cerrar un seguimiento
export interface CompetitionData {
  hadCompetition: boolean;       // ¿Hubo competidores?
  competitors?: string;          // Nombre(s) de competidores (texto libre)
  lossReason?: string;           // Motivo de pérdida si aplica
  notes?: string;                // Notas adicionales sobre la competencia
}

// Un seguimiento completo (tracking) con su propia línea de tiempo
export interface TrackingRecord {
  id: string;
  company: string;              // Empresa durante este seguimiento
  jobTitle?: string;            // Cargo durante este seguimiento
  startDate: string;            // Fecha de inicio
  endDate?: string;             // Fecha de cierre (si archivado)
  status: 'active' | 'won' | 'lost' | 'archived';
  stages: StageData[];
  price?: number;
  competition?: CompetitionData;
}

// Relación entre contactos
export interface ContactRelation {
  contactId: string;          // ID del contacto relacionado
  contactName: string;        // Nombre (cache para UI)
  company: string;            // Empresa del contacto relacionado
  relationType: string;       // "Jefe", "Colega", "Reporte directo", etc.
}

export interface ContactData {
  id?: string;
  importDate?: string;
  externalId?: string;
  firstName: string;
  lastName: string;
  company: string;
  activity?: string;
  companyType?: string;
  jobTitle: string;
  profileLink?: string;
  email: string;
  isEmailValid?: boolean;
  phone: string;
  countryCode?: string;
  province?: string;
  country?: string;
  source: 'linkedin' | 'whatsapp' | 'email' | 'db' | '';
  dbSource?: string;
  assignedTo?: string;
  price?: number;
  status?: 'won' | 'lost' | 'active';
  stages?: StageData[];
  competition?: CompetitionData;       // Datos de competencia del seguimiento activo
  trackingHistory?: TrackingRecord[];  // Seguimientos anteriores archivados
  additionalLinks?: string[];         // Links adicionales (LinkedIn, Portfolio, etc.)
  relations?: ContactRelation[];       // Contactos vinculados
}
