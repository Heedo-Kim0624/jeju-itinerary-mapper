
import React, { useState, useEffect } from 'react';
import LeftPanel from '@/components/leftpanel/LeftPanel';
import RightPanel from '@/components/rightpanel/RightPanel';
import RegionSlidePanel from '@/components/middlepanel/RegionSlidePanel';
import { useItinerary } from '@/hooks/use-itinerary';
import { useSelectedPlaces } from '@/hooks/use-selected-places';
import { ItineraryMapProvider } from '@/contexts/ItineraryMapContext';
import { useItineraryMapContext } from '@/hooks/useItineraryMapContext';

const Index: React.FC = () => {
  const [showRegionPanel, setShowRegionPanel] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region]
    );
  };

  const { selectedPlaces } = useSelectedPlaces();
  
  const {
    itinerary,
    selectedItineraryDay,
  } = useItinerary();

  return (
    <ItineraryMapProvider>
      <ItineraryMapInitializer 
        itinerary={itinerary} 
        selectedDay={selectedItineraryDay}
      />
      
      <div className="flex h-screen overflow-hidden bg-jeju-light-gray relative">
        {/* 모바일: 세로 분할, 데스크톱: 가로 분할 */}
        <div className="flex flex-col md:flex-row w-full h-full">
          {/* 왼쪽 패널 */}
          <div className="h-[60vh] md:h-full md:w-[300px] flex-shrink-0">
            <LeftPanel />
          </div>

          {/* 오른쪽 지도 패널 */}
          <div className="flex-1 h-[40vh] md:h-full">
            <RightPanel
              places={selectedPlaces}
              selectedPlace={null}
            />
          </div>
        </div>

        {/* 지역 슬라이드 패널 */}
        <RegionSlidePanel
          open={showRegionPanel}
          onClose={() => setShowRegionPanel(false)}
          selectedRegions={selectedRegions}
          onToggle={toggleRegion}
          onConfirm={() => setShowRegionPanel(false)}
        />
      </div>
    </ItineraryMapProvider>
  );
};

// ItineraryMapProvider 초기화 컴포넌트
const ItineraryMapInitializer: React.FC<{
  itinerary: any;
  selectedDay: number | null;
}> = ({ itinerary, selectedDay }) => {
  const { setItinerary, selectDay } = useItineraryMapContext();
  
  useEffect(() => {
    if (itinerary) {
      setItinerary(itinerary);
      console.log('[ItineraryMapInitializer] itinerary 설정됨:', itinerary.length);
      
      if (selectedDay !== null) {
        selectDay(selectedDay);
        console.log('[ItineraryMapInitializer] selectedDay 설정됨:', selectedDay);
      }
    }
  }, [itinerary, selectedDay, setItinerary, selectDay]);
  
  return null;
};

export default Index;
