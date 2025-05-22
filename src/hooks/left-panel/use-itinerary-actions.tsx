import { useCallback } from 'react';
import { useTripDetails } from '@/hooks/use-trip-details';
import { useSelectedPlaces } from '@/hooks/use-selected-places';
import { useItinerary } from '@/hooks/use-itinerary';
import { useLeftPanelState } from './use-left-panel-state';
import { toast } from 'sonner';
import { formatDateToMMDD, getDayOfWeekString } from '@/utils/date-utils';
import type { SchedulePayload, ItineraryDay, NewServerScheduleResponse, Place } from '@/types';

interface UseItineraryActionsProps {
  // This prop was removed as generateItinerary is now called directly from useLeftPanel's adapter
  // generateItinerary: (payload: SchedulePayload) => Promise<ItineraryDay[] | null>; 
}

export const useItineraryActions = (/* props: UseItineraryActionsProps */) => {
  const { setIsGenerating, setItineraryReceived, setCurrentPanel } = useLeftPanelState();
  const { dates, startTime, endTime } = useTripDetails();
  const { selectedPlaces, candidatePlaces, prepareSchedulePayload } = useSelectedPlaces();
  const itineraryHook = useItinerary();


  // This function seems to be intended to be called when a raw server response is received
  // and needs to be parsed and set into the itinerary state.
  // The `useItineraryEvents` hook already handles 'rawServerResponseReceived' event
  // and calls `itineraryHook.parseServerResponse`.
  // So, this `handleServerItineraryData` might be redundant or for a different purpose.
  // For now, let's assume it's the primary way to process server response if called directly.
  const handleServerItineraryData = useCallback(async (
    serverResponse: NewServerScheduleResponse,
    lastSentPayload: SchedulePayload | null
  ) => {
    setIsGenerating(true);
    try {
      console.log("[useItineraryActions] Processing server itinerary data:", serverResponse);
      // Use itineraryHook.parseServerResponse which is already designed for this.
      // It requires currentSelectedPlaces, tripStartDate, and lastSentPayload.
      const allPlacesForParsingContext = [...selectedPlaces, ...candidatePlaces] as Place[];
      
      const parsedItinerary = await itineraryHook.parseServerResponse(
        serverResponse,
        allPlacesForParsingContext, // Provide all known places for context
        dates.startDate,
        lastSentPayload // Pass the last payload
      );

      if (parsedItinerary && parsedItinerary.length > 0) {
        itineraryHook.setItinerary(parsedItinerary);
        itineraryHook.setShowItinerary(true);
        itineraryHook.setIsItineraryCreated(true);
        // Select the first day by default
        itineraryHook.handleSelectItineraryDay(parsedItinerary[0].day); 
        setCurrentPanel('itinerary');
        setItineraryReceived(true);
        toast.success('서버로부터 일정을 성공적으로 수신하여 처리했습니다.');
      } else {
        toast.error('서버 응답에서 유효한 일정을 생성하지 못했습니다.');
        itineraryHook.setItinerary(null);
        itineraryHook.setShowItinerary(false);
        itineraryHook.setIsItineraryCreated(false);
        setItineraryReceived(false);
      }
    } catch (error) {
      console.error('Error processing server itinerary data:', error);
      toast.error(`서버 일정 처리 중 오류: ${error instanceof Error ? error.message : String(error)}`);
      setItineraryReceived(false);
      itineraryHook.setItinerary(null);
      itineraryHook.setShowItinerary(false);
      itineraryHook.setIsItineraryCreated(false);
    } finally {
      setIsGenerating(false);
    }
  }, [
      setIsGenerating, 
      setItineraryReceived, 
      setCurrentPanel, 
      itineraryHook, 
      dates.startDate,
      selectedPlaces, // Add dependencies
      candidatePlaces // Add dependencies
  ]);

  return {
    handleServerItineraryData,
  };
};
