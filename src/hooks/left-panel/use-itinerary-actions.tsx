
import { useCallback } from 'react';
import { toast } from 'sonner';
import type { Place, ItineraryDay, SelectedPlace } from '@/types/supabase';
import { useItineraryGenerator } from '../itinerary/useItineraryGenerator';
import { useItineraryState } from '../itinerary/useItineraryState';

// Cleanup the supabase types later
interface UseItineraryActionsProps {
  userDirectlySelectedPlaces: SelectedPlace[];
  autoCompleteCandidatePlaces: Place[];
  setIsGenerating?: (isGenerating: boolean) => void;
  setItineraryReceived?: (received: boolean) => void;
  setShowItinerary?: (show: boolean) => void;
}

export const useItineraryActions = ({
  userDirectlySelectedPlaces,
  autoCompleteCandidatePlaces,
  setIsGenerating,
  setItineraryReceived,
  setShowItinerary,
}: UseItineraryActionsProps) => {
  const { state: itineraryState, actions: itineraryActions } = useItineraryState();
  const { generateItinerary } = useItineraryGenerator();
  
  const createItinerary = useCallback(async (
    tripStartDate: Date,
    tripEndDate: Date,
    tripStartTime: string,
    tripEndTime: string
  ): Promise<ItineraryDay[] | null> => {
    if (!tripStartDate || !tripEndDate) {
      toast.error("여행 날짜가 설정되지 않았습니다.");
      return null;
    }

    // Check if there are any places to work with
    if (userDirectlySelectedPlaces.length === 0) {
      toast.error("일정에 포함할 장소가 선택되지 않았습니다.");
      return null;
    }

    // Processing UI states
    if (setIsGenerating) setIsGenerating(true);
    
    try {
      // Combined approach using both selected and auto-complete candidate places
      const placesToInclude: Place[] = [
        ...userDirectlySelectedPlaces,
        ...autoCompleteCandidatePlaces
      ];
      
      // Generate an itinerary
      // 수정: 함수 호출 매개변수 맞추기
      const itineraryDays = await generateItinerary(placesToInclude);
      
      if (itineraryDays && itineraryDays.length > 0) {
        // Update itinerary state
        itineraryActions.setItinerary(itineraryDays);
        itineraryActions.setItineraryCreated(true);
        itineraryActions.setSelectedItineraryDay(1); // default to first day
        
        if (setShowItinerary) setShowItinerary(true);
        if (setItineraryReceived) setItineraryReceived(true);
        
        console.log("Itinerary created successfully:", itineraryDays);
        return itineraryDays;
      } else {
        toast.error("일정 생성에 실패했습니다. 서버 응답이 없거나 유효하지 않습니다.");
        return null;
      }
    } catch (error) {
      console.error("일정 생성 중 오류 발생:", error);
      toast.error(`일정 생성 실패: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    } finally {
      if (setIsGenerating) setIsGenerating(false);
    }
  }, [
    userDirectlySelectedPlaces,
    autoCompleteCandidatePlaces,
    generateItinerary,
    itineraryActions,
    setIsGenerating,
    setItineraryReceived,
    setShowItinerary
  ]);

  return {
    createItinerary,
    itineraryState,
    itineraryActions
  };
};
