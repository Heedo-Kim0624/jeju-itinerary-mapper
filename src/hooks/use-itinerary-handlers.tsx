
import { useCallback } from 'react';
import { toast } from 'sonner';
import type { Place, SchedulePayload, ItineraryDay as SupabaseItineraryDay } from '@/types/supabase';
import type { ItineraryDay } from '@/hooks/use-itinerary';
import { NewServerScheduleResponse, isNewServerScheduleResponse } from '@/types/schedule';
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
            
            console.log("[handleCreateItinerary] 유효한 응답입니다. 이벤트를 발생시킵니다.");
            
            // 서버 응답을 직접 처리합니다 (이전 코드와 가장 큰 차이점)
            try {
              // 1. 서버 응답을 ItineraryDay 배열로 파싱합니다
              const parsedItinerary = parseServerResponse(serverResponse, tripDetails.dates?.startDate || new Date());
              
              // 2. 좌표 정보를 업데이트합니다
              const itineraryWithCoords = updateItineraryWithCoordinates(parsedItinerary, geoJsonNodes as any);
              
              // 3. 지도에 경로 데이터를 설정합니다
              const routesForMapContext: Record<number, any> = {};
              itineraryWithCoords.forEach(day => {
                routesForMapContext[day.day] = {
                  nodeIds: day.routeData?.nodeIds || [],
                  linkIds: day.routeData?.linkIds || [],
                  interleaved_route: day.interleaved_route,
                };
              });
              
              // 4. 상태 업데이트 및 이벤트 발생을 위한 함수를 직접 호출합니다
              console.log("[handleCreateItinerary] 상태 업데이트 및 이벤트 발생");
              
              // 4.1 서버 경로를 맵 컨텍스트에 설정합니다
              setServerRoutes(routesForMapContext);
              
              // 4.2 itineraryCreated 이벤트를 발생시킵니다
              const itineraryCreatedEvent = new CustomEvent('itineraryCreated', {
                detail: { 
                  itinerary: itineraryWithCoords,
                  selectedDay: itineraryWithCoords.length > 0 ? itineraryWithCoords[0].day : null
                }
              });
              window.dispatchEvent(itineraryCreatedEvent);
              
              // 4.3 itineraryWithCoordinatesReady 이벤트를 발생시킵니다
              const coordsEvent = new CustomEvent('itineraryWithCoordinatesReady', {
                detail: { itinerary: itineraryWithCoords }
              });
              window.dispatchEvent(coordsEvent);
              
              // 명시적으로 일정 패널을 표시합니다
              setShowItinerary(true);
              
              // 5. 강제 리렌더링을 위한 타이머 설정
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
            console.warn("[handleCreateItinerary] 서버 응답은 있지만 형식이 맞지 않습니다. 클라이언트 측 일정 생성으로 폴백.");
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
    
    // 클라이언트 측 일정 생성으로 폴백하는 함수
    function fallbackToClientItinerary() {
      if (tripDetails.dates && selectedPlaces.length > 0) {
        const fallbackItinerary = generateItineraryFn(
          selectedPlaces, 
          tripDetails.dates.startDate, 
          tripDetails.dates.endDate, 
          tripDetails.dates.startTime, 
          tripDetails.dates.endTime
        );
        
        if (fallbackItinerary && fallbackItinerary.length > 0) {
          // Dispatch 'itineraryCreated' event for client-side generated itinerary
          const event = new CustomEvent('itineraryCreated', { 
            detail: { 
              itinerary: fallbackItinerary,
              selectedDay: fallbackItinerary[0].day
            } 
          });
          window.dispatchEvent(event);
          
          // 명시적으로 일정 패널을 표시합니다
          setShowItinerary(true);
          
          // 강제 리렌더링을 위한 setTimeout 추가
          setTimeout(() => {
            console.log("[handleCreateItinerary] 클라이언트 일정 생성 후 강제 리렌더링 트리거");
            const forceEvent = new Event('forceRerender');
            window.dispatchEvent(forceEvent);
          }, 200);
          
          toast.info("서버 일정 생성 실패. 클라이언트에서 기본 일정을 생성했습니다.");
          return true;
        } else {
          toast.error("클라이언트 일정 생성에 실패했습니다.");
          return false;
        }
      } else {
        toast.error("일정 생성에 필요한 정보가 부족합니다.");
        return false;
      }
    }
  }, [generateSchedule, parseServerResponse, geoJsonNodes, setServerRoutes]);

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
