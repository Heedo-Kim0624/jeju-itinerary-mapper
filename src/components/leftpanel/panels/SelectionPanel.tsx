
import React from 'react';
import LeftPanelContainer from '../LeftPanelContainer';
import { Place } from '@/types/supabase';
import { ItineraryDay } from '@/hooks/use-itinerary';

interface SelectionPanelProps {
  children: React.ReactNode;
  showItinerary: boolean;
  setShowItinerary: (show: boolean) => void;
  selectedPlaces: Place[];
  handleRemovePlace: (id: string) => void;
  handleViewOnMap: (place: Place) => void;
  allCategoriesSelected: boolean;
  dates: {
    startDate: Date | null;
    endDate: Date | null;
    startTime: string;
    endTime: string;
  };
  handleCreateItinerary: () => Promise<boolean>;
  itinerary: ItineraryDay[] | null;
  selectedItineraryDay: number | null;
  handleSelectItineraryDay: (day: number) => void;
}

const SelectionPanel: React.FC<SelectionPanelProps> = ({ 
  children,
  showItinerary,
  setShowItinerary,
  selectedPlaces,
  handleRemovePlace,
  handleViewOnMap,
  allCategoriesSelected,
  dates,
  handleCreateItinerary,
  itinerary,
  selectedItineraryDay,
  handleSelectItineraryDay
}) => {
  if (showItinerary) return null;

  return (
    <LeftPanelContainer
      showItinerary={showItinerary}
      onSetShowItinerary={setShowItinerary}
      selectedPlaces={selectedPlaces}
      onRemovePlace={handleRemovePlace}
      onViewOnMap={handleViewOnMap}
      allCategoriesSelected={allCategoriesSelected}
      dates={dates}
      onCreateItinerary={() => {
        console.log("[SelectionPanel] 일정 생성 버튼 클릭");
        handleCreateItinerary().then((success) => {
          console.log(`[SelectionPanel] 일정 생성 시도 ${success ? '성공' : '실패'} 후 UI 업데이트 로직 실행됨`);
        });
        return true;
      }}
      itinerary={itinerary}
      selectedItineraryDay={selectedItineraryDay}
      onSelectDay={handleSelectItineraryDay}
    >
      {children}
    </LeftPanelContainer>
  );
};

export default SelectionPanel;
