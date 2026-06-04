import React, { useState } from 'react';
import { useCongress } from '../../context/CongressContext';
import { useOjs } from '../../context/OjsContext';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const AttendeePage: React.FC = () => {
  const { name: congressName, modality, classroom, lines, selectedLine } = useCongress();
  const { addLog } = useOjs();

  // Local state for Attendee payment (fully encapsulated)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success'>('pending');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const selectedLineName = lines.find((l) => l.id === selectedLine)?.name || 'General';

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
    // Formatear en bloques de 4 dígitos
    const formatted = val
      .replace(/\s?/g, '')
      .replace(/(\d{4})/g, '$1 ')
      .trim();
    setCardNumber(formatted);
  };

  return (
    <Card className="flex flex-col gap-6 w-full animate-fade-in">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <span className="text-2xl">👥</span> Portal de Inscripción y Pagos (Asistente)
        </h2>
      </div>

      <div className="flex flex-col gap-5">
        {paymentStatus === 'pending' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Detalle de factura */}
            <div className="lg:col-span-5 flex flex-col gap-4 border border-slate-100 dark:border-slate-800 bg-slate-55/40 dark:bg-slate-900/40 p-5 rounded-2xl">
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
                variant="accent"
                className="w-full font-semibold mt-3 py-3"
                disabled={isProcessingPayment}
                isLoading={isProcessingPayment}
              >
                {isProcessingPayment ? 'Validando con pasarela...' : 'Realizar Pago Seguro ($50.00 USD)'}
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col gap-6 items-center">
            {/* Banner de éxito */}
            <div className="flex flex-col items-center text-center gap-2 max-w-md">
              <span className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-3xl rounded-full flex items-center justify-center select-none animate-bounce">
                🎉
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">¡Inscripción Confirmada!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tu pago ha sido validado de manera exitosa y hemos generado tu acceso oficial al congreso.
              </p>
            </div>

            {/* Ticket Digital Premium */}
            <div className="relative w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-md overflow-hidden flex flex-col">
              {/* Notches laterales */}
              <div className="absolute left-0 top-[60%] -translate-x-1/2 h-8 w-8 bg-slate-50 dark:bg-slate-900 rounded-full border-r border-slate-200 dark:border-slate-800 z-10"></div>
              <div className="absolute right-0 top-[60%] translate-x-1/2 h-8 w-8 bg-slate-50 dark:bg-slate-900 rounded-full border-l border-slate-200 dark:border-slate-800 z-10"></div>

              {/* Cabecera del ticket */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex justify-between items-center select-none">
                <span className="font-extrabold text-sm tracking-widest uppercase">TICKET DE INGRESO</span>
                <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded">#NV-2026-8941</span>
              </div>

              {/* Cuerpo del ticket */}
              <div className="p-5 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Asistente:</span>
                    <strong className="text-slate-900 dark:text-slate-250">Israel Samuels</strong>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Modalidad:</span>
                    <Badge variant="primary" className="w-fit">
                      {modality.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-0.5 col-span-2">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Evento:</span>
                    <strong className="text-slate-900 dark:text-slate-250 leading-relaxed truncate" title={congressName}>
                      {congressName}
                    </strong>
                  </div>
                  <div className="flex flex-col gap-0.5 col-span-2">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Acceso Asignado:</span>
                    <strong className="text-slate-900 dark:text-slate-250">{classroom}</strong>
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

            {/* Itinerario Desbloqueado */}
            <div className="w-full border-t border-slate-100 dark:border-slate-805 pt-6 mt-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 select-none">
                <span>📅</span> Tu Itinerario del Congreso (Desbloqueado)
              </h4>
              <div className="flex flex-col gap-3.5 mt-4">
                <div className="flex gap-4 items-start bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4 transition-all duration-200 hover:shadow-sm">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 py-1.5 px-3 rounded-lg shrink-0 w-24 text-center">
                    09:00 AM
                  </span>
                  <div className="flex flex-col gap-1">
                    <strong className="text-xs font-bold text-slate-900 dark:text-slate-200">
                      Conferencia Magistral Inaugural
                    </strong>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <span>●</span> Sala: {classroom} (Enlace Activo)
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 items-start bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4 transition-all duration-200 hover:shadow-sm">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 py-1.5 px-3 rounded-lg shrink-0 w-24 text-center">
                    11:00 AM
                  </span>
                  <div className="flex flex-col gap-1">
                    <strong className="text-xs font-bold text-slate-900 dark:text-slate-200">
                      Sesión de Ponencias Orales - Línea: {selectedLineName}
                    </strong>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <span>●</span> Acceso a Transmisión Directa
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
