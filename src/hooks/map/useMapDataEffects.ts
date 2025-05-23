import { useCallback, useState, useEffect, useRef } from 'react';
import type { Place, ItineraryDay } from '@/types/supabase';
import type { ServerRouteDataForDay } from '@/hooks/map/useServerRoutes'; 
// ServerRouteResponse 임포트는 renderItineraryRoute의 시그니처가 변경되므로 더 이상 직접 필요하지 않을 수 있음
// import type { ServerRouteResponse } from '@/types/schedule'; 

interface UseMapDataEffectsProps {
  isMapInitialized: boolean;
  isGeoJsonLoaded: boolean;
  showGeoJson: boolean;
  toggleGeoJsonVisibility: () => void;
  renderItineraryRoute: ( // allServerRoutes 파라미터 타입 변경
    itineraryDay: ItineraryDay | null,
    allServerRoutes?: Record<number, ServerRouteDataForDay>, 
    onComplete?: () => void
  ) => void;
  serverRoutesData: Record<number, ServerRouteDataForDay> | null; 
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
    
    if (itineraryChanged || dayChanged) {
      console.log(`[MapDataEffects] 일정 또는 선택된 일자 변경 감지:`, { 
        itineraryChanged, 
        dayChanged,
        prevDay: prevSelectedDayRef.current,
        currentDay: selectedDay
      });
      
      prevItineraryRef.current = itinerary;
      prevSelectedDayRef.current = selectedDay;
      
      if (itinerary && itinerary.length > 0 && selectedDay !== null) {
        const currentDayData = itinerary.find(d => d.day === selectedDay);
        if (currentDayData) {
          console.log(`[MapDataEffects] ${selectedDay}일차 일정 경로 시각화 시작`);
          // allServerRoutes 파라미터에는 serverRoutesData (이미 ServerRouteDataForDay 타입) 또는 undefined 전달
          // 현재는 undefined를 전달하고 있으므로, 타입 변경으로 인한 직접적 영향은 없음
          renderItineraryRoute(currentDayData, serverRoutesData || undefined, () => {
            setIsRouteVisualized(true);
            visRenderedRef.current = true;
            console.log(`[MapDataEffects] ${selectedDay}일차 일정 경로 시각화 완료`);
          });
        } else {
          renderItineraryRoute(null, serverRoutesData || undefined, () => {
             setIsRouteVisualized(false);
             console.log(`[MapDataEffects] ${selectedDay}일차 데이터 없음, 경로 시각화 스킵 또는 초기화`);
          });
        }
      } else if (selectedDay === null && itinerary && itinerary.length > 0) {
        renderItineraryRoute(null, serverRoutesData || undefined, () => {
          setIsRouteVisualized(false);
          console.log(`[MapDataEffects] 선택된 일자 없음, 모든 경로 초기화 시도`);
        });
      }
    }
  }, [isMapInitialized, isGeoJsonLoaded, renderItineraryRoute, itinerary, selectedDay, serverRoutesData]);

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
