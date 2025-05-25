
import { useEffect, useCallback, useState, useRef } from 'react';
import type { Place, ItineraryDay } from '@/types/core';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { ServerRouteDataForDay } from '@/hooks/map/useServerRoutes';

interface UseMapDataEffectsProps {
  isMapInitialized: boolean;
  renderItineraryRoute: (
    itineraryDay: ItineraryDay | null,
    allServerRoutes?: Record<number, ServerRouteDataForDay>,
    onComplete?: () => void
  ) => void;
  serverRoutesData: Record<number, ServerRouteDataForDay>;
  checkGeoJsonMapping?: (places: Place[]) => {
    mappedPlaces: number;
    totalPlaces: number;
    mappingRate: string;
    averageDistance: number | string;
    success: boolean;
    message: string;
  };
  places: Place[];
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
}

export const useMapDataEffects = ({
  isMapInitialized,
  renderItineraryRoute,
  serverRoutesData,
  checkGeoJsonMapping,
  places,
  itinerary,
  selectedDay,
}: UseMapDataEffectsProps) => {
  const [previousDay, setPreviousDay] = useState<number | null>(null);
  const renderingInProgress = useRef<boolean>(false);
  
  // 장소 클릭 핸들러
  const handlePlaceClick = useCallback((place: Place, index: number) => {
    // 여기서 place 클릭 시 처리 로직 구현 가능 (필요시)
    console.log(`[useMapDataEffects] Place clicked: ${place.name} (${index})`);
  }, []);

  // 일정 일자가 변경될 때 해당 일자의 경로 렌더링
  useEffect(() => {
    if (!isMapInitialized || !itinerary || selectedDay === null) return;
    
    console.log(`[useMapDataEffects] selectedDay changed to: ${selectedDay}, previousDay: ${previousDay}`);
    
    if (renderingInProgress.current) {
      console.log("[useMapDataEffects] Rendering still in progress, waiting...");
      return;
    }
    
    // 선택한 일자의 itinerary 데이터 찾기
    const currentDayData = itinerary.find(day => day.day === selectedDay);
    if (!currentDayData) {
      console.warn(`[useMapDataEffects] No itinerary data found for day ${selectedDay}`);
      return;
    }
    
    // 경로 렌더링 시작
    renderingInProgress.current = true;
    console.log(`[useMapDataEffects] Rendering route for day ${selectedDay}:`, 
      {
        dayInfo: `${currentDayData.dayOfWeek} (${currentDayData.date})`,
        routeId: currentDayData.routeId,
        placesCount: currentDayData.places.length,
        nodeIdsCount: currentDayData.routeData.nodeIds.length,
        linkIdsCount: currentDayData.routeData.linkIds.length,
        interleavedRouteLength: currentDayData.interleaved_route.length,
        serverRouteDataEntries: Object.keys(serverRoutesData).length
      }
    );
    
    // 실제 렌더링 함수 호출
    renderItineraryRoute(
      currentDayData,
      serverRoutesData,
      () => {
        console.log(`[useMapDataEffects] Route rendering completed for day ${selectedDay}`);
        renderingInProgress.current = false;
        setPreviousDay(selectedDay);
      }
    );
  }, [isMapInitialized, itinerary, selectedDay, renderItineraryRoute, serverRoutesData, previousDay]);

  // GeoJSON 매핑 품질 체크 (옵션)
  useEffect(() => {
    if (isMapInitialized && checkGeoJsonMapping && places.length > 0) {
      const mappingResult = checkGeoJsonMapping(places);
      console.log(`[useMapDataEffects] GeoJSON mapping quality: ${mappingResult.mappingRate} (${mappingResult.mappedPlaces}/${mappingResult.totalPlaces})`);
    }
  }, [isMapInitialized, checkGeoJsonMapping, places]);

  // 일자 선택 이벤트 리스너
  useEffect(() => {
    const handleItineraryDaySelected = (event: Event) => {
      const customEvent = event as CustomEvent<{day: number, timestamp: number}>;
      const selectedDayFromEvent = customEvent.detail?.day;
      
      if (selectedDayFromEvent !== undefined && selectedDayFromEvent !== null) {
        console.log(`[useMapDataEffects] 'itineraryDaySelected' event received for day: ${selectedDayFromEvent}`);
        // 일자 선택 이벤트가 발생하면 renderItineraryRoute는 selectedDay가 변경될 때 호출되므로
        // 여기서는 추가 처리가 필요 없음
      }
    };

    window.addEventListener('itineraryDaySelected', handleItineraryDaySelected);
    return () => {
      window.removeEventListener('itineraryDaySelected', handleItineraryDaySelected);
    };
  }, [renderItineraryRoute, serverRoutesData]);

  return { handlePlaceClick };
};
