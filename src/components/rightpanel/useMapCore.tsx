
import { useRef, useState, useCallback } from 'react';
import { useMapResize } from '@/hooks/useMapResize';
import { useMapInitialization } from '@/hooks/map/useMapInitialization';
import { useMapMarkers } from '@/hooks/map/useMapMarkers';
import { useMapRouting } from '@/hooks/map/useMapRouting';
import { useMapNavigation } from '@/hooks/map/useMapNavigation';
import { useMapItineraryRouting } from '@/hooks/map/useMapItineraryRouting';
import { ItineraryDay } from '@/types/supabase';

export const useMapCore = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [showGeoJson, setShowGeoJson] = useState<boolean>(false);
  
  const {
    map,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
  } = useMapInitialization(mapContainer);

  const { addMarkers, clearMarkersAndUiElements } = useMapMarkers(map);
  const { calculateRoutes } = useMapRouting(map);
  const { panTo } = useMapNavigation(map);
  const { renderDayRoute, clearAllRoutes } = useMapItineraryRouting(map);

  useMapResize(map);

  const toggleGeoJsonVisibility = useCallback(() => {
    setShowGeoJson(!showGeoJson);
  }, [showGeoJson]);

  // 일정 경로 렌더링을 위한 함수 추가
  const renderItineraryRoute = useCallback((itineraryDay: ItineraryDay | null) => {
    if (itineraryDay) {
      renderDayRoute(itineraryDay);
    } else {
      clearAllRoutes();
    }
  }, [renderDayRoute, clearAllRoutes]);

  return {
    mapContainer,
    map,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
    addMarkers,
    calculateRoutes,
    clearMarkersAndUiElements,
    showGeoJson,
    toggleGeoJsonVisibility,
    panTo,
    renderItineraryRoute,
    clearAllRoutes
  };
};

export default useMapCore;
