
import { useState, useCallback, useEffect } from 'react';
import { ItineraryDay } from '@/types/supabase';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';

export const useScheduleStateAndEffects = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isLoadingState, setIsLoadingState] = useState<boolean>(true); // 초기 로딩 상태 true

  const { renderGeoJsonRoute, clearAllRoutes } = useMapContext();

  // 일정 데이터가 변경되면 로딩 상태를 false로 설정
  useEffect(() => {
    if (itinerary.length > 0) {
      console.log(`[useScheduleStateAndEffects] 일정이 설정되었습니다. 일수: ${itinerary.length}, 로딩 상태 해제`);
      setIsLoadingState(false);
    }
  }, [itinerary]);

  const handleSelectDay = useCallback((day: number) => {
    setSelectedDay(day);
    console.log(`[useScheduleStateAndEffects] 일정 ${day}일차가 선택되었습니다.`);
  }, []);

  useEffect(() => {
    if (selectedDay !== null && itinerary.length > 0 && renderGeoJsonRoute && clearAllRoutes) {
      const currentDayData = itinerary.find(d => d.day === selectedDay);
      if (currentDayData?.interleaved_route) {
        clearAllRoutes();
        const nodes = extractAllNodesFromRoute(currentDayData.interleaved_route).map(String);
        const links = extractAllLinksFromRoute(currentDayData.interleaved_route).map(String);
        console.log(`[useScheduleStateAndEffects] ${selectedDay}일차 렌더링 중: ${nodes.length}개 노드, ${links.length}개 링크`);
        renderGeoJsonRoute(nodes, links, { strokeColor: '#3366FF', strokeWeight: 5, strokeOpacity: 0.8 });
      } else if (currentDayData) {
        console.log(`[useScheduleStateAndEffects] ${selectedDay}일차에 interleaved_route가 없습니다. 대체 렌더링 필요.`);
      } else {
        clearAllRoutes(); // 현재 일 데이터나 경로가 없으면 경로를 지웁니다
      }
    } else {
        clearAllRoutes(); // selectedDay가 null이거나 itinerary가 비어있으면 경로를 지웁니다
    }
  }, [selectedDay, itinerary, renderGeoJsonRoute, clearAllRoutes]);

  return {
    itinerary,
    setItinerary,
    selectedDay,
    setSelectedDay,
    isLoadingState,
    setIsLoadingState,
    handleSelectDay,
  };
};
