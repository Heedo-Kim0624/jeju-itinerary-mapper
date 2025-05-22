
import { useCallback } from 'react';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { toast } from 'sonner';
import type { ItineraryDay } from '@/types';

interface UseItineraryCreationTriggerProps {
  createItineraryFunction: () => Promise<ItineraryDay[] | null>;
  isCurrentlyGenerating: boolean;
}

export const useItineraryCreationTrigger = ({
  createItineraryFunction,
  isCurrentlyGenerating,
}: UseItineraryCreationTriggerProps) => {
  const { clearAllRoutes, clearMarkersAndUiElements } = useMapContext();

  const handleTriggerCreateItinerary = useCallback(async () => {
    if (isCurrentlyGenerating) {
      toast.info("일정 생성 중입니다. 잠시만 기다려주세요.");
      return null;
    }

    if (clearMarkersAndUiElements) {
      // console.log("[useItineraryCreationTrigger] Clearing map markers and UI elements before itinerary creation.");
      clearMarkersAndUiElements();
    } else {
      console.warn("[useItineraryCreationTrigger] clearMarkersAndUiElements function is not available.");
    }

    if (clearAllRoutes) {
      // console.log("[useItineraryCreationTrigger] Clearing previous routes before itinerary creation.");
      clearAllRoutes();
    }
    
    const result = await createItineraryFunction();
    return result;
  }, [isCurrentlyGenerating, createItineraryFunction, clearMarkersAndUiElements, clearAllRoutes]);

  return {
    handleTriggerCreateItinerary,
  };
};
