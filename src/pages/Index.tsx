
import React, { useState } from 'react';
import LeftPanel from '@/components/leftpanel/LeftPanel';
import RightPanel from '@/components/rightpanel/RightPanel';
// RegionSlidePanel 사용되지 않으면 제거 가능
// import RegionSlidePanel from '@/components/middlepanel/RegionSlidePanel';
import { useItinerary } from '@/hooks/use-itinerary';
import { useSelectedPlaces } from '@/hooks/use-selected-places';
import { useLeftPanel } from '@/hooks/use-left-panel'; // 추가

const Index: React.FC = () => {
  // LeftPanel 관련 상태는 useLeftPanel 훅 또는 LeftPanel 내부에서 관리
  // const [showRegionPanel, setShowRegionPanel] = useState(false);
  // const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  // const toggleRegion = (region: string) => {
  //   setSelectedRegions((prev) =>
  //     prev.includes(region)
  //       ? prev.filter((r) => r !== region)
  //       : [...prev, region]
  //   );
  // };

  // useLeftPanel 훅에서 필요한 상태와 함수들을 가져올 수 있습니다.
  // 예시: const { placesManagement, itineraryManagement } = useLeftPanel();
  // 이 상태들을 RightPanel에 전달합니다.
  const { placesManagement, itineraryManagement, tripDetails } = useLeftPanel();


  // selectedCategoriesCount 상태 추가하여 디버그
  console.log('모든 카테고리 선택 여부:', placesManagement.allCategoriesSelected);

  return (
    <div className="flex h-screen overflow-hidden bg-jeju-light-gray relative">
      {/* 왼쪽 패널 */}
      <LeftPanel onClose={() => console.log("LeftPanel closed")} /> {/* onClose prop 추가 */}

      {/* 오른쪽 지도 패널 */}
      <RightPanel
        places={placesManagement.selectedPlaces} // useLeftPanel에서 가져온 selectedPlaces
        selectedPlace={null} // 필요에 따라 상태 관리
        itinerary={itineraryManagement.itinerary} // useLeftPanel에서 가져온 itinerary
        selectedDay={itineraryManagement.selectedItineraryDay} // useLeftPanel에서 가져온 selectedItineraryDay
        selectedPlaces={placesManagement.selectedPlaces} // 추가
      />

      {/* RegionSlidePanel은 현재 LeftPanel의 RegionPanelHandler로 대체된 것으로 보임 */}
      {/* <RegionSlidePanel
        open={showRegionPanel}
        onClose={() => setShowRegionPanel(false)}
        selectedRegions={selectedRegions}
        onToggle={toggleRegion}
        onConfirm={() => setShowRegionPanel(false)}
      /> */}
    </div>
  );
};

export default Index;
