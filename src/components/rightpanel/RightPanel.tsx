
import React from 'react';
import MapContainer from './MapContainer';
import { useMapResize } from '@/hooks/useMapResize';
import { useMapContext } from './MapContext'; // useMapContext 추가
import type { Place, ItineraryDay } from '@/types/core';

interface RightPanelProps {
  places: Place[];
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
  const { map } = useMapContext(); // map 객체를 컨텍스트에서 가져옵니다.
  
  useMapResize(map); // 컨텍스트의 map 객체를 사용하여 리사이즈 훅 호출

  // 직접적인 지도 조작 로직 (initializeMap, addMarkers, clearMarkers 등) 제거
  // 해당 로직은 Map.tsx, MapMarkers.tsx 등 하위 컴포넌트에서 props와 context를 통해 처리

  console.log("[RightPanel] Rendering with props:", {
    placesCount: places?.length,
    selectedPlaceId: selectedPlace?.id,
    itineraryDays: itinerary?.length,
    selectedDay,
  });

  return (
    <div className="flex-1 h-full relative">
      {/* MapContainer에 필요한 props만 전달하고 mapId prop 제거 */}
      <MapContainer
        places={places}
        selectedPlace={selectedPlace}
        itinerary={itinerary}
        selectedDay={selectedDay}
      />
    </div>
  );
};

export default RightPanel;
