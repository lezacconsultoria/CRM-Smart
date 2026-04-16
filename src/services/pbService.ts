import PocketBase from 'pocketbase';
import { ContactData, StageData, Note, User, CompetitionData, TrackingRecord, ContactRelation, CompanyConfig } from '../types';

const PB_URL = 'https://pb.lezacconsultoria.com';
export const pb = new PocketBase(PB_URL);

// Local Cache Keys
const CACHE_KEYS = {
  CONTACTS: 'crm_smart_cache_contacts',
  USERS: 'crm_smart_cache_users'
};

export const pbService = {
  resetToken() {
    pb.authStore.clear();
    this._cachedUsers = null;
  },

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

  // User Authentication
  async loginUser(email: string, passwordString: string): Promise<User | null> {
    try {
      // Authenticate directly against the users collection instead of using master account
      const authData = await pb.collection('users').authWithPassword(email, passwordString);
      
      if (authData && authData.record) {
        return {
          id: authData.record.id,
          name: authData.record.name,
          email: authData.record.email,
          role: authData.record.rol as 'admin' | 'user'
        };
      }
      return null;
    } catch (e: any) {
      console.error('Login Error', e);
      return null;
    }
  },

  async getUsers(): Promise<User[]> {
     try {
       const records = await pb.collection('users').getFullList({
           sort: '-created', // 'users' has the default 'created' field
       });
       return records.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.rol as 'admin' | 'user'
       }));
     } catch (e) {
       console.error('Error fetching users', e);
       return [];
     }
  },

  // Contacts
  async getContacts(): Promise<{ list: ContactData[], isCache: boolean }> {
    try {
      const records = await pb.collection('contactos').getFullList({
        sort: '-fecha_importado, -id',
      });
      
      const list = records.map((c) => this._mapContact(c));
      localStorage.setItem(CACHE_KEYS.CONTACTS, JSON.stringify(list));
      
      return { list, isCache: false };
    } catch (e) {
      console.error('Error in getContacts, trying cache', e);
      const cached = localStorage.getItem(CACHE_KEYS.CONTACTS);
      if (cached) {
        try {
          const list = JSON.parse(cached);
          console.info('[pbService] Loaded contacts from local cache');
          return { list, isCache: true };
        } catch (parseErr) {
          console.error('Cache corruption', parseErr);
        }
      }
      throw e;
    }
  },

  _mapContact(c: any): ContactData {
    let assignedTo = c.asignado || '';

    let parsedStages: any[] = [];
    let contactStatus: "active" | "won" | "lost" | undefined = undefined;
    let contactPrice: number | undefined = undefined;
    let contactCompetition: CompetitionData | undefined = undefined;
    let contactTrackingHistory: TrackingRecord[] = [];
    let contactRelations: ContactRelation[] = [];
    let contactAdditionalLinks: string[] = [];

    if (c.stages_json) {
      try {
        const parsed = JSON.parse(c.stages_json);
        if (Array.isArray(parsed)) {
          parsedStages = parsed;
        } else if (parsed && Array.isArray(parsed.stages)) {
          parsedStages = parsed.stages;
          contactStatus = parsed.status;
          contactPrice = parsed.price;
          contactCompetition = parsed.competition;
          contactTrackingHistory = parsed.trackingHistory || [];
          contactRelations = parsed.relations || [];
          contactAdditionalLinks = parsed.additionalLinks || [];
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
      id: c.id,
      importDate: c.fecha_importado,
      firstName: c.nombre || '',
      lastName: c.apellido || '',
      company: c.empresa || '',
      companyType: c.tipo_de_empresa,
      jobTitle: c.cargo || '',
      profileLink: c.link_de_perfil,
      email: c.email || '',
      phone: c.telefono || '',
      province: c.provincia,
      country: c.pais,
      source: c.origen_db || 'unknown',
      dbSource: c.origen_db,
      assignedTo: assignedTo,
      price: contactPrice,
      status: contactStatus,
      activity: c.actividad || '',
      externalId: c.ids_origen || '',
      isEmailValid: !!c.email_valido,
      stages: parsedStages,
      competition: contactCompetition,
      trackingHistory: contactTrackingHistory,
      relations: contactRelations,
      additionalLinks: contactAdditionalLinks,
    };
  },

  async isEmailDuplicate(email: string, excludeId?: string): Promise<boolean> {
    if (!email) return false;
    try {
      const normalizedEmail = email.trim().toLowerCase();
      let filter = `email = "${normalizedEmail.replace(/"/g, '\\"')}"`;
      if (excludeId) {
        filter += ` && id != "${excludeId}"`;
      }
      const records = await pb.collection('contactos').getList(1, 1, { filter });
      return records.items.length > 0;
    } catch (e) {
      console.error('Error checking duplicate email', e);
      return false;
    }
  },

  async findExistingEmails(emails: string[]): Promise<string[]> {
    if (emails.length === 0) return [];
    
    const validEmails = Array.from(new Set(
      emails.filter(e => e && e.includes('@')).map(e => e.trim().toLowerCase())
    ));
    if (validEmails.length === 0) return [];

    const batches = [];
    for (let i = 0; i < validEmails.length; i += 30) {
      batches.push(validEmails.slice(i, i + 30));
    }

    const duplicates: string[] = [];
    for (const batch of batches) {
      try {
        const emailFilters = batch.map(e => `email="${e.replace(/"/g, '\\"')}"`).join(' || ');
        const records = await pb.collection('contactos').getFullList({
           filter: emailFilters,
           fields: 'email'
        });
        records.forEach(r => {
            if (r.email) duplicates.push(r.email.trim().toLowerCase());
        });
      } catch (e) {
        console.error('Error batch checking emails', e);
      }
    }
    return Array.from(new Set(duplicates));
  },

  _buildStagesPayload(contact: Partial<ContactData>, stagesToSave: StageData[]) {
    const stagesPayload: any = { stages: stagesToSave };
    if (contact.status !== undefined) stagesPayload.status = contact.status;
    if (contact.price !== undefined) stagesPayload.price = contact.price;
    if (contact.competition !== undefined) stagesPayload.competition = contact.competition;
    if (contact.trackingHistory !== undefined) stagesPayload.trackingHistory = contact.trackingHistory;
    if (contact.relations !== undefined) stagesPayload.relations = contact.relations;
    if (contact.additionalLinks !== undefined) stagesPayload.additionalLinks = contact.additionalLinks;
    return stagesPayload;
  },

  async createContact(contact: Partial<ContactData>): Promise<ContactData> {
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

    const stagesPayload = this._buildStagesPayload(contact, stagesToSave);

    const payload: any = {
      nombre: contact.firstName || '',
      apellido: contact.lastName || '',
      empresa: contact.company || '',
      tipo_de_empresa: contact.companyType || '',
      cargo: contact.jobTitle || '',
      link_de_perfil: contact.profileLink || '',
      email: contact.email || '',
      telefono: contact.phone || '',
      provincia: contact.province || '',
      pais: contact.country || '',
      origen_db: contact.source || contact.dbSource || '',
      asignado: contact.assignedTo || '',
      actividad: contact.activity || '',
      ids_origen: contact.externalId || '',
      email_valido: !!contact.isEmailValid,
      stages_json: JSON.stringify(stagesPayload),
      fecha_importado: new Date().toISOString()
    };
    
    const record = await pb.collection('contactos').create(payload);
    return this._mapContact(record);
  },

  async importBulkContacts(contacts: Partial<ContactData>[], onProgress?: (count: number) => void): Promise<void> {
    const CONCURRENCY_LIMIT = 40;
    const defaultStages: any[] = [
      { id: 1, name: 'Descubrimiento', notes: [] },
      { id: 2, name: 'Propuesta', notes: [] },
      { id: 3, name: 'Negociación', notes: [] },
      { id: 4, name: 'Cierre', notes: [] },
    ];

    let completed = 0;
    for (let i = 0; i < contacts.length; i += CONCURRENCY_LIMIT) {
      const chunk = contacts.slice(i, i + CONCURRENCY_LIMIT);
      
      await Promise.all(
        chunk.map(async (c) => {
          let stagesToSave = c.stages && c.stages.length > 0 ? c.stages : defaultStages;
          let s3 = stagesToSave.find((s: any) => s.id === 3);
          if (s3 && c.price !== undefined) {
             s3.price = c.price;
          }
          
          const stagesPayload = { stages: stagesToSave, price: c.price, status: c.status };
          
          const payload = {
            fecha_importado: c.importDate || new Date().toISOString(),
            nombre: c.firstName || '',
            apellido: c.lastName || '',
            empresa: c.company || '',
            tipo_de_empresa: c.companyType || '',
            cargo: c.jobTitle || '',
            link_de_perfil: c.profileLink || '',
            email: c.email || '',
            telefono: c.phone || '',
            provincia: c.province || '',
            pais: c.country || '',
            origen_db: c.source || c.dbSource || 'Manual Import',
            asignado: c.assignedTo || '',
            actividad: c.activity || '',
            ids_origen: c.externalId || '',
            email_valido: !!c.isEmailValid,
            stages_json: JSON.stringify(stagesPayload)
          };

          try {
            // requestKey: null disables PocketBase auto-cancellation of parallel requests
            await pb.collection('contactos').create(payload, { requestKey: null });
          } catch (err) {
            console.error('Error bulk uploading contact:', err);
          } finally {
            completed++;
            if (onProgress) onProgress(completed);
          }
        })
      );
    }
  },

  async updateContact(id: string, contact: Partial<ContactData>): Promise<void> {
    const payload: any = {};
    if (contact.firstName !== undefined) payload.nombre = contact.firstName;
    if (contact.lastName !== undefined) payload.apellido = contact.lastName;
    if (contact.company !== undefined) payload.empresa = contact.company;
    if (contact.companyType !== undefined) payload.tipo_de_empresa = contact.companyType;
    if (contact.jobTitle !== undefined) payload.cargo = contact.jobTitle;
    if (contact.email !== undefined) payload.email = contact.email;
    if (contact.phone !== undefined) payload.telefono = contact.phone;
    if (contact.province !== undefined) payload.provincia = contact.province;
    if (contact.country !== undefined) payload.pais = contact.country;
    if (contact.source !== undefined || contact.dbSource !== undefined) payload.origen_db = contact.source || contact.dbSource;
    if (contact.assignedTo !== undefined) payload.asignado = contact.assignedTo;
    if (contact.activity !== undefined) payload.actividad = contact.activity;
    if (contact.externalId !== undefined) payload.ids_origen = contact.externalId;
    if (contact.isEmailValid !== undefined) payload.email_valido = contact.isEmailValid;

    if (contact.importDate) payload.fecha_importado = contact.importDate;
    if (contact.stages) {
      let stagesToSave = [...contact.stages];
      let s3 = stagesToSave.find((s: any) => s.id === 3);
      if (s3 && contact.price !== undefined) {
         s3 = { ...s3, price: contact.price };
         stagesToSave = stagesToSave.map(s => s.id === 3 ? s3! : s);
      }
      const stagesPayload = this._buildStagesPayload(contact, stagesToSave);
      payload.stages_json = JSON.stringify(stagesPayload);
    }
    
    if (contact.profileLink !== undefined) {
      payload.link_de_perfil = contact.profileLink;
    }

    await pb.collection('contactos').update(id, payload);
  },

  async deleteContact(id: string): Promise<void> {
    await pb.collection('contactos').delete(id);
  },

  async deleteBulkContacts(ids: string[]): Promise<void> {
    const CONCURRENCY_LIMIT = 20; // Number of parallel requests at a time
    const errors: any[] = [];

    // Process in chunks to avoid overwhelming the server/browser
    for (let i = 0; i < ids.length; i += CONCURRENCY_LIMIT) {
      const chunk = ids.slice(i, i + CONCURRENCY_LIMIT);
      
      // Execute this chunk in parallel
      await Promise.all(
        chunk.map(id => 
          pb.collection('contactos').delete(id, { requestKey: null })
            .catch(err => {
              console.error(`Error deleting contact ${id}:`, err);
              errors.push(err);
            })
        )
      );
    }

    if (errors.length > 0 && errors.length === ids.length) {
      // Only throw if EVERY single deletion failed
      throw new Error("Batch requests are disabled on this server and individual deletions failed.");
    }
  },

  // Configuration
  async getConfig(): Promise<CompanyConfig | null> {
    try {
      const records = await pb.collection('configuracion').getFullList({
        $autoCancel: false
      });
      if (records.length > 0) {
        // Sort locally to avoid 400 Bad Request if -created is not indexed/allowed
        const r = records.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime())[0];
        
        return {
          id: r.id,
          name: r.name,
          rubro: r.rubro,
          tags: r.tags || [],
          jobTitles: r.jobTitles || [],
          extraInfo: r.extraInfo,
          showBudget: r.showBudget !== undefined ? r.showBudget : true
        };
      }
      return null;
    } catch (e) {
      console.error('Error fetching config', e);
      return null;
    }
  },

  async updateConfig(config: CompanyConfig): Promise<void> {
    try {
      const payload = {
        name: config.name,
        rubro: config.rubro,
        tags: config.tags,
        jobTitles: config.jobTitles,
        extraInfo: config.extraInfo,
        showBudget: config.showBudget
      };
      if (config.id) {
        await pb.collection('configuracion').update(config.id, payload);
      } else {
        await pb.collection('configuracion').create(payload);
      }
    } catch (e) {
      console.error('Error updating config', e);
      throw e;
    }
  }
};
