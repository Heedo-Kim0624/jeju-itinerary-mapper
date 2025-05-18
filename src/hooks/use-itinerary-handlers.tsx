import { useCallback } from 'react';
import { toast } from 'sonner';
import type { Place, SchedulePayload, ItineraryDay, NewServerScheduleResponse, ServerRouteResponse, isNewServerScheduleResponse } from '@/types';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useScheduleGenerator } from '@/hooks/use-schedule-generator';
import { useScheduleParser, updateItineraryWithCoordinates } from '@/hooks/schedule/useScheduleParser';

/**
 * 일정 관련 핸들러 훅
 */
export const useItineraryHandlers = () => {
  const { clearMarkersAndUiElements, geoJsonNodes, setServerRoutes } = useMapContext();
  const { generateSchedule } = useScheduleGenerator();
  const { parseServerResponse } = useScheduleParser({ currentSelectedPlaces: [] });

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
    setShowItinerary: (show: boolean) => void
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
    
    const payload: SchedulePayload | null = prepareSchedulePayloadFn(selectedPlaces, tripDetails.startDatetime, tripDetails.endDatetime);

    if (payload) {
      console.log("[handleCreateItinerary] 서버 일정 생성 요청 시작, payload:", JSON.stringify(payload, null, 2));
      
      try {
        const serverResponse: NewServerScheduleResponse | null = await generateSchedule(payload);
        
        if (serverResponse) {
          console.log("[handleCreateItinerary] 서버 응답 성공:", serverResponse);
          
          console.log("[handleCreateItinerary] 서버 응답 로그 (세부):", {
            응답타입: typeof serverResponse,
            객체여부: typeof serverResponse === 'object',
            널여부: serverResponse === null,
            배열여부: Array.isArray(serverResponse),
            schedule존재: !!serverResponse?.schedule,
            route_summary존재: !!serverResponse?.route_summary,
            유효성검사결과: isNewServerScheduleResponse(serverResponse)
          });

          if (isNewServerScheduleResponse(serverResponse) && serverResponse.route_summary) { // Allow empty route_summary for valid empty schedules
            
            console.log("[handleCreateItinerary] 유효한 응답입니다. 이벤트를 발생시킵니다.");
            
            try {
              const parsedItinerary = parseServerResponse(serverResponse, tripDetails.dates?.startDate || new Date());
              
              const itineraryWithCoords = updateItineraryWithCoordinates(parsedItinerary, geoJsonNodes as any);
              
              const routesForMapContext: Record<number, ServerRouteResponse> = {};
              itineraryWithCoords.forEach(day => {
                routesForMapContext[day.day] = {
                  nodeIds: day.routeData.nodeIds.map(Number).filter(n => !isNaN(n)),
                  linkIds: day.routeData.linkIds.map(Number).filter(n => !isNaN(n)),
                  interleaved_route: day.interleaved_route,
                };
              });
              
              console.log("[handleCreateItinerary] 상태 업데이트 및 이벤트 발생");
              setServerRoutes(routesForMapContext);
              
              const itineraryCreatedEvent = new CustomEvent('itineraryCreated', {
                detail: { 
                  itinerary: itineraryWithCoords,
                  selectedDay: itineraryWithCoords.length > 0 ? itineraryWithCoords[0].day : null
                }
              });
              window.dispatchEvent(itineraryCreatedEvent);
              
              const coordsEvent = new CustomEvent('itineraryWithCoordinatesReady', {
                detail: { itinerary: itineraryWithCoords }
              });
              window.dispatchEvent(coordsEvent);
              
              setShowItinerary(true);
              
              setTimeout(() => {
                console.log("[handleCreateItinerary] 강제 리렌더링 이벤트 발생");
                window.dispatchEvent(new Event('forceRerender'));
              }, 200);
              
              return true;
            } catch (error) {
              console.error("[handleCreateItinerary] 서버 응답 파싱 중 오류:", error);
              toast.error("서버 응답 처리 중 오류가 발생했습니다.");
              fallbackToClientItinerary();
              return false;
            }
          } else {
            console.warn("[handleCreateItinerary] 서버 응답은 있지만 형식이 맞지 않거나 route_summary가 없습니다. 클라이언트 측 일정 생성으로 폴백.");
            return fallbackToClientItinerary();
          }
        } else {
          console.warn("[handleCreateItinerary] 서버 응답이 null 또는 undefined입니다.");
          toast.error("서버로부터 응답을 받지 못했습니다. 클라이언트에서 기본 일정을 생성합니다.");
          return fallbackToClientItinerary();
        }
      } catch (error) {
        console.error("[handleCreateItinerary] 서버 요청 중 오류 발생:", error);
        toast.error("서버 일정 생성 중 오류 발생. 클라이언트에서 기본 일정을 생성합니다.");
        return fallbackToClientItinerary();
      }
    } else {
      console.error("[handleCreateItinerary] 페이로드 생성 실패");
      toast.error("일정 생성에 필요한 정보가 부족합니다.");
      return false;
    }
    
    function fallbackToClientItinerary(): boolean {
      if (tripDetails.dates && selectedPlaces.length > 0 && generateItineraryFn) {
        const fallbackItinerary = generateItineraryFn(
          selectedPlaces, 
          tripDetails.dates.startDate, 
          tripDetails.dates.endDate, 
          tripDetails.dates.startTime, 
          tripDetails.dates.endTime
        );
        
        if (fallbackItinerary && fallbackItinerary.length > 0) {
          const event = new CustomEvent('itineraryCreated', { 
            detail: { 
              itinerary: fallbackItinerary,
              selectedDay: fallbackItinerary.length > 0 ? fallbackItinerary[0].day : null 
            } 
          });
          window.dispatchEvent(event);
          setShowItinerary(true);
          
          setTimeout(() => {
            console.log("[handleCreateItinerary] 클라이언트 일정 생성 후 강제 리렌더링 트리거");
            window.dispatchEvent(new Event('forceRerender'));
          }, 200);
          
          toast.info("서버 일정 생성 실패. 클라이언트에서 기본 일정을 생성했습니다.");
          return true;
        } else {
          toast.error("클라이언트 일정 생성에 실패했습니다.");
          return false;
        }
      } else {
        toast.error("일정 생성에 필요한 정보가 부족하여 클라이언트 폴백도 실패했습니다.");
        return false;
      }
    }
  }, [generateSchedule, parseServerResponse, geoJsonNodes, setServerRoutes]);

  const handleCloseItinerary = useCallback((
    setShowItinerary: (show: boolean) => void
  ) => {
    setShowItinerary(false);
    clearMarkersAndUiElements(); 
  }, [clearMarkersAndUiElements]);

  return {
    handleCreateItinerary,
    handleCloseItinerary
  };
};
