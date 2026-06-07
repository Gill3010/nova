import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Textarea } from '../../components/common/Textarea';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useCongress } from '../../context/CongressContext';
import { fetchEspacios, createEspacio, updateEspacio, deleteEspacio } from '../../services/dbApi';
import type { Espacio } from '../../types';
import { Plus, Edit2, Trash2, MapPin, Users, Monitor, Link as LinkIcon, ServerCrash, X } from 'lucide-react';

export const SpacesPage: React.FC = () => {
  const { refreshEspacios } = useCongress();
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form Fields
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('fisica');
  const [ubicacion, setUbicacion] = useState('');
  const [capacidad, setCapacidad] = useState<number>(0);
  const [descripcion, setDescripcion] = useState('');
  const [equipamientoStr, setEquipamientoStr] = useState('');
  const [enlaceVirtual, setEnlaceVirtual] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [estado, setEstado] = useState('Activo');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEspacios();
  }, []);

  const loadEspacios = async () => {
    try {
      setLoading(true);
      const data = await fetchEspacios();
      setEspacios(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Error al cargar los espacios');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setNombre('');
    setTipo('fisica');
    setUbicacion('');
    setCapacidad(0);
    setDescripcion('');
    setEquipamientoStr('');
    setEnlaceVirtual('');
    setObservaciones('');
    setEstado('Activo');
    setIsFormOpen(false);
  };

  const handleEdit = (espacio: Espacio) => {
    setEditingId(espacio.id);
    setNombre(espacio.nombre);
    setTipo(espacio.tipo);
    setUbicacion(espacio.ubicacion || '');
    setCapacidad(espacio.capacidad || 0);
    setDescripcion(espacio.descripcion || '');
    setEquipamientoStr(espacio.equipamiento ? espacio.equipamiento.join(', ') : '');
    setEnlaceVirtual(espacio.enlace_virtual || '');
    setObservaciones(espacio.observaciones || '');
    setEstado(espacio.estado || 'Activo');
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este espacio?')) return;
    try {
      await deleteEspacio(id);
      loadEspacios();
      refreshEspacios();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return alert('El nombre es obligatorio');
    
    setSaving(true);
    const equipArray = equipamientoStr.split(',').map(s => s.trim()).filter(s => s);
    
    const data = {
      nombre,
      tipo,
      ubicacion,
      capacidad,
      descripcion,
      equipamiento: equipArray,
      enlace_virtual: enlaceVirtual,
      observaciones,
      estado
    };

    try {
      if (editingId) {
        await updateEspacio(editingId, data);
      } else {
        await createEspacio(data);
      }
      resetForm();
      loadEspacios();
      refreshEspacios();
    } catch (err: any) {
      alert(err.message || 'Error al guardar el espacio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Cargando espacios...</div>;
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            Gestión de Espacios
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Administra aulas, auditorios y canales virtuales para los eventos.
          </p>
        </div>
        {!isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Espacio
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-3">
          <ServerCrash className="w-5 h-5" />
          {error}
        </div>
      )}

      {isFormOpen && (
        <Card className="border-indigo-100 dark:border-indigo-900 shadow-md">
          <div className="flex flex-row justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 rounded-t-xl border-b border-zinc-100 dark:border-zinc-800 px-6 py-4">
            <h3 className="font-bold text-lg">{editingId ? 'Editar Espacio' : 'Nuevo Espacio'}</h3>
            <Button variant="ghost" onClick={resetForm} size="sm" aria-label="Cerrar formulario">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="pt-6 px-6 pb-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Nombre del Espacio"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Aula Magna"
                  required
                />
                <Select
                  label="Tipo de Espacio"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                >
                  <option value="fisica">Física (Aula, Auditorio)</option>
                  <option value="virtual">Virtual (Zoom, Teams)</option>
                </Select>
                
                <Input
                  label={tipo === 'virtual' ? 'Servidor / Plataforma' : 'Ubicación / Edificio'}
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  placeholder={tipo === 'virtual' ? 'Ej. Servidor Central' : 'Ej. Edificio A'}
                />
                
                <Input
                  label="Capacidad Máxima (personas)"
                  type="number"
                  min="0"
                  value={capacidad}
                  onChange={(e) => setCapacidad(parseInt(e.target.value) || 0)}
                />
              </div>

              {tipo === 'virtual' && (
                <Input
                  label="Enlace Virtual (URL)"
                  type="url"
                  value={enlaceVirtual}
                  onChange={(e) => setEnlaceVirtual(e.target.value)}
                  placeholder="https://zoom.us/j/..."
                />
              )}

              <Textarea
                label="Equipamiento (separado por comas)"
                value={equipamientoStr}
                onChange={(e) => setEquipamientoStr(e.target.value)}
                placeholder="Ej. Proyector HD, Pizarra Digital, Audio"
                rows={2}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Textarea
                  label="Descripción"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                />
                <Textarea
                  label="Observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-800">
                <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Espacio'}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {!isFormOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {espacios.length === 0 ? (
            <div className="col-span-full py-12 text-center text-zinc-500 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              No hay espacios registrados aún.
            </div>
          ) : (
            espacios.map((espacio) => (
              <Card key={espacio.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow p-0">
                <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800 flex flex-row justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold truncate" title={espacio.nombre}>
                      {espacio.nombre}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                        {espacio.tipo === 'virtual' ? 'Virtual' : 'Físico'}
                      </Badge>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {espacio.capacidad}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(espacio)}
                      className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(espacio.id)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 px-6 py-4 flex flex-col gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  {espacio.ubicacion && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{espacio.ubicacion}</span>
                    </div>
                  )}
                  {espacio.enlace_virtual && (
                    <div className="flex items-start gap-2 min-w-0">
                      <LinkIcon className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                      <a href={espacio.enlace_virtual} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline truncate block w-full">
                        {espacio.enlace_virtual}
                      </a>
                    </div>
                  )}
                  {espacio.equipamiento && espacio.equipamiento.length > 0 && (
                    <div className="flex items-start gap-2 mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <Monitor className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                      <div className="flex flex-wrap gap-1">
                        {espacio.equipamiento.map((eq, i) => (
                          <span key={i} className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-300">
                            {eq}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};
