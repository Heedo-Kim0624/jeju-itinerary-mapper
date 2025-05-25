
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
  // updateDayPolylinePaths is called by renderItineraryRoute, not directly here.
  // updateDayPolylinePaths: (day: number, polylinePaths: { lat: number; lng: number }[][]) => void;
  serverRoutesData: Record<number, ServerRouteDataForDay> | null; 
  checkGeoJsonMapping: (places: Place[]) => void;
  places: Place[]; // General places, not necessarily for the current day's route
  itinerary: ItineraryDay[] | null; // Full itinerary from props/state
  selectedDay: number | null;
}

export const useMapDataEffects = ({
  isMapInitialized,
  isGeoJsonLoaded,
  renderItineraryRoute,
  serverRoutesData,
  checkGeoJsonMapping,
  places, // These are likely the 'search result' places or all available places
  itinerary, // This is the full generated schedule
  selectedDay,
}: UseMapDataEffectsProps) => {
  const prevItineraryRef = useRef<ItineraryDay[] | null>(null);
  const prevSelectedDayRef = useRef<number | null>(null);
  const prevServerRoutesDataRef = useRef<Record<number, ServerRouteDataForDay> | null>(null);


  const [isRouteVisualized, setIsRouteVisualized] = useState(false);

  const handlePlaceClick = useCallback((place: Place, index: number) => {
    console.log(`[MapDataEffects] 장소 클릭됨: ${place.name} (인덱스: ${index})`);
    // This function seems more related to individual place clicks, not route rendering.
  }, []);

  useEffect(() => {
    if (!isMapInitialized || !renderItineraryRoute) {
      console.log('[MapDataEffects] 초기화 안됨 또는 renderItineraryRoute 없음, 경로 렌더링 스킵.');
      return;
    }

    const itineraryChanged = prevItineraryRef.current !== itinerary;
    const dayChanged = prevSelectedDayRef.current !== selectedDay;
    const serverRoutesChanged = prevServerRoutesDataRef.current !== serverRoutesData;

    // Trigger route rendering if selectedDay changes, itinerary changes, or serverRoutesData for the selectedDay changes.
    if (dayChanged || itineraryChanged || serverRoutesChanged) {
      console.log(`[MapDataEffects] 경로 렌더링 트리거 감지:`, { 
        dayChanged,
        itineraryChanged,
        serverRoutesChanged,
        prevDay: prevSelectedDayRef.current,
        currentDay: selectedDay,
        hasItinerary: !!itinerary,
        itineraryLength: itinerary?.length || 0,
        hasServerRoutesData: !!serverRoutesData,
        serverRoutesDataKeys: serverRoutesData ? Object.keys(serverRoutesData) : "N/A",
      });
      
      prevItineraryRef.current = itinerary;
      prevSelectedDayRef.current = selectedDay;
      prevServerRoutesDataRef.current = serverRoutesData;
      
      if (selectedDay !== null && serverRoutesData && serverRoutesData[selectedDay]) {
        const currentDayRouteInfo = serverRoutesData[selectedDay];
        // Ensure itineraryDayData is present, which it should be after changes to useScheduleGenerationCore
        if (currentDayRouteInfo.itineraryDayData) {
          console.log(`[MapDataEffects] ${selectedDay}일차 경로 시각화 시작 (serverRoutesData 사용). ItineraryDay places: ${currentDayRouteInfo.itineraryDayData.places?.length}, Polyline paths cached: ${currentDayRouteInfo.polylinePaths?.length || 0}`);
          renderItineraryRoute(currentDayRouteInfo.itineraryDayData, serverRoutesData, () => {
            setIsRouteVisualized(true);
            console.log(`[MapDataEffects] ${selectedDay}일차 경로 시각화 (serverRoutesData) 완료 콜백.`);
          });
        } else {
           console.warn(`[MapDataEffects] ${selectedDay}일차 데이터가 serverRoutesData에 있으나 itineraryDayData 누락. Fallback 시도.`);
           // Fallback to itinerary if serverRoutesData[selectedDay].itineraryDayData is missing (should be rare)
           const fallbackItineraryDay = itinerary?.find(d => d.day === selectedDay);
           if (fallbackItineraryDay) {
             console.warn(`[MapDataEffects] ${selectedDay}일차 itineraryDayData 누락으로 itinerary에서 직접 찾아 사용.`, { fallbackItineraryDay });
             renderItineraryRoute(fallbackItineraryDay, serverRoutesData, () => {
               setIsRouteVisualized(true);
               console.log(`[MapDataEffects] ${selectedDay}일차 경로 시각화 (fallback to itinerary) 완료 콜백.`);
             });
           } else {
             console.error(`[MapDataEffects] ${selectedDay}일차에 대한 ItineraryDay 데이터를 serverRoutesData 및 itinerary 모두에서 찾을 수 없음. 지도 초기화.`);
             renderItineraryRoute(null, serverRoutesData, () => setIsRouteVisualized(false));
           }
        }
      } else if (selectedDay !== null && itinerary && itinerary.length > 0) {
        // This block handles the case where serverRoutesData might not yet be populated for the selectedDay,
        // or is missing the specific day. We attempt a fallback to the main itinerary prop.
        const fallbackItineraryDay = itinerary.find(d => d.day === selectedDay);
        if (fallbackItineraryDay) {
          console.warn(`[MapDataEffects] ${selectedDay}일차 데이터가 serverRoutesData에 없음. itinerary에서 직접 찾아 사용.`, { fallbackItineraryDay });
          renderItineraryRoute(fallbackItineraryDay, serverRoutesData, () => {
            setIsRouteVisualized(true);
            console.log(`[MapDataEffects] ${selectedDay}일차 경로 시각화 (fallback to itinerary) 완료 콜백.`);
          });
        } else {
          console.warn(`[MapDataEffects] ${selectedDay}일차에 대한 ItineraryDay 데이터를 itinerary에서도 찾을 수 없음. 지도 초기화.`);
          renderItineraryRoute(null, serverRoutesData, () => setIsRouteVisualized(false));
        }
      } else if (selectedDay === null) {
        console.log(`[MapDataEffects] 선택된 일자 없음 (selectedDay is null), 지도 초기화 시도.`);
        renderItineraryRoute(null, serverRoutesData, () => {
          setIsRouteVisualized(false);
        });
      } else {
        console.log(`[MapDataEffects] 경로 렌더링 조건 충족 안됨 (selectedDay: ${selectedDay}, itinerary: ${!!itinerary}, serverRoutesData: ${!!serverRoutesData})`);
         // Potentially renderItineraryRoute(null) if map needs clearing but conditions not met for specific day
      }
    }
  }, [
    isMapInitialized, 
    renderItineraryRoute, 
    itinerary, 
    selectedDay, 
    serverRoutesData,
    // isGeoJsonLoaded is not a direct dependency for this effect's route rendering logic, 
    // but renderItineraryRoute itself might depend on it.
  ]);

  useEffect(() => {
    if (isMapInitialized && isGeoJsonLoaded && places.length > 0 && checkGeoJsonMapping) {
      // This checkGeoJsonMapping seems to be for general places, not specific to a day's route.
      // Its re-execution should be tied to changes in `places` or `isGeoJsonLoaded`.
      console.log("[MapDataEffects] Checking GeoJSON mapping for general places list.");
      checkGeoJsonMapping(places);
    }
  }, [isMapInitialized, isGeoJsonLoaded, places, checkGeoJsonMapping]);

  return {
    isRouteVisualized,
    handlePlaceClick, // Kept if used elsewhere, though not directly related to route rendering logic here.
  };
};
