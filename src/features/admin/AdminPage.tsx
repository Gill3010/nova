import React from 'react';
import { Building2, Plus } from 'lucide-react';
import { useCongress } from '../../context/CongressContext';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Textarea } from '../../components/common/Textarea';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { DEFAULT_ROLES } from '../../constants/data';

export const AdminPage: React.FC = () => {
  const {
    name,
    setName,
    description,
    setDescription,
    date,
    setDate,
    endDate,
    setEndDate,
    venue,
    modality,
    setModality,
    espaciosIds,
    setEspaciosIds,
    espacios,
    academicLevel,
    setAcademicLevel,
    lines,
    selectedLine,
    newLineName,
    setNewLineName,
    selectedRoles,
    selectedClassroomObj,
    showSuggestions,
    filteredSuggestions,
    activeSuggestion,
    isLoadingSuggestions,
    autocompleteRef,
    handleVenueChange,
    handleVenueFocus,
    handleVenueKeyDown,
    handleSuggestionClick,
    handleAddCustomLine,
    selectLine,
    toggleRol
  } = useCongress();

  return (
    <Card className="flex flex-col gap-6 w-full animate-fade-in">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
          <Building2 className="h-5 w-5 text-zinc-500" aria-hidden="true" /> Datos del Congreso Académico
        </h2>
      </div>

      <div className="flex flex-col gap-5">
        {/* Nombre del Congreso */}
        <Input
          id="cong-name"
          label="Nombre del Congreso"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Congreso Internacional de Posgrado"
        />

        {/* Descripción */}
        <Textarea
          id="cong-desc"
          label="Descripción / Convocatoria"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción del evento y sus alcances..."
        />

        {/* Fila: Fecha y Sede */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="cong-date"
              label="Fecha de Inicio"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Input
              id="cong-end-date"
              label="Fecha de Finalización"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={date}
            />
          </div>

          <div className="relative flex flex-col gap-1.5" ref={autocompleteRef}>
            <label htmlFor="cong-venue" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Sede Principal
            </label>
            <div className="relative">
              <input
                id="cong-venue"
                type="text"
                value={venue}
                onChange={(e) => handleVenueChange(e.target.value)}
                onFocus={handleVenueFocus}
                onKeyDown={handleVenueKeyDown}
                placeholder="Ej. Campus Central o Edificio Principal"
                autoComplete="off"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-950 dark:text-white outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
              />
              {showSuggestions && (
                <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-lg flex flex-col gap-0.5">
                  {isLoadingSuggestions && (
                    <li className="px-3.5 py-2 text-sm text-slate-500 dark:text-slate-400 italic">
                      Buscando universidades...
                    </li>
                  )}
                  {!isLoadingSuggestions && filteredSuggestions.length > 0 ? (
                    filteredSuggestions.map((suggestion, index) => (
                      <li
                        key={suggestion}
                        className={`px-3.5 py-2 text-sm text-slate-900 dark:text-slate-200 rounded-md cursor-pointer transition-colors ${
                          index === activeSuggestion
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </li>
                    ))
                  ) : !isLoadingSuggestions ? (
                    <li 
                      className="px-3.5 py-2 text-sm text-slate-500 dark:text-slate-400 italic cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors rounded-md"
                      onClick={() => handleSuggestionClick(venue)}
                    >
                      No se encontraron coincidencias. Presiona Enter o haz clic aquí para usar "{venue}"
                    </li>
                  ) : null}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Fila: Modalidad y Aula */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            id="cong-modality"
            label="Modalidad"
            value={modality}
            onChange={(e) => setModality(e.target.value as 'presencial' | 'virtual' | 'hibrida')}
          >
            <option value="presencial">Presencial</option>
            <option value="virtual">Virtual</option>
            <option value="hibrida">Híbrida</option>
          </Select>

          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Sedes / Espacios <span className="text-xs text-slate-500 font-normal">(Selección múltiple. El primero será la sede principal)</span>
            </label>
            <div className="flex flex-wrap gap-2 mt-1">
              {espacios.map(room => {
                const isSelected = espaciosIds.includes(room.id);
                const isMain = espaciosIds[0] === room.id;
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setEspaciosIds(espaciosIds.filter(id => id !== room.id));
                      } else {
                        setEspaciosIds([...espaciosIds, room.id]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors flex items-center gap-1 ${
                      isSelected 
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-800 dark:bg-indigo-900/50 dark:border-indigo-700 dark:text-indigo-200' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    {room.nombre}
                    {isMain && <Badge className="ml-1 text-[9px] py-0 px-1">Principal</Badge>}
                  </button>
                );
              })}
              {espacios.length === 0 && (
                <span className="text-sm text-slate-500">No hay espacios disponibles. Créalos en la pestaña Espacios.</span>
              )}
            </div>

            {/* Aula Asignada - Tarjeta Detallada */}
            {selectedClassroomObj && (
              <div className="mt-2 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/40 p-4 flex flex-col gap-3 transition-all duration-200">
                <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-850 pb-2">
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    {selectedClassroomObj.nombre}
                  </h4>
                  <Badge variant={selectedClassroomObj.tipo === 'virtual' ? 'outline' : 'default'}>
                    {selectedClassroomObj.tipo === 'virtual' ? 'Virtual' : 'Física'}
                  </Badge>
                </div>
                <div className="text-xs flex flex-col gap-1.5 text-slate-600 dark:text-slate-400">
                  <div className="flex flex-col gap-0.5 min-w-0 overflow-hidden w-full">
                    <strong className="text-slate-800 dark:text-slate-200">Ubicación/Enlace:</strong>
                    {selectedClassroomObj.tipo === 'virtual' ? (
                      <a href={selectedClassroomObj.enlace_virtual} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline truncate block">
                        {selectedClassroomObj.enlace_virtual}
                      </a>
                    ) : (
                      <span className="truncate block">{selectedClassroomObj.ubicacion}</span>
                    )}
                  </div>
                  <p>
                    <strong className="text-slate-800 dark:text-slate-200">Capacidad Máxima:</strong>{' '}
                    {selectedClassroomObj.capacidad} personas
                  </p>
                  <div className="flex flex-col gap-1 mt-1">
                    <strong className="text-slate-800 dark:text-slate-200">Equipamiento disponible:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedClassroomObj.equipamiento?.map((equip: string, idx: number) => (
                        <span
                          key={idx}
                          className="bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded text-[10px]"
                        >
                          {equip}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nivel Académico */}
        <Select
          id="cong-level"
          label="Nivel Académico del Evento"
          value={academicLevel}
          onChange={(e) => setAcademicLevel(e.target.value as 'maestria' | 'doctorado' | 'otros')}
        >
          <option value="maestria">Maestría (Enfoque en formación académica y profesional)</option>
          <option value="doctorado">Doctorado (Enfoque en alta investigación original)</option>
          <option value="otros">Otros (Eventos de extensión, cursos o seminarios generales)</option>
        </Select>

        {/* Líneas de Investigación */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Línea de Investigación Seleccionada
          </label>
          <div className="min-h-12 border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl p-3 flex items-center justify-center">
            {!selectedLine ? (
              <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                Ninguna línea seleccionada. Selecciona una de abajo.
              </span>
            ) : (
              (() => {
                const line = lines.find((l) => l.id === selectedLine);
                if (!line) return null;
                return (
                  <Badge variant={line.isCustom ? 'outline' : 'default'} className="text-xs py-1 px-3">
                    {line.name}
                  </Badge>
                );
              })()
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto border border-slate-250 dark:border-slate-800 rounded-lg p-3">
            {lines.map((line) => {
              const isSelected = selectedLine === line.id;
              return (
                <div
                  key={line.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                    isSelected
                      ? line.isCustom
                        ? 'bg-teal-50 dark:bg-teal-950/20 border-teal-500 text-teal-700 dark:text-teal-400 font-medium'
                        : 'bg-blue-50 dark:bg-blue-950/20 border-blue-500 text-blue-700 dark:text-blue-400 font-medium'
                      : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                  onClick={() => selectLine(line.id)}
                >
                  <input
                    type="radio"
                    name="research-line-group"
                    checked={isSelected}
                    readOnly
                    className="cursor-pointer accent-blue-600 h-3.5 w-3.5"
                  />
                  <span>{line.name}</span>
                </div>
              );
            })}
          </div>

          {/* Formulario para agregar nueva línea */}
          <form onSubmit={handleAddCustomLine} className="flex gap-2 w-full mt-1">
            <input
              type="text"
              placeholder="Agregar línea de investigación relevante..."
              value={newLineName}
              onChange={(e) => setNewLineName(e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-950 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
            />
            <Button type="submit" variant="secondary" size="sm" className="shrink-0">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Agregar
            </Button>
          </form>
        </div>

        {/* Roles Habilitados */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Roles de Usuario Habilitados para el Congreso
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {DEFAULT_ROLES.map((role) => {
              const isSelected = selectedRoles.includes(role.id);
              return (
                <div
                  key={role.id}
                  className={`relative p-4 rounded-xl border cursor-pointer select-none transition-all flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                  onClick={() => toggleRol(role.id)}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {role.name}
                    </h3>
                    {isSelected && (
                      <span className="text-blue-600 dark:text-blue-400 font-bold text-xs bg-blue-100 dark:bg-blue-900/40 rounded-full h-4 w-4 flex items-center justify-center">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                    {role.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};
