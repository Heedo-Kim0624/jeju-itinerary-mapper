
import { useRef, useState, useCallback, useEffect } from 'react';
import { useMapResize } from '@/hooks/useMapResize';
import { useMapInitialization } from '@/hooks/map/useMapInitialization';
import { useMapMarkers } from '@/hooks/map/useMapMarkers';
import { useMapRouting } from '@/hooks/map/useMapRouting';
import { useMapNavigation } from '@/hooks/map/useMapNavigation';
import { useMapItineraryRouting } from '@/hooks/map/useMapItineraryRouting';
import { ItineraryDay } from '@/types/supabase';
import { toast } from 'sonner';

export const useMapCore = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [showGeoJson, setShowGeoJson] = useState<boolean>(false);
  const [isGeoJsonLoaded, setIsGeoJsonLoaded] = useState<boolean>(false);
  const geoJsonNodes = useRef<any[]>([]);
  const geoJsonLinks = useRef<any[]>([]);
  
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

  // GeoJSON 데이터가 로드되면 호출되는 콜백 함수
  const handleGeoJsonLoaded = useCallback((nodes: any[], links: any[]) => {
    geoJsonNodes.current = nodes;
    geoJsonLinks.current = links;
    setIsGeoJsonLoaded(true);
    console.log("GeoJSON 데이터가 메모리에 로드되었습니다.", {
      노드수: nodes.length,
      링크수: links.length
    });
  }, []);

  // 일정 경로 렌더링을 위한 함수
  const renderItineraryRoute = useCallback((itineraryDay: ItineraryDay | null) => {
    if (itineraryDay) {
      renderDayRoute(itineraryDay);
    } else {
      clearAllRoutes();
    }
  }, [renderDayRoute, clearAllRoutes]);

  // 특정 장소 간의 경로만 하이라이트하는 기능
  const highlightSegment = useCallback((fromPlaceId: string, toPlaceId: string) => {
    if (!map || !isGeoJsonLoaded) {
      toast.error("지도 데이터가 아직 준비되지 않았습니다.");
      return;
    }
    
    // 여기서 fromPlaceId와 toPlaceId를 사용하여 
    // geoJsonNodes.current와 geoJsonLinks.current에서 해당 경로만 표시하는 로직 구현
    console.log(`${fromPlaceId}에서 ${toPlaceId}까지의 경로를 하이라이트합니다.`);
    
    // 구현 예시 (실제로는 노드와 링크의 ID를 비교하여 관련된 것만 표시해야 함)
    try {
      // 여기에 경로 하이라이트 구현이 필요합니다
    } catch (error) {
      console.error("경로 하이라이트 오류:", error);
      toast.error("경로 표시 중 오류가 발생했습니다.");
    }
  }, [map, isGeoJsonLoaded]);

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
    clearAllRoutes,
    highlightSegment,
    handleGeoJsonLoaded,
    isGeoJsonLoaded
  };
};

export default useMapCore;
