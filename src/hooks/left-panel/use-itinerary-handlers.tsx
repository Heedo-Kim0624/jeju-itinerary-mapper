import { useCallback } from 'react';
import { toast } from 'sonner';
import type { Place, SchedulePayload as SupabaseSchedulePayload } from '@/types/supabase'; // Keep original SchedulePayload for Supabase if distinct
import { ItineraryDay } from '@/hooks/use-itinerary'; // Corrected import
import { NewServerScheduleResponse, isNewServerScheduleResponse, ServerRouteResponse } from '@/types'; // Import from @/types
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useScheduleGenerator } from '@/hooks/use-schedule-generator'; // This is the server call hook

/**
 * 일정 관련 핸들러 훅
 */
export const useItineraryHandlers = () => {
  const { clearMarkersAndUiElements, setServerRoutes } = useMapContext(); // Added setServerRoutes
  const { generateSchedule, isGenerating, error } = useScheduleGenerator();

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
    // prepareSchedulePayloadFn is complex, let's assume it's passed correctly from useSelectedPlaces or similar
    // For now, using SupabaseSchedulePayload type for it.
    prepareSchedulePayloadFn: (
        userSelectedPlacesInput: Place[], // Assuming Place from supabase is used here
        startDatetimeISO: string | null,
        endDatetimeISO: string | null
    ) => SupabaseSchedulePayload | null,
    // generateItineraryFn is the client-side fallback from useItinerary
    generateItineraryFn: (
        placesToUse: Place[], 
        startDate: Date, 
        endDate: Date, 
        startTime: string, 
        endTime: string
    ) => ItineraryDay[] | null, // This ItineraryDay is from use-itinerary
    setShowItinerary: (show: boolean) => void, // This likely comes from useLeftPanel's uiVisibility
    setCurrentPanel: (panel: string) => void // This likely comes from useLeftPanel
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
    
    // The payload for the server might be different from SupabaseSchedulePayload if types diverged.
    // Assuming prepareSchedulePayloadFn from useSelectedPlaces creates the correct server payload.
    const payloadForServer = prepareSchedulePayloadFn(selectedPlaces, tripDetails.startDatetime, tripDetails.endDatetime);

    if (payloadForServer) {
      console.log("[handleCreateItinerary] 서버 일정 생성 요청 시작, payload:", JSON.stringify(payloadForServer, null, 2));
      
      try {
        // Server call returns NewServerScheduleResponse
        const serverResponse: NewServerScheduleResponse | null = await generateSchedule(payloadForServer as any); // Cast if types are slightly off
        
        if (serverResponse) {
          console.log("[handleCreateItinerary] 서버 응답 성공:", serverResponse);
          
          console.log("[handleCreateItinerary] 서버 응답 로그 (세부):", {
            응답타입: typeof serverResponse,
            객체여부: typeof serverResponse === 'object',
            널여부: serverResponse === null,
            배열여부: Array.isArray(serverResponse),
            schedule존재: !!serverResponse?.schedule,
            route_summary존재: !!serverResponse?.route_summary,
            유효성검사결과: isNewServerScheduleResponse(serverResponse) // Use the imported function
          });
          
          if (isNewServerScheduleResponse(serverResponse) && // Use the imported function
              serverResponse.route_summary && 
              serverResponse.route_summary.length > 0) {
            
            console.log("[handleCreateItinerary] 유효한 응답입니다. 이벤트를 발생시킵니다 (useScheduleGenerationRunner에서 처리).");
            // The actual processing and event dispatching for itineraryCreated
            // should happen in useScheduleGenerationRunner which calls this.
            // This function's role might be simplified to just getting server response
            // or directly parsing and setting if not using the runner approach.
            // For now, we assume this is part of a flow where runner will use this.
            // If this handler IS the main runner, it should dispatch the event itself.
            // Let's assume for now that `useScheduleGenerationRunner` handles the event dispatch.
             window.dispatchEvent(new CustomEvent('rawServerResponseReceived', { detail: serverResponse }));

            return true; // Indicate success for runner to proceed.
          } else {
            console.warn("[handleCreateItinerary] 서버 응답은 있지만 형식이 맞지 않습니다. 클라이언트 측 일정 생성으로 폴백.", {
              isNewResponse: isNewServerScheduleResponse(serverResponse), // Use the imported function
              hasRouteSummary: !!serverResponse?.route_summary,
              routeSummaryLength: serverResponse?.route_summary?.length
            });
            
            const clientItinerary = generateItineraryFn(
              selectedPlaces, 
              tripDetails.dates.startDate, 
              tripDetails.dates.endDate, 
              tripDetails.dates.startTime, 
              tripDetails.dates.endTime
            );
            
            if (clientItinerary && clientItinerary.length > 0) {
              toast.info("서버 일정 생성 실패. 클라이언트에서 기본 일정을 생성했습니다.");
              const event = new CustomEvent('itineraryCreated', { 
                detail: { 
                  itinerary: clientItinerary,
                  selectedDay: clientItinerary.length > 0 ? clientItinerary[0].day : null
                } 
              });
              window.dispatchEvent(event);
              setShowItinerary(true); // Ensure panel shows
              setCurrentPanel('itinerary'); 
            } else {
              toast.error("서버 및 클라이언트 일정 생성 모두 실패했습니다.");
            }
            return !!clientItinerary && clientItinerary.length > 0;
          }
        } else {
          console.warn("[handleCreateItinerary] 서버 응답이 null 또는 undefined입니다. 클라이언트 폴백.");
          toast.error("서버로부터 응답을 받지 못했습니다. 클라이언트에서 기본 일정을 생성합니다.");
          
          const clientItinerary = generateItineraryFn(
            selectedPlaces, 
            tripDetails.dates.startDate, 
            tripDetails.dates.endDate, 
            tripDetails.dates.startTime, 
            tripDetails.dates.endTime
          );
          
          if (clientItinerary && clientItinerary.length > 0) {
            const event = new CustomEvent('itineraryCreated', { 
              detail: { 
                itinerary: clientItinerary,
                selectedDay: clientItinerary.length > 0 ? clientItinerary[0].day : null
              } 
            });
            window.dispatchEvent(event);
            setShowItinerary(true);
            setCurrentPanel('itinerary');
            return true;
          } else {
            toast.error("클라이언트 일정 생성에 실패했습니다.");
            return false;
          }
        }
      } catch (e) {
        console.error("[handleCreateItinerary] 서버 요청 중 오류 발생:", e);
        toast.error("서버 일정 생성 중 오류 발생. 클라이언트에서 기본 일정을 생성합니다.");
        const clientItinerary = generateItineraryFn(
          selectedPlaces, 
          tripDetails.dates.startDate, 
          tripDetails.dates.endDate, 
          tripDetails.dates.startTime, 
          tripDetails.dates.endTime
        );
        
        if (clientItinerary && clientItinerary.length > 0) {
          const event = new CustomEvent('itineraryCreated', { 
            detail: { 
              itinerary: clientItinerary,
              selectedDay: clientItinerary.length > 0 ? clientItinerary[0].day : null
            } 
          });
          window.dispatchEvent(event);
          setShowItinerary(true);
          setCurrentPanel('itinerary');
        } else {
           toast.error("서버 및 클라이언트 일정 생성 모두 실패했습니다.");
        }
        return !!clientItinerary && clientItinerary.length > 0;
      }
    } else {
      console.error("[handleCreateItinerary] 페이로드 생성 실패");
      toast.error("일정 생성에 필요한 정보가 부족합니다.");
      return false;
    }
  }, [generateSchedule, setServerRoutes]); // Added setServerRoutes

  const handleCloseItinerary = useCallback((
    setShowItineraryFn: (show: boolean) => void, // Renamed to avoid conflict
    setCurrentPanelFn: (panel: string) => void // Renamed to avoid conflict
  ) => {
    setShowItineraryFn(false);
    clearMarkersAndUiElements(); 
    setServerRoutes({}); // Clear server routes from map
    setCurrentPanelFn('category'); 
  }, [clearMarkersAndUiElements, setServerRoutes]);

  return {
    handleCreateItinerary,
    handleCloseItinerary,
    isGenerating, // Expose loading state from useScheduleGenerator
    error // Expose error state
  };
};
