import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle, CalendarDays, MapPin, Clock, Tag } from 'lucide-react';
import { useCongress } from '../../context/CongressContext';
import { useAuth } from '../../context/AuthContext';
import { useOjs } from '../../context/OjsContext';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { fetchActividades } from '../../services/dbApi';
import type { Actividad } from '../../types';
import { Agenda } from '../../components/agenda/PublicAgenda';
import { useTour } from '../onboarding';

export const AttendeePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Product Tour del Asistente ──────────────────────────────────────────────
  // autoStart: true → se dispara automáticamente si el usuario no ha visto el tour.
  // El hook filtra automáticamente los pasos cuyos elementos no estén montados en el DOM
  // (ej: las cards de info/agenda solo aparecen cuando hay un congreso seleccionado).
  useTour({
    role: 'attendee',
    userId: user?.id ?? 0,
    autoStart: true,
  });

  const {
    internalId,
    name: congressName,
    motto,
    description,
    date,
    endDate,
    venue,
    modality,
    espaciosIds,
    espacios
  } = useCongress();
  const { addLog } = useOjs();

  // Local state for Attendee payment (fully encapsulated)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success'>('pending');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [isLoadingAgenda, setIsLoadingAgenda] = useState(false);

  useEffect(() => {
    if (internalId) {
      setIsLoadingAgenda(true);
      fetchActividades(internalId)
        .then(data => setActividades(data))
        .catch(err => console.error("Error loading agenda", err))
        .finally(() => setIsLoadingAgenda(false));
    }
  }, [internalId]);

  if (!internalId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto gap-5 animate-fade-in">
        <div className="h-16 w-16 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shadow-sm">
          <CalendarDays className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Ningún congreso seleccionado</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
            Para ver el itinerario completo, los detalles generales y registrar tu asistencia, primero debes seleccionar un evento desde el Directorio.
          </p>
        </div>
        <Button onClick={() => navigate('/directorio')} variant="primary" className="px-6">
          Ver Directorio de Eventos
        </Button>
      </div>
    );
  }

  const classroomName = espaciosIds && espaciosIds.length > 0 
    ? espacios.find(e => e.id === espaciosIds[0])?.nombre || 'Espacio no asignado' 
    : 'Espacio no asignado';

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvc) {
      alert('Por favor complete todos los datos de su tarjeta.');
      return;
    }

    setIsProcessingPayment(true);
    addLog('info', 'Iniciando procesamiento de pago de inscripción ($50.00 USD)...');

    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentStatus('success');
      addLog(
        'success',
        'Pago de inscripción procesado con éxito. Código de autorización: AUTH_77A08600. Acceso al congreso liberado.'
      );
    }, 1800);
  };

  const handleCardNumberChange = (val: string) => {
    const formatted = val
      .replace(/\s?/g, '')
      .replace(/(\d{4})/g, '$1 ')
      .trim();
    setCardNumber(formatted);
  };

  return (
    <div className="flex flex-col gap-8 w-full animate-fade-in">
      
      {/* SECCIÓN 0: INFORMACIÓN GENERAL DEL CONGRESO (VISTA DE SOLO LECTURA) */}
      {/* data-tour-id: referenciado en el paso 2 del tour del Asistente */}
      <Card data-tour-id="attendee-info-card" className="flex flex-col gap-6 w-full shadow-sm border-t-4 border-t-indigo-600 dark:border-t-indigo-500">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit font-bold uppercase tracking-wider text-[10px] border-indigo-200 dark:border-indigo-855 text-indigo-600 dark:text-indigo-400">
            Información del Evento
          </Badge>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight mt-1">
            {congressName || 'Congreso Académico'}
          </h1>
          {motto && (
            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 italic mt-0.5">
              "{motto}"
            </p>
          )}
          {description && (
            <p className="text-sm text-zinc-650 dark:text-zinc-400 mt-2 leading-relaxed whitespace-pre-line bg-zinc-50/50 dark:bg-zinc-900/30 p-4 rounded-xl border border-zinc-150 dark:border-zinc-800">
              {description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Fecha */}
          <div className="flex gap-3 items-start p-3 bg-slate-50/50 dark:bg-slate-900/10 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <Clock className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha</span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {date ? new Date(date).toLocaleDateString() : '-'}
                {endDate && endDate !== date && (
                  <>
                    <span className="mx-1 text-slate-400 font-normal">al</span>
                    {new Date(endDate).toLocaleDateString()}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Modalidad */}
          <div className="flex gap-3 items-start p-3 bg-slate-50/50 dark:bg-slate-900/10 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <Tag className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modalidad</span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 capitalize">
                {modality || '-'}
              </span>
            </div>
          </div>

          {/* Sede Principal */}
          <div className="flex gap-3 items-start p-3 bg-slate-50/50 dark:bg-slate-900/10 rounded-xl border border-slate-100 dark:border-slate-800/60 min-w-0">
            <MapPin className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sede Principal</span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate" title={venue}>
                {venue || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Espacios Asignados */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-slate-400" /> Espacios / Sedes Asignadas
            </span>
            <div className="flex flex-wrap gap-2 bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800 items-center min-h-[46px]">
              {espaciosIds && espaciosIds.length > 0 ? (
                espaciosIds.map(id => {
                  const r = espacios.find(e => e.id === id);
                  if (!r) return null;
                  return (
                    <Badge key={id} variant="default" className="text-xs">
                      {r.nombre} ({r.tipo === 'virtual' ? 'Virtual' : 'Físico'})
                    </Badge>
                  );
                })
              ) : (
                <span className="text-xs text-slate-500 italic">No hay espacios asignados a este congreso</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* SECCIÓN 1: ITINERARIO PÚBLICO (SIEMPRE VISIBLE PARA TODOS) */}
      {/* data-tour-id: referenciado en el paso 3 del tour del Asistente */}
      <Card data-tour-id="attendee-agenda-card" className="flex flex-col gap-6 w-full shadow-sm">
        <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
            <CalendarDays className="h-5 w-5 text-zinc-500" aria-hidden="true" /> Itinerario Dinámico del Congreso
          </h2>
        </div>

        {isLoadingAgenda ? (
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl w-full"></div>
            <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full"></div>
            <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full"></div>
          </div>
        ) : actividades.length === 0 ? (
          <div className="text-center py-12 text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-sm bg-slate-50/50 dark:bg-slate-900/20">
            El organizador aún no ha publicado la agenda para este congreso.
          </div>
        ) : (
          <Agenda.Root actividades={actividades}>
            <Agenda.Tabs />
            <div className="mt-8">
              <Agenda.List />
            </div>
          </Agenda.Root>
        )}
      </Card>

      {/* SECCIÓN 2: TICKET E INSCRIPCIÓN */}
      {/* data-tour-id: referenciado en el paso 4 del tour del Asistente */}
      <Card data-tour-id="attendee-payment-form" className="flex flex-col gap-6 w-full shadow-sm">
        <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
            <Users className="h-5 w-5 text-zinc-500" aria-hidden="true" /> Inscripción y Acceso Oficial
          </h2>
        </div>

        <div className="flex flex-col gap-5">
          {paymentStatus === 'pending' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Detalle de factura */}
              <div className="lg:col-span-5 flex flex-col gap-4 border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 p-5 rounded-2xl">
                <div>
                  <h3 className="text-base font-bold text-slate-950 dark:text-white">Inscripción al Congreso</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Acceso completo a ponencias presenciales, transmisiones de aulas virtuales y certificado oficial de
                    asistencia firmado por los organizadores del evento.
                  </p>
                </div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">$50.00</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">USD</span>
                </div>
              </div>

              {/* Formulario de Pago */}
              <form onSubmit={handlePaymentSubmit} className="lg:col-span-7 flex flex-col gap-4">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Detalles de Tarjeta de Crédito / Débito (Simulado)
                </label>

                <Input
                  id="card-number"
                  type="text"
                  placeholder="4000 1234 5678 9010"
                  value={cardNumber}
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  maxLength={19}
                  label="Número de Tarjeta"
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    id="card-expiry"
                    type="text"
                    placeholder="MM/AA"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    maxLength={5}
                    label="Vencimiento"
                    required
                  />
                  <Input
                    id="card-cvc"
                    type="password"
                    placeholder="CVC"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                    maxLength={3}
                    label="Código CVC"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full mt-3"
                  disabled={isProcessingPayment}
                  isLoading={isProcessingPayment}
                >
                  {isProcessingPayment ? 'Validando...' : 'Realizar Pago Seguro ($50.00 USD)'}
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-6 items-center">
              {/* Banner de éxito */}
              <div className="flex flex-col items-center text-center gap-2 max-w-md">
                <span className="h-12 w-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mt-1">¡Inscripción Confirmada!</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Tu pago fue validado exitosamente. Tu acceso oficial al congreso ha sido generado.
                </p>
              </div>

              {/* Ticket Digital */}
              <div className="w-full max-w-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden flex flex-col">
                {/* Cabecera del ticket */}
                <div className="bg-zinc-900 dark:bg-zinc-800 px-5 py-4 text-white flex justify-between items-center">
                  <span className="font-semibold text-sm tracking-wide uppercase">Ticket de Ingreso</span>
                  <span className="text-xs font-mono text-zinc-400">#NV-2026-8941</span>
                </div>

                {/* Cuerpo del ticket */}
                <div className="p-5 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">Asistente:</span>
                      <strong className="text-slate-900 dark:text-slate-200">{user?.nombre || 'Israel Samuels'}</strong>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">Modalidad:</span>
                      <Badge variant="default" className="w-fit capitalize">
                        {modality}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-0.5 col-span-2">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">Evento:</span>
                      <strong className="text-slate-900 dark:text-slate-200 leading-relaxed truncate" title={congressName}>
                        {congressName}
                      </strong>
                    </div>
                    <div className="flex flex-col gap-0.5 col-span-2">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">Acceso Asignado:</span>
                      <strong className="text-slate-900 dark:text-slate-200">{classroomName}</strong>
                    </div>
                  </div>

                  {/* Línea divisoria de corte */}
                  <div className="relative my-2 select-none">
                    <div className="border-t border-dashed border-slate-200 dark:border-slate-800 w-full"></div>
                  </div>

                  {/* Código QR Simulado */}
                  <div className="flex flex-col items-center gap-2 mt-1">
                    <div className="h-32 w-32 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-2xl flex items-center justify-center">
                      <div className="h-full w-full bg-[radial-gradient(#0f172a_2px,transparent_2px)] dark:bg-[radial-gradient(#f8fafc_2px,transparent_2px)] [background-size:8px_8px] opacity-80 rounded-lg"></div>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wide uppercase">
                      Presentar QR al ingresar
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
