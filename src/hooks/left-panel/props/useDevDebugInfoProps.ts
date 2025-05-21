
import { useMemo } from 'react';
import type { LeftPanelPropsData } from '../use-left-panel-props'; // Adjust if type is moved

type UseDevDebugInfoPropsArgs = Pick<
  LeftPanelPropsData,
  | 'uiVisibility'
  | 'itineraryManagement'
  | 'isGeneratingItinerary'
  | 'itineraryReceived'
  | 'tripDetails'
>;

export const useDevDebugInfoProps = ({
  uiVisibility,
  itineraryManagement,
  isGeneratingItinerary,
  itineraryReceived,
  tripDetails,
}: UseDevDebugInfoPropsArgs) => {
  return useMemo(() => {
    return {
      showItineraryHook: uiVisibility.showItinerary,
      itineraryHook: itineraryManagement.itinerary,
      selectedDayHook: itineraryManagement.selectedItineraryDay,
      isGeneratingPanel: isGeneratingItinerary,
      itineraryReceivedPanel: itineraryReceived,
      tripStartDate: tripDetails.dates?.startDate,
    };
  }, [
    uiVisibility,
    itineraryManagement,
    isGeneratingItinerary,
    itineraryReceived,
    tripDetails.dates?.startDate,
  ]);
};
