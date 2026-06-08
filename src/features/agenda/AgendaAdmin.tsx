import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, MapPin, Edit2, X, Lock } from 'lucide-react';
import { useCongress } from '../../context/CongressContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Textarea } from '../../components/common/Textarea';
import { fetchActividades, createActividad, updateActividad, deleteActividad } from '../../services/dbApi';
import type { Actividad } from '../../types';

export const AgendaAdmin: React.FC = () => {
  const { user } = useAuth();
  const { internalId, creadorId, name: congressName, espaciosIds, espacios } = useCongress();
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Formulario nueva actividad
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [espacioSeleccionado, setEspacioSeleccionado] = useState<number | ''>('');
  const [enlaceVirtual, setEnlaceVirtual] = useState('');
  const [editingActividadId, setEditingActividadId] = useState<number | null>(null);

  const canEdit = user?.rol === 'admin' || (user?.rol === 'organizer' && user?.id === creadorId);

  const cargarActividades = async () => {
    if (!internalId) return;
    setIsLoading(true);
    try {
      const data = await fetchActividades(internalId);
      setActividades(data);
    } catch (error) {
      console.error('Error al cargar actividades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (internalId) {
      cargarActividades();
    } else {
      setActividades([]);
    }
  }, [internalId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalId) return alert('Primero debes guardar el congreso en la pestaña Congresos.');
    if (!titulo || !fecha || !horaInicio || !horaFin) return alert('Por favor, completa los campos obligatorios.');

    try {
      if (editingActividadId) {
        await updateActividad(editingActividadId, {
          espacio_id: espacioSeleccionado || null,
          titulo,
          descripcion,
          fecha,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          enlace_virtual: enlaceVirtual
        });
        setEditingActividadId(null);
      } else {
        await createActividad({
          congreso_id: internalId,
          espacio_id: espacioSeleccionado || null,
          titulo,
          descripcion,
          fecha,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          enlace_virtual: enlaceVirtual
        });
      }
      
      cancelEdit();
      await cargarActividades();
    } catch (error) {
      console.error('Error al guardar actividad:', error);
      alert('Hubo un error al guardar la actividad.');
    }
  };

  const handleEditClick = (act: Actividad) => {
    setEditingActividadId(act.id);
    setTitulo(act.titulo);
    setDescripcion(act.descripcion || '');
    setFecha(act.fecha);
    setHoraInicio(act.hora_inicio);
    setHoraFin(act.hora_fin);
    setEspacioSeleccionado(act.espacio_id || '');
    setEnlaceVirtual(act.enlace_virtual || '');
  };

  const cancelEdit = () => {
    setEditingActividadId(null);
    setTitulo('');
    setDescripcion('');
    setFecha('');
    setHoraInicio('');
    setHoraFin('');
    setEspacioSeleccionado('');
    setEnlaceVirtual('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta actividad?')) return;
    try {
      await deleteActividad(id);
      await cargarActividades();
    } catch (error) {
      console.error('Error al eliminar actividad:', error);
    }
  };

  const sedesDelCongreso = espacios.filter(e => espaciosIds.includes(e.id));

  if (!internalId) {
    return (
      <Card className="flex flex-col gap-6 w-full animate-fade-in text-center py-10">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Agenda del Congreso</h2>
        <p className="text-slate-500">
          Por favor, selecciona o crea primero un congreso en la pestaña "Congresos" para poder gestionar su itinerario.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-6 w-full animate-fade-in lg:col-span-12">
      <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
          <Calendar className="h-5 w-5 text-zinc-500" /> Agenda: {congressName}
        </h2>
        <p className="text-sm text-slate-500 mt-1">Programa ponencias y actividades según el horario y las múltiples sedes de este evento.</p>
      </div>

      {/* Read-only notice for non-creator organizers */}
      {!canEdit && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-400 text-sm">
          <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Solo puedes visualizar el itinerario. Únicamente el creador del congreso o un administrador puede agregar, editar o eliminar actividades.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Formulario Izquierda — only visible when user can edit */}
        {canEdit && (
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className={`bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border transition-colors ${editingActividadId ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/30' : 'border-slate-100 dark:border-slate-800'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {editingActividadId ? 'Editar Actividad' : 'Nueva Actividad'}
                </h3>
                {editingActividadId && (
                  <Button type="button" variant="ghost" size="sm" onClick={cancelEdit} className="text-slate-500 hover:text-slate-800 flex gap-1 items-center">
                    <X className="h-3 w-3" /> Cancelar
                  </Button>
                )}
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  id="act-titulo"
                  label="Título de la Actividad / Ponencia *"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Ej. Conferencia Magistral"
                  required
                />
                
                <Textarea
                  id="act-desc"
                  label="Descripción / Ponente"
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  rows={2}
                  placeholder="Breve descripción o nombre del ponente..."
                />

                <div className="grid grid-cols-3 gap-3">
                  <Input
                    id="act-fecha"
                    type="date"
                    label="Fecha *"
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                    required
                  />
                  <Input
                    id="act-hora-ini"
                    type="time"
                    label="Inicio *"
                    value={horaInicio}
                    onChange={e => setHoraInicio(e.target.value)}
                    required
                  />
                  <Input
                    id="act-hora-fin"
                    type="time"
                    label="Fin *"
                    value={horaFin}
                    onChange={e => setHoraFin(e.target.value)}
                    required
                  />
                </div>

                <Select
                  id="act-espacio"
                  label="Sede / Espacio"
                  value={espacioSeleccionado}
                  onChange={e => setEspacioSeleccionado(Number(e.target.value) || '')}
                >
                  <option value="">-- No asignar sede física --</option>
                  {sedesDelCongreso.map(sede => (
                    <option key={sede.id} value={sede.id}>
                      {sede.tipo === 'virtual' ? (sede.enlace_virtual || sede.nombre) : (sede.ubicacion || sede.nombre)}
                    </option>
                  ))}
                </Select>

                <Input
                  id="act-virtual"
                  label="Enlace Virtual (Opcional)"
                  value={enlaceVirtual}
                  onChange={e => setEnlaceVirtual(e.target.value)}
                  placeholder="https://zoom.us/j/..."
                />

                <Button type="submit" variant="primary" className="mt-2 w-full flex items-center justify-center gap-2">
                  {editingActividadId ? (
                    <>Guardar Cambios</>
                  ) : (
                    <><Plus className="h-4 w-4" /> Agregar al Itinerario</>
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Listado Derecha */}
        <div className={`${canEdit ? 'lg:col-span-7' : 'lg:col-span-12'} flex flex-col gap-4`}>
          <h3 className="font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            Actividades Programadas
          </h3>
          
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
              <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
            </div>
          ) : actividades.length === 0 ? (
            <div className="text-center py-10 text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No hay actividades programadas. Utiliza el formulario para añadir una.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {actividades.map((act) => (
                <div key={act.id} className="flex flex-col sm:flex-row gap-4 p-4 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-sm transition-all group">
                  <div className="shrink-0 flex flex-col items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 p-3 rounded-lg min-w-[90px]">
                    <span className="text-xs font-semibold uppercase">{act.fecha}</span>
                    <span className="font-bold text-lg mt-0.5">{act.hora_inicio}</span>
                    <span className="text-[10px] text-indigo-500">{act.hora_fin}</span>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{act.titulo}</h4>
                      {canEdit && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditClick(act)}
                            className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                            title="Editar actividad"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(act.id)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1"
                            title="Eliminar actividad"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {act.descripcion && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{act.descripcion}</p>}
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {act.espacio_nombre && (
                        <Badge variant="outline" className="text-[10px] flex items-center gap-1 max-w-full">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {act.espacio_tipo === 'virtual' 
                              ? (act.espacio_enlace_virtual || act.espacio_nombre) 
                              : (act.espacio_ubicacion || act.espacio_nombre)}
                          </span>
                        </Badge>
                      )}
                      {act.enlace_virtual && (
                        <Badge variant="outline" className="text-[10px]">Virtual</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Card>
  );
};
