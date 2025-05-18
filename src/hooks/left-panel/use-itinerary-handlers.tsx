
import { useCallback } from 'react';
import { toast } from 'sonner';
import type { Place, SchedulePayload, ItineraryDay as SupabaseItineraryDay } from '@/types/supabase';
import type { ItineraryDay } from '@/hooks/use-itinerary';
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
        
        if (serverResponse) {
          console.log("[handleCreateItinerary] 서버 응답 성공:", serverResponse);
          
          // 이 시점에 서버 응답이 유효한지 확인하기 위해 로그를 추가합니다
          console.log("[handleCreateItinerary] 서버 응답 로그 (세부):", {
            응답타입: typeof serverResponse,
            객체여부: typeof serverResponse === 'object',
            널여부: serverResponse === null,
            배열여부: Array.isArray(serverResponse),
            schedule존재: !!serverResponse?.schedule,
            route_summary존재: !!serverResponse?.route_summary,
            유효성검사결과: isNewServerScheduleResponse(serverResponse)
          });
          
          if (isNewServerScheduleResponse(serverResponse) && 
              serverResponse.route_summary && 
              serverResponse.route_summary.length > 0) {
            
            // 명시적으로 일정 처리를 위한 이벤트를 발생시킵니다 (dispatch 전에 로그를 추가)
            console.log("[handleCreateItinerary] 유효한 응답입니다. 이벤트를 발생시킵니다.");
            
            // itineraryCreated 이벤트는 useScheduleGenerationRunner.ts에서 처리합니다
            // 이 훅에서는 성공 여부만 반환합니다
            return true;
          } else {
            console.warn("[handleCreateItinerary] 서버 응답은 있지만 형식이 맞지 않습니다. 클라이언트 측 일정 생성으로 폴백.", {
              isNewServerScheduleResponse: isNewServerScheduleResponse(serverResponse),
              hasRouteSummary: !!serverResponse?.route_summary,
              routeSummaryLength: serverResponse?.route_summary?.length
            });
            
            // 클라이언트 측 일정 생성으로 폴백
            const result = generateItineraryFn(
              selectedPlaces, 
              tripDetails.dates.startDate, 
              tripDetails.dates.endDate, 
              tripDetails.dates.startTime, 
              tripDetails.dates.endTime
            );
            
            if (result) {
              toast.info("서버 일정 생성 실패. 클라이언트에서 기본 일정을 생성했습니다.");
              
              // Dispatch 'itineraryCreated' event for client-side generated itinerary
              const event = new CustomEvent('itineraryCreated', { 
                detail: { 
                  itinerary: result,
                  selectedDay: result.length > 0 ? result[0].day : null
                } 
              });
              window.dispatchEvent(event);
              
              // 강제 리렌더링을 위한 setTimeout 추가
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
        } else {
          console.warn("[handleCreateItinerary] 서버 응답이 null 또는 undefined입니다.");
          toast.error("서버로부터 응답을 받지 못했습니다. 클라이언트에서 기본 일정을 생성합니다.");
          
          // 클라이언트 측 일정 생성으로 폴백
          const result = generateItineraryFn(
            selectedPlaces, 
            tripDetails.dates.startDate, 
            tripDetails.dates.endDate, 
            tripDetails.dates.startTime, 
            tripDetails.dates.endTime
          );
          
          if (result) {
            // Dispatch 'itineraryCreated' event for client-side generated itinerary
            const event = new CustomEvent('itineraryCreated', { 
              detail: { 
                itinerary: result,
                selectedDay: result.length > 0 ? result[0].day : null
              } 
            });
            window.dispatchEvent(event);
            
            // 강제 리렌더링을 위한 setTimeout 추가
            setTimeout(() => {
              console.log("클라이언트 일정 생성(서버 응답 없음) 후 강제 리렌더링 트리거");
              const forceEvent = new Event('forceRerender');
              window.dispatchEvent(forceEvent);
            }, 100);
            
            return true;
          } else {
            toast.error("클라이언트 일정 생성에 실패했습니다.");
            return false;
          }
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
          // Dispatch 'itineraryCreated' event for client-side generated itinerary
          const event = new CustomEvent('itineraryCreated', { 
            detail: { 
              itinerary: result,
              selectedDay: result.length > 0 ? result[0].day : null
            } 
          });
          window.dispatchEvent(event);

          // 강제 리렌더링을 위한 setTimeout 추가
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
  }, [generateSchedule]);

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
