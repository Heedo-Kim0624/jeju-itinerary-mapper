
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
  // 컴포넌트 렌더링 로그
  console.log(`[MapMarkers] Component rendered with selectedDay: ${selectedDay}, itinerary: ${itinerary?.length || 0} days`);
  
  const { forceMarkerUpdate, clearAllMarkers } = useMapMarkers({
    places,
    selectedPlace,
    itinerary,
    selectedDay,
    selectedPlaces,
    onPlaceClick,
    highlightPlaceId,
  });

  // 주요 props 변경 감지 및 마커 업데이트
  useEffect(() => {
    console.log(`[MapMarkers] selectedDay changed to: ${selectedDay}`);
    console.log(`[MapMarkers] itinerary: ${itinerary ? `${itinerary.length} days` : 'null'}`);
    
    if (selectedDay !== null && itinerary) {
      const dayData = itinerary.find(day => day.day === selectedDay);
      if (dayData) {
        console.log(`[MapMarkers] Selected day ${selectedDay} has ${dayData.places?.length || 0} places`);
        // 기존 마커 명시적 제거 후 새로고침
        clearAllMarkers();
      }
    }
    
    // 약간의 지연 후 마커 업데이트 수행 (상태 업데이트 전파 시간 확보)
    const timer = setTimeout(() => {
      console.log('[MapMarkers] Forcing marker update due to selectedDay/itinerary change');
      forceMarkerUpdate();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [selectedDay, itinerary, forceMarkerUpdate, clearAllMarkers]);

  // 일정 생성 이벤트 핸들러
  useEffect(() => {
    const handleStartScheduleGeneration = () => {
      console.log("[MapMarkers] startScheduleGeneration event detected - clearing all markers");
      clearAllMarkers();
    };
    
    // 일차 선택 이벤트 핸들러
    const handleDaySelected = (event: any) => {
      if (event.detail && typeof event.detail.day === 'number') {
        console.log(`[MapMarkers] itineraryDaySelected event detected - day: ${event.detail.day}`);
        setTimeout(() => {
          console.log('[MapMarkers] Forcing marker update due to day selection event');
          // 확실한 마커 초기화 및 새로고침
          clearAllMarkers();
          forceMarkerUpdate();
        }, 100);
      }
    };
    
    // 시각화 시작 이벤트 처리
    const handleStartVisualization = () => {
      console.log("[MapMarkers] startScheduleVisualization event detected");
      setTimeout(() => {
        clearAllMarkers();
        forceMarkerUpdate();
      }, 50);
    };
    
    console.log("[MapMarkers] Registering direct event handlers");
    window.addEventListener('startScheduleGeneration', handleStartScheduleGeneration);
    window.addEventListener('itineraryDaySelected', handleDaySelected);
    window.addEventListener('startScheduleVisualization', handleStartVisualization);
    
    return () => {
      console.log("[MapMarkers] Removing direct event handlers");
      window.removeEventListener('startScheduleGeneration', handleStartScheduleGeneration);
      window.removeEventListener('itineraryDaySelected', handleDaySelected);
      window.removeEventListener('startScheduleVisualization', handleStartVisualization);
    };
  }, [clearAllMarkers, forceMarkerUpdate]);

  useEffect(() => {
    return () => {
      console.log("[MapMarkers] Component unmounting - cleaning up");
    };
  }, []);

  return null;
};

export default React.memo(MapMarkers, (prevProps, nextProps) => {
  // 메모이제이션 비교 로직 향상
  const isSameSelectedDay = prevProps.selectedDay === nextProps.selectedDay;
  const isSameSelectedPlace = prevProps.selectedPlace?.id === nextProps.selectedPlace?.id;
  const isSameHighlightId = prevProps.highlightPlaceId === nextProps.highlightPlaceId;
  
  const prevItineraryLength = prevProps.itinerary?.length || 0;
  const nextItineraryLength = nextProps.itinerary?.length || 0;
  const isSameItineraryLength = prevItineraryLength === nextItineraryLength;
  
  // 일정 및 일차가 동일해도 내부 내용이 변경되었을 수 있으므로 더 세밀하게 검사
  let isSameDayContents = true;
  if (isSameSelectedDay && 
      prevProps.selectedDay !== null && 
      nextProps.selectedDay !== null && 
      prevProps.itinerary && 
      nextProps.itinerary) {
    
    const prevDay = prevProps.itinerary.find(d => d.day === prevProps.selectedDay);
    const nextDay = nextProps.itinerary.find(d => d.day === nextProps.selectedDay);
    
    if (prevDay && nextDay) {
      isSameDayContents = prevDay.places.length === nextDay.places.length &&
                        prevDay.places.every((place, idx) => place.id === nextDay.places[idx]?.id);
    }
  }
  
  const isSamePlacesLength = prevProps.places.length === nextProps.places.length;
  
  // 컴포넌트 리렌더링이 필요한지 결정
  const shouldUpdate = !isSameSelectedDay || !isSameItineraryLength || !isSameDayContents;
  
  if (shouldUpdate) {
    console.log("[MapMarkers] Memo comparison detected change - will re-render", {
      isSameSelectedDay,
      isSameItineraryLength,
      isSameDayContents,
      prevSelectedDay: prevProps.selectedDay,
      nextSelectedDay: nextProps.selectedDay,
    });
  }
  
  return isSameSelectedPlace && isSameHighlightId && isSamePlacesLength && 
         isSameSelectedDay && isSameItineraryLength && isSameDayContents;
});
