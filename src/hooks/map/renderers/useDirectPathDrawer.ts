
import { useCallback } from 'react';
import type { Place } from '@/types/supabase';

interface UseDirectPathDrawerProps {
  map: any;
  isNaverLoadedParam: boolean;
  addPolyline: (
    pathCoordinates: { lat: number; lng: number }[],
    color: string,
    weight?: number,
    opacity?: number,
    zIndex?: number
  ) => any | null;
}

const DIRECT_ROUTE_COLOR = '#22c55e';
const DIRECT_ROUTE_WEIGHT = 4;

export const useDirectPathDrawer = ({
  map,
  isNaverLoadedParam,
  addPolyline,
}: UseDirectPathDrawerProps) => {
  const drawDirectPath = useCallback((placesToRoute: Place[]) => {
    if (!map || !isNaverLoadedParam || placesToRoute.length < 2) return;

    const pathCoordinates = placesToRoute
        .filter(p => typeof p.x === 'number' && typeof p.y === 'number' && !isNaN(p.x) && !isNaN(p.y))
        .map(place => ({ lat: place.y as number, lng: place.x as number }));

    if (pathCoordinates.length < 2) return;

    addPolyline(pathCoordinates, DIRECT_ROUTE_COLOR, DIRECT_ROUTE_WEIGHT);
  }, [map, isNaverLoadedParam, addPolyline]);

  return { drawDirectPath };
};
