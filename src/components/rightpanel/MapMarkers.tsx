
import React from 'react';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';

interface MapMarkersProps {
  places: Place[]; 
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  selectedPlaces?: Place[];
  onPlaceClick?: (place: Place | ItineraryPlaceWithTime, index: number) => void;
  highlightPlaceId?: string;
}

const MapMarkers: React.FC<MapMarkersProps> = () => {
  // 마커 렌더링을 완전히 비활성화
  console.log('[MapMarkers] 마커 렌더링이 비활성화되었습니다.');
  return null; 
};

export default React.memo(MapMarkers);
