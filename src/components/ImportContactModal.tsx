import React, { useState, useRef, useEffect } from 'react';
import { ContactData } from '../types';
import * as XLSX from 'xlsx';
import { pbService } from '../services/pbService';

interface ImportContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (contacts: Partial<ContactData>[]) => void;
}

export default function ImportContactModal({ isOpen, onClose, onImport }: ImportContactModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedData, setPastedData] = useState('');
  const [importObservation, setImportObservation] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{current: number, total: number} | null>(null);
  const [duplicateEmails, setDuplicateEmails] = useState<string[]>([]);
  const [contactsToUpload, setContactsToUpload] = useState<Partial<ContactData>[]>([]);
  const [showDuplicateView, setShowDuplicateView] = useState(false);
  const [parsedContacts, setParsedContacts] = useState<Partial<ContactData>[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset all states when modal closes
      setShowDuplicateView(false);
      setDuplicateEmails([]);
      setContactsToUpload([]);
      setParsedContacts([]);
      setSelectedFileName(null);
      setPastedData('');
      setImportObservation('');
      setIsProcessing(false);
      setActiveTab('upload');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const mapHeaderToField = (header: string): keyof ContactData | null => {
    const h = header.toLowerCase().trim();
    if ((h.includes('nombre') && !h.includes('apellido')) || h === 'nombre') return 'firstName';
    if (h.includes('apellido')) return 'lastName';
    if (h.includes('válido')) return 'isEmailValid' as any;
    if (h === 'email' || h === 'correo' || h === 'e-mail' || (h.includes('email') && !h.includes('válido') && !h.includes('status'))) return 'email';
    if (h.includes('cargo') || h.includes('puesto')) return 'jobTitle';
    if (h.includes('empresa') || h.includes('compañia') || h === 'company') return 'company';
    if (h.includes('telefono') || h.includes('celular')) return 'phone';
    if (h.includes('pais') || h.includes('country')) return 'country';
    if (h.includes('provincia') || h.includes('estado')) return 'province';
    if (h.includes('ids_origen')) return 'externalId';
    if (h.includes('actividad')) return 'activity';
    if (h === 'base') return 'dbSource';
    if (h.includes('tipo')) return 'companyType';
    if (h.includes('link') || h.includes('perfil')) return 'profileLink';
    if (h.includes('origen')) return 'source';
    if (h === 'emial' || h === 'asignado') return 'assignedTo';
    return null;
  };

  const processData = (data: any[]) => {
    if (data.length < 1) return [];
    
    const applyObservation = (contact: Partial<ContactData>) => {
      if (importObservation.trim()) {
        const note = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          text: importObservation,
          date: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
          tag: 'Importación'
        };
        contact.stages = [
          { id: 1, name: 'Descubrimiento', notes: [note] },
          { id: 2, name: 'Propuesta', notes: [] },
          { id: 3, name: 'Negociación', notes: [] },
          { id: 4, name: 'Cierre', notes: [] },
          { id: 5, name: 'Post-Venta', notes: [] },
        ];
      }
      return contact;
    };

    const handleSpecialFields = (contact: Partial<ContactData>, key: string, value: any) => {
      const h = key.toLowerCase().trim();
      
      if (h.includes('nombre completo') && !contact.firstName) {
        const parts = String(value).split(' ');
        contact.firstName = parts[0] || '';
        contact.lastName = parts.slice(1).join(' ') || '';
      }

      if (h.includes('válido')) {
        contact.isEmailValid = String(value) === '1' || String(value).toLowerCase() === 'true';
      }
    };

    if (typeof data[0] === 'object' && !Array.isArray(data[0])) {
      const contacts: Partial<ContactData>[] = [];
      data.forEach(item => {
        const baseContact: Partial<ContactData> = {};
        let rawEmails: string[] = [];

        Object.keys(item).forEach(key => {
          const field = mapHeaderToField(key);
          if (field) {
            if (field === 'isEmailValid') {
              baseContact.isEmailValid = String(item[key]) === '1' || String(item[key]).toLowerCase() === 'true';
            } else if (field === 'email') {
              const val = String(item[key] || '').trim();
              if (val) {
                // Split by common delimiters: /, ;, ,, or whitespace
                rawEmails = val.split(/[\/\;, \t\n]+/).filter(e => e.includes('@'));
              }
            } else if (field !== 'tasks' && field !== 'stages') {
              (baseContact as any)[field] = String(item[key] || '').trim();
            }
          }
          handleSpecialFields(baseContact, key, item[key]);
        });

        if (baseContact.isEmailValid === false) return;

        if (rawEmails.length > 0) {
          rawEmails.forEach(email => {
            contacts.push(applyObservation({ ...baseContact, email: email.toLowerCase() }));
          });
        } else if (Object.keys(baseContact).length > 0) {
          contacts.push(applyObservation(baseContact));
        }
      });
      return contacts;
    }

    const headers = data[0].map((h: any) => String(h));
    const result: Partial<ContactData>[] = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const baseContact: Partial<ContactData> = {};
      let rawEmails: string[] = [];

      headers.forEach((header: string, idx: number) => {
        const field = mapHeaderToField(header);
        const val = row[idx];
        if (field) {
          if (field === 'isEmailValid') {
            baseContact.isEmailValid = String(val) === '1' || String(val).toLowerCase() === 'true';
          } else if (field === 'email') {
            const emailVal = String(val || '').trim();
            if (emailVal) {
              rawEmails = emailVal.split(/[\/\;, \t\n]+/).filter(e => e.includes('@'));
            }
          } else if (field !== 'tasks' && field !== 'stages') {
            (baseContact as any)[field] = String(val || '').trim();
          }
        }
        handleSpecialFields(baseContact, header, val);
      });

      if (baseContact.isEmailValid === false) continue;

      if (rawEmails.length > 0) {
        rawEmails.forEach(email => {
          result.push(applyObservation({ ...baseContact, email: email.toLowerCase() }));
        });
      } else if (Object.keys(baseContact).length > 0) {
        result.push(applyObservation(baseContact));
      }
    }
    return result;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    parseFile(file);
  };

  const parseFile = (file: File) => {
    setIsProcessing(true);
    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const contacts = processData(jsonData);
        if (contacts.length > 0) {
          // Just store the parsed contacts — do NOT upload yet
          setParsedContacts(contacts);
        } else {
          alert("No se encontraron contactos válidos en el archivo. Verifica los encabezados.");
          setSelectedFileName(null);
        }
      } catch (err) {
        console.error("Error parsing file", err);
        alert("Error al leer el archivo. Asegúrate de que sea un CSV o Excel válido.");
        setSelectedFileName(null);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = (e: React.MouseEvent) => {
    e.preventDefault();
    const headers = ["Nombre", "Apellido", "Nombre Completo", "Email", "Actividad", "Cargo", "Empresa", "Telefono", "Pais", "Provincia", "Origen", "Tipo", "Perfil LinkedIn"];
    const data = [
      ["Juan", "Perez", "Juan Perez", "juan@ejemplo.com", "SaaS", "Gerente", "Empresa SA", "+5411223344", "Argentina", "Buenos Aires", "LinkedIn", "Cliente", "https://linkedin.com/in/juan"]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, "plantilla_contactos_crm.csv");
  };

  const handleImport = () => {
    // File tab: use pre-parsed contacts from file selection
    if (activeTab === 'upload') {
      if (parsedContacts.length === 0) {
        alert("Por favor seleccioná un archivo primero.");
        return;
      }
      handleDuplicateCheck(parsedContacts);
      return;
    }

    // Paste tab
    if (!pastedData.trim()) {
      alert("Por favor pega algunos datos primero.");
      return;
    }

    setIsProcessing(true);
    
    setTimeout(() => {
      try {
        const rows = pastedData.split('\n').filter(r => r.trim() !== '');
        if (rows.length > 1) {
          const separator = rows[0].includes('\t') ? '\t' : (rows[0].includes(',') ? ',' : ';');
          const data = rows.map(row => row.split(separator).map(cell => cell.trim()));
          const contacts = processData(data);
          
          if (contacts.length > 0) {
            handleDuplicateCheck(contacts);
            setPastedData('');
            return;
          }
        }
        alert("No se pudieron procesar los datos. Asegúrate de incluir encabezados (Nombre, Email, etc).");
      } catch (e) {
        console.error("Parse Error", e);
        alert("Error al procesar los datos");
      } finally {
        setIsProcessing(false);
      }
    }, 800);
  };

  const handleDuplicateCheck = async (contacts: Partial<ContactData>[]) => {
    setIsProcessing(true);
    try {
      const allEmails = contacts.map(c => c.email).filter(Boolean) as string[];
      if (allEmails.length === 0) {
        onImport(contacts);
        onClose();
        return;
      }

      const existingEmails = await pbService.findExistingEmails(allEmails);
      if (existingEmails.length > 0) {
        setDuplicateEmails(existingEmails);
        setContactsToUpload(contacts);
        setShowDuplicateView(true);
      } else {
        onImport(contacts);
        onClose();
      }
    } catch (e) {
      console.error("Duplicate check error", e);
      onImport(contacts);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmUpload = async () => {
    const finalContacts = contactsToUpload.filter(c => {
      const normalizedEmail = (c.email || '').trim().toLowerCase();
      return !duplicateEmails.includes(normalizedEmail);
    });
    
    if (finalContacts.length > 0) {
      setIsProcessing(true);
      setUploadProgress({ current: 0, total: finalContacts.length });
      
      try {
        await pbService.importBulkContacts(finalContacts, (count) => {
          setUploadProgress({ current: count, total: finalContacts.length });
        });
        
        // After successful upload, tell parent to refresh data
        onImport([]); // We pass empty because we already uploaded them
        onClose();
      } catch (e) {
        console.error("Upload Error", e);
        alert("Error al subir los contactos. Algunos registros podrían no haberse guardado.");
      } finally {
        setIsProcessing(false);
        setUploadProgress(null);
      }
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-surface-container rounded-3xl border border-outline-variant/20 shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
        {showDuplicateView ? (
          <>
            <div className="p-8 text-center flex-1 overflow-y-auto custom-scrollbar">
              <div className="w-20 h-20 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl">warning</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 font-headline">Contactos Duplicados Detectados</h2>
              <p className="text-on-surface-variant mb-8">
                Hemos encontrado <span className="text-error font-bold">{duplicateEmails.length}</span> emails que ya existen en su base de datos. 
                <br />Estos registros <span className="font-bold underline">no se subirán</span> para evitar duplicidad.
              </p>

              <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 p-4 mb-8">
                <p className="text-[10px] text-outline font-bold uppercase tracking-widest mb-3 text-left">Lista de emails duplicados:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {duplicateEmails.map(email => (
                    <div key={email} className="flex items-center gap-2 text-xs text-on-surface px-3 py-1.5 bg-surface-container-highest/30 rounded-lg border border-outline-variant/5">
                      <span className="material-symbols-outlined text-[14px] text-error">block</span>
                      <span className="truncate">{email}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={onClose}
                  className="px-8 py-3 rounded-xl border border-outline-variant/30 text-white font-bold text-sm tracking-wide hover:bg-surface-container-highest transition-colors"
                >
                  Cancelar Todo
                </button>
                <button 
                  onClick={confirmUpload}
                  className="px-8 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm tracking-wide shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">publish</span>
                  Subir los {contactsToUpload.length - duplicateEmails.length} restantes
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
              <div>
                <h2 className="text-2xl font-headline font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">cloud_upload</span>
                  Importación Masiva
                </h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  Agregue múltiples contactos desde archivos CSV, Excel o base de datos.
                </p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-outline hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex border-b border-outline-variant/10">
              <button 
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'upload' ? 'border-primary text-primary' : 'border-transparent text-outline hover:text-white hover:bg-surface-container-highest/20'}`}
              >
                Subir Archivo (.csv, .xlsx)
              </button>
              <button 
                onClick={() => setActiveTab('paste')}
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'paste' ? 'border-primary text-primary' : 'border-transparent text-outline hover:text-white hover:bg-surface-container-highest/20'}`}
              >
                Pegar Datos (Excel / Sheets)
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                className="hidden" 
              />
              
              {activeTab === 'upload' ? (
                parsedContacts.length > 0 ? (
                  // File ready to import - show preview instead of dropzone
                  <div className="border-2 border-primary/40 rounded-2xl bg-primary/5 flex flex-col items-center justify-center p-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center text-primary mb-4">
                      <span className="material-symbols-outlined text-3xl">check_circle</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Archivo listo para importar</h3>
                    <p className="text-sm text-primary font-semibold mb-1">{selectedFileName}</p>
                    <p className="text-sm text-on-surface-variant mb-6">
                      Se detectaron <span className="text-white font-bold">{parsedContacts.length}</span> contactos válidos.
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setParsedContacts([]); setSelectedFileName(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="px-5 py-2 rounded-xl bg-surface-container-highest text-on-surface-variant font-bold text-sm tracking-wide border border-outline-variant/20 hover:text-white transition-colors"
                    >
                      Cambiar archivo
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file) parseFile(file);
                    }}
                    className="border-2 border-dashed border-outline-variant/30 rounded-2xl bg-surface-container-highest/10 flex flex-col items-center justify-center p-12 text-center group hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-3xl">upload_file</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Arrastra tu archivo aquí</h3>
                    <p className="text-sm text-on-surface-variant max-w-sm mb-6">
                      Soportamos formatos .csv, .xls, y .xlsx. Asegúrate de que los encabezados coincidan con nuestra estructura.
                    </p>
                    <button 
                      className="px-6 py-2 rounded-xl bg-surface-container-highest text-white font-bold text-sm tracking-wide border border-outline-variant/20 hover:bg-surface-container-highest/80"
                    >
                      Explorar Archivos
                    </button>
                  </div>
                )
              ) : (
                <div className="flex flex-col h-full min-h-[300px]">
                  <label className="text-xs font-bold text-outline uppercase tracking-wider mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">content_paste</span>
                    Pega tus datos aquí
                  </label>
                  <textarea
                    value={pastedData}
                    onChange={(e) => setPastedData(e.target.value)}
                    placeholder="Nombre, Apellido, Email, Cargo, Empresa..."
                    className="w-full flex-1 min-h-[250px] bg-surface-container-highest border border-outline-variant/20 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-on-surface-variant/50 resize-none font-mono"
                  />
                  <p className="text-xs text-on-surface-variant mt-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-secondary">info</span>
                    Puedes copiar directamente desde Google Sheets o Excel.
                  </p>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-outline-variant/10">
                <label className="text-xs font-bold text-outline uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">description</span>
                  Observación Global para esta Importación
                </label>
                <textarea
                  value={importObservation}
                  onChange={(e) => setImportObservation(e.target.value)}
                  placeholder="Ej: Base de prospectos feriado AR, campaña Q3..."
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-on-surface-variant/30 h-20 resize-none transition-all"
                />
                <p className="text-[10px] text-on-surface-variant mt-2">
                  Esta nota se agregará automáticamente a todos los contactos importados en la etapa de "Descubrimiento".
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-outline-variant/10 bg-surface-container-low flex items-center justify-between">
              <button 
                onClick={downloadTemplate}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">table_view</span>
                Descargar Plantilla CSV
              </button>
              <div className="flex items-center gap-3">
                <button 
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-transparent text-white font-bold text-sm tracking-wide hover:bg-surface-container transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleImport}
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm tracking-wide shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/40 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">refresh</span>
                      {uploadProgress ? `Subiendo ${uploadProgress.current} / ${uploadProgress.total}...` : 'Procesando...'}
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">database</span>
                      Iniciar Importación
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
