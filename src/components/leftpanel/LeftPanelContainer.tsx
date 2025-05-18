import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Place } from '@/types/supabase';
import { ItineraryDay } from '@/hooks/use-itinerary';
import PlaceCart from './PlaceCart';
import ItineraryButton from './ItineraryButton';
import ScheduleViewer from './ScheduleViewer';

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
  onCreateItinerary: () => boolean;
  itinerary: ItineraryDay[] | null;
  selectedItineraryDay: number | null;
  onSelectDay: (day: number) => void;
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
  onSelectDay
}) => {
  // 강제 리렌더링을 위한 상태 추가 (from user's Part 2)
  const [rerenderTrigger, setRerenderTrigger] = useState(0);
  
  // 강제 리렌더링 이벤트 리스너 (from user's Part 2)
  useEffect(() => {
    const handleForceRerender = () => {
      console.log("LeftPanelContainer: 강제 리렌더링 이벤트 수신");
      setRerenderTrigger(prev => prev + 1);
    };
    
    window.addEventListener('forceRerender', handleForceRerender);
    
    return () => {
      window.removeEventListener('forceRerender', handleForceRerender);
    };
  }, []);
  
  // 리렌더링 트리거 변경 시 로그 (from user's Part 2)
  useEffect(() => {
    if (rerenderTrigger > 0) {
      console.log("LeftPanelContainer: 강제 리렌더링 트리거됨:", rerenderTrigger);
    }
  }, [rerenderTrigger]);

  const handleCloseItinerary = () => {
    onSetShowItinerary(false);
    // Potentially clear map elements here if MapContext is accessible or via another callback
  };

  // The main display logic for LeftPanelContainer:
  // If showItinerary is true AND itinerary data exists, it used to show ScheduleViewer.
  // HOWEVER, LeftPanel.tsx now directly renders ItineraryView when showItinerary is true.
  // So, LeftPanelContainer should only render its children (the selection panels)
  // when showItinerary is FALSE.
  // The user's original logic for LeftPanelContainer showed ScheduleViewer if showItinerary was true.
  // Let's stick to the user's original logic for LeftPanelContainer IF ItineraryView in LeftPanel.tsx is not shown.
  // The condition in LeftPanel.tsx is: `uiVisibility.showItinerary && itineraryManagement.itinerary`
  // So, LeftPanelContainer is only rendered if that condition is false.
  // Therefore, the `if (showItinerary && itinerary)` block inside LeftPanelContainer might be redundant
  // if LeftPanel.tsx already handles this.
  // Let's assume LeftPanelContainer is always the "non-itinerary view" part based on LeftPanel.tsx logic.

  // The user's provided `LeftPanel.tsx` structure is:
  // if (showItinerary && itinerary) { <ItineraryView /> } else { <LeftPanelContainer> <LeftPanelContent/> </LeftPanelContainer> }
  // This means LeftPanelContainer will NOT be rendered when showItinerary is true.
  // Thus, the `if (showItinerary && itinerary)` block within `LeftPanelContainer` is effectively dead code.
  // I will remove it for clarity, as `LeftPanelContainer` will only display its children (the regular panels).
  
  // console.log("LeftPanelContainer rendering. showItinerary:", showItinerary, "Itinerary data:", !!itinerary);

  // The original logic in LeftPanelContainer was to show ScheduleViewer IF showItinerary was true.
  // However, LeftPanel.tsx now renders ItineraryView directly under that condition.
  // This LeftPanelContainer is only rendered in the 'else' block of LeftPanel.tsx.
  // So, showItinerary will be false when this component renders, or itinerary will be null.
  // The provided `LeftPanelContainer.tsx` structure seems to be from before `ItineraryView` was handled in `LeftPanel.tsx`.
  // I will keep the structure user provided for `LeftPanelContainer` for now, but note the potential redundancy.

  if (showItinerary && itinerary) {
     // This block is likely not hit due to LeftPanel.tsx's conditional rendering.
     // If it is hit, it means LeftPanel.tsx logic changed or showItinerary can be true
     // when itinerary is null, which would then pass to here.
     // For safety, keeping the original structure.
    console.log("LeftPanelContainer: Rendering ScheduleViewer directly (should ideally be ItineraryView in LeftPanel.tsx)");
    return (
      <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-40 shadow-md">
        <ScheduleViewer
          schedule={itinerary}
          selectedDay={selectedItineraryDay}
          onDaySelect={onSelectDay}
          onClose={handleCloseItinerary} // This onClose is local to LeftPanelContainer
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
        <ItineraryButton 
          allCategoriesSelected={allCategoriesSelected}
          onCreateItinerary={onCreateItinerary} // This is a prop from LeftPanel
        />
      </div>
    </div>
  );
};

export default LeftPanelContainer;
