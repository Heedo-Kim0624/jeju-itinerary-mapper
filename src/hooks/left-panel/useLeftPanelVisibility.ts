
import type { useItinerary } from '@/hooks/use-itinerary';
import type { useLeftPanelState } from './use-left-panel-state';

type ItineraryHook = ReturnType<typeof useItinerary>;
type LeftPanelStateHook = ReturnType<typeof useLeftPanelState>;

interface UseLeftPanelVisibilityProps {
  itineraryManagementHook: ItineraryHook;
  leftPanelState: LeftPanelStateHook;
}

export const useLeftPanelVisibility = ({
  itineraryManagementHook,
  leftPanelState,
}: UseLeftPanelVisibilityProps) => {
  return {
    showItinerary: itineraryManagementHook.showItinerary,
    setShowItinerary: itineraryManagementHook.setShowItinerary,
    showCategoryResult: leftPanelState.showCategoryResult,
    setShowCategoryResult: leftPanelState.setShowCategoryResult,
  };
};
