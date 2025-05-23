
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
  const { forceMarkerUpdate } = useMapMarkers({
    places,
    selectedPlace,
    itinerary,
    selectedDay,
    selectedPlaces,
    onPlaceClick,
    highlightPlaceId,
  });

  // 초기 마운트시에만 마커 업데이트 강제 (한 번만 실행)
  useEffect(() => {
    // 첫 렌더링 후 한 번만 실행
    const timer = setTimeout(() => {
      forceMarkerUpdate();
    }, 300);
    
    return () => clearTimeout(timer);
  }, []); // 빈 의존성 배열로 컴포넌트 마운트 시에만 실행

  // 이 컴포넌트는 UI를 렌더링하지 않음
  return null;
};

export default React.memo(MapMarkers); // React.memo로 감싸서 불필요한 리렌더링 방지
