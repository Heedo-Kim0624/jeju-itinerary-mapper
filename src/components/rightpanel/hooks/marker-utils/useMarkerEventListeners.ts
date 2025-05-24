
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
    const handleItineraryDaySelected = (event: CustomEvent) => {
      const { day } = event.detail || {};
      console.log(`[useMarkerEventListeners] itineraryDaySelected event received with day: ${day}`);
      
      if (day !== prevSelectedDayRef.current) {
        console.log(`[useMarkerEventListeners] Selected day changed from ${prevSelectedDayRef.current} to ${day}, forcing update.`);
        // Note: prevSelectedDayRef is updated by useMarkerLifecycleManager or the main hook
        forceMarkerUpdate();
      }
    };

    const handleStartScheduleGeneration = () => {
      console.log("[useMarkerEventListeners] startScheduleGeneration event detected - clearing all markers");
      clearAllMarkers();
    };

    window.addEventListener('itineraryDaySelected', handleItineraryDaySelected as EventListener);
    window.addEventListener('startScheduleGeneration', handleStartScheduleGeneration);
    
    return () => {
      window.removeEventListener('itineraryDaySelected', handleItineraryDaySelected as EventListener);
      window.removeEventListener('startScheduleGeneration', handleStartScheduleGeneration);
    };
  }, [clearAllMarkers, forceMarkerUpdate, prevSelectedDayRef]);
};
