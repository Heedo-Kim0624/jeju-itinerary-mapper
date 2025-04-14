
import React, { useState } from 'react';
import LeftPanel from '@/components/leftpanel/LeftPanel';
import RightPanel from '@/components/rightpanel/RightPanel';
import type { Place, ItineraryDay } from '@/types/supabase';

const Index: React.FC = () => {
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region]
    );
  };

  const places: Place[] = []; // 실제 데이터를 여기에 연결해야 함
  const selectedPlace: Place | null = null;
  const itinerary: ItineraryDay[] | null = null;
  const selectedDay: number | null = null;

  return (
    <div className="flex h-screen overflow-hidden bg-jeju-light-gray relative">
      {/* 왼쪽 패널 */}
      <LeftPanel />

      {/* 오른쪽 지도 패널 */}
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
