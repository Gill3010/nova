import { useState, useEffect, useRef } from 'react';
import type { Congress, ResearchLine } from '../types';
import {
  DEFAULT_RESEARCH_LINES,
  PREDEFINED_CLASSROOMS,
  DEFAULT_ROLES,
  LATIN_AMERICAN_UNIVERSITIES
} from '../constants/data';

export function useCongressForm() {
  // Estado del congreso
  const [name, setName] = useState('I Congreso Internacional de Investigación Científica y Posgrado');
  const [description, setDescription] = useState('Evento académico orientado a la difusión de trabajos de investigación desarrollados por alumnos de maestría y doctorado.');
  const [date, setDate] = useState('2026-10-15');
  const [venue, setVenue] = useState('Campus Central - Universidad de la Nueva Era');
  const [modality, setModality] = useState<Congress['modality']>('hibrida');
  const [classroom, setClassroom] = useState(PREDEFINED_CLASSROOMS[0].name);
  const [academicLevel, setAcademicLevel] = useState<Congress['academicLevel']>('maestria');

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
      if (showSuggestions && filteredSuggestions[activeSuggestion]) {
        e.preventDefault();
        setVenue(filteredSuggestions[activeSuggestion]);
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
      name,
      description,
      date,
      venue,
      modality,
      classroom,
      academicLevel,
      researchLine: lines.find(l => l.id === selectedLine)?.name || '',
      roles: selectedRoles.map(id => DEFAULT_ROLES.find(r => r.id === id)?.name || '')
    };
  };

  const selectedClassroomObj = PREDEFINED_CLASSROOMS.find(r => r.name === classroom) || PREDEFINED_CLASSROOMS[0];

  return {
    name,
    setName,
    description,
    setDescription,
    date,
    setDate,
    venue,
    setVenue,
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
    toggleRol,
    getCongressJson
  };
}
