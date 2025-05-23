import { useCallback, useState, useEffect, useRef } from 'react';
import type { Place, ItineraryDay } from '@/types/supabase';
import type { ServerRouteDataForDay } from '@/hooks/map/useServerRoutes'; 
import type { ServerRouteResponse } from '@/types/schedule'; // For renderItineraryRoute from context

interface UseMapDataEffectsProps {
  isMapInitialized: boolean;
  isGeoJsonLoaded: boolean;
  showGeoJson: boolean;
  toggleGeoJsonVisibility: () => void;
  // 컨텍스트에서 오는 renderItineraryRoute의 실제 시그니처로 변경
  renderItineraryRoute: (
    itineraryDay: ItineraryDay | null,
    allServerRoutes?: Record<number, ServerRouteResponse>, // 이 부분은 컨텍스트 함수의 시그니처를 따름
    onComplete?: () => void
  ) => void;
  // serverRoutesData 타입을 Record<number, ServerRouteDataForDay> | null로 변경
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
  renderItineraryRoute, // 이 함수는 이제 컨텍스트의 함수를 직접 받음
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
      
      if (itinerary && itinerary.length > 0 && selectedDay !== null) {
        const currentDayData = itinerary.find(d => d.day === selectedDay);
        if (currentDayData) {
          console.log(`[MapDataEffects] ${selectedDay}일차 일정 경로 시각화 시작`);
          // renderItineraryRoute 호출 시 currentDayData (단일 ItineraryDay 객체) 전달
          // allServerRoutes는 여기서 직접 사용하지 않으므로 undefined 또는 null 전달 가능
          // 혹은 serverRoutesData를 활용하여 해당 날짜의 ServerRouteResponse를 찾아서 전달할 수도 있음
          // 여기서는 일단 null로 전달, 필요시 수정
          renderItineraryRoute(currentDayData, undefined, () => {
            setIsRouteVisualized(true);
            visRenderedRef.current = true;
            console.log(`[MapDataEffects] ${selectedDay}일차 일정 경로 시각화 완료`);
          });
        } else {
          // 선택된 날짜에 대한 데이터가 없으면 기존 경로를 지우는 로직이 필요할 수 있음 (clearAllRoutes 호출 등)
          // 현재는 renderItineraryRoute에 null을 전달하여 내부적으로 처리하도록 유도
          renderItineraryRoute(null, undefined, () => {
             setIsRouteVisualized(false); // 경로가 없으므로 false
             console.log(`[MapDataEffects] ${selectedDay}일차 데이터 없음, 경로 시각화 스킵 또는 초기화`);
          });
        }
      } else if (selectedDay === null && itinerary && itinerary.length > 0) {
        // 날짜 선택이 해제된 경우, 모든 경로를 지우도록 null 전달
        renderItineraryRoute(null, undefined, () => {
          setIsRouteVisualized(false);
          console.log(`[MapDataEffects] 선택된 일자 없음, 모든 경로 초기화 시도`);
        });
      }
    }
  }, [isMapInitialized, isGeoJsonLoaded, renderItineraryRoute, itinerary, selectedDay, serverRoutesData]); // serverRoutesData 의존성 추가

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
