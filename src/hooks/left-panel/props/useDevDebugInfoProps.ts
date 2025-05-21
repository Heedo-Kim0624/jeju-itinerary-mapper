
import { useMemo } from 'react';
import type { LeftPanelPropsData } from '@/types/left-panel'; // 경로 수정

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
