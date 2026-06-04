import React from 'react';
import { useCongress } from '../../context/CongressContext';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Textarea } from '../../components/common/Textarea';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { PREDEFINED_CLASSROOMS, DEFAULT_ROLES } from '../../constants/data';

export const AdminPage: React.FC = () => {
  const {
    name,
    setName,
    description,
    setDescription,
    date,
    setDate,
    venue,
    modality,
    setModality,
    classroom,
    setClassroom,
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
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <span className="text-2xl">🏢</span> Datos del Congreso Académico
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
          <Input
            id="cong-date"
            label="Fecha de Celebración"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

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
                    <li className="px-3.5 py-2 text-sm text-slate-500 dark:text-slate-400 italic">
                      No se encontraron coincidencias. Presiona Enter para usar "{venue}"
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
            <Select
              id="cong-classroom"
              label="Asignación de Aula / Canal"
              value={classroom}
              onChange={(e) => setClassroom(e.target.value)}
            >
              {PREDEFINED_CLASSROOMS.map((room) => (
                <option key={room.id} value={room.name}>
                  {room.name} ({room.type === 'virtual' ? 'Virtual' : 'Presencial'})
                </option>
              ))}
            </Select>

            {/* Aula Asignada - Tarjeta Detallada */}
            {selectedClassroomObj && (
              <div className="mt-2 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/40 p-4 flex flex-col gap-3 transition-all duration-200">
                <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-850 pb-2">
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    {selectedClassroomObj.name}
                  </h4>
                  <Badge variant={selectedClassroomObj.type === 'virtual' ? 'info' : 'primary'}>
                    {selectedClassroomObj.type === 'virtual' ? '🌐 Virtual' : '🏢 Física'}
                  </Badge>
                </div>
                <div className="text-xs flex flex-col gap-1.5 text-slate-600 dark:text-slate-400">
                  <p>
                    <strong className="text-slate-800 dark:text-slate-200">Ubicación:</strong>{' '}
                    {selectedClassroomObj.building}
                  </p>
                  <p>
                    <strong className="text-slate-800 dark:text-slate-200">Capacidad Máxima:</strong>{' '}
                    {selectedClassroomObj.capacity} personas
                  </p>
                  <div className="flex flex-col gap-1 mt-1">
                    <strong className="text-slate-800 dark:text-slate-200">Equipamiento disponible:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedClassroomObj.equipment.map((equip, idx) => (
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
                  <Badge variant={line.isCustom ? 'info' : 'primary'} className="text-xs py-1 px-3">
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
            <Button type="submit" variant="secondary" className="px-4 py-2 text-xs shrink-0">
              + Agregar
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
