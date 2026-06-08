import React, { createContext, useContext, useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { CalendarDays, MapPin, Clock, Video, User } from 'lucide-react';
import { Badge } from '../common/Badge';
import type { Actividad } from '../../types';

// --- Types & Interfaces ---
interface AgendaContextType {
  actividades: Actividad[];
  fechasUnicas: string[];
  activeDate: string;
  setActiveDate: (date: string) => void;
}

interface AgendaRootProps {
  actividades: Actividad[];
  children: ReactNode;
}

interface AgendaCardProps {
  actividad: Actividad;
}

// --- Context ---
const AgendaContext = createContext<AgendaContextType | undefined>(undefined);

const useAgendaContext = () => {
  const context = useContext(AgendaContext);
  if (!context) {
    throw new Error('Los componentes de Agenda deben usarse dentro de <Agenda.Root>');
  }
  return context;
};

// --- Compound Components ---

const Root: React.FC<AgendaRootProps> = ({ actividades, children }) => {
  const fechasUnicas = useMemo(() => {
    const fechas = actividades.map(a => a.fecha).filter(Boolean) as string[];
    return Array.from(new Set(fechas)).sort();
  }, [actividades]);

  const [activeDate, setActiveDate] = useState<string>(fechasUnicas[0] || '');

  // Update active date if it becomes invalid due to props changing
  useMemo(() => {
    if (fechasUnicas.length > 0 && !fechasUnicas.includes(activeDate)) {
      setActiveDate(fechasUnicas[0]);
    }
  }, [fechasUnicas, activeDate]);

  const value = { actividades, fechasUnicas, activeDate, setActiveDate };

  return (
    <AgendaContext.Provider value={value}>
      <div className="w-full flex flex-col gap-6 animate-fade-in">
        {children}
      </div>
    </AgendaContext.Provider>
  );
};

const Tabs: React.FC = () => {
  const { fechasUnicas, activeDate, setActiveDate } = useAgendaContext();

  if (fechasUnicas.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto pb-2 -mx-2 px-2 hide-scrollbar">
      <div className="flex gap-2 min-w-max">
        {fechasUnicas.map((fecha, idx) => {
          const isActive = activeDate === fecha;
          return (
            <button
              key={fecha}
              onClick={() => setActiveDate(fecha)}
              className={`relative px-5 py-3 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ease-out select-none ${
                isActive 
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/30 scale-105' 
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:scale-105'
              }`}
            >
              <span className={`text-[10px] uppercase tracking-wider font-bold mb-1 opacity-80`}>
                Día {idx + 1}
              </span>
              <span className="text-sm font-semibold whitespace-nowrap">
                {fecha}
              </span>
              {isActive && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const List: React.FC = () => {
  const { actividades, activeDate } = useAgendaContext();

  const actividadesDelDia = useMemo(() => {
    return actividades
      .filter(a => a.fecha === activeDate)
      .sort((a, b) => {
        // Ordenar por hora de inicio (simplificado, asumiendo formato HH:MM AM/PM estándar o HH:MM 24h)
        const timeA = new Date(`1970/01/01 ${a.hora_inicio}`).getTime();
        const timeB = new Date(`1970/01/01 ${b.hora_inicio}`).getTime();
        return (timeA || 0) - (timeB || 0);
      });
  }, [actividades, activeDate]);

  if (actividadesDelDia.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/20">
        <CalendarDays className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No hay actividades programadas para este día.</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-6 pl-4 md:pl-0">
      {/* Línea de tiempo vertical central (visible solo en desktop) */}
      <div className="hidden md:block absolute left-[120px] top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
      
      {actividadesDelDia.map((act) => (
        <Card key={act.id} actividad={act} />
      ))}
    </div>
  );
};

const Card: React.FC<AgendaCardProps> = ({ actividad }) => {
  const isVirtual = !!actividad.enlace_virtual;

  return (
    <div className="relative flex flex-col md:flex-row gap-4 md:gap-8 group">
      {/* Indicador de Línea de Tiempo (Desktop) */}
      <div className="hidden md:flex flex-col items-end w-[100px] shrink-0 pt-4 relative">
        {/* Punto en la línea */}
        <div className="absolute right-[-17px] top-5 w-3 h-3 rounded-full bg-white dark:bg-slate-950 border-2 border-indigo-500 shadow-sm shadow-indigo-500/40 z-10 group-hover:scale-125 transition-transform" />
        
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{actividad.hora_inicio}</span>
        {actividad.hora_fin && (
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">{actividad.hora_fin}</span>
        )}
      </div>

      {/* Tarjeta de Contenido */}
      <div className="flex-1 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 rounded-3xl p-5 md:p-6 overflow-hidden relative">
        {/* Adorno visual (Glow) */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="flex flex-col gap-3 relative z-10">
          <div className="flex justify-between items-start gap-4">
            <h4 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {actividad.titulo}
            </h4>
            {/* Etiquetas tipo de evento */}
            <div className="flex gap-2 shrink-0">
              {isVirtual && (
                <Badge className="bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200 dark:bg-fuchsia-950/30 dark:text-fuchsia-400 dark:border-fuchsia-900/50 uppercase tracking-wider text-[9px] px-2">
                  Virtual
                </Badge>
              )}
            </div>
          </div>

          {/* Actor / Ponente */}
          {actividad.descripcion && (
            <div className="flex items-center gap-2 mt-1">
              <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shrink-0">
                <User className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {actividad.descripcion}
              </span>
            </div>
          )}

          {/* Metadata (Hora móvil, Sede, Links) */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            {/* Hora en versión móvil */}
            <div className="flex md:hidden items-center gap-1.5 text-xs font-medium text-slate-500">
              <Clock className="h-3.5 w-3.5 text-indigo-500" />
              <span>{actividad.hora_inicio} {actividad.hora_fin ? `- ${actividad.hora_fin}` : ''}</span>
            </div>

            {actividad.espacio_nombre && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span className="truncate max-w-[200px] sm:max-w-[300px]">
                  {actividad.espacio_tipo === 'virtual' 
                    ? (actividad.espacio_enlace_virtual || actividad.espacio_nombre) 
                    : (actividad.espacio_ubicacion || actividad.espacio_nombre)}
                </span>
              </div>
            )}

            {actividad.enlace_virtual && (
              <a 
                href={actividad.enlace_virtual} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline ml-auto"
              >
                <Video className="h-3.5 w-3.5" />
                Unirse a la transmisión
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Exportamos el objeto compuesto
export const Agenda = {
  Root,
  Tabs,
  List,
};
