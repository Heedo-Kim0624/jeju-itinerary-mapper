import { useCallback } from 'react';
import { toast } from 'sonner';
import type { Place, SchedulePayload } from '@/types/supabase'; // SupabaseItineraryDay 제거
import type { ItineraryDay } from '@/hooks/use-itinerary'; // use-itinerary에서 export된 타입 사용
import { NewServerScheduleResponse, isNewServerScheduleResponse } from '@/types/schedule';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useScheduleGenerator } from '@/hooks/use-schedule-generator';


/**
 * 일정 관련 핸들러 훅
 */
export const useItineraryHandlers = () => {
  const { clearMarkersAndUiElements } = useMapContext();
  const { generateSchedule } = useScheduleGenerator();

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

  const handleCreateItinerary = useCallback(async (
    tripDetails: TripDetailsForItinerary,
    selectedPlaces: Place[],
    // ItineraryDay 타입을 use-itinerary에서 가져온 것으로 사용
    prepareSchedulePayloadFn: (places: Place[], startISO: string | null, endISO: string | null) => SchedulePayload | null,
    generateItineraryFn: (placesToUse: Place[], startDate: Date, endDate: Date, startTime: string, endTime: string) => ItineraryDay[] | null,
    setShowItinerary: (show: boolean) => void,
    setCurrentPanel: (panel: string) => void
  ): Promise<boolean> => {
    console.log('[handleCreateItinerary] 함수 호출됨, 인자:', {
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
    
    const payload = prepareSchedulePayloadFn(selectedPlaces, tripDetails.startDatetime, tripDetails.endDatetime);

    if (payload) {
      console.log("[handleCreateItinerary] 서버 일정 생성 요청 시작, payload:", JSON.stringify(payload, null, 2));
      
      try {
        const serverResponse = await generateSchedule(payload);
        
        if (serverResponse && isNewServerScheduleResponse(serverResponse) && 
            serverResponse.route_summary && serverResponse.route_summary.length > 0) {
          console.log("[handleCreateItinerary] 서버 응답 성공:", serverResponse);
          // setShowItinerary(true); // This is now handled by the 'itineraryCreated' event listener in useLeftPanel
          // setCurrentPanel('itinerary'); // This is also handled by the event listener implicitly
          // The event dispatch is in useScheduleGenerationRunner
          return true; // Indicate success, event will trigger UI updates
        } else {
          console.warn("[handleCreateItinerary] 서버 응답 없거나 불완전함, 클라이언트 측 일정 생성으로 폴백. Response:", serverResponse);
          // Fallback to client-side generation
          const result = generateItineraryFn(
            selectedPlaces, 
            tripDetails.dates.startDate, 
            tripDetails.dates.endDate, 
            tripDetails.dates.startTime, 
            tripDetails.dates.endTime
          );
          
          if (result) {
            toast.info("서버 일정 생성 실패. 클라이언트에서 기본 일정을 생성했습니다.");
            // setShowItinerary(true); // Handled by useLeftPanel's useEffect listening to itinerary changes
            // setCurrentPanel('itinerary'); // Handled by useLeftPanel's useEffect

            // Dispatch 'itineraryCreated' event for client-side generated itinerary
            const event = new CustomEvent('itineraryCreated', { 
              detail: { 
                itinerary: result,
                selectedDay: result.length > 0 ? result[0].day : null
              } 
            });
            window.dispatchEvent(event);
            
            // 강제 리렌더링을 위한 setTimeout 추가 (from user's Part 2)
            setTimeout(() => {
              console.log("클라이언트 일정 생성 후 강제 리렌더링 트리거");
              const forceEvent = new Event('forceRerender');
              window.dispatchEvent(forceEvent);
            }, 100);

          } else {
            toast.error("서버 및 클라이언트 일정 생성 모두 실패했습니다.");
          }
          return !!result;
        }
      } catch (error) {
        console.error("[handleCreateItinerary] 서버 요청 중 오류 발생:", error);
        toast.error("서버 일정 생성 중 오류 발생. 클라이언트에서 기본 일정을 생성합니다.");
        const result = generateItineraryFn(
          selectedPlaces, 
          tripDetails.dates.startDate, 
          tripDetails.dates.endDate, 
          tripDetails.dates.startTime, 
          tripDetails.dates.endTime
        );
        
        if (result) {
          // setShowItinerary(true); // Handled by useLeftPanel
          // setCurrentPanel('itinerary'); // Handled by useLeftPanel

          // Dispatch 'itineraryCreated' event for client-side generated itinerary
          const event = new CustomEvent('itineraryCreated', { 
            detail: { 
              itinerary: result,
              selectedDay: result.length > 0 ? result[0].day : null
            } 
          });
          window.dispatchEvent(event);

          // 강제 리렌더링을 위한 setTimeout 추가 (from user's Part 2)
          setTimeout(() => {
            console.log("오류 후 클라이언트 일정 생성 후 강제 리렌더링 트리거");
            const forceEvent = new Event('forceRerender');
            window.dispatchEvent(forceEvent);
          }, 100);

        } else {
           toast.error("서버 및 클라이언트 일정 생성 모두 실패했습니다.");
        }
        return !!result;
      }
    } else {
      console.error("[handleCreateItinerary] 페이로드 생성 실패");
      toast.error("일정 생성에 필요한 정보가 부족합니다.");
      return false;
    }
  }, [generateSchedule]); // generateItineraryFn 제거 (generateSchedule 사용)

  const handleCloseItinerary = useCallback((
    setShowItinerary: (show: boolean) => void,
    setCurrentPanel: (panel: string) => void
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
