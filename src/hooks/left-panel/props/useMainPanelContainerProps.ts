
import { useMemo } from 'react';
import type { Place, ItineraryDay } from '@/types';
import type { LeftPanelPropsData } from '../use-left-panel-props'; // Adjust if type is moved

type UseMainPanelContainerPropsArgs = Pick<
  LeftPanelPropsData,
  | 'uiVisibility'
  | 'placesManagement'
  | 'tripDetails'
  | 'itineraryManagement'
  | 'isGeneratingItinerary'
>;

export const useMainPanelContainerProps = ({
  uiVisibility,
  placesManagement,
  tripDetails,
  itineraryManagement,
  isGeneratingItinerary,
}: UseMainPanelContainerPropsArgs) => {
  return useMemo(() => {
    if (isGeneratingItinerary || uiVisibility.showItinerary) {
      return null;
    }
    return {
      showItinerary: uiVisibility.showItinerary,
      onSetShowItinerary: uiVisibility.setShowItinerary,
      selectedPlaces: placesManagement.selectedPlaces,
      onRemovePlace: placesManagement.handleRemovePlace,
      onViewOnMap: placesManagement.handleViewOnMap,
      allCategoriesSelected: placesManagement.allCategoriesSelected,
      dates: {
        startDate: tripDetails.dates?.startDate || null,
        endDate: tripDetails.dates?.endDate || null,
        startTime: tripDetails.dates?.startTime || "09:00",
        endTime: tripDetails.dates?.endTime || "21:00",
      },
      itinerary: itineraryManagement.itinerary,
      selectedItineraryDay: itineraryManagement.selectedItineraryDay,
      onSelectDay: itineraryManagement.handleSelectItineraryDay,
      isGenerating: isGeneratingItinerary,
      // onCreateItinerary will be added by the orchestrator
    };
  }, [
    uiVisibility,
    placesManagement,
    tripDetails.dates,
    itineraryManagement,
    isGeneratingItinerary,
  ]);
};
