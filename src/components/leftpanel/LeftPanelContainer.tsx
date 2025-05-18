
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Place } from '@/types/supabase';
import { ItineraryDay } from '@/types/supabase'; // UPDATED IMPORT
import PlaceCart from './PlaceCart';
import ItineraryButton from './ItineraryButton';
// ScheduleViewer import removed as LeftPanel.tsx handles ItineraryView directly

interface LeftPanelContainerProps {
  showItinerary: boolean; // This prop will likely be false when this container is rendered by LeftPanel
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
  onCreateItinerary: () => boolean; // Changed from () => void to () => boolean based on LeftPanel's usage
  itinerary: ItineraryDay[] | null; // Prop for itinerary data
  selectedItineraryDay: number | null;
  onSelectDay: (day: number) => void;
  // Props needed for new debug UI (if passed from LeftPanel)
  // For simplicity, debug UI will use props already available or make assumptions
}

const LeftPanelContainer: React.FC<LeftPanelContainerProps> = ({
  showItinerary,
  // onSetShowItinerary, // Not directly used by this component's render if ScheduleViewer block is removed
  selectedPlaces,
  onRemovePlace,
  onViewOnMap,
  allCategoriesSelected,
  children,
  // dates, // Not directly used by this component's render if ScheduleViewer block is removed
  onCreateItinerary,
  itinerary, // Used in debug UI
  // selectedItineraryDay, // Not directly used by this component's render
  // onSelectDay, // Not directly used by this component's render
}) => {
  const [rerenderTrigger, setRerenderTrigger] = useState(0);
  
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
  
  useEffect(() => {
    if (rerenderTrigger > 0) {
      console.log("LeftPanelContainer: 강제 리렌더링 트리거됨:", rerenderTrigger);
    }
  }, [rerenderTrigger]);

  // Debug UI state
  const [uiState, setUiState] = useState({
    lastUpdate: Date.now(),
    // isGeneratingSchedule: false, // This state is in LeftPanel, not directly here
    showItineraryProp: showItinerary, // Value of the showItinerary prop
    hasItineraryProp: !!itinerary && itinerary.length > 0, // Based on itinerary prop
  });

  useEffect(() => {
    const newUiState = {
      lastUpdate: Date.now(),
      showItineraryProp: showItinerary,
      hasItineraryProp: !!itinerary && itinerary.length > 0,
    };
    setUiState(newUiState);
    
    console.log("LeftPanelContainer - Props & UI 상태:", {
      showItineraryProp: showItinerary, // Log the prop value
      itineraryPropLength: itinerary?.length || 0, // Log based on prop
    });

    // This warning is helpful if LeftPanelContainer expects showItinerary to be true but it isn't
    if (itinerary && itinerary.length > 0 && !showItinerary) {
      console.warn("LeftPanelContainer: Itinerary data exists (prop), but showItinerary prop is false.");
    }
  }, [showItinerary, itinerary]);


  // The `if (showItinerary && itinerary)` block that rendered ScheduleViewer here is removed.
  // LeftPanel.tsx conditionally renders EITHER ItineraryView (if showItinerary is true) 
  // OR LeftPanelContainer (if showItinerary is false).
  // So, when LeftPanelContainer is rendered, showItinerary prop should be false.

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
          onCreateItinerary={onCreateItinerary}
        />
      </div>
      
      {/* 디버깅 정보 (개발 환경에서만 표시) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-0 left-0 w-full bg-gray-800 bg-opacity-80 text-white p-1 text-xs z-50">
          <div>LPC Props: showItin: {uiState.showItineraryProp ? '✅' : '❌'} | hasItin: {uiState.hasItineraryProp ? '✅' : '❌'}</div>
          <div>LPC Updated: {new Date(uiState.lastUpdate).toLocaleTimeString()}</div>
        </div>
      )}
    </div>
  );
};

export default LeftPanelContainer;
