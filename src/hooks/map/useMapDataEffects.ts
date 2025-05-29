
import { useCallback, useState, useEffect, useRef } from 'react';
import type { Place, ItineraryDay } from '@/types/supabase'; // or @/types/core
import type { ServerRouteDataForDay } from '@/hooks/map/useServerRoutes';
import { useMapContext } from '@/components/rightpanel/MapContext'; 

interface UseMapDataEffectsProps {
  isMapInitialized: boolean;
  // isGeoJsonLoaded 제거 (MapContext 통해 간접적으로 확인 가능 또는 GeoJson 자체 로딩 상태 사용)
  renderItineraryRoute: ( 
    itineraryDay: ItineraryDay | null,
    allServerRoutes?: Record<number, ServerRouteDataForDay>,
    onComplete?: () => void 
  ) => void;
  serverRoutesData: Record<number, ServerRouteDataForDay> | null;
  checkGeoJsonMapping: (places: Place[]) => void; // 이 함수는 GeoJson 로드 상태를 내부적으로 확인해야 함
  places: Place[]; 
  itinerary: ItineraryDay[] | null; 
  selectedDay: number | null;
}

export const useMapDataEffects = ({
  isMapInitialized,
  // isGeoJsonLoaded, // 제거
  renderItineraryRoute,
  serverRoutesData,
  checkGeoJsonMapping,
  places,
  itinerary,
  selectedDay,
}: UseMapDataEffectsProps) => {
  const prevItineraryRef = useRef<ItineraryDay[] | null>(null);
  const prevSelectedDayRef = useRef<number | null>(null);
  const prevServerRoutesDataRef = useRef<Record<number, ServerRouteDataForDay> | null>(null);
  
  const routeRenderingInProgressRef = useRef(false);
  // handleRouteRenderingCompleteForContext 는 MapContext에서 직접 가져오므로, 여기서 상태를 중복 관리할 필요는 없음.
  // MapContext의 currentRenderingDay, renderingComplete.route 상태를 참조하여 로직을 구성할 수 있음.
  const { handleRouteRenderingCompleteForContext, isGeoJsonLoaded } = useMapContext(); // isGeoJsonLoaded 추가

  const handlePlaceClick = useCallback((place: Place, index: number) => {
    console.log(`[MapDataEffects] Place clicked: ${place.name}, index: ${index}`);
  }, []);

  useEffect(() => {
    if (!isMapInitialized || !renderItineraryRoute) {
      console.log('[MapDataEffects] Effect skipped: Map not initialized or renderItineraryRoute not available.');
      return;
    }

    const itineraryActuallyChanged = prevItineraryRef.current !== itinerary;
    const dayActuallyChanged = prevSelectedDayRef.current !== selectedDay;
    const serverRoutesActuallyChanged = prevServerRoutesDataRef.current !== serverRoutesData;
    
    let timeoutId: NodeJS.Timeout | undefined;

    if (dayActuallyChanged || itineraryActuallyChanged || serverRoutesActuallyChanged) {
      // console.log(`[MapDataEffects] Change detected. Day: ${dayActuallyChanged}, Itin: ${itineraryActuallyChanged}, ServerRoutes: ${serverRoutesActuallyChanged}`);
      if (routeRenderingInProgressRef.current) {
        console.log('[MapDataEffects] Route rendering already in progress (ref lock), skipping this update.');
        return;
      }
      routeRenderingInProgressRef.current = true;
      console.log('[MapDataEffects] routeRenderingInProgressRef SET TO TRUE');

      prevItineraryRef.current = itinerary;
      prevSelectedDayRef.current = selectedDay;
      prevServerRoutesDataRef.current = serverRoutesData;

      timeoutId = setTimeout(() => {
        console.log(`[MapDataEffects] Starting route processing for day: ${selectedDay}. Clearing old routes first.`);
        
        // 1. 이전 경로 클리어 (renderItineraryRoute(null, ...) 호출)
        renderItineraryRoute(null, serverRoutesData || undefined, () => {
          console.log(`[MapDataEffects] Old routes cleared for day: ${selectedDay}. Now checking for new route.`);
          
          let effectiveItineraryDay: ItineraryDay | null = null;
          if (selectedDay !== null && itinerary && itinerary.length > 0) {
            effectiveItineraryDay = itinerary.find(d => d.day === selectedDay) || null;
          }
          
          if (effectiveItineraryDay) {
            console.log(`[MapDataEffects] Rendering new route for day ${selectedDay}. Route ID: ${effectiveItineraryDay.routeId}`);
            // 2. 새 경로 렌더링
            renderItineraryRoute(effectiveItineraryDay, serverRoutesData || undefined, () => {
              // 이 onComplete는 *새로운* 경로 렌더링 완료 시 호출됨
              console.log(`[MapDataEffects] Route for day ${selectedDay} (Route ID: ${effectiveItineraryDay?.routeId}) rendered. Notifying MapContext.`);
              routeRenderingInProgressRef.current = false;
              console.log('[MapDataEffects] routeRenderingInProgressRef SET TO FALSE (new route rendered)');
              if (handleRouteRenderingCompleteForContext) {
                handleRouteRenderingCompleteForContext(); // MapContext에 경로 렌더링 완료 알림
              }
            });
          } else {
            console.log(`[MapDataEffects] No valid itinerary data for day ${selectedDay}, routes remain cleared. Notifying MapContext.`);
            routeRenderingInProgressRef.current = false;
            console.log('[MapDataEffects] routeRenderingInProgressRef SET TO FALSE (no new route)');
            if (handleRouteRenderingCompleteForContext) {
                handleRouteRenderingCompleteForContext(); // 경로 없어도 완료 알림 (마커 진행 위해)
            }
          }
        });
      }, 0); 
    } else {
      // console.log('[MapDataEffects] No relevant changes detected for route visualization.');
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Unmounting or re-running: if a render was pending, release lock.
      // This might be aggressive if another effect could also control this ref.
      // For now, assume this is the primary controller of the ref.
      // if (routeRenderingInProgressRef.current) {
      //   console.log('[MapDataEffects] Cleanup: routeRenderingInProgressRef was true, setting to false.');
      //   routeRenderingInProgressRef.current = false;
      // }
    };
  }, [
    isMapInitialized,
    renderItineraryRoute,
    itinerary,
    selectedDay,
    serverRoutesData,
    handleRouteRenderingCompleteForContext, 
  ]);

  useEffect(() => {
    if (isMapInitialized && isGeoJsonLoaded && places.length > 0 && checkGeoJsonMapping) {
      console.log('[MapDataEffects] Checking GeoJSON mapping due to dependencies change.');
      checkGeoJsonMapping(places);
    }
  }, [isMapInitialized, isGeoJsonLoaded, places, checkGeoJsonMapping]);

  return {
    handlePlaceClick,
  };
};
