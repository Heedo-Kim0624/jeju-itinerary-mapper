import React from 'react';
import LeftPanel from '@/components/leftpanel/LeftPanel';
import RightPanel from '@/components/rightpanel/RightPanel';
import type { Place, ItineraryDay } from '@/types/supabase';

const Index: React.FC = () => {
  // TODO: 상태 및 로직 필요 시 여기에 추가

  const places: Place[] = []; // 실제 데이터를 여기에 연결해야 함
  const selectedPlace: Place | null = null;
  const itinerary: ItineraryDay[] | null = null;
  const selectedDay: number | null = null;

  return (
    <div className="flex h-screen overflow-hidden bg-jeju-light-gray">
      <LeftPanel />
      <RightPanel 
        places={places} 
        selectedPlace={selectedPlace} 
        itinerary={itinerary} 
        selectedDay={selectedDay} 
      />
    </div>
  );
};

export default Index;
