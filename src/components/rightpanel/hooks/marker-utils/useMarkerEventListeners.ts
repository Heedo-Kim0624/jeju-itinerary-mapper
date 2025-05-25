
import { useEffect } from 'react';

interface UseMarkerEventListenersProps {
  clearAllMarkers: () => void;
  forceMarkerUpdate: () => void;
  prevSelectedDayRef: React.MutableRefObject<number | null>;
}

export const useMarkerEventListeners = ({
  clearAllMarkers,
  forceMarkerUpdate,
  prevSelectedDayRef,
}: UseMarkerEventListenersProps) => {
  useEffect(() => {
    console.log("[useMarkerEventListeners] Setting up event listeners");
    
    const handleItineraryDaySelected = (event: CustomEvent) => {
      const { day } = event.detail || {};
      console.log(`[useMarkerEventListeners] itineraryDaySelected event received with day: ${day}`);
      
      if (day !== prevSelectedDayRef.current) {
        console.log(`[useMarkerEventListeners] Selected day changed from ${prevSelectedDayRef.current} to ${day}, forcing update.`);
        forceMarkerUpdate();
      }
    };

    const handleStartScheduleGeneration = () => {
      console.log("[useMarkerEventListeners] startScheduleGeneration event detected - clearing all markers");
      clearAllMarkers();
    };

    // Debug log to confirm event registration
    console.log("[useMarkerEventListeners] Registering events: itineraryDaySelected and startScheduleGeneration");
    
    window.addEventListener('itineraryDaySelected', handleItineraryDaySelected as EventListener);
    window.addEventListener('startScheduleGeneration', handleStartScheduleGeneration);
    
    return () => {
      console.log("[useMarkerEventListeners] Removing event listeners");
      window.removeEventListener('itineraryDaySelected', handleItineraryDaySelected as EventListener);
      window.removeEventListener('startScheduleGeneration', handleStartScheduleGeneration);
    };
  }, [clearAllMarkers, forceMarkerUpdate, prevSelectedDayRef]);
};
