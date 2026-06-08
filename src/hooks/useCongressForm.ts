import { useState, useEffect, useRef } from 'react';
import type { Congress, ResearchLine } from '../types';
import {
  DEFAULT_RESEARCH_LINES,
  DEFAULT_ROLES,
  LATIN_AMERICAN_UNIVERSITIES
} from '../constants/data';
import { fetchEspacios } from '../services/dbApi';
import type { Espacio } from '../types';

export function useCongressForm() {
  // Estado del congreso
  const [internalId, setInternalId] = useState<number | undefined>(undefined);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [venue, setVenue] = useState('');
  const [modality, setModality] = useState<Congress['modality']>('hibrida');
  const [espaciosIds, setEspaciosIds] = useState<number[]>([]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [academicLevel, setAcademicLevel] = useState<Congress['academicLevel']>('maestria');
  const [ojsSubmissionId, setOjsSubmissionId] = useState<number | undefined>(undefined);
  const [ojsPublicationId, setOjsPublicationId] = useState<number | undefined>(undefined);

  const refreshEspacios = async () => {
    try {
      const data = await fetchEspacios();
      setEspacios(data);
      // Eliminamos el auto-seleccionar la primera sede para evitar confusiones
      // cuando el usuario crea un congreso nuevo.
    } catch (err) {
      console.error("Error al refrescar espacios", err);
    }
  };

  // Fetch espacios on mount
  useEffect(() => {
    refreshEspacios();
  }, []);

  // Estado de líneas de investigación
  const [lines, setLines] = useState<ResearchLine[]>(DEFAULT_RESEARCH_LINES);
  const [selectedLine, setSelectedLine] = useState<string>('1');
  const [newLineName, setNewLineName] = useState('');

  // Estado de roles
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['ponente', 'revisor', 'organizador', 'editor', 'asistente', 'administrador']);

  // Autocompletado de sede (Universidades)
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Buscar universidades
  useEffect(() => {
    if (!showSuggestions) return;

    if (venue.trim().length < 3) {
      const filtered = LATIN_AMERICAN_UNIVERSITIES.filter(univ =>
        univ.toLowerCase().includes(venue.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      return;
    }

    setIsLoadingSuggestions(true);
    const delayDebounceFn = setTimeout(() => {
      const latamCountries = [
        'argentina', 'bolivia', 'brazil', 'chile', 'colombia', 'costa rica', 'cuba',
        'dominican republic', 'ecuador', 'el salvador', 'guatemala', 'honduras', 'mexico',
        'nicaragua', 'panama', 'paraguay', 'peru', 'uruguay', 'venezuela', 'puerto rico'
      ];

      const query = venue.trim().toLowerCase();
      const isCountryQuery = latamCountries.some(c => c === query || (c.startsWith(query) && query.length >= 4));

      const searchParam = isCountryQuery
        ? `country=${encodeURIComponent(query)}`
        : `name=${encodeURIComponent(venue)}`;

      fetch(`http://universities.hipolabs.com/search?${searchParam}`)
        .then(res => res.json())
        .then(data => {
          const filtered = data
            .filter((item: any) => latamCountries.includes(item.country.toLowerCase()))
            .map((item: any) => `${item.name} - ${item.country}`)
            .slice(0, 20);

          setFilteredSuggestions(filtered);
          setIsLoadingSuggestions(false);
        })
        .catch(err => {
          console.error("Error fetching universities:", err);
          const filtered = LATIN_AMERICAN_UNIVERSITIES.filter(univ =>
            univ.toLowerCase().includes(venue.toLowerCase())
          );
          setFilteredSuggestions(filtered);
          setIsLoadingSuggestions(false);
        });
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [venue, showSuggestions]);

  // Manejadores de Autocompletado
  const handleVenueChange = (val: string) => {
    setVenue(val);
    setShowSuggestions(true);
    setActiveSuggestion(0);
  };

  const handleVenueFocus = () => {
    setShowSuggestions(true);
    setActiveSuggestion(0);
  };

  const handleVenueKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showSuggestions) {
        if (filteredSuggestions[activeSuggestion]) {
          setVenue(filteredSuggestions[activeSuggestion]);
        }
        setShowSuggestions(false);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (activeSuggestion === 0) return;
      setActiveSuggestion(activeSuggestion - 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (activeSuggestion === filteredSuggestions.length - 1) return;
      setActiveSuggestion(activeSuggestion + 1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setVenue(suggestion);
    setShowSuggestions(false);
  };

  // Agregar nueva línea de investigación
  const handleAddCustomLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLineName.trim()) return;

    const normalizedNew = newLineName.trim().toLowerCase();
    if (lines.some(l => l.name.toLowerCase() === normalizedNew)) {
      alert('Esta línea de investigación ya existe.');
      return;
    }

    const newId = String(lines.length + 1);
    const newLine: ResearchLine = {
      id: newId,
      name: newLineName.trim(),
      isCustom: true
    };

    setLines(prev => [...prev, newLine]);
    setSelectedLine(newId);
    setNewLineName('');
  };

  const selectLine = (id: string) => {
    setSelectedLine(id);
  };

  const toggleRol = (id: string) => {
    setSelectedRoles(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getCongressJson = (): Congress => {
    return {
      id: internalId,
      name,
      description,
      date,
      venue,
      modality,
      classroom: espaciosIds.length > 0 ? espacios.find(e => e.id === espaciosIds[0])?.nombre || '' : '',
      espacio_id: espaciosIds.length > 0 ? espaciosIds[0] : undefined,
      sedes: espaciosIds.map((id, index) => ({ espacio_id: id, es_sede_principal: index === 0 })),
      academicLevel,
      researchLine: lines.find(l => l.id === selectedLine)?.name || '',
      roles: selectedRoles.map(id => DEFAULT_ROLES.find(r => r.id === id)?.name || ''),
      ojs_submission_id: ojsSubmissionId,
      ojs_publication_id: ojsPublicationId,
      fecha_finalizacion: endDate || undefined
    };
  };

  const selectedClassroomObj = espaciosIds.length > 0 ? (espacios.find(r => r.id === espaciosIds[0]) || null) : null;

  const resetCongressForm = () => {
    setInternalId(undefined);
    setName('');
    setDescription('');
    setDate('');
    setEndDate('');
    setVenue('');
    setModality('hibrida');
    setEspaciosIds([]);
    setAcademicLevel('maestria');
    setLines(DEFAULT_RESEARCH_LINES);
    setSelectedLine('1');
    setNewLineName('');
    setSelectedRoles(['ponente', 'revisor', 'organizador', 'editor', 'asistente', 'administrador']);
    setOjsSubmissionId(undefined);
    setOjsPublicationId(undefined);
  };

  const loadCongress = (data: any) => {
    setInternalId(data.id);
    setName(data.nombre || '');
    setDescription(data.descripcion || '');
    setDate(data.fecha_celebracion || '');
    setEndDate(data.fecha_finalizacion || '');
    setVenue(data.sede || '');
    setModality(data.modalidad || 'hibrida');
    if (data.sedes && Array.isArray(data.sedes) && data.sedes.length > 0) {
      setEspaciosIds(data.sedes.map((s: any) => s.espacio_id));
    } else {
      setEspaciosIds(data.espacio_id ? [data.espacio_id] : []);
    }
    setAcademicLevel(data.nivel_academico || 'maestria');
    setOjsSubmissionId(data.ojs_submission_id);
    setOjsPublicationId(data.ojs_publication_id);
    // Research line logic is simplified since it's just stored as string
    if (data.linea_investigacion) {
      const found = lines.find(l => l.name === data.linea_investigacion);
      if (found) setSelectedLine(found.id);
    }
  };

  return {
    name,
    setName,
    description,
    setDescription,
    date,
    setDate,
    endDate,
    setEndDate,
    venue,
    setVenue,
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
    internalId,
    setInternalId,
    ojsSubmissionId,
    setOjsSubmissionId,
    ojsPublicationId,
    setOjsPublicationId,
    handleVenueChange,
    handleVenueFocus,
    handleVenueKeyDown,
    handleSuggestionClick,
    handleAddCustomLine,
    selectLine,
    toggleRol,
    getCongressJson,
    resetCongressForm,
    loadCongress,
    refreshEspacios
  };
}
