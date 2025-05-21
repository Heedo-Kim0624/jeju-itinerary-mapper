
import { useMemo } from 'react';
import type { ItineraryDay } from '@/types';
import type { LeftPanelPropsData } from '@/types/left-panel'; // 경로 수정

type UseItineraryDisplayPropsArgs = Pick<
  LeftPanelPropsData,
  'uiVisibility' | 'itineraryManagement' | 'tripDetails' | 'handleCloseItinerary'
>;

export const useItineraryDisplayProps = ({
  uiVisibility,
  itineraryManagement,
  tripDetails,
  handleCloseItinerary,
}: UseItineraryDisplayPropsArgs) => {
  return useMemo(() => {
    if (!uiVisibility.showItinerary || !itineraryManagement.itinerary) {
      return null;
    }
    return {
      itinerary: itineraryManagement.itinerary,
      startDate: tripDetails.dates?.startDate || new Date(),
      onSelectDay: itineraryManagement.handleSelectItineraryDay,
      selectedDay: itineraryManagement.selectedItineraryDay,
      onCloseItinerary: handleCloseItinerary,
      debug: {
        itineraryLength: itineraryManagement.itinerary?.length || 0,
        selectedDay: itineraryManagement.selectedItineraryDay,
        showItinerary: uiVisibility.showItinerary,
      },
    };
  }, [
    uiVisibility,
    itineraryManagement,
    tripDetails.dates?.startDate,
    handleCloseItinerary,
  ]);
};
