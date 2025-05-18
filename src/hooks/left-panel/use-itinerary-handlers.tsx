
import { useCallback } from 'react';
import { toast } from 'sonner';
import type { Place, SchedulePayload } from '@/types/supabase';
// ItineraryDay from use-itinerary is CreatorItineraryDay
import type { ItineraryDay } from '@/hooks/use-itinerary'; 
// import { NewServerScheduleResponse, isNewServerScheduleResponse } from '@/types/schedule'; // No longer used directly here
import { useMapContext } from '@/components/rightpanel/MapContext';
// import { useScheduleGenerator } from '@/hooks/use-schedule-generator'; // No longer used directly here

/**
 * 일정 관련 핸들러 훅
 */
export const useItineraryHandlers = () => {
  const { clearMarkersAndUiElements } = useMapContext();
  // const { generateSchedule } = useScheduleGenerator(); // Server call is now primarily in useScheduleManagement

  interface TripDetailsForItinerary {
    dates: {
      startDate: Date;
      endDate: Date;
      startTime: string;
      endTime: string;
    } | null;
    startDatetime: string | null;
    endDatetime: string | null;
  }

  // This function now primarily handles client-side generation or acts as a fallback
  // The main server-side generation is expected to be triggered via useScheduleManagement.runScheduleGenerationProcess
  const handleCreateItinerary = useCallback(async (
    tripDetails: TripDetailsForItinerary,
    selectedPlaces: Place[],
    // prepareSchedulePayloadFn is kept for signature but not used if only client-side
    _prepareSchedulePayloadFn: (places: Place[], startISO: string | null, endISO: string | null) => SchedulePayload | null,
    generateItineraryFn: (placesToUse: Place[], startDate: Date, endDate: Date, startTime: string, endTime: string) => ItineraryDay[] | null,
    setShowItinerary: (show: boolean) => void,
    setCurrentPanel: (panel: 'region' | 'date' | 'category' | 'itinerary') => void // Corrected panel type
  ): Promise<boolean> => {
    console.log('[use-itinerary-handlers/handleCreateItinerary] 함수 호출됨 (주로 클라이언트 또는 폴백용):', {
      tripDetails: tripDetails ? {
        startDatetime: tripDetails.startDatetime,
        endDatetime: tripDetails.endDatetime,
        hasDates: !!tripDetails.dates
      } : 'null',
      selectedPlacesCount: selectedPlaces.length,
    });
    
    if (!tripDetails.dates || !tripDetails.startDatetime || !tripDetails.endDatetime) {
      toast.error("여행 날짜와 시간을 먼저 설정해주세요.");
      return false;
    }
    
    if (selectedPlaces.length === 0) {
      toast.error("선택된 장소가 없습니다. 장소를 선택해주세요.");
      return false;
    }
    
    // Server payload preparation is removed as this handler is now simplified
    // const payload = prepareSchedulePayloadFn(selectedPlaces, tripDetails.startDatetime, tripDetails.endDatetime);

    // if (payload) { // Removed server call logic based on user's snippet
    //   console.log("[handleCreateItinerary] 서버 일정 생성 요청 시작, payload:", JSON.stringify(payload, null, 2));
      
    try {
      // Directly call client-side generation based on user's snippet
      console.log("[use-itinerary-handlers/handleCreateItinerary] 클라이언트 측 일정 생성 시도");
      const result = generateItineraryFn(
        selectedPlaces, 
        tripDetails.dates.startDate, 
        tripDetails.dates.endDate, 
        tripDetails.dates.startTime, 
        tripDetails.dates.endTime
      );
      
      if (result && result.length > 0) {
        console.log("[use-itinerary-handlers/handleCreateItinerary] 클라이언트 일정 생성 성공:", {
          일수: result.length,
          첫날장소수: result[0]?.places.length || 0
        });
        
        // UI 상태 전환 (setTimeout for state update order)
        // This assumes generateItineraryFn (from use-itinerary) already sets itinerary state
        // and this handler's role is to ensure panel visibility.
        // The 'itineraryCreated' event from useScheduleManagement should be the primary way to set itinerary state.
        // This part might be redundant if generateItineraryFn itself triggers setShowItinerary via use-itinerary.
        setTimeout(() => {
          setShowItinerary(true);
          setCurrentPanel('itinerary');
          console.log("[use-itinerary-handlers/handleCreateItinerary] UI 상태 전환 완료 (showItinerary=true, currentPanel=itinerary)");
        }, 100); // Timeout for state update order
        
        // Dispatch event if this client generation is a primary source
        // However, if this is purely a fallback, the main process should dispatch its own event.
        // Let's assume for now generateItineraryFn handles state and this is about visibility.
        // If use-itinerary's generateItinerary already sets showItinerary, this might be extra.
        // But it ensures the panel changes.

        return true; 
      } else {
        console.warn("[use-itinerary-handlers/handleCreateItinerary] 클라이언트 일정 생성 실패 또는 결과 없음.");
        toast.error("클라이언트 일정 생성에 실패했습니다."); // More specific error
        return false;
      }
    } catch (error) {
      console.error("[use-itinerary-handlers/handleCreateItinerary] 클라이언트 일정 생성 중 오류 발생:", error);
      toast.error("클라이언트 일정 생성 중 오류가 발생했습니다.");
      return false;
    }
    // } else {
    //   console.error("[use-itinerary-handlers/handleCreateItinerary] 페이로드 생성 실패 (서버 로직 제거됨)");
    //   toast.error("일정 생성에 필요한 정보가 부족합니다.");
    //   return false;
    // }
  }, []); // Removed generateSchedule from dependencies

  const handleCloseItinerary = useCallback((
    setShowItinerary: (show: boolean) => void,
    setCurrentPanel: (panel: 'region' | 'date' | 'category' | 'itinerary') => void // Corrected panel type
  ) => {
    setShowItinerary(false);
    clearMarkersAndUiElements(); 
    setCurrentPanel('category'); 
  }, [clearMarkersAndUiElements]);

  return {
    handleCreateItinerary,
    handleCloseItinerary
  };
};
