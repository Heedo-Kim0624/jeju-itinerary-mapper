
import React from 'react';
import MapContainer from './MapContainer';
import { useMapResize } from '@/hooks/useMapResize';
import { useMapContext } from './MapContext'; 
import type { Place, ItineraryDay } from '@/types/core';

interface RightPanelProps {
  places: Place[]; // 이 props들은 RightPanel 레벨에서는 필요할 수 있으나, MapContainer로 넘기지 않음
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
}

const RightPanel: React.FC<RightPanelProps> = ({
  places,
  selectedPlace,
  itinerary,
  selectedDay,
}) => {
  const { map } = useMapContext(); 
  
  useMapResize(map); 

  console.log("[RightPanel] Rendering with props:", {
    placesCount: places?.length,
    selectedPlaceId: selectedPlace?.id,
    itineraryDays: itinerary?.length,
    selectedDay,
  });

  return (
    <div className="flex-1 h-full relative">
      {/* MapContainer에는 더 이상 props를 전달하지 않습니다. */}
      <MapContainer />
    </div>
  );
};

export default RightPanel;
