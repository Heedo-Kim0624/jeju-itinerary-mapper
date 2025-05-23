
import { useCallback, useState, useEffect, useRef } from 'react';
import type { Place, ItineraryDay } from '@/types/supabase';
import type { ServerRoutesData } from '@/hooks/map/useServerRoutes';

interface UseMapDataEffectsProps {
  isMapInitialized: boolean;
  isGeoJsonLoaded: boolean;
  showGeoJson: boolean;
  toggleGeoJsonVisibility: () => void;
  renderItineraryRoute: (itinerary: ItineraryDay[], currentDay: number | null) => void;
  serverRoutesData: ServerRoutesData | null;
  checkGeoJsonMapping: (places: Place[]) => void;
  places: Place[];
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
}

export const useMapDataEffects = ({
  isMapInitialized,
  isGeoJsonLoaded,
  showGeoJson,
  toggleGeoJsonVisibility,
  renderItineraryRoute,
  serverRoutesData,
  checkGeoJsonMapping,
  places,
  itinerary,
  selectedDay,
}: UseMapDataEffectsProps) => {
  // Track previous values to detect changes
  const prevItineraryRef = useRef<ItineraryDay[] | null>(null);
  const prevSelectedDayRef = useRef<number | null>(null);
  const visRenderedRef = useRef(false);

  // 경로 시각화가 완료되었는지 여부
  const [isRouteVisualized, setIsRouteVisualized] = useState(false);

  // 장소 클릭 핸들러
  const handlePlaceClick = useCallback((place: Place, index: number) => {
    console.log(`[MapDataEffects] 장소 클릭됨: ${place.name} (인덱스: ${index})`);
  }, []);

  // 일정이 변경되거나 선택된 일자가 변경될 때 경로 렌더링
  useEffect(() => {
    if (!isMapInitialized || !isGeoJsonLoaded || !renderItineraryRoute || !itinerary) {
      return;
    }

    const itineraryChanged = prevItineraryRef.current !== itinerary;
    const dayChanged = prevSelectedDayRef.current !== selectedDay;
    
    // 값 변경 감지
    if (itineraryChanged || dayChanged) {
      console.log(`[MapDataEffects] 일정 또는 선택된 일자 변경 감지:`, { 
        itineraryChanged, 
        dayChanged,
        prevDay: prevSelectedDayRef.current,
        currentDay: selectedDay
      });
      
      prevItineraryRef.current = itinerary;
      prevSelectedDayRef.current = selectedDay;
      
      // 일정과 선택된 일자가 있으면 해당 일자의 경로 렌더링
      if (itinerary && itinerary.length > 0 && selectedDay !== null) {
        console.log(`[MapDataEffects] ${selectedDay}일차 일정 경로 시각화 시작`);
        renderItineraryRoute(itinerary, selectedDay);
        setIsRouteVisualized(true);
        visRenderedRef.current = true;
        console.log(`[MapDataEffects] ${selectedDay}일차 일정 경로 시각화 완료`);
      }
    }
  }, [isMapInitialized, isGeoJsonLoaded, renderItineraryRoute, itinerary, selectedDay]);

  // GeoJson 데이터와 장소 매핑 확인
  useEffect(() => {
    if (isMapInitialized && isGeoJsonLoaded && places.length > 0 && checkGeoJsonMapping) {
      checkGeoJsonMapping(places);
    }
  }, [isMapInitialized, isGeoJsonLoaded, places, checkGeoJsonMapping]);

  return {
    isRouteVisualized,
    handlePlaceClick,
  };
};
