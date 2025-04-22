
import React from 'react';
import { toast } from 'sonner';
import { Place } from '@/types/supabase';
import PlaceCart from './PlaceCart';
import ItineraryButton from './ItineraryButton';
import LeftPanelContent from './LeftPanelContent';

interface LeftPanelContainerProps {
  showItinerary: boolean;
  onSetShowItinerary: (show: boolean) => void;
  selectedPlaces: Place[];
  onRemovePlace: (id: string) => void;
  onViewOnMap: (place: Place) => void;
  allCategoriesSelected: boolean;
  children: React.ReactNode;
}

const LeftPanelContainer: React.FC<LeftPanelContainerProps> = ({
  showItinerary,
  onSetShowItinerary,
  selectedPlaces,
  onRemovePlace,
  onViewOnMap,
  allCategoriesSelected,
  children
}) => {
  const handleCreateItinerary = () => {
    toast.success("경로 생성 기능이 구현될 예정입니다.");
    onSetShowItinerary(true);
  };

  if (showItinerary) {
    return (
      <div className="absolute inset-0 z-10 bg-white p-4 overflow-y-auto">
        <button
          onClick={() => onSetShowItinerary(false)}
          className="text-sm text-blue-600 hover:underline mb-4"
        >
          ← 뒤로
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-l border-r border-gray-200 z-40 shadow-md flex flex-col">
      {children}
      <div className="px-4 mb-4">
        <PlaceCart 
          selectedPlaces={selectedPlaces} 
          onRemovePlace={onRemovePlace}
          onViewOnMap={onViewOnMap}
        />
        <ItineraryButton 
          allCategoriesSelected={allCategoriesSelected}
          onCreateItinerary={handleCreateItinerary}
        />
      </div>
    </div>
  );
};

export default LeftPanelContainer;
