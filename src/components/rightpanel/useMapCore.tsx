
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
  const geoJsonRetryCount = useRef<number>(0);
  
  const {
    map,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
    isGeoJsonInitialized
  } = useMapInitialization(mapContainer);

  const { addMarkers, clearMarkersAndUiElements } = useMapMarkers(map);
  const { calculateRoutes } = useMapRouting(map);
  const { panTo } = useMapNavigation(map);
  const { renderDayRoute, clearAllRoutes } = useMapItineraryRouting(map);

  useMapResize(map);
  
  // GeoJSON 초기화 상태 모니터링
  useEffect(() => {
    if (isGeoJsonInitialized) {
      console.log("✅ GeoJSON API가 초기화되었습니다.");
    }
  }, [isGeoJsonInitialized]);

  const toggleGeoJsonVisibility = useCallback(() => {
    // GeoJSON이 로드되지 않았다면 메시지 표시
    if (!isGeoJsonLoaded && !showGeoJson) {
      toast.info("경로 데이터를 로드하고 있습니다. 잠시 기다려주세요.");
    }
    setShowGeoJson(prev => !prev);
  }, [isGeoJsonLoaded, showGeoJson]);

  // GeoJSON 데이터가 로드되면 호출되는 콜백 함수
  const handleGeoJsonLoaded = useCallback((nodes: any[], links: any[]) => {
    if (nodes.length > 0 || links.length > 0) {
      geoJsonNodes.current = nodes;
      geoJsonLinks.current = links;
      setIsGeoJsonLoaded(true);
      console.log("GeoJSON 데이터가 메모리에 로드되었습니다.", {
        노드수: nodes.length,
        링크수: links.length
      });
      toast.success("경로 데이터가 로드되었습니다");
    } else {
      console.warn("빈 GeoJSON 데이터가 로드되었습니다");
      // 최대 3번까지 재시도
      if (geoJsonRetryCount.current < 3) {
        geoJsonRetryCount.current += 1;
        console.log(`GeoJSON 데이터 로드 재시도 (${geoJsonRetryCount.current}/3)...`);
      } else {
        toast.error("경로 데이터 로드에 실패했습니다");
      }
    }
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
  const highlightSegment = useCallback((fromIndex: number, toIndex: number, itineraryDay?: ItineraryDay) => {
    if (!map) {
      console.warn("지도가 아직 준비되지 않았습니다.");
      return;
    }
    
    try {
      console.log(`${fromIndex}번에서 ${toIndex}번까지의 경로를 하이라이트합니다.`);
      
      // 현재 일정이 있으면 해당 장소들 사이의 경로만 하이라이트
      if (itineraryDay && itineraryDay.places) {
        const places = itineraryDay.places;
        if (fromIndex >= 0 && fromIndex < places.length && 
            toIndex >= 0 && toIndex < places.length) {
          
          // 현재 코드에서는 일시적으로 경로를 하이라이트하는 로직이 없으므로
          // 일단 콘솔에만 표시하고 향후 구현 예정
          console.log(`${places[fromIndex].name}에서 ${places[toIndex].name}까지의 경로 하이라이트`);
          
          // GeoJSON 데이터가 로드되었을 경우 좀더 정확한 경로 표시 가능
          if (isGeoJsonLoaded && geoJsonNodes.current.length > 0) {
            // 향후 구현: GeoJSON 데이터를 활용한 정확한 경로 하이라이트
            console.log("GeoJSON 데이터를 활용한 정확한 경로 하이라이트 가능");
          }
        }
      }
    } catch (error) {
      console.error("경로 하이라이트 오류:", error);
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
