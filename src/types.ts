export interface Note {
  id: string;
  text: string;
  date: string;
  tag?: string;
  reminderDays?: number;
  reminderDate?: string;
  reminderTimestamp?: number;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  isOverdue?: boolean;
  contactId?: string;
  dueDateTimestamp?: number;
}

export interface StageData {
  id: number;
  name: string;
  notes: Note[];
}

export interface ContactData {
  id?: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  countryCode?: string;
  jobTitle: string;
  source: 'linkedin' | 'whatsapp' | 'email' | '';
  assignedTo?: string;
  tasks?: Task[];
  stages?: StageData[];
}
