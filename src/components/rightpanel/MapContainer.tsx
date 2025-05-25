
import React from 'react';
import Map from './Map';
// import { Place, ItineraryDay } from '@/types/supabase'; // Map이 props를 받지 않으므로 Place, ItineraryDay 불필요

interface MapContainerProps {
  // places: Place[]; // Map 컴포넌트가 직접 데이터를 관리하므로 제거
  // selectedPlace: Place | null; // Map 컴포넌트가 직접 데이터를 관리하므로 제거
  // itinerary: ItineraryDay[] | null; // Map 컴포넌트가 직접 데이터를 관리하므로 제거
  // selectedDay: number | null; // Map 컴포넌트가 직접 데이터를 관리하므로 제거
  // selectedPlaces?: Place[]; // Map 컴포넌트가 직접 데이터를 관리하므로 제거
}

const MapContainer: React.FC<MapContainerProps> = (
  // props 제거
) => {
  return (
    <div className="w-full h-full">
      {/* Map 컴포넌트에 props를 전달하지 않습니다. */}
      <Map />
    </div>
  );
};

export default MapContainer;
