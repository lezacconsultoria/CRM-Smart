import axios from 'axios';
import { ContactData, Task, StageData, Note, User } from '../types';

const NOCODB_URL = 'https://nocodb.lezacconsultoria.com';
const BASE_ID = 'pwqcmbzgrz73kd1';

// We store the admin token in memory after the first login to make sub-requests.
// In a real application, this should be handled securely by a backend.
let ADMIN_TOKEN = '';

// Helper to set headers
const getHeaders = () => ({
  'xc-auth': ADMIN_TOKEN,
  'Content-Type': 'application/json'
});

export const nocoService = {
  // 1. Initial Authentication (Getting the proxy token)
  async masterLogin() {
    if (ADMIN_TOKEN) return;
    try {
      const res = await axios.post(`${NOCODB_URL}/api/v1/auth/user/signin`, {
        email: 'lezacconsultoria@gmail.com',
        password: 'Gualeguay2025##'
      });
      ADMIN_TOKEN = res.data.token;
    } catch (e) {
      console.error('Error logging into NocoDB Master Account', e);
      throw new Error('Internal Configuration Error: Cannot connect to DB');
    }
  },

  // 2. User Authentication
  async loginUser(email: string, passwordString: string): Promise<User | null> {
    await this.masterLogin();
    
    try {
      // Find the user in "Usuarios" table (ID: m7itnn4o516xej9)
      const res = await axios.get(`${NOCODB_URL}/api/v1/db/data/noco/${BASE_ID}/m7itnn4o516xej9`, {
        headers: getHeaders(),
        params: {
          where: `(Email,eq,${email})~and(Password,eq,${passwordString})`
        }
      });
      
      const users = res.data.list;
      if (users && users.length > 0) {
        const u = users[0];
        return {
          id: u.Id || u.id || email,
          name: u.Nombre,
          email: u.Email,
          role: u.Rol as 'admin' | 'user'
        };
      }
      return null;
    } catch (e) {
      console.error('Login Error', e);
      return null;
    }
  },

  // 3. Contacts (Contactos)
  async getContacts(): Promise<ContactData[]> {
    await this.masterLogin();
    try {
      const res = await axios.get(`${NOCODB_URL}/api/v1/db/data/noco/${BASE_ID}/m7t44xu1kj6xal8`, {
        headers: getHeaders(),
        params: { limit: 1000 }
      });
      
      // Parse NocoDB format to App format
      return res.data.list.map((c: any) => ({
        id: String(c.Id),
        importDate: c['Fecha importado'],
        firstName: c['Nombre'] || '',
        lastName: c['Apellido'] || '',
        company: c['Empresa'] || '',
        companyType: c['Tipo de empresa'],
        jobTitle: c['Cargo'] || '',
        profileLink: c['Link de perfil'],
        email: c['Correo Electronico'] || '',
        phone: c['Telefono'] || '',
        province: c['Provincia'],
        country: c['Pais'],
        source: c['Origen DB'] || 'unknown',
        dbSource: c['Origen DB'],
        assignedTo: c['Asignado'],
        activity: c['Actividad'] || '',
        externalId: c['ids_origen'] || '',
        isEmailValid: !!c['Email válido'],
        tasks: c['TasksJSON'] ? JSON.parse(c['TasksJSON']) : [],
        stages: c['StagesJSON'] ? JSON.parse(c['StagesJSON']) : []
      }));
    } catch (e) {
      console.error('Error fetching contacts', e);
      return [];
    }
  },

  async isEmailDuplicate(email: string, excludeId?: string): Promise<boolean> {
    if (!email) return false;
    await this.masterLogin();
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const escapedEmail = normalizedEmail.replace(/'/g, "\\'");
      let where = `(Correo Electronico,eq,${escapedEmail})`;
      if (excludeId) {
        where += `~and(Id,neq,${excludeId})`;
      }
      const res = await axios.get(`${NOCODB_URL}/api/v1/db/data/noco/${BASE_ID}/m7t44xu1kj6xal8`, {
        headers: getHeaders(),
        params: { where }
      });
      return res.data.list && res.data.list.length > 0;
    } catch (e) {
      console.error('Error checking duplicate email', e);
      return false;
    }
  },

  async findExistingEmails(emails: string[]): Promise<string[]> {
    if (emails.length === 0) return [];
    await this.masterLogin();
    
    // NocoDB 'in' operator syntax: (Field,in,val1,val2,...)
    // Pre-filtering empty or invalid emails and normalizing/trimming
    const validEmails = Array.from(new Set(
      emails
        .filter(e => e && e.includes('@'))
        .map(e => e.trim().toLowerCase())
    ));

    if (validEmails.length === 0) return [];

    // Split into batches of 30 to avoid long query limits
    const batches = [];
    for (let i = 0; i < validEmails.length; i += 30) {
      batches.push(validEmails.slice(i, i + 30));
    }

    const duplicates: string[] = [];
    for (const batch of batches) {
      try {
        const emailList = batch.map(e => e.replace(/'/g, "\\'")).join(',');
        const res = await axios.get(`${NOCODB_URL}/api/v1/db/data/noco/${BASE_ID}/m7t44xu1kj6xal8`, {
          headers: getHeaders(),
          params: { 
            where: `(Correo Electronico,in,${emailList})`,
            fields: 'Correo Electronico',
            limit: 1000 // Ensure we don't hit the default per-page limit (25)
          }
        });
        if (res.data.list) {
          res.data.list.forEach((item: any) => {
            const email = item['Correo Electronico'];
            if (email) duplicates.push(email.trim().toLowerCase());
          });
        }
      } catch (e) {
        console.error('Error batch checking emails', e);
      }
    }
    return Array.from(new Set(duplicates));
  },

  async createContact(contact: Partial<ContactData>): Promise<ContactData> {
    await this.masterLogin();
    
    // Default stages if none provided
    const defaultStages = [
      { id: 1, name: 'Descubrimiento', notes: [] },
      { id: 2, name: 'Propuesta', notes: [] },
      { id: 3, name: 'Negociación', notes: [] },
    ];

    const payload: any = {
      'Fecha importado': contact.importDate || new Date().toISOString().split('T')[0],
      'Nombre': contact.firstName,
      'Apellido': contact.lastName,
      'Empresa': contact.company,
      'Tipo de empresa': contact.companyType,
      'Cargo': contact.jobTitle,
      'Correo Electronico': contact.email,
      'Telefono': contact.phone,
      'Provincia': contact.province,
      'Pais': contact.country,
      'Origen DB': contact.source || contact.dbSource,
      'Asignado': contact.assignedTo,
      'Actividad': contact.activity,
      'ids_origen': contact.externalId,
      'Email válido': contact.isEmailValid,
      'TasksJSON': JSON.stringify(contact.tasks || []),
      'StagesJSON': JSON.stringify(contact.stages && contact.stages.length > 0 ? contact.stages : defaultStages)
    };

    if (contact.profileLink) {
      payload['Link de perfil'] = contact.profileLink;
    }
    
    const res = await axios.post(`${NOCODB_URL}/api/v1/db/data/noco/${BASE_ID}/m7t44xu1kj6xal8`, payload, {
      headers: getHeaders()
    });

    return {
      ...contact,
      id: String(res.data.Id),
      tasks: contact.tasks || [],
      stages: contact.stages && contact.stages.length > 0 ? contact.stages : defaultStages
    } as ContactData;
  },

  async importBulkContacts(contacts: Partial<ContactData>[]): Promise<void> {
    await this.masterLogin();
    
    const defaultStages = [
      { id: 1, name: 'Descubrimiento', notes: [] },
      { id: 2, name: 'Propuesta', notes: [] },
      { id: 3, name: 'Negociación', notes: [] },
    ];

    const payload = contacts.map(c => ({
      'Fecha importado': c.importDate || new Date().toISOString().split('T')[0],
      'Nombre': c.firstName || '',
      'Apellido': c.lastName || '',
      'Empresa': c.company || '',
      'Tipo de empresa': c.companyType,
      'Cargo': c.jobTitle || '',
      'Link de perfil': c.profileLink,
      'Correo Electronico': c.email || '',
      'Telefono': c.phone || '',
      'Provincia': c.province,
      'Pais': c.country,
      'Origen DB': c.source || c.dbSource || 'Manual Import',
      'Asignado': c.assignedTo,
      'Actividad': c.activity || '',
      'ids_origen': c.externalId || '',
      'Email válido': c.isEmailValid || false,
      'TasksJSON': JSON.stringify(c.tasks || []),
      'StagesJSON': JSON.stringify(c.stages && c.stages.length > 0 ? c.stages : defaultStages)
    }));

    // Perform bulk insert
    await axios.post(`${NOCODB_URL}/api/v1/db/data/bulk/noco/${BASE_ID}/m7t44xu1kj6xal8`, payload, {
      headers: getHeaders()
    });
  },

  async updateContact(id: string, contact: Partial<ContactData>): Promise<void> {
    await this.masterLogin();
    const payload: any = {
      Id: parseInt(id),
      'Nombre': contact.firstName,
      'Apellido': contact.lastName,
      'Empresa': contact.company,
      'Tipo de empresa': contact.companyType,
      'Cargo': contact.jobTitle,
      'Correo Electronico': contact.email,
      'Telefono': contact.phone,
      'Provincia': contact.province,
      'Pais': contact.country,
      'Origen DB': contact.source || contact.dbSource,
      'Asignado': contact.assignedTo,
      'Actividad': contact.activity,
      'ids_origen': contact.externalId,
      'Email válido': contact.isEmailValid
    };

    if (contact.importDate) {
      payload['Fecha importado'] = contact.importDate;
    }
    
    if (contact.tasks) {
      payload['TasksJSON'] = JSON.stringify(contact.tasks);
    }
    if (contact.stages) {
      payload['StagesJSON'] = JSON.stringify(contact.stages);
    }
    
    // NocoDB sometimes rejects empty string for URL column
    if (contact.profileLink) {
      payload['Link de perfil'] = contact.profileLink;
    } else if (contact.profileLink === '') {
      payload['Link de perfil'] = null;
    }

    // Remove undefined
    Object.keys(payload).forEach(key => (payload as any)[key] === undefined && delete (payload as any)[key]);

    await axios.patch(`${NOCODB_URL}/api/v1/db/data/noco/${BASE_ID}/m7t44xu1kj6xal8/${id}`, payload, {
      headers: getHeaders()
    });
  },

  async deleteContact(id: string): Promise<void> {
    await this.masterLogin();
    await axios.delete(`${NOCODB_URL}/api/v1/db/data/noco/${BASE_ID}/m7t44xu1kj6xal8/${id}`, {
      headers: getHeaders()
    });
  },

  async deleteBulkContacts(ids: string[]): Promise<void> {
    await this.masterLogin();
    const payload = ids.map(id => ({ Id: parseInt(id) }));
    await axios.delete(`${NOCODB_URL}/api/v1/db/data/bulk/noco/${BASE_ID}/m7t44xu1kj6xal8`, {
      headers: getHeaders(),
      data: payload
    });
  }
};
