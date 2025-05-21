
import React, { useState, useEffect } from 'react';
import { Place, ItineraryDay } from '@/types'; // @/types에서 가져오도록 변경
import PlaceCart from './PlaceCart';
import ContainedScheduleViewer from './ContainedScheduleViewer'; // Added

interface LeftPanelContainerProps {
  showItinerary: boolean;
  onSetShowItinerary: (show: boolean) => void;
  selectedPlaces: Place[];
  onRemovePlace: (id: string) => void;
  onViewOnMap: (place: Place) => void;
  allCategoriesSelected: boolean;
  children: React.ReactNode;
  dates: {
    startDate: Date | null;
    endDate: Date | null;
    startTime: string;
    endTime: string;
  } | null;
  onCreateItinerary: () => void; // boolean 대신 void로 변경
  itinerary: ItineraryDay[] | null;
  selectedItineraryDay: number | null;
  onSelectDay: (day: number) => void;
  isGenerating?: boolean;
}

const LeftPanelContainer: React.FC<LeftPanelContainerProps> = ({
  showItinerary,
  onSetShowItinerary,
  selectedPlaces,
  onRemovePlace, 
  onViewOnMap,   
  allCategoriesSelected,
  children,
  dates,
  onCreateItinerary,
  itinerary,
  selectedItineraryDay,
  onSelectDay,
  isGenerating = false,
}) => {
  const [localIsGenerating, setLocalIsGenerating] = useState(isGenerating);
  
  useEffect(() => {
    console.log("[LeftPanelContainer] isGenerating prop changed:", isGenerating);
    setLocalIsGenerating(isGenerating);
  }, [isGenerating]);
  
  useEffect(() => {
    const handleForceRerender = () => {
      console.log("[LeftPanelContainer] forceRerender event received, checking and clearing loading state");
      if (localIsGenerating) {
        // setLocalIsGenerating(false); // Let runner manage its state
      }
    };
    
    window.addEventListener('forceRerender', handleForceRerender);
    
    return () => {
      window.removeEventListener('forceRerender', handleForceRerender);
    };
  }, [localIsGenerating]);

  const handleCloseItinerary = () => {
    onSetShowItinerary(false);
  };

  useEffect(() => {
    console.log("[LeftPanelContainer] Itinerary State:", {
      showItinerary,
      itineraryLength: itinerary?.length,
      selectedItineraryDay,
      isGenerating: localIsGenerating
    });
  }, [showItinerary, itinerary, selectedItineraryDay, localIsGenerating]);

  if (showItinerary && itinerary && itinerary.length > 0) {
    console.log("LeftPanelContainer: Rendering ContainedScheduleViewer");
    return (
      <ContainedScheduleViewer
        itinerary={itinerary}
        selectedItineraryDay={selectedItineraryDay}
        onSelectDay={onSelectDay}
        onClose={handleCloseItinerary}
        startDate={dates?.startDate || new Date()}
      />
    );
  }

  return (
    <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-l border-r border-gray-200 z-40 shadow-md flex flex-col">
      <div className="flex-1 overflow-auto">
        {children}
      </div>
      <div className="px-4 py-4 border-t">
        <PlaceCart 
          selectedPlaces={selectedPlaces} 
          onRemovePlace={onRemovePlace}
          onViewOnMap={onViewOnMap}
        />
        
        {localIsGenerating ? (
          <div className="w-full py-3 bg-blue-500 text-white text-center rounded-md flex items-center justify-center cursor-wait" aria-busy="true" aria-live="polite">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            일정 생성 중...
          </div>
        ) : (
          <button
            className={`w-full py-3 ${
              allCategoriesSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } rounded-md font-medium transition-colors`}
            onClick={() => {
              if (allCategoriesSelected && !localIsGenerating) {
                onCreateItinerary();
              }
            }}
            disabled={!allCategoriesSelected || localIsGenerating}
          >
            경로 생성하기
          </button>
        )}
      </div>
    </div>
  );
};

export default LeftPanelContainer;
