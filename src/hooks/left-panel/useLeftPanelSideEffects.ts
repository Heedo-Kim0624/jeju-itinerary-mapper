
import { useEffect, useState } from 'react';
import { ItineraryDay } from '@/hooks/use-itinerary'; // Assuming this is the correct ItineraryDay type from use-itinerary.tsx

interface UseLeftPanelSideEffectsProps {
  itinerary: ItineraryDay[] | null;
  selectedItineraryDay: number | null;
  showItinerary: boolean;
  setItinerary: (itinerary: ItineraryDay[]) => void;
  setSelectedItineraryDay: (day: number | null) => void;
  setShowItinerary: (show: boolean) => void;
}

export const useLeftPanelSideEffects = ({
  itinerary,
  selectedItineraryDay,
  showItinerary,
  setItinerary,
  setSelectedItineraryDay,
  setShowItinerary,
}: UseLeftPanelSideEffectsProps) => {
  // Listener for 'itineraryCreated' event
  useEffect(() => {
    const handleItineraryCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ itinerary: ItineraryDay[]; selectedDay: number | null }>;
      console.log("[useLeftPanelSideEffects] 'itineraryCreated' event received:", customEvent.detail);

      if (customEvent.detail.itinerary) {
        setItinerary(customEvent.detail.itinerary);
        // Ensure itinerary panel is shown when itinerary is created/updated
        setShowItinerary(true); 
        console.log("[useLeftPanelSideEffects] Setting showItinerary to true after receiving itinerary via event");
      }

      if (customEvent.detail.selectedDay !== null) {
        setSelectedItineraryDay(customEvent.detail.selectedDay);
      } else if (customEvent.detail.itinerary && customEvent.detail.itinerary.length > 0) {
        setSelectedItineraryDay(customEvent.detail.itinerary[0].day);
      } else {
        setSelectedItineraryDay(null);
      }
      
      // Dispatch a forceRerender event slightly after to ensure UI updates if necessary
      // This was in the original use-left-panel's event handler.
      setTimeout(() => {
        console.log("[useLeftPanelSideEffects] Forcing UI update after state changes from itineraryCreated event");
        window.dispatchEvent(new Event('forceRerender'));
      }, 0);
    };

    window.addEventListener('itineraryCreated', handleItineraryCreated);
    return () => window.removeEventListener('itineraryCreated', handleItineraryCreated);
  }, [setItinerary, setSelectedItineraryDay, setShowItinerary]);

  // Effect to auto-show itinerary panel or select day based on state changes
  useEffect(() => {
    if (itinerary && itinerary.length > 0 && !showItinerary) {
      console.log("useLeftPanelSideEffects: Itinerary exists but panel not shown. Auto-activating itinerary panel.");
      setShowItinerary(true);
    }
    if (itinerary && itinerary.length > 0 && selectedItineraryDay === null) {
      console.log("useLeftPanelSideEffects: Itinerary exists but no day selected. Auto-selecting first itinerary day.");
      if (itinerary[0] && typeof itinerary[0].day === 'number') {
        setSelectedItineraryDay(itinerary[0].day);
      }
    }
  }, [itinerary, showItinerary, selectedItineraryDay, setShowItinerary, setSelectedItineraryDay]);

  // Listener for 'forceRerender' to allow other parts of the app to trigger updates in this context
  const [, setForceUpdate] = useState(0);
  useEffect(() => {
    const forceRerenderListener = () => {
      console.log("[useLeftPanelSideEffects] 'forceRerender' event caught, updating dummy state for potential re-render.");
      setForceUpdate(prev => prev + 1);
    };
    window.addEventListener('forceRerender', forceRerenderListener);
    return () => window.removeEventListener('forceRerender', forceRerenderListener);
  }, []);
};
