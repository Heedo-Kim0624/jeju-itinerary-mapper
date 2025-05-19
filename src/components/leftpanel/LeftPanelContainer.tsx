
import React, { useState, useEffect } from 'react';
import { Place, ItineraryDay } from '@/types'; // Using ItineraryDay from @/types
import PlaceCart from './PlaceCart';
// ScheduleViewer is rendered by ItineraryView, or directly if LeftPanelContainer is showing itinerary.
// If ItineraryView is always used inside LeftPanel when itinerary is shown, then ScheduleViewer might not be directly used here.
// However, your request implies LeftPanelContainer might still render ScheduleViewer directly.
import ScheduleViewer from './ScheduleViewer'; 
import ItineraryView from './ItineraryView'; // Added import for ItineraryView

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
  onCreateItinerary: () => Promise<boolean> | boolean; // Can be async or sync
  itinerary: ItineraryDay[] | null;
  selectedItineraryDay: number | null;
  onSelectDay: (day: number) => void;
  isGenerating?: boolean; // This prop indicates if the itinerary generation process is ongoing
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
  isGenerating = false, // Default to false
}) => {
  // This localIsGenerating state seems to be primarily for the button's visual state.
  // The actual generation process might be managed higher up or in a dedicated hook.
  // The `isGenerating` prop passed in should be the source of truth for the loading state.
  const [localButtonLoading, setLocalButtonLoading] = useState(false);

  useEffect(() => {
    // Sync local button loading state with the isGenerating prop
    // This ensures the button reflects the actual generation status.
    console.log("[LeftPanelContainer] isGenerating prop changed:", isGenerating);
    setLocalButtonLoading(isGenerating);
  }, [isGenerating]);
  
  const handleCloseItinerary = () => {
    onSetShowItinerary(false);
    // Additional cleanup like clearing map routes might be handled by useLeftPanel's handleCloseItinerary
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
  }, [showItinerary, itinerary, selectedItineraryDay, isGenerating, localButtonLoading]);

  // Condition for showing the ItineraryView (or ScheduleViewer directly, though ItineraryView is preferred as it contains more structure)
  // We should show the itinerary if `showItinerary` is true, data exists, and we are NOT currently in a generation phase.
  const shouldRenderItineraryView = showItinerary && itinerary && itinerary.length > 0 && !isGenerating;

  if (shouldRenderItineraryView) {
    console.log("LeftPanelContainer: Rendering ItineraryView (or ScheduleViewer as per original).");
    // Prefer ItineraryView if it's meant to be the main display component for generated schedules.
    // The user's original LeftPanel.tsx uses ItineraryView.
    // If this LeftPanelContainer is shown *instead* of the ItineraryView in LeftPanel,
    // then it should render a similar view.
    return (
      <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-40 shadow-md">
        {/* Using ItineraryView for consistency with LeftPanel.tsx */}
        <ItineraryView
          itinerary={itinerary}
          selectedDay={selectedItineraryDay}
          onDaySelect={onSelectDay}
          onClose={handleCloseItinerary}
          startDate={dates?.startDate || new Date()}
        />
        {/* Or, if ScheduleViewer is intended here as a simpler display:
        <ScheduleViewer
          schedule={itinerary}
          selectedDay={selectedItineraryDay}
          onDaySelect={onSelectDay}
          onClose={handleCloseItinerary}
          startDate={dates?.startDate || new Date()}
        />
        */}
      </div>
    );
  }

  // Default view: category selection, place cart, and generate button
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
        
        {localButtonLoading ? ( // Use localButtonLoading for the button's own visual feedback
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
            onClick={async () => { // Make onClick async
              if (allCategoriesSelected && !localButtonLoading) { 
                setLocalButtonLoading(true); // Set button loading immediately
                try {
                  await onCreateItinerary(); // Await the creation process
                  // The actual setting of isGenerating to false should be handled by the 
                  // useScheduleGenerationRunner's finally block or itineraryCreated event.
                  // This localButtonLoading is more for immediate feedback.
                } catch (error) {
                  console.error("Error during onCreateItinerary from button click:", error);
                  // Potentially setLocalButtonLoading(false) here if error is not handled by global state
                }
                // setLocalButtonLoading(false); // This might be set too early if onCreateItinerary is async and global state handles the end.
                                              // Rely on the `isGenerating` prop to turn this off.
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

