import { useCallback, useState, useEffect, useRef } from 'react';
import type { Place, ItineraryDay } from '@/types/supabase';
import type { ServerRouteDataForDay } from '@/hooks/map/useServerRoutes'; 

interface UseMapDataEffectsProps {
  isMapInitialized: boolean;
  isGeoJsonLoaded: boolean;
  renderItineraryRoute: (
    itineraryDay: ItineraryDay | null,
    allServerRoutes?: Record<number, ServerRouteDataForDay>, 
    onComplete?: () => void
  ) => void;
  updateDayPolylinePaths: (day: number, polylinePaths: { lat: number; lng: number }[][]) => void;
  serverRoutesData: Record<number, ServerRouteDataForDay> | null; 
  checkGeoJsonMapping: (places: Place[]) => void;
  places: Place[];
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
}

export const useMapDataEffects = ({
  isMapInitialized,
  isGeoJsonLoaded,
  renderItineraryRoute,
  updateDayPolylinePaths,
  serverRoutesData,
  checkGeoJsonMapping,
  places,
  itinerary,
  selectedDay,
}: UseMapDataEffectsProps) => {
  const prevItineraryRef = useRef<ItineraryDay[] | null>(null);
  const prevSelectedDayRef = useRef<number | null>(null);

  const [isRouteVisualized, setIsRouteVisualized] = useState(false);

  const handlePlaceClick = useCallback((place: Place, index: number) => {
    console.log(`[MapDataEffects] 장소 클릭됨: ${place.name} (인덱스: ${index})`);
  }, []);

  useEffect(() => {
    if (!isMapInitialized || !renderItineraryRoute) {
      console.log('[MapDataEffects] 초기화 안됨 또는 renderItineraryRoute 없음, 경로 렌더링 스킵.');
      return;
    }

    const itineraryChanged = prevItineraryRef.current !== itinerary;
    const dayChanged = prevSelectedDayRef.current !== selectedDay;
    
    if (itineraryChanged || dayChanged) {
      console.log(`[MapDataEffects] 일정 또는 선택된 일자 변경 감지:`, { 
        itineraryChanged, 
        dayChanged,
        prevDay: prevSelectedDayRef.current,
        currentDay: selectedDay,
        hasItinerary: !!itinerary,
        itineraryLength: itinerary?.length || 0,
        hasServerRoutesData: !!serverRoutesData,
        serverRoutesDataKeys: serverRoutesData ? Object.keys(serverRoutesData) : [],
      });
      
      prevItineraryRef.current = itinerary;
      prevSelectedDayRef.current = selectedDay;
      
      if (selectedDay !== null && itinerary && itinerary.length > 0) {
        const currentServerRouteData = serverRoutesData ? serverRoutesData[selectedDay] : null;
        
        if (currentServerRouteData && currentServerRouteData.itineraryDayData) {
          console.log(`[MapDataEffects] ${selectedDay}일차 경로 시각화 시작. 사용될 ItineraryDay 데이터:`, currentServerRouteData.itineraryDayData);
          renderItineraryRoute(currentServerRouteData.itineraryDayData, serverRoutesData || undefined, () => {
            setIsRouteVisualized(true);
            console.log(`[MapDataEffects] ${selectedDay}일차 경로 시각화 완료 콜백.`);
          });
        } else {
          const fallbackItineraryDay = itinerary.find(d => d.day === selectedDay);
          if (fallbackItineraryDay) {
            console.warn(`[MapDataEffects] ${selectedDay}일차 데이터가 serverRoutesData에 완전하지 않음. itinerary에서 직접 찾아 사용.`, { fallbackItineraryDay });
            renderItineraryRoute(fallbackItineraryDay, serverRoutesData || undefined, () => {
              setIsRouteVisualized(true);
              console.log(`[MapDataEffects] ${selectedDay}일차 경로 시각화 (fallback) 완료 콜백.`);
            });
          } else {
            console.warn(`[MapDataEffects] ${selectedDay}일차에 대한 ItineraryDay 데이터를 serverRoutesData 및 itinerary 모두에서 찾을 수 없음. 경로 렌더링 스킵.`);
            renderItineraryRoute(null, serverRoutesData || undefined, () => {
               setIsRouteVisualized(false);
               console.log(`[MapDataEffects] ${selectedDay}일차 데이터 없음, 지도 초기화됨.`);
            });
          }
        }
      } else if (selectedDay === null) {
        console.log(`[MapDataEffects] 선택된 일자 없음, 지도 초기화 시도.`);
        renderItineraryRoute(null, serverRoutesData || undefined, () => {
          setIsRouteVisualized(false);
        });
      }
    }
  }, [
    isMapInitialized, 
    isGeoJsonLoaded, 
    renderItineraryRoute, 
    itinerary, 
    selectedDay, 
    serverRoutesData,
    updateDayPolylinePaths
  ]);

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
