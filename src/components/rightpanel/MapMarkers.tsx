
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

  // 주요 props 변경 감지 및 마커 업데이트 - 더 엄격한 디펜던시 트래킹
  useEffect(() => {
    console.log(`[MapMarkers] selectedDay changed to: ${selectedDay}`);
    
    // 마커 초기화 및 업데이트
    clearAllMarkers();
    
    // 약간의 지연 후 마커 업데이트 수행 (상태 업데이트 전파 시간 확보)
    const timer = setTimeout(() => {
      console.log('[MapMarkers] Forcing marker update due to selectedDay change');
      forceMarkerUpdate();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [selectedDay, forceMarkerUpdate, clearAllMarkers]);
  
  // 일정 변경 감지 및 마커 업데이트
  useEffect(() => {
    if (itinerary) {
      console.log(`[MapMarkers] itinerary updated: ${itinerary.length} days`);
      
      // 일정 변경 시에도 마커 초기화 및 업데이트
      clearAllMarkers();
      
      const timer = setTimeout(() => {
        console.log('[MapMarkers] Forcing marker update due to itinerary change');
        forceMarkerUpdate();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [itinerary, forceMarkerUpdate, clearAllMarkers]);

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
        
        // 확실한 마커 초기화 및 새로고침
        clearAllMarkers();
        
        setTimeout(() => {
          console.log('[MapMarkers] Forcing marker update due to day selection event');
          forceMarkerUpdate();
        }, 100);
      }
    };
    
    // 시각화 시작 이벤트 처리
    const handleStartVisualization = () => {
      console.log("[MapMarkers] startScheduleVisualization event detected");
      
      // 모든 마커 초기화 후 새로고침
      clearAllMarkers();
      
      setTimeout(() => {
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
      clearAllMarkers();
    };
  }, [clearAllMarkers]);

  return null;
};

export default React.memo(MapMarkers, (prevProps, nextProps) => {
  // 메모이제이션 비교 로직 - 더 엄격하게 재작성
  
  // 기본 항목 비교
  const isSameSelectedDay = prevProps.selectedDay === nextProps.selectedDay;
  const isSameSelectedPlace = prevProps.selectedPlace?.id === nextProps.selectedPlace?.id;
  const isSameHighlightId = prevProps.highlightPlaceId === nextProps.highlightPlaceId;
  
  const prevItineraryLength = prevProps.itinerary?.length || 0;
  const nextItineraryLength = nextProps.itinerary?.length || 0;
  const isSameItineraryLength = prevItineraryLength === nextItineraryLength;
  
  // 선택된 일자의 장소 비교 - 보다 정확한 검사
  let isSameDayContents = true;
  if (isSameSelectedDay && 
      prevProps.selectedDay !== null && 
      nextProps.selectedDay !== null && 
      prevProps.itinerary && 
      nextProps.itinerary) {
    
    const prevDay = prevProps.itinerary.find(d => d.day === prevProps.selectedDay);
    const nextDay = nextProps.itinerary.find(d => d.day === nextProps.selectedDay);
    
    if (prevDay && nextDay) {
      // 장소 길이 비교
      if (prevDay.places.length !== nextDay.places.length) {
        isSameDayContents = false;
      } else {
        // 동일 길이일 경우 모든 장소 ID 비교
        isSameDayContents = prevDay.places.every((place, idx) => 
          place.id === nextDay.places[idx]?.id
        );
      }
    } else if (prevDay || nextDay) {
      // 한쪽만 존재할 경우 다르다고 간주
      isSameDayContents = false;
    }
  }
  
  // 일반 장소 배열 비교
  const isSamePlacesLength = prevProps.places.length === nextProps.places.length;
  let isSamePlacesContents = isSamePlacesLength;
  if (isSamePlacesLength && prevProps.places.length > 0) {
    isSamePlacesContents = prevProps.places.every((place, idx) => 
      place.id === nextProps.places[idx]?.id
    );
  }
  
  // 선택된 장소들 비교
  const prevSelectedCount = prevProps.selectedPlaces?.length || 0;
  const nextSelectedCount = nextProps.selectedPlaces?.length || 0;
  const isSameSelectedCount = prevSelectedCount === nextSelectedCount;
  
  // 컴포넌트 리렌더링 결정
  const shouldUpdate = 
    !isSameSelectedDay || 
    !isSameItineraryLength || 
    !isSameDayContents ||
    !isSamePlacesContents ||
    !isSameSelectedCount;
  
  if (shouldUpdate) {
    console.log("[MapMarkers] Memo comparison detected change - will re-render", {
      isSameSelectedDay,
      isSameItineraryLength,
      isSameDayContents,
      isSamePlacesContents,
      prevSelectedDay: prevProps.selectedDay,
      nextSelectedDay: nextProps.selectedDay,
    });
  }
  
  // 변경이 감지되지 않으면 리렌더링 방지 (true 반환)
  return !shouldUpdate;
});
