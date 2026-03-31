import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList } from 'recharts';
import { ContactData, Task, Note } from '../types';

const contactsByUser = [
  { name: 'Roberto M.', contactados: 145 },
  { name: 'Elena R.', contactados: 112 },
  { name: 'Carlos L.', contactados: 84 },
];

interface DashboardProps {
  onOpenNewContact?: () => void;
  contacts?: ContactData[];
}

export default function Dashboard({ onOpenNewContact, contacts = [] }: DashboardProps) {
  // Extract pending tasks from all contacts
  const allTasks = contacts.flatMap(c => 
    (c.tasks || []).map(t => ({ ...t, contactName: `${c.firstName} ${c.lastName}` }))
  );
  const pendingTasks = allTasks.filter(t => !t.completed);

  // Extract reminders from all contacts
  const allReminders = contacts.flatMap(c => 
    (c.stages || []).flatMap(s => 
      s.notes
        .filter(n => n.reminderDate)
        .map(n => ({ ...n, contactName: `${c.firstName} ${c.lastName}`, stageName: s.name }))
    )
  );

  // Extract recent activity (all notes)
  const allActivity = contacts.flatMap(c => 
    (c.stages || []).flatMap(s => 
      s.notes.map(n => ({
        ...n,
        contactName: `${c.firstName} ${c.lastName}`,
        stageName: s.name,
        timestamp: parseInt(n.id) || 0
      }))
    )
  ).sort((a, b) => b.timestamp - a.timestamp);

  // --- KPI Calculations ---
  const totalContactos = contacts.length;

  const getContactStage = (contact: ContactData) => {
    let activeStage = 0;
    contact.stages?.forEach(stage => {
      if (stage.notes && stage.notes.length > 0) {
        activeStage = Math.max(activeStage, stage.id);
      }
    });
    return activeStage;
  };

  const totalContactados = contacts.length;
  const totalReunion = contacts.filter(c => getContactStage(c) >= 2).length;
  const totalCerrado = contacts.filter(c => getContactStage(c) >= 3).length;

  const funnelData = [
    { name: 'Contactados', value: totalContactados, fill: '#d2bbff' },
    { name: 'Reunión', value: totalReunion, fill: '#a376ff' },
    { name: 'Cerrado/Perdido', value: totalCerrado, fill: '#703ecc' },
  ];

  const userCounts = contacts.reduce((acc, contact) => {
    const user = contact.assignedTo || 'Sin asignar';
    acc[user] = (acc[user] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const contactsByUser = Object.entries(userCounts).map(([name, count]) => ({
    name,
    contactados: count
  })).sort((a, b) => b.contactados - a.contactados);

  const clientesGanados = contacts.filter(c => getContactStage(c) === 3).length;
  const propuestas = contacts.filter(c => getContactStage(c) === 2).length;
  const tasaAvance = totalContactos > 0 ? Math.round(((clientesGanados + propuestas) / totalContactos) * 100) : 0;

  let activasHoy = 0;
  let vencidas = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  contacts.forEach(contact => {
    // Check tasks
    contact.tasks?.forEach(task => {
      if (!task.completed && task.dueDateTimestamp) {
        if (task.dueDateTimestamp < today.getTime()) {
          vencidas++;
        } else if (task.dueDateTimestamp >= today.getTime() && task.dueDateTimestamp < tomorrow.getTime()) {
          activasHoy++;
        }
      }
    });

    // Check reminders
    contact.stages?.forEach(stage => {
      stage.notes.forEach(note => {
        if (note.reminderTimestamp) {
          if (note.reminderTimestamp < today.getTime()) {
            vencidas++;
          } else if (note.reminderTimestamp >= today.getTime() && note.reminderTimestamp < tomorrow.getTime()) {
            activasHoy++;
          }
        }
      });
    });
  });
  // ------------------------

  return (
    <div className="pt-6 px-4 md:pt-8 md:px-8 pb-24 md:pb-12 min-h-screen">
      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-6 mb-8">
        <div className="lg:col-span-1 bg-surface-container p-5 md:p-6 rounded-xl border border-outline-variant/5">
          <p className="text-[11px] font-bold text-outline uppercase tracking-wider mb-4">Total Contactos</p>
          <div className="flex items-baseline gap-2">
            <h3 className="font-headline text-3xl font-extrabold">{totalContactos}</h3>
            <span className="text-[10px] text-secondary-container">+12%</span>
          </div>
        </div>
        
        <div className="lg:col-span-1 bg-surface-container p-5 md:p-6 rounded-xl border border-outline-variant/5">
          <p className="text-[11px] font-bold text-outline uppercase tracking-wider mb-4">Op. Activas</p>
          <div className="flex items-baseline gap-2">
            <h3 className="font-headline text-3xl font-extrabold">{activasHoy}</h3>
            <span className="text-[10px] text-outline">vence hoy</span>
          </div>
        </div>
        
        <div className="lg:col-span-1 bg-surface-container p-5 md:p-6 rounded-xl border border-error/10 bg-error/5 group">
          <p className="text-[11px] font-bold text-error uppercase tracking-wider mb-4 flex items-center gap-2">
            Op. Vencidas
            <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="font-headline text-3xl font-extrabold text-error">{vencidas}</h3>
            <span className="text-xs text-error/60 material-symbols-outlined">priority_high</span>
          </div>
        </div>
        
        <div className="lg:col-span-1 bg-surface-container p-5 md:p-6 rounded-xl border border-outline-variant/5">
          <p className="text-[11px] font-bold text-outline uppercase tracking-wider mb-4">Clientes Ganados</p>
          <div className="flex items-baseline gap-2">
            <h3 className="font-headline text-3xl font-extrabold">{clientesGanados}</h3>
            <span className="text-[10px] text-secondary-container">↑ 4</span>
          </div>
        </div>
        
        <div className="lg:col-span-1 bg-surface-container p-5 md:p-6 rounded-xl border border-outline-variant/5">
          <p className="text-[11px] font-bold text-outline uppercase tracking-wider mb-4">Propuestas</p>
          <div className="flex items-baseline gap-2">
            <h3 className="font-headline text-3xl font-extrabold">{propuestas}</h3>
            <span className="text-[10px] text-primary">80% conv.</span>
          </div>
        </div>
        
        <div className="lg:col-span-1 bg-surface-container p-5 md:p-6 rounded-xl border border-outline-variant/5 bg-gradient-to-br from-surface-container to-surface-container-high">
          <p className="text-[11px] font-bold text-outline uppercase tracking-wider mb-4">Tasa Avance</p>
          <div className="flex items-baseline gap-2">
            <h3 className="font-headline text-3xl font-extrabold">{tasaAvance}%</h3>
            <div className="w-full h-1 bg-surface-container-lowest rounded-full mt-2 relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${tasaAvance}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Análisis de Contactabilidad y Conversión */}
      <div className="grid grid-cols-12 gap-4 md:gap-8 mb-8">
        {/* Contactos por Ejecutivo */}
        <div className="col-span-12 lg:col-span-6 bg-surface-container p-5 md:p-8 rounded-xl border border-outline-variant/5 min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h4 className="font-headline text-xl font-bold">Contactabilidad</h4>
              <p className="text-xs text-outline mt-1 font-body">Contactos realizados por ejecutivo</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[10px] text-outline uppercase font-bold tracking-widest">Total Contactados</p>
              <p className="text-2xl font-headline font-bold text-primary">{totalContactados}</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contactsByUser} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#353436" horizontal={false} />
                <XAxis type="number" stroke="#958e9f" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#e5e2e3" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#201f20', borderColor: '#4a4453', borderRadius: '8px', color: '#e5e2e3' }}
                  itemStyle={{ color: '#d2bbff' }}
                  cursor={{ fill: '#2a2a2b' }}
                />
                <Bar dataKey="contactados" fill="#a376ff" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel de Ventas */}
        <div className="col-span-12 lg:col-span-6 bg-surface-container p-5 md:p-8 rounded-xl border border-outline-variant/5 min-w-0">
          <div className="mb-6">
            <h4 className="font-headline text-xl font-bold">Funnel de Conversión</h4>
            <p className="text-xs text-outline mt-1 font-body">Contactados - Reunión - Cerrado/Perdido</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip
                  contentStyle={{ backgroundColor: '#201f20', borderColor: '#4a4453', borderRadius: '8px', color: '#e5e2e3' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Funnel
                  dataKey="value"
                  data={funnelData}
                  isAnimationActive
                >
                  <LabelList position="center" fill="#131314" stroke="none" dataKey="name" fontSize={12} fontWeight="bold" />
                  <LabelList position="right" fill="#e5e2e3" stroke="none" dataKey="value" fontSize={14} fontWeight="bold" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Tasks, Ranking & Activity */}
      <div className="grid grid-cols-12 gap-4 md:gap-8">
        {/* Tareas Pendientes */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container p-5 md:p-6 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-headline text-md font-bold">Tareas del Día</h4>
            <span className="text-[10px] font-bold text-primary">{pendingTasks.length} Pendientes</span>
          </div>
          <div className="space-y-3">
            {pendingTasks.length === 0 ? (
              <p className="text-xs text-outline italic text-center py-4">No hay tareas pendientes</p>
            ) : (
              pendingTasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-container-high group transition-all">
                  <div className="mt-0.5 w-4 h-4 border-2 border-outline/30 rounded flex items-center justify-center group-hover:border-primary transition-colors">
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-on-surface">{task.title}</p>
                    <p className="text-[10px] text-outline mt-1 flex justify-between">
                      <span>{task.contactName}</span>
                      <span className={task.isOverdue ? 'text-error font-bold' : ''}>{task.dueDate}</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recordatorios */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container p-5 md:p-6 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-headline text-md font-bold">Recordatorios</h4>
            <span className="text-[10px] font-bold text-secondary-container">{allReminders.length} Próximos</span>
          </div>
          <div className="space-y-3">
            {allReminders.length === 0 ? (
              <p className="text-xs text-outline italic text-center py-4">No hay recordatorios próximos</p>
            ) : (
              allReminders.slice(0, 5).map(reminder => (
                <div key={reminder.id} className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-high border border-outline-variant/5">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-secondary-container/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[12px] text-secondary-container">notification_important</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-on-surface line-clamp-2">{reminder.text}</p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-[10px] text-outline font-bold">{reminder.contactName}</p>
                      <p className="text-[10px] text-secondary-container font-bold bg-secondary-container/10 px-2 py-0.5 rounded">
                        {reminder.reminderDate}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container p-5 md:p-6 rounded-xl">
          <h4 className="font-headline text-md font-bold mb-6">Actividad Reciente</h4>
          <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-outline-variant/20">
            {allActivity.length === 0 ? (
              <p className="text-xs text-outline italic text-center py-4">No hay actividad reciente</p>
            ) : (
              allActivity.slice(0, 5).map((activity, index) => (
                <div key={activity.id} className="relative pl-8">
                  <div className={`absolute left-0 top-1 w-4 h-4 rounded-full flex items-center justify-center ${index === 0 ? 'bg-primary/20' : 'bg-outline-variant/20'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${index === 0 ? 'bg-primary' : 'bg-outline'}`}></div>
                  </div>
                  <p className="text-[11px] font-bold line-clamp-1">{activity.text}</p>
                  <p className="text-[10px] text-outline">{activity.date} • {activity.contactName}</p>
                </div>
              ))
            )}
          </div>
          <button className="w-full mt-8 py-2 text-[10px] font-bold text-outline hover:text-primary transition-colors flex items-center justify-center gap-2">
            Ver historial completo
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
