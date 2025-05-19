import React, { useState, useEffect } from 'react';
import { Place, ItineraryDay } from '@/types'; 
import PlaceCart from './PlaceCart';
import ScheduleViewer from './ScheduleViewer'; 
// import ItineraryView from './ItineraryView'; // No longer directly used here if ScheduleViewer is primary

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
  onCreateItinerary: () => Promise<boolean> | boolean; 
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
  const [localButtonLoading, setLocalButtonLoading] = useState(false);

  useEffect(() => {
    console.log("[LeftPanelContainer] isGenerating prop changed:", isGenerating);
    setLocalButtonLoading(isGenerating);
  }, [isGenerating]);
  
  const handleCloseItinerary = () => {
    onSetShowItinerary(false);
  };

  useEffect(() => {
    console.log("[LeftPanelContainer] Itinerary State & Visibility:", {
      props_showItinerary: showItinerary,
      props_itineraryLength: itinerary?.length,
      props_selectedItineraryDay: selectedItineraryDay,
      props_isGenerating: isGenerating,
      localButtonLoading: localButtonLoading,
      render_condition_met: showItinerary && itinerary && itinerary.length > 0 && !isGenerating
    });
     // 중요: 일정이 있고 showItinerary가 true이면 강제로 패널 표시 (디버깅용)
    if (itinerary && itinerary.length > 0 && showItinerary) {
      console.log("LeftPanelContainer - 일정 패널 표시 조건 충족 (useEffect)");
    }
  }, [showItinerary, itinerary, selectedItineraryDay, isGenerating, localButtonLoading]);

  const shouldRenderItineraryView = showItinerary && itinerary && itinerary.length > 0 && !isGenerating;

  if (shouldRenderItineraryView) {
    console.log("LeftPanelContainer: Rendering ScheduleViewer.");
    return (
      <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-40 shadow-md">
        <ScheduleViewer
          schedule={itinerary} // Prop name for ScheduleViewer
          selectedDay={selectedItineraryDay}
          onDaySelect={onSelectDay}
          onClose={handleCloseItinerary}
          startDate={dates?.startDate || new Date()}
        />
      </div>
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
        
        {localButtonLoading ? ( 
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
            onClick={async () => { 
              if (allCategoriesSelected && !localButtonLoading) { 
                setLocalButtonLoading(true); 
                try {
                  await onCreateItinerary(); 
                } catch (error) {
                  console.error("Error during onCreateItinerary from button click:", error);
                }
              }
            }}
            disabled={!allCategoriesSelected || localButtonLoading}
          >
            경로 생성하기
          </button>
        )}
      </div>
    </div>
  );
};

export default LeftPanelContainer;
