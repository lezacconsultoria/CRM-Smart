import axios from 'axios';
import { ContactData, Task, StageData, Note, User } from '../types';

const NOCODB_URL = 'https://nocodb.lezacconsultoria.com';
const BASE_ID = 'pwqcmbzgrz73kd1';

// We store the admin token in memory after the first login to make sub-requests.
let ADMIN_TOKEN = '';

// Local Cache Keys
const CACHE_KEYS = {
  CONTACTS: 'crm_smart_cache_contacts',
  TASKS: 'crm_smart_cache_tasks',
  USERS: 'crm_smart_cache_users'
};

// Helper to set headers
const getHeaders = () => ({
  'xc-auth': ADMIN_TOKEN,
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache'
});

// Retry helper with exponential backoff
const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delayMs = 800): Promise<T> => {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      lastError = e;
      const isNetworkError = e.code === 'ERR_NETWORK' || e.code === 'ERR_CONNECTION_RESET' || e.message === 'Network Error';
      const failingUrl = e.config?.url || 'URL unknown';
      if (!isNetworkError || attempt === retries) break;
      console.warn(`[nocoService] Error on ${failingUrl} (Attempt ${attempt}/${retries}). Retrying in ${delayMs * attempt}ms...`);
      await new Promise(res => setTimeout(res, delayMs * attempt));
    }
  }
  throw lastError;
};

export const nocoService = {
  // 1. Initial Authentication (Getting the proxy token)
  async masterLogin() {
    if (ADMIN_TOKEN) return;
    try {
      const res = await withRetry(() => axios.post(`${NOCODB_URL}/api/v1/auth/user/signin`, {
        email: 'lezacconsultoria@gmail.com',
        password: 'Gualeguay2025##'
      }));
      ADMIN_TOKEN = res.data.token;
    } catch (e: any) {
      console.error('Error logging into NocoDB Master Account', e);
      const detail = e.code ? ` (${e.code})` : (e.message ? `: ${e.message}` : '');
      if (e.code === 'ERR_NETWORK' || e.message === 'Network Error') {
        throw new Error(`ERR_NETWORK`);
      }
      if (e.response?.status === 401 || e.response?.status === 403) {
        throw new Error('Error de Autenticación Maestra: Credenciales de sistema inválidas.');
      }
      throw new Error(`Error de Conexión DB${detail}`);
    }
  },

  // Clears the cached token so masterLogin will retry on next call
  resetToken() {
    ADMIN_TOKEN = '';
    this._cachedUsers = null;
  },

  // Internal cache to minimize fetching users
  _cachedUsers: null as User[] | null,

  async _resolveUser(assigneeStr: string): Promise<User | null> {
    if (!assigneeStr) return null;
    if (!this._cachedUsers) {
       this._cachedUsers = await this.getUsers();
    }
    const target = assigneeStr.trim().toLowerCase();
    return this._cachedUsers.find(u => 
      u.id === target || 
      u.email.toLowerCase() === target || 
      (u.name && u.name.toLowerCase() === target)
    ) || null;
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
          id: u.Id ? String(u.Id) : email,
          name: u.Nombre,
          email: u.Email,
          role: u.Rol as 'admin' | 'user'
        };
      }
      return null;
    } catch (e: any) {
      console.error('Login Error', e);
      const detail = e.code ? ` (${e.code})` : (e.message ? `: ${e.message}` : '');
      if (e.code === 'ERR_NETWORK' || !e.response) {
        throw new Error(`Error de Red/CORS: No se puede validar el usuario${detail}.`);
      }
      return null;
    }
  },

  async getUsers(): Promise<User[]> {
     await this.masterLogin();
     try {
       const res = await axios.get(`${NOCODB_URL}/api/v1/db/data/noco/${BASE_ID}/m7itnn4o516xej9`, {
         headers: getHeaders(),
         params: { limit: 100 }
       });
       return res.data.list.map((u: any) => ({
          id: u.Id ? String(u.Id) : u.Email,
          name: u.Nombre,
          email: u.Email,
          role: u.Rol as 'admin' | 'user'
       }));
     } catch (e) {
       console.error('Error fetching users', e);
       return [];
     }
  },


  // 3. Contacts (Contactos)
  async getContacts(): Promise<{ list: ContactData[], isCache: boolean }> {
    try {
      await this.masterLogin();
      const res = await axios.get(`${NOCODB_URL}/api/v1/db/data/noco/${BASE_ID}/m7t44xu1kj6xal8`, {
        headers: getHeaders(),
        params: { limit: 1000 }
      });
      
      const list = res.data.list;
      // Cache the response
      localStorage.setItem(CACHE_KEYS.CONTACTS, JSON.stringify(list));
      
      // Parse NocoDB format to App format
      return {
        list: list.map((c: any) => this._mapContact(c)),
        isCache: false
      };
    } catch (e) {
      console.error('Error in getContacts, trying cache', e);
      const cached = localStorage.getItem(CACHE_KEYS.CONTACTS);
      if (cached) {
        try {
          const list = JSON.parse(cached);
          console.info('[nocoService] Loaded contacts from local cache');
          return {
            list: list.map((c: any) => this._mapContact(c)),
            isCache: true
          };
        } catch (parseErr) {
          console.error('Cache corruption', parseErr);
        }
      }
      throw e; // If no cache, rethrow so App.tsx knows it's a hard fail
    }
  },

  _mapContact(c: any) {
    let assignedTo = c['Asignado'] || '';
    if (c['Usuarios_id'] && Array.isArray(c['Usuarios_id']) && c['Usuarios_id'].length > 0) {
       assignedTo = c['Usuarios_id'][0].Nombre || c['Usuarios_id'][0].Email || assignedTo;
    } else if (c['Usuarios_id'] && c['Usuarios_id'].Nombre) {
       assignedTo = c['Usuarios_id'].Nombre || c['Usuarios_id'].Email || assignedTo;
    }

    let parsedStages: any[] = [];
    let contactStatus: string | undefined = undefined;
    let contactPrice: number | undefined = undefined;

    if (c['StagesJSON']) {
      try {
        const parsed = JSON.parse(c['StagesJSON']);
        if (Array.isArray(parsed)) {
          parsedStages = parsed;
        } else if (parsed && Array.isArray(parsed.stages)) {
          parsedStages = parsed.stages;
          contactStatus = parsed.status;
          contactPrice = parsed.price;
        }
      } catch (e) {
        parsedStages = [];
      }
    }

    const stage3 = parsedStages.find((s: any) => s.id === 3);
    if (contactPrice === undefined && stage3?.price !== undefined) {
      contactPrice = stage3.price;
    }
    
    return {
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
      assignedTo: assignedTo,
      price: contactPrice,
      status: contactStatus,
      activity: c['Actividad'] || '',
      externalId: c['ids_origen'] || '',
      isEmailValid: !!c['Email válido'],
      tasks: c['TasksJSON'] ? JSON.parse(c['TasksJSON']) : [],
      stages: parsedStages
    };
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
    
    const defaultStages: any[] = [
      { id: 1, name: 'Descubrimiento', notes: [] },
      { id: 2, name: 'Propuesta', notes: [] },
      { id: 3, name: 'Negociación', notes: [] },
      { id: 4, name: 'Cierre', notes: [] },
    ];

    let stagesToSave = contact.stages && contact.stages.length > 0 ? contact.stages : defaultStages;
    let s3 = stagesToSave.find(s => s.id === 3);
    if (s3 && contact.price !== undefined) {
       s3 = { ...s3, price: contact.price };
       stagesToSave = stagesToSave.map(s => s.id === 3 ? s3! : s);
    }

    const stagesPayload: any = { stages: stagesToSave };
    if (contact.status !== undefined) stagesPayload.status = contact.status;
    if (contact.price !== undefined) stagesPayload.price = contact.price;

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
      'StagesJSON': JSON.stringify(stagesPayload)
    };

    if (contact.profileLink) {
      payload['Link de perfil'] = contact.profileLink;
    }
    
    const res = await axios.post(`${NOCODB_URL}/api/v1/db/data/noco/${BASE_ID}/m7t44xu1kj6xal8`, payload, {
      headers: getHeaders()
    });

    const contactId = String(res.data.Id);

    // Relate user if assignedTo mapped to a User
    if (contact.assignedTo) {
      const u = await this._resolveUser(contact.assignedTo);
      if (u) {
        try {
           await axios.post(`${NOCODB_URL}/api/v1/db/data/noco/${BASE_ID}/m7t44xu1kj6xal8/${contactId}/mo/Usuarios_id/${u.id}`, {}, {
             headers: getHeaders()
           });
        } catch (e) { console.error('Error linking user', e); }
      }
    }

    return {
      ...contact,
      id: contactId,
      tasks: contact.tasks || [],
      stages: contact.stages && contact.stages.length > 0 ? contact.stages : defaultStages
    } as ContactData;
  },

  async importBulkContacts(contacts: Partial<ContactData>[]): Promise<void> {
    await this.masterLogin();
    
    const defaultStages: any[] = [
      { id: 1, name: 'Descubrimiento', notes: [] },
      { id: 2, name: 'Propuesta', notes: [] },
      { id: 3, name: 'Negociación', notes: [] },
      { id: 4, name: 'Cierre', notes: [] },
    ];

    const payload = contacts.map(c => {
      let stagesToSave = c.stages && c.stages.length > 0 ? c.stages : defaultStages;
      let s3 = stagesToSave.find((s: any) => s.id === 3);
      if (s3 && c.price !== undefined) {
         s3.price = c.price;
      }
      return {
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
        'StagesJSON': JSON.stringify(stagesToSave)
      };
    });

    // Perform bulk insert
    const cRes = await axios.post(`${NOCODB_URL}/api/v1/db/data/bulk/noco/${BASE_ID}/m7t44xu1kj6xal8`, payload, {
      headers: getHeaders()
    });

    // Bulk assign relationships 
    if (cRes.data && Array.isArray(cRes.data)) {
      const linkPromises = [];
      for (let i = 0; i < contacts.length; i++) {
        const contactId = cRes.data[i]?.Id;
        const assignedTo = contacts[i]?.assignedTo;
        if (contactId && assignedTo) {
           const u = await this._resolveUser(assignedTo);
           if (u) {
             linkPromises.push(
               axios.post(`${NOCODB_URL}/api/v1/db/data/noco/${BASE_ID}/m7t44xu1kj6xal8/${contactId}/mo/Usuarios_id/${u.id}`, {}, {
                 headers: getHeaders()
               }).catch(e => console.error(`Bulk link error for CID ${contactId}`, e.message))
             );
           }
        }
      }
      
      // Execute in chunks
      for (let i = 0; i < linkPromises.length; i+=10) {
         await Promise.all(linkPromises.slice(i, i+10));
      }
    }
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
      let stagesToSave = [...contact.stages];
      // Inject price into stage 3 data
      let s3 = stagesToSave.find((s: any) => s.id === 3);
      if (s3 && contact.price !== undefined) {
         s3 = { ...s3, price: contact.price };
         stagesToSave = stagesToSave.map(s => s.id === 3 ? s3! : s);
      }
      // Wrap in an object to persist status and price at the top level
      const stagesPayload: any = {
        stages: stagesToSave,
      };
      if (contact.status !== undefined) {
        stagesPayload.status = contact.status;
      }
      if (contact.price !== undefined) {
        stagesPayload.price = contact.price;
      }
      payload['StagesJSON'] = JSON.stringify(stagesPayload);
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

    if (contact.assignedTo) {
      const u = await this._resolveUser(contact.assignedTo);
      if (u) {
        try {
           await axios.post(`${NOCODB_URL}/api/v1/db/data/noco/${BASE_ID}/m7t44xu1kj6xal8/${id}/mo/Usuarios_id/${u.id}`, {}, {
             headers: getHeaders()
           });
        } catch (e) { console.error('Error linking user on update', e); }
      }
    }
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
