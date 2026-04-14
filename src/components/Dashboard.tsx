import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, Area, AreaChart
} from 'recharts';
import { ContactData, Note, User } from '../types';

interface DashboardProps {
  onOpenNewContact?: () => void;
  contacts?: ContactData[];
  user?: User | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  `$${value.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;

const toDateKey = (dateStr: string) => {
  // Accepts YYYY-MM-DD or ISO strings
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
};

const subtractDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
};

// ─── Custom Tooltip for Line Chart ──────────────────────────────────────────
const LineTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-container-high border border-outline-variant/20 rounded-xl p-3 shadow-xl text-xs">
        <p className="text-outline font-semibold mb-1">{label}</p>
        <p className="text-primary font-bold text-sm">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

// ─── Custom Tooltip for Pie Chart ───────────────────────────────────────────
const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-container-high border border-outline-variant/20 rounded-xl p-3 shadow-xl text-xs">
        <p className="font-bold" style={{ color: payload[0].payload.fill }}>{payload[0].name}</p>
        <p className="text-on-surface font-bold text-sm">{payload[0].value} contactos</p>
      </div>
    );
  }
  return null;
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Dashboard({ onOpenNewContact, contacts = [], user }: DashboardProps) {
  const canViewItem = (createdBy?: string) => {
    if (!user) return true;
    if (user.role === 'admin') return true;
    return !createdBy || createdBy === user.name;
  };

  // Date range state for Line Chart (default: last 30 days)
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  const [dateFrom, setDateFrom] = useState<string>(
    subtractDays(today, 30).toISOString().split('T')[0]
  );
  const [dateTo, setDateTo] = useState<string>(today.toISOString().split('T')[0]);

  // ── Extract reminders, activity ──

  const allReminders = contacts.flatMap(c =>
    (c.stages || []).flatMap(s =>
      s.notes
        .filter(n => n.reminderDate && canViewItem(n.createdBy))
        .map(n => ({ ...n, contactName: `${c.firstName} ${c.lastName}`, stageName: s.name }))
    )
  );

  const allActivity = contacts.flatMap(c =>
    (c.stages || []).flatMap(s =>
      s.notes.filter(n => canViewItem(n.createdBy)).map(n => ({
        ...n,
        contactName: `${c.firstName} ${c.lastName}`,
        stageName: s.name,
        timestamp: parseInt(n.id) || 0
      }))
    )
  ).sort((a, b) => b.timestamp - a.timestamp);

  // ── KPI Calculations ──
  const totalContactos = contacts.length;

  const getContactStage = (contact: ContactData) => {
    let activeStage = 0;
    contact.stages?.forEach(stage => {
      if ((stage.notes && stage.notes.length > 0) || (stage.id === 3 && contact.price && contact.price > 0)) {
        activeStage = Math.max(activeStage, stage.id);
      }
    });
    return activeStage;
  };

  const etapa1 = contacts.filter(c => getContactStage(c) >= 1 || c.status === 'won').length;
  const etapa2 = contacts.filter(c => getContactStage(c) >= 2 || c.status === 'won').length;
  const etapa3 = contacts.filter(c => getContactStage(c) >= 3 || c.status === 'won').length;
  const etapa4 = contacts.filter(c => getContactStage(c) >= 4 || c.status === 'won').length;
  const etapaGanados = contacts.filter(c => c.status === 'won').length;

  const funnelData = [
    { name: 'Descubrimiento', value: etapa1, fill: '#d2bbff' },
    { name: 'Propuesta', value: etapa2, fill: '#b592ff' },
    { name: 'Negociación', value: etapa3, fill: '#966dff' },
    { name: 'Cierre', value: etapa4, fill: '#703ecc' },
  ];

  const userCounts = contacts.reduce((acc, contact) => {
    const u = contact.assignedTo || 'Sin asignar';
    acc[u] = (acc[u] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const contactsByUser = Object.entries(userCounts).map(([name, count]) => ({
    name,
    contactados: count
  })).sort((a, b) => b.contactados - a.contactados);

  const clientesGanados = contacts.filter(c => c.status === 'won').length;
  const clientesPerdidos = contacts.filter(c => c.status === 'lost').length;
  const clientesActivos = contacts.filter(c => !c.status || c.status === 'active').length;

  const propuestas = contacts.filter(c => getContactStage(c) >= 2 && c.status !== 'lost' && c.status !== 'won').length;
  const tasaAvance = totalContactos > 0 ? Math.round(((clientesGanados + propuestas) / totalContactos) * 100) : 0;

  const ingresoProyectado = contacts
    .filter(c => getContactStage(c) === 3 && c.status !== 'won' && c.status !== 'lost')
    .reduce((sum, c) => sum + (c.price || 0), 0);

  const ingresoReal = contacts
    .filter(c => c.status === 'won')
    .reduce((sum, c) => sum + (c.price || 0), 0);

  let activasHoy = 0;
  let vencidas = 0;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  contacts.forEach(contact => {
    contact.stages?.forEach(stage => {
      stage.notes.forEach(note => {
        if (!canViewItem(note.createdBy)) return;
        if (note.reminderTimestamp) {
          if (note.reminderTimestamp < todayStart.getTime()) vencidas++;
          else if (note.reminderTimestamp >= todayStart.getTime() && note.reminderTimestamp < tomorrowStart.getTime()) activasHoy++;
        }
      });
    });
  });

  // ── Pie Chart Data: Won / Lost / Active ──
  const PIE_DATA = [
    { name: 'Ganados',   value: clientesGanados, fill: '#6ee7b7' },
    { name: 'Perdidos',  value: clientesPerdidos, fill: '#f87171' },
    { name: 'En proceso', value: clientesActivos,  fill: '#a376ff' },
  ].filter(d => d.value > 0);

  const winRate = (clientesGanados + clientesPerdidos) > 0
    ? Math.round((clientesGanados / (clientesGanados + clientesPerdidos)) * 100)
    : 0;

  // ── Line Chart Data: Daily income from won contacts ──
  const lineData = useMemo(() => {
    const from = new Date(dateFrom);
    from.setHours(0, 0, 0, 0);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);

    // Build a map of { dateKey -> totalIncome }
    const dayMap: Record<string, number> = {};

    // Fill all days in range with 0
    const cursor = new Date(from);
    while (cursor <= to) {
      dayMap[cursor.toISOString().split('T')[0]] = 0;
      cursor.setDate(cursor.getDate() + 1);
    }

    // Sum income from won contacts by importDate
    contacts
      .filter(c => c.status === 'won' && c.price && c.price > 0)
      .forEach(c => {
        const key = toDateKey(c.importDate || '');
        if (key && dayMap[key] !== undefined) {
          dayMap[key] += c.price || 0;
        }
      });

    // Convert to array sorted by date
    return Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({
        date: new Date(date + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
        total,
        fullDate: date,
      }));
  }, [contacts, dateFrom, dateTo]);

  const totalInRange = lineData.reduce((s, d) => s + d.total, 0);
  const daysWithSales = lineData.filter(d => d.total > 0).length;

  // Quick-range presets
  const applyPreset = (days: number) => {
    setDateFrom(subtractDays(today, days).toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  };

  // Tick pruning for line chart (show ~8 labels max)
  const tickInterval = Math.max(1, Math.floor(lineData.length / 8));

  return (
    <div className="pt-6 px-4 md:pt-8 md:px-8 pb-24 md:pb-12 min-h-screen">

      {/* ── KPI Bento Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="lg:col-span-1 bg-surface-container p-5 md:p-6 rounded-xl border border-outline-variant/5">
          <p className="text-[11px] font-bold text-outline uppercase tracking-wider mb-4">Total Contactos</p>
          <div className="flex items-baseline gap-2">
            <h3 className="font-headline text-3xl font-extrabold">{totalContactos}</h3>
          </div>
        </div>

        <div className="lg:col-span-1 bg-surface-container p-5 md:p-6 rounded-xl border border-outline-variant/5">
          <p className="text-[11px] font-bold text-outline uppercase tracking-wider mb-4">Op. Activas</p>
          <div className="flex items-baseline gap-2">
            <h3 className="font-headline text-3xl font-extrabold">{activasHoy}</h3>
            {activasHoy > 0 && <span className="text-[10px] text-outline">vence hoy</span>}
          </div>
        </div>

        <div className="lg:col-span-1 bg-surface-container p-5 md:p-6 rounded-xl border border-error/10 bg-error/5 group">
          <p className="text-[11px] font-bold text-error uppercase tracking-wider mb-4 flex items-center gap-2">
            Op. Vencidas
            {vencidas > 0 && <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="font-headline text-3xl font-extrabold text-error">{vencidas}</h3>
            {vencidas > 0 && <span className="text-xs text-error/60 material-symbols-outlined">priority_high</span>}
          </div>
        </div>

        <div className="lg:col-span-1 bg-surface-container p-5 md:p-6 rounded-xl border border-outline-variant/5">
          <p className="text-[11px] font-bold text-outline uppercase tracking-wider mb-4">Clientes Ganados</p>
          <div className="flex items-baseline gap-2">
            <h3 className="font-headline text-3xl font-extrabold">{clientesGanados}</h3>
          </div>
        </div>

        <div className="lg:col-span-1 bg-surface-container p-5 md:p-6 rounded-xl border border-outline-variant/5">
          <p className="text-[11px] font-bold text-outline uppercase tracking-wider mb-4">Propuestas</p>
          <div className="flex items-baseline gap-2">
            <h3 className="font-headline text-3xl font-extrabold">{propuestas}</h3>
            {propuestas > 0 && totalContactos > 0 && (
              <span className="text-[10px] text-primary">{Math.round((propuestas / totalContactos) * 100)}% del total</span>
            )}
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

        <div className="lg:col-span-1 bg-surface-container p-5 md:p-6 rounded-xl border border-outline-variant/5">
          <p className="text-[11px] font-bold text-outline uppercase tracking-wider mb-4">Ingreso Proyectado</p>
          <div className="flex items-baseline gap-2">
            <h3 className="font-headline text-3xl font-extrabold">${ingresoProyectado.toLocaleString('es-AR')}</h3>
          </div>
        </div>

        <div className="lg:col-span-1 bg-surface-container p-5 md:p-6 rounded-xl border border-primary/20 shadow-sm shadow-primary/5 bg-gradient-to-br from-surface-container to-primary/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-primary">
            Ingreso Real
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="font-headline text-3xl font-extrabold drop-shadow-sm">${ingresoReal.toLocaleString('es-AR')}</h3>
          </div>
        </div>
      </div>

      {/* ── Charts Row 1: Pie + Line ── */}
      <div className="grid grid-cols-12 gap-4 md:gap-8 mb-8">

        {/* Pie Chart — Won / Lost / Active */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container p-5 md:p-8 rounded-xl border border-outline-variant/5 min-w-0">
          <div className="mb-6">
            <h4 className="font-headline text-xl font-bold">Unidades</h4>
            <p className="text-xs text-outline mt-1 font-body">Distribución de contactos por estado</p>
          </div>

          {PIE_DATA.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-xs text-outline italic">Sin datos suficientes</p>
            </div>
          ) : (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={PIE_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius="55%"
                      outerRadius="80%"
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {PIE_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex flex-col gap-2 mt-4">
                {PIE_DATA.map(d => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }}></div>
                      <span className="text-xs text-on-surface-variant">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-on-surface">{d.value}</span>
                      <span className="text-[10px] text-outline w-10 text-right">
                        {totalContactos > 0 ? Math.round((d.value / totalContactos) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Win rate badge */}
              {(clientesGanados + clientesPerdidos) > 0 && (
                <div className="mt-5 pt-4 border-t border-outline-variant/10 flex items-center justify-between">
                  <span className="text-[11px] text-outline uppercase font-bold tracking-wider">Tasa de cierre</span>
                  <span className="text-sm font-extrabold" style={{ color: winRate >= 50 ? '#6ee7b7' : '#f87171' }}>
                    {winRate}%
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Line Chart — Daily Income */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container p-5 md:p-8 rounded-xl border border-outline-variant/5 min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h4 className="font-headline text-xl font-bold">Ingresos por Día</h4>
              <p className="text-xs text-outline mt-1 font-body">
                {totalInRange > 0
                  ? <>{formatCurrency(totalInRange)} · {daysWithSales} día{daysWithSales !== 1 ? 's' : ''} con ventas</>
                  : 'Sin ventas en el período seleccionado'}
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              {/* Presets */}
              <div className="flex gap-1">
                {[
                  { label: '7d',  days: 7 },
                  { label: '30d', days: 30 },
                  { label: '90d', days: 90 },
                ].map(p => {
                  const isActive = dateFrom === subtractDays(today, p.days).toISOString().split('T')[0]
                                && dateTo   === today.toISOString().split('T')[0];
                  return (
                    <button
                      key={p.label}
                      onClick={() => applyPreset(p.days)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                        isActive
                          ? 'bg-primary/20 border-primary/40 text-primary'
                          : 'bg-surface-container-high border-outline-variant/10 text-outline hover:text-on-surface'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {/* Date inputs */}
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dateFrom}
                  max={dateTo}
                  onChange={e => setDateFrom(e.target.value)}
                  className="text-[11px] bg-surface-container-high border border-outline-variant/15 rounded-lg px-2 py-1.5 text-on-surface focus:outline-none focus:border-primary/40 transition-colors"
                />
                <span className="text-[10px] text-outline">→</span>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom}
                  onChange={e => setDateTo(e.target.value)}
                  className="text-[11px] bg-surface-container-high border border-outline-variant/15 rounded-lg px-2 py-1.5 text-on-surface focus:outline-none focus:border-primary/40 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#a376ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a376ff" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#353436" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#958e9f"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval={tickInterval}
                  tick={{ fill: '#958e9f' }}
                />
                <YAxis
                  stroke="#958e9f"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => v === 0 ? '0' : `$${(v / 1000).toFixed(0)}k`}
                  width={48}
                />
                <Tooltip content={<LineTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#a376ff"
                  strokeWidth={2.5}
                  fill="url(#incomeGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#a376ff', stroke: '#201f20', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Charts Row 2: Bar + Funnel ── */}
      <div className="grid grid-cols-12 gap-4 md:gap-8 mb-8">
        {/* Bar — Contacts by user */}
        <div className="col-span-12 lg:col-span-6 bg-surface-container p-5 md:p-8 rounded-xl border border-outline-variant/5 min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h4 className="font-headline text-xl font-bold">Contactabilidad</h4>
              <p className="text-xs text-outline mt-1 font-body">Contactos realizados por ejecutivo</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[10px] text-outline uppercase font-bold tracking-widest">Total Contactados</p>
              <p className="text-2xl font-headline font-bold text-primary">{totalContactos}</p>
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
          <div className="mb-8">
            <h4 className="font-headline text-xl font-bold">Funnel de Conversión</h4>
            <p className="text-xs text-outline mt-1 font-body">Análisis por Etapas de Venta</p>
          </div>
          <div className="flex flex-col items-center gap-1.5 py-4">
            {funnelData.map((step, idx) => {
              // Forced widths to create the "funnel" look (4 stages)
              const funnelWidths = ['100%', '85%', '70%', '55%'];
              const isZero = step.value === 0;
              
              return (
                <div key={step.name} className="w-full flex flex-col items-center group">
                  <div
                    className="h-12 transition-all duration-500 ease-out relative overflow-hidden flex items-center justify-between px-6 border border-white/5"
                    style={{
                      width: funnelWidths[idx] || '50%',
                      backgroundColor: isZero ? 'rgba(149, 142, 159, 0.05)' : step.fill,
                      borderRadius: '12px',
                      boxShadow: isZero ? 'none' : `0 8px 16px ${step.fill}40`,
                      opacity: isZero ? 0.3 : 1,
                    }}
                  >
                    {!isZero && <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>}
                    
                    <div className="flex items-center gap-3 z-10 overflow-hidden">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${isZero ? 'bg-white/10 text-outline' : 'bg-white/20 text-white'}`}>
                        {idx + 1}
                      </div>
                      <span className={`text-xs font-bold truncate ${isZero ? 'text-outline' : 'text-white shadow-sm'}`}>
                        {step.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 z-10">
                      <span className={`text-lg font-black ${isZero ? 'text-outline/40' : 'text-white'}`}>
                        {step.value}
                      </span>
                    </div>
                  </div>
                  
                  {/* Conversion Connector */}
                  {idx < funnelData.length - 1 && (
                    <div className="h-4 w-px bg-gradient-to-b from-outline-variant/30 to-transparent"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom Grid: Reminders & Activity ── */}
      <div className="grid grid-cols-12 gap-4 md:gap-8">
        {/* Próximos Recordatorios */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container p-5 md:p-6 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-headline text-md font-bold">Recordatorios del Día</h4>
            <span className="text-[10px] font-bold text-primary">{activasHoy} Hoy</span>
          </div>
          <div className="space-y-3">
            {allReminders.length === 0 ? (
              <p className="text-xs text-outline italic text-center py-4">No hay recordatorios pendientes</p>
            ) : (
              allReminders.slice(0, 5).map(reminder => (
                <div key={reminder.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-container-high group transition-all">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[12px] text-primary">alarm</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-on-surface line-clamp-1">{reminder.text}</p>
                    <p className="text-[10px] text-outline mt-1 flex justify-between">
                      <span>{reminder.contactName}</span>
                      <span className="text-primary font-bold">{reminder.reminderDate}</span>
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
