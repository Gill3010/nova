import { useEffect, useState } from 'react';
import { fetchDashboardData, fetchRevistasForCongress } from '../../../services/dbApi';
import type { PostgresCongress } from '../../../services/dbApi';

export function useCongressRevistaLoader(
  selectedCongressId?: string,
  selectedRevistaOjsId?: number,
  setSelectedRevistaOjsId?: (id: number | undefined) => void
) {
  const [availableCongresses, setAvailableCongresses] = useState<PostgresCongress[]>([]);
  const [isLoadingCongresses, setIsLoadingCongresses] = useState(true);
  const [availableRevistas, setAvailableRevistas] = useState<any[]>([]);
  const [isLoadingRevistas, setIsLoadingRevistas] = useState(false);

  useEffect(() => {
    const loadCongresses = async () => {
      try {
        const data = await fetchDashboardData('all');
        // Mostrar solo los congresos activos (no archivados)
        setAvailableCongresses(data.filter(c => c.estado !== 'Archivado'));
      } catch (err) {
        console.error('Error cargando congresos:', err);
      } finally {
        setIsLoadingCongresses(false);
      }
    };
    loadCongresses();
  }, []);

  // Cargar revistas disponibles cuando se selecciona un congreso
  useEffect(() => {
    if (!selectedCongressId) {
      setAvailableRevistas([]);
      return;
    }
    const loadRevistas = async () => {
      setIsLoadingRevistas(true);
      try {
        const data = await fetchRevistasForCongress(parseInt(selectedCongressId, 10));
        setAvailableRevistas(data);
        // Auto-seleccionar si solo hay una revista o si ya hay una seleccionada
        if (data.length === 1 && setSelectedRevistaOjsId && !selectedRevistaOjsId) {
          setSelectedRevistaOjsId(data[0].id);
        } else if (selectedRevistaOjsId && setSelectedRevistaOjsId && !data.find((r: any) => r.id === selectedRevistaOjsId)) {
          // Si la revista seleccionada no está en la lista, limpiar
          setSelectedRevistaOjsId(undefined);
        }
      } catch (err) {
        console.error('Error cargando revistas:', err);
        setAvailableRevistas([]);
      } finally {
        setIsLoadingRevistas(false);
      }
    };
    loadRevistas();
  }, [selectedCongressId, selectedRevistaOjsId, setSelectedRevistaOjsId]);

  return {
    availableCongresses,
    availableRevistas,
    isLoadingCongresses,
    isLoadingRevistas,
  };
}
