import React, { useState, useEffect } from 'react';
import LeftPanel from '@/components/leftpanel/LeftPanel';
import RightPanel from '@/components/rightpanel/RightPanel';
import RegionSlidePanel from '@/components/middlepanel/RegionSlidePanel';
import { useItinerary } from '@/hooks/use-itinerary';
import { useSelectedPlaces } from '@/hooks/use-selected-places';
import { ItineraryMapProvider } from '@/contexts/ItineraryMapContext';

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

  const { selectedPlaces, allCategoriesSelected } = useSelectedPlaces();
  
  const {
    itinerary,
    selectedItineraryDay,
    showItinerary,
    setShowItinerary,
    generateItinerary
  } = useItinerary();

  // ItineraryMapProvider에 itinerary와 selectedDay 동기화
  const [contextInitialized, setContextInitialized] = useState(false);

  return (
    <ItineraryMapProvider>
      <ItineraryMapInitializer 
        itinerary={itinerary} 
        selectedDay={selectedItineraryDay}
        onInitialized={() => setContextInitialized(true)}
      />
      
      <div className="flex h-screen overflow-hidden bg-jeju-light-gray relative">
        {/* 왼쪽 패널 */}
        <LeftPanel />

        {/* 오른쪽 지도 패널 */}
        <RightPanel
          places={selectedPlaces}
          selectedPlace={null}
        />

        {/* 오른쪽에 붙는 지역 슬라이드 패널 */}
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
  onInitialized: () => void;
}> = ({ itinerary, selectedDay, onInitialized }) => {
  const { setItinerary, selectDay } = useItineraryMapContext();
  
  useEffect(() => {
    if (itinerary) {
      setItinerary(itinerary);
      console.log('[ItineraryMapInitializer] itinerary 설정됨:', itinerary.length);
      
      if (selectedDay !== null) {
        selectDay(selectedDay);
        console.log('[ItineraryMapInitializer] selectedDay 설정됨:', selectedDay);
      }
      
      onInitialized();
    }
  }, [itinerary, selectedDay, setItinerary, selectDay, onInitialized]);
  
  return null; // 실제 DOM 요소는 렌더링하지 않음
};

export default Index;
