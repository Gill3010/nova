import React, { useState } from 'react';
import { Users, CheckCircle, CalendarDays } from 'lucide-react';
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
      <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
          <Users className="h-5 w-5 text-zinc-500" aria-hidden="true" /> Inscripción y Acceso
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
                    <strong className="text-slate-900 dark:text-slate-250">Israel Samuels</strong>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Modalidad:</span>
                    <Badge variant="default" className="w-fit capitalize">
                      {modality}
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
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-zinc-500" aria-hidden="true" /> Itinerario del Congreso
              </h4>
              <div className="flex flex-col gap-3.5 mt-4">
                <div className="flex gap-3 items-start border border-zinc-100 dark:border-zinc-800 rounded-lg p-3.5">
                  <span className="text-xs font-semibold text-zinc-500 bg-zinc-50 dark:bg-zinc-800 py-1 px-2.5 rounded shrink-0">
                    09:00
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <strong className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                      Conferencia Magistral Inaugural
                    </strong>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Sala: {classroom}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 items-start border border-zinc-100 dark:border-zinc-800 rounded-lg p-3.5">
                  <span className="text-xs font-semibold text-zinc-500 bg-zinc-50 dark:bg-zinc-800 py-1 px-2.5 rounded shrink-0">
                    11:00
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <strong className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                      Ponencias Orales — {selectedLineName}
                    </strong>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Transmisión en vivo
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
