
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
  
  const { forceMarkerUpdate } = useMapMarkers({
    places,
    selectedPlace,
    itinerary,
    selectedDay,
    selectedPlaces,
    onPlaceClick,
    highlightPlaceId,
  });

  // 초기 마운트시 마커 업데이트 (한 번만 실행)
  useEffect(() => {
    const timer = setTimeout(() => {
      forceMarkerUpdate();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [forceMarkerUpdate]);

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
  
  // 모든 조건이 동일하면 리렌더링 방지
  return isSameSelectedDay && isSameSelectedPlace && isSameHighlightId && 
         isSameItineraryLength && isSamePlacesLength;
});
