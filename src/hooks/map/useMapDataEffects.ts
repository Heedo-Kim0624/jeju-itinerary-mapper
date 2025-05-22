
import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { Place, ItineraryDay } from '@/types/supabase';
import type { ServerRouteResponse } from '@/types/schedule';

interface UseMapDataEffectsProps {
  // From MapContext
  isMapInitialized: boolean;
  isGeoJsonLoaded: boolean;
  showGeoJson: boolean;
  toggleGeoJsonVisibility: () => void;
  renderItineraryRoute: (
    itineraryDay: ItineraryDay | null,
    allServerRoutes?: Record<number, ServerRouteResponse>,
    onComplete?: () => void
  ) => void;
  serverRoutesData: Record<number, ServerRouteResponse>;
  checkGeoJsonMapping: (places: Place[]) => {
    totalPlaces: number;
    mappedPlaces: number;
    mappingRate: string;
    averageDistance: number | string;
    success: boolean;
    message: string;
  };

  // From Map component props
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
  // GeoJSON이 로드되면 사용자에게 알림
  useEffect(() => {
    if (isGeoJsonLoaded && showGeoJson) {
      toast.success('경로 데이터가 지도에 표시됩니다');
    }
  }, [isGeoJsonLoaded, showGeoJson]);

  // 일정 데이터가 변경될 때 경로 시각화
  useEffect(() => {
    if (isMapInitialized && isGeoJsonLoaded && itinerary && itinerary.length > 0 && selectedDay !== null) {
      const currentDayData = itinerary.find(day => day.day === selectedDay);
      if (currentDayData) {
        console.log(`[MapDataEffects] 선택된 ${selectedDay}일차 일정 경로 시각화 중...`);
        
        if (!showGeoJson) {
          console.log("[MapDataEffects] GeoJSON 표시를 활성화합니다.");
          toggleGeoJsonVisibility();
        }
        
        renderItineraryRoute(currentDayData, serverRoutesData, () => {
          console.log(`[MapDataEffects] ${selectedDay}일차 일정 경로 시각화 완료`);
        });
      }
    }
  }, [itinerary, selectedDay, isMapInitialized, isGeoJsonLoaded, showGeoJson, toggleGeoJsonVisibility, renderItineraryRoute, serverRoutesData]);

  // 서버 경로 데이터가 변경될 때마다 로그 출력 및 처리
  useEffect(() => {
    if (Object.keys(serverRoutesData).length > 0) {
      console.log("[MapDataEffects] 서버 경로 데이터가 업데이트됨:", {
        일수: Object.keys(serverRoutesData).length,
        첫날_노드: serverRoutesData[1]?.nodeIds?.length || 0,
        첫날_링크: serverRoutesData[1]?.linkIds?.length || 0,
        첫날_인터리브드: !!serverRoutesData[1]?.interleaved_route
      });
      
      if (isGeoJsonLoaded && !showGeoJson) {
        console.log("[MapDataEffects] 서버 경로 데이터가 있어 GeoJSON 표시를 활성화합니다.");
        toggleGeoJsonVisibility();
      }
      
      if (selectedDay !== null && itinerary && itinerary.length > 0) {
        const currentDayData = itinerary.find(day => day.day === selectedDay);
        if (currentDayData) {
          console.log(`[MapDataEffects] 서버 경로 데이터 업데이트 후 ${selectedDay}일차 일정 경로 시각화 중...`);
          renderItineraryRoute(currentDayData, serverRoutesData, () => {
            console.log(`[MapDataEffects] ${selectedDay}일차 일정 경로 시각화 완료 (데이터 업데이트 후)`);
          });
        }
      }
    }
  }, [serverRoutesData, isGeoJsonLoaded, showGeoJson, toggleGeoJsonVisibility, selectedDay, itinerary, renderItineraryRoute]);

  // 장소와 GeoJSON 매핑 검사
  useEffect(() => {
    if (isGeoJsonLoaded && places.length > 0 && isMapInitialized) {
      const timer = setTimeout(() => {
        const mappingResult = checkGeoJsonMapping(places);
        console.log('[MapDataEffects] GeoJSON 매핑 결과:', mappingResult);
        
        if (mappingResult.success) {
          console.log(`✅ [MapDataEffects] 장소-GeoJSON 매핑 성공: ${mappingResult.mappedPlaces}/${mappingResult.totalPlaces} 장소, 평균 거리: ${mappingResult.averageDistance}m`);
        } else {
          console.warn(`⚠️ [MapDataEffects] 장소-GeoJSON 매핑 부족: ${mappingResult.mappingRate} 매핑됨, 평균 거리: ${mappingResult.averageDistance}m`);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isGeoJsonLoaded, places, isMapInitialized, checkGeoJsonMapping]);

  const handlePlaceClick = useCallback((place: Place, index: number) => {
    console.log(`[MapDataEffects] 장소 클릭됨: ${place.name} (${index + 1}번)`);
    if (itinerary && itinerary.length > 0 && selectedDay !== null) {
      const currentDayData = itinerary.find(day => day.day === selectedDay);
      if (currentDayData) {
        const placeIndexInItinerary = currentDayData.places.findIndex(p => p.id === place.id);
        if (placeIndexInItinerary !== -1) {
          console.log(`[MapDataEffects] 일정 내 장소 클릭: ${place.name} (일차: ${selectedDay}, 인덱스: ${placeIndexInItinerary})`);
          // 여기서 필요한 하이라이트 로직 호출 가능 (현재는 로깅만)
        }
      }
    }
  }, [itinerary, selectedDay]);

  return { handlePlaceClick };
};
