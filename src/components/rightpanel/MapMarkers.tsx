
import React, { useEffect } from 'react';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { useMapMarkers } from './hooks/useMapMarkers';

interface MapMarkersProps {
  places: Place[];
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  selectedPlaces?: Place[]; 
  onPlaceClick?: (place: Place | ItineraryPlaceWithTime, index: number) => void;
  highlightPlaceId?: string;
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  places,
  selectedPlace,
  itinerary,
  selectedDay,
  selectedPlaces = [],
  onPlaceClick,
  highlightPlaceId,
}) => {
  console.log(`[MapMarkers] Component rendered with selectedDay: ${selectedDay}`);
  
  const { forceMarkerUpdate, clearAllMarkers } = useMapMarkers({
    places,
    selectedPlace,
    itinerary,
    selectedDay,
    selectedPlaces,
    onPlaceClick,
    highlightPlaceId,
  });

  // 초기 마운트와 주요 props 변경 시 마커 업데이트
  useEffect(() => {
    console.log(`[MapMarkers] selectedDay changed to: ${selectedDay}, forcing marker update`);
    const timer = setTimeout(() => {
      forceMarkerUpdate();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [selectedDay, itinerary, forceMarkerUpdate]);

  // 경로 생성 시작 이벤트 감지 시 모든 마커 제거
  useEffect(() => {
    const handleStartScheduleGeneration = () => {
      console.log("[MapMarkers] startScheduleGeneration 이벤트 감지 - 모든 마커 제거");
      clearAllMarkers();
    };
    
    // 일정 일자 선택 이벤트 감지
    const handleDaySelected = (event: any) => {
      if (event.detail && typeof event.detail.day === 'number') {
        console.log(`[MapMarkers] itineraryDaySelected 이벤트 감지 - 일자: ${event.detail.day}`);
        // 약간의 지연 후에 마커 업데이트 실행 (다른 이벤트 처리 완료 후)
        setTimeout(() => {
          forceMarkerUpdate();
        }, 100);
      }
    };
    
    window.addEventListener('startScheduleGeneration', handleStartScheduleGeneration);
    window.addEventListener('itineraryDaySelected', handleDaySelected);
    
    return () => {
      window.removeEventListener('startScheduleGeneration', handleStartScheduleGeneration);
      window.removeEventListener('itineraryDaySelected', handleDaySelected);
    };
  }, [clearAllMarkers, forceMarkerUpdate]);

  // 이 컴포넌트는 UI를 렌더링하지 않음
  return null;
};

// 메모이제이션을 통한 불필요한 리렌더링 방지, 커스텀 비교 함수 추가
export default React.memo(MapMarkers, (prevProps, nextProps) => {
  // 변경이 있을 때만 리렌더링하도록 비교 로직 구현
  const isSameSelectedDay = prevProps.selectedDay === nextProps.selectedDay;
  const isSameSelectedPlace = prevProps.selectedPlace?.id === nextProps.selectedPlace?.id;
  const isSameHighlightId = prevProps.highlightPlaceId === nextProps.highlightPlaceId;
  
  // 일정 데이터 길이 비교
  const prevItineraryLength = prevProps.itinerary?.length || 0;
  const nextItineraryLength = nextProps.itinerary?.length || 0;
  const isSameItineraryLength = prevItineraryLength === nextItineraryLength;
  
  // places 배열 길이 비교
  const isSamePlacesLength = prevProps.places.length === nextProps.places.length;
  
  // 일정이 변경되었거나 선택된 일자가 변경된 경우 리렌더링 필요
  if (!isSameSelectedDay || !isSameItineraryLength) {
    return false; // 리렌더링 필요
  }
  
  // 모든 조건이 동일하면 리렌더링 방지
  return isSameSelectedPlace && isSameHighlightId && isSamePlacesLength;
});
