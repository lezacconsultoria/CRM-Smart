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
  createdBy?: string;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  isOverdue?: boolean;
  contactId?: string;
  dueDateTimestamp?: number;
  createdBy?: string;
}

export interface StageData {
  id: number;
  name: string;
  notes: Note[];
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
  tasks?: Task[];
  stages?: StageData[];
}
