import React from 'react';

export default function Servicios() {
  return (
    <div className="pt-6 px-4 md:pt-8 md:px-8 pb-24 md:pb-12 min-h-screen">
      {/* Header Section */}
      <div className="mb-8 md:mb-12">
        <h2 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Catálogo de Servicios</h2>
        <p className="text-on-surface-variant max-w-2xl font-body text-sm md:text-base">Ecosistema de soluciones consultivas diseñadas para la alta dirección. Use esta guía para articular valor y mitigar barreras en el ciclo de venta.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        {/* Service Catalog Grid */}
        <section className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Estrategia Digital */}
            <div className="bg-surface-container rounded-xl p-6 md:p-8 border border-outline-variant/5 hover:border-primary/20 transition-all duration-300 group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-2xl md:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>strategy</span>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-secondary-container/10 text-secondary-container border border-secondary-container/20 text-center">Alta Rentabilidad</span>
              </div>
              <h3 className="font-headline text-xl md:text-2xl font-bold text-white mb-4">Estrategia Digital</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest block mb-2">Valor Agregado</label>
                  <p className="text-sm text-on-surface-variant leading-relaxed italic">"Transformamos la incertidumbre tecnológica en una hoja de ruta financiera ejecutable, reduciendo el riesgo de inversión en un 40%."</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest block mb-2">Cliente Ideal</label>
                    <p className="text-xs text-on-surface">CEOs de empresas medianas con procesos manuales.</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest block mb-2">Ticket Promedio</label>
                    <p className="text-xs text-primary font-bold">$15k - $45k USD</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant/10">
                  <label className="text-[10px] font-bold text-error uppercase tracking-widest block mb-2">Objeciones Frecuentes</label>
                  <ul className="text-xs space-y-2 text-on-surface-variant">
                    <li className="flex gap-2 items-start">
                      <span className="material-symbols-outlined text-error text-sm mt-0.5">cancel</span>
                      "Es un gasto, no una inversión prioritaria ahora."
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="material-symbols-outlined text-error text-sm mt-0.5">cancel</span>
                      "Ya tenemos un departamento de TI interno."
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Card 2: Implementación CRM */}
            <div className="bg-surface-container rounded-xl p-6 md:p-8 border border-outline-variant/5 hover:border-primary/20 transition-all duration-300 group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-2xl md:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>architecture</span>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-primary-container/10 text-primary-container border border-primary-container/20 text-center">Operativo</span>
              </div>
              <h3 className="font-headline text-xl md:text-2xl font-bold text-white mb-4">Implementación CRM</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest block mb-2">Valor Agregado</label>
                  <p className="text-sm text-on-surface-variant leading-relaxed italic">"Despliegue táctico que garantiza la adopción del equipo comercial al 90%, eliminando silos de información en 60 días."</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest block mb-2">Cliente Ideal</label>
                    <p className="text-xs text-on-surface">Direcciones comerciales con equipos de +10 personas.</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest block mb-2">Ticket Promedio</label>
                    <p className="text-xs text-primary font-bold">$8k - $20k USD</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant/10">
                  <label className="text-[10px] font-bold text-error uppercase tracking-widest block mb-2">Objeciones Frecuentes</label>
                  <ul className="text-xs space-y-2 text-on-surface-variant">
                    <li className="flex gap-2 items-start">
                      <span className="material-symbols-outlined text-error text-sm mt-0.5">cancel</span>
                      "El equipo no querrá usar una herramienta nueva."
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="material-symbols-outlined text-error text-sm mt-0.5">cancel</span>
                      "Es muy complejo migrar nuestros Excels."
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Card 3: Auditoría de Procesos */}
            <div className="bg-surface-container rounded-xl p-6 md:p-8 border border-outline-variant/5 hover:border-primary/20 transition-all duration-300 group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-2xl md:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>fact_check</span>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-surface-variant text-on-surface-variant border border-outline-variant/20 text-center">Puerta de Entrada</span>
              </div>
              <h3 className="font-headline text-xl md:text-2xl font-bold text-white mb-4">Auditoría de Procesos</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest block mb-2">Valor Agregado</label>
                  <p className="text-sm text-on-surface-variant leading-relaxed italic">"Diagnóstico 'Rayos X' de la operación actual que identifica fugas de capital ocultas en el flujo de trabajo diario."</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest block mb-2">Cliente Ideal</label>
                    <p className="text-xs text-on-surface">Empresas en fase de escalamiento acelerado.</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest block mb-2">Ticket Promedio</label>
                    <p className="text-xs text-primary font-bold">$3k - $7k USD</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant/10">
                  <label className="text-[10px] font-bold text-error uppercase tracking-widest block mb-2">Objeciones Frecuentes</label>
                  <ul className="text-xs space-y-2 text-on-surface-variant">
                    <li className="flex gap-2 items-start">
                      <span className="material-symbols-outlined text-error text-sm mt-0.5">cancel</span>
                      "Ya sabemos lo que está mal, solo ocupamos manos."
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Card 4: Capacitación Ejecutiva */}
            <div className="bg-surface-container rounded-xl p-6 md:p-8 border border-outline-variant/5 hover:border-primary/20 transition-all duration-300 group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-2xl md:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/20 text-center">Continuidad</span>
              </div>
              <h3 className="font-headline text-xl md:text-2xl font-bold text-white mb-4">Capacitación Ejecutiva</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest block mb-2">Valor Agregado</label>
                  <p className="text-sm text-on-surface-variant leading-relaxed italic">"Transferencia de know-how crítico para que la empresa no dependa externamente de consultores a largo plazo."</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest block mb-2">Cliente Ideal</label>
                    <p className="text-xs text-on-surface">Mandos medios que necesitan actualizar sus skills digitales.</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest block mb-2">Ticket Promedio</label>
                    <p className="text-xs text-primary font-bold">$5k - $12k USD</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant/10">
                  <label className="text-[10px] font-bold text-error uppercase tracking-widest block mb-2">Objeciones Frecuentes</label>
                  <ul className="text-xs space-y-2 text-on-surface-variant">
                    <li className="flex gap-2 items-start">
                      <span className="material-symbols-outlined text-error text-sm mt-0.5">cancel</span>
                      "Podemos ver tutoriales en YouTube o LinkedIn."
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sidebar Strategic Insights */}
        <aside className="space-y-6">
          <div className="bg-surface-container/40 backdrop-blur-xl rounded-xl p-6 border border-primary/10">
            <h4 className="font-headline text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">lightbulb</span>
              Cuándo ofrecerlo
            </h4>
            <div className="space-y-8">
              <div>
                <h5 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Señales de Estrategia</h5>
                <ul className="space-y-3">
                  <li className="flex gap-3 items-start text-sm text-on-surface-variant">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    El cliente menciona que "siente que la competencia le está ganando".
                  </li>
                  <li className="flex gap-3 items-start text-sm text-on-surface-variant">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    Hay presupuesto asignado pero no hay claridad en el retorno esperado.
                  </li>
                </ul>
              </div>
              
              <div>
                <h5 className="text-xs font-bold text-secondary-container uppercase tracking-wider mb-3">Señales de Implementación</h5>
                <ul className="space-y-3">
                  <li className="flex gap-3 items-start text-sm text-on-surface-variant">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary-container mt-1.5 flex-shrink-0"></div>
                    Quejas constantes sobre "datos perdidos" o "no sabemos qué hace ventas".
                  </li>
                  <li className="flex gap-3 items-start text-sm text-on-surface-variant">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary-container mt-1.5 flex-shrink-0"></div>
                    Dependencia absoluta de hojas de cálculo compartidas.
                  </li>
                </ul>
              </div>
              
              <div>
                <h5 className="text-xs font-bold text-tertiary-container uppercase tracking-wider mb-3">Señales de Capacitación</h5>
                <ul className="space-y-3">
                  <li className="flex gap-3 items-start text-sm text-on-surface-variant">
                    <div className="w-1.5 h-1.5 rounded-full bg-tertiary-container mt-1.5 flex-shrink-0"></div>
                    Alta rotación de personal en el área operativa.
                  </li>
                  <li className="flex gap-3 items-start text-sm text-on-surface-variant">
                    <div className="w-1.5 h-1.5 rounded-full bg-tertiary-container mt-1.5 flex-shrink-0"></div>
                    El cliente pregunta "¿Cómo podemos hacer esto nosotros mismos?".
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-outline-variant/10">
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                <p className="text-[10px] font-bold text-primary uppercase mb-1">Tip de Consultor</p>
                <p className="text-xs text-on-surface-variant">Siempre ancla el precio al **valor del problema resuelto**, no a las horas de trabajo estimadas.</p>
              </div>
            </div>
          </div>

          {/* Strategic Summary Small Card */}
          <div className="bg-surface-container-high rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-outline">KPI de Catálogo</span>
              <span className="material-symbols-outlined text-outline">trending_up</span>
            </div>
            <div className="text-2xl font-headline font-bold text-white mb-1">68%</div>
            <p className="text-[10px] text-on-surface-variant">Tasa de conversión cuando se presenta la Auditoría como puerta de entrada.</p>
          </div>
        </aside>
      </div>

      {/* Footer Stats & Legend */}
      <footer className="mt-12 pt-8 border-t border-outline-variant/10 flex flex-col sm:flex-row gap-6 sm:gap-8 justify-between items-start sm:items-center">
        <div className="flex flex-wrap gap-4 sm:gap-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span className="text-xs text-on-surface-variant">Margen Alto</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-secondary-container"></div>
            <span className="text-xs text-on-surface-variant">Margen Medio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-surface-variant"></div>
            <span className="text-xs text-on-surface-variant">Entrada de Bajo Costo</span>
          </div>
        </div>
        <div className="text-[10px] text-outline italic">
          Última actualización: Noviembre 2023 • Lezac Strategic Methodology v4.2
        </div>
      </footer>
    </div>
  );
}
