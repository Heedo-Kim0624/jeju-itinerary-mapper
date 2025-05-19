import { useCallback } from 'react';
import { toast } from 'sonner';
import type { Place, SchedulePayload, ItineraryDay, NewServerScheduleResponse } from '@/types'; // @/types에서 가져오도록 변경
import { isNewServerScheduleResponse } from '@/types'; // isNewServerScheduleResponse도 @/types에서 가져옴
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useScheduleGenerator } from '@/hooks/use-schedule-generator';

/**
 * 일정 관련 핸들러 훅
 */
export const useItineraryHandlers = () => {
  const { clearMarkersAndUiElements, setServerRoutes } = useMapContext();
  const { generateSchedule, isGenerating } = useScheduleGenerator();

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
    selectedPlacesInput: Place[],
    prepareSchedulePayloadFn: (
        userSelectedPlaces: Place[], 
        startDatetimeISO: string | null,
        endDatetimeISO: string | null
    ) => SchedulePayload | null,
    generateItineraryFn: (
        placesToUse: Place[], 
        startDate: Date, 
        endDate: Date, 
        startTime: string, 
        endTime: string
    ) => ItineraryDay[] | null, // ItineraryDay from @/types
    setShowItinerary: (show: boolean) => void,
    setCurrentPanel: (panel: string) => void
  ): Promise<boolean> => {
    console.log('[handleCreateItinerary] 함수 호출됨, 인자:', {
      tripDetails: tripDetails ? {
        startDatetime: tripDetails.startDatetime,
        endDatetime: tripDetails.endDatetime,
        hasDates: !!tripDetails.dates
      } : 'null',
      selectedPlacesCount: selectedPlacesInput.length,
    });
    
    if (!tripDetails.dates || !tripDetails.startDatetime || !tripDetails.endDatetime) {
      toast.error("여행 날짜와 시간을 먼저 설정해주세요.");
      return false;
    }
    
    if (selectedPlacesInput.length === 0) {
      toast.error("선택된 장소가 없습니다. 장소를 선택해주세요.");
      return false;
    }
    
    const payloadForServer = prepareSchedulePayloadFn(
      selectedPlacesInput, 
      tripDetails.startDatetime, 
      tripDetails.endDatetime
    );

    if (payloadForServer) {
      console.log("[handleCreateItinerary] 서버 일정 생성 요청 시작, payload:", JSON.stringify(payloadForServer, null, 2));
      
      try {
        // generateSchedule의 반환 타입을 NewServerScheduleResponse | null로 가정
        const serverResponse = await generateSchedule(payloadForServer) as NewServerScheduleResponse | null;
        
        if (serverResponse) {
          console.log("[handleCreateItinerary] 서버 응답 성공:", serverResponse);
          
          if (isNewServerScheduleResponse(serverResponse) && 
              serverResponse.route_summary && 
              serverResponse.route_summary.length > 0) {
            
            console.log("[handleCreateItinerary] 유효한 응답입니다. rawServerResponseReceived 이벤트를 발생시킵니다.");
            window.dispatchEvent(new CustomEvent('rawServerResponseReceived', { detail: serverResponse }));
            return true;
          } else {
            console.warn("[handleCreateItinerary] 서버 응답은 있지만 형식이 맞지 않거나 route_summary가 비어있습니다. 클라이언트 측 일정 생성으로 폴백.", {
              isNewResponseFormat: isNewServerScheduleResponse(serverResponse),
              hasRouteSummary: !!serverResponse?.route_summary,
              routeSummaryLength: serverResponse?.route_summary?.length ?? 0
            });
            
            const clientItinerary = generateItineraryFn(
              selectedPlacesInput, 
              tripDetails.dates.startDate, 
              tripDetails.dates.endDate, 
              tripDetails.dates.startTime, 
              tripDetails.dates.endTime
            );
            
            if (clientItinerary && clientItinerary.length > 0) {
              toast.info("서버 일정 생성 실패 또는 형식이 맞지 않아 클라이언트에서 기본 일정을 생성했습니다.");
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
          console.warn("[handleCreateItinerary] 서버 응답이 null 또는 undefined입니다. 클라이언트 폴백.");
          toast.error("서버로부터 응답을 받지 못했습니다. 클라이언트에서 기본 일정을 생성합니다.");
          
          const clientItinerary = generateItineraryFn(
            selectedPlacesInput, 
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
      } catch (e: any) {
        console.error("[handleCreateItinerary] 서버 요청 중 오류 발생:", e);
        toast.error(`서버 일정 생성 중 오류: ${e.message || '알 수 없는 오류'}. 클라이언트에서 기본 일정을 생성합니다.`);
        const clientItinerary = generateItineraryFn(
          selectedPlacesInput, 
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
  }, [generateSchedule, setServerRoutes]); // generateItineraryFn was removed from deps array as it's a param

  const handleCloseItinerary = useCallback((
    setShowItineraryFn: (show: boolean) => void,
    setCurrentPanelFn: (panel: string) => void
  ) => {
    setShowItineraryFn(false);
    clearMarkersAndUiElements(); 
    setServerRoutes({} as Record<number, import('@/types').ServerRouteResponse>); // Ensure ServerRouteResponse is from @/types
    setCurrentPanelFn('category'); 
  }, [clearMarkersAndUiElements, setServerRoutes]);

  return {
    handleCreateItinerary,
    handleCloseItinerary,
    isGenerating,
  };
};
