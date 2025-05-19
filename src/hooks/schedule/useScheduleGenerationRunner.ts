
import { useCallback } from 'react';
import { toast } from 'sonner';
import { SelectedPlace } from '@/types/supabase';
import { NewServerScheduleResponse, ServerRouteResponse, isNewServerScheduleResponse, ItineraryDay as CoreItineraryDay } from '@/types/core';
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useItineraryCreator, ItineraryDay as CreatorItineraryDay } from '@/hooks/use-itinerary-creator';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useSchedulePayload } from './useSchedulePayload';
import { useScheduleParser, updateItineraryWithCoordinates } from './useScheduleParser';

const DEBUG_MODE = true;

function debugLog(message: string, data?: any) {
  if (DEBUG_MODE) {
    console.log(`[DEBUG] %c${message}`, 'color: blue; font-weight: bold;', data !== undefined ? data : '');
  }
}

interface UseScheduleGenerationRunnerProps {
  selectedPlaces: SelectedPlace[];
  dates: { startDate: Date; endDate: Date; startTime: string; endTime: string; } | null;
  startDatetime: string | null;
  endDatetime: string | null;
  setItinerary: (itinerary: CoreItineraryDay[]) => void;
  setSelectedDay: (day: number | null) => void;
  setIsLoadingState: (loading: boolean) => void;
}

export const useScheduleGenerationRunner = ({
  selectedPlaces,
  dates,
  startDatetime, 
  endDatetime,   
  setItinerary: setItineraryCore,
  setSelectedDay,
  setIsLoadingState,
}: UseScheduleGenerationRunnerProps) => {
  const { generateSchedule: generateScheduleViaHook } = useScheduleGeneratorHook();
  const { createItinerary } = useItineraryCreator();
  const { setServerRoutes, geoJsonNodes } = useMapContext();
  
  const { preparePayload } = useSchedulePayload({ 
    selectedPlaces, 
    startDatetimeISO: startDatetime, 
    endDatetimeISO: endDatetime 
  });
  const { parseServerResponse } = useScheduleParser({ currentSelectedPlaces: selectedPlaces });

  const runScheduleGenerationProcess = useCallback(async () => {
    console.log("[useScheduleGenerationRunner] runScheduleGenerationProcess started. Setting isLoadingState to true.");
    setIsLoadingState(true);
    
    let finalItineraryForEvent: CoreItineraryDay[] = [];
    
    try {
      const payload = preparePayload();
      debugLog('Server request payload (useScheduleGenerationRunner):', payload);
      
      if (!payload) {
        toast.error("일정 생성에 필요한 정보가 부족합니다.");
        setIsLoadingState(false);
        return;
      }

      // Listen for raw server response events - CREATE A SEPARATE HANDLER
      const handleRawServerResponse = (event: Event) => {
        const customEvent = event as CustomEvent<{response: NewServerScheduleResponse}>;
        const serverResponse = customEvent.detail?.response;
        
        console.log('[useScheduleGenerationRunner] rawServerResponseReceived 이벤트 받음:', serverResponse);
        
        if (serverResponse) {
          try {
            // 서버 응답을 파싱하여 itinerary 생성
            const parsedItinerary = parseServerResponse(serverResponse, dates?.startDate || new Date());
            console.log("[useScheduleGenerationRunner] 파싱된 일정:", parsedItinerary);
            
            if (parsedItinerary && parsedItinerary.length > 0) {
              // GeoJSON에서 좌표 정보 추가
              const itineraryWithCoords = updateItineraryWithCoordinates(parsedItinerary, geoJsonNodes as any);
              console.log("[useScheduleGenerationRunner] 좌표가 추가된 일정:", itineraryWithCoords);
              
              // 상태에 일정 데이터를 저장
              setItineraryCore(itineraryWithCoords);
              finalItineraryForEvent = itineraryWithCoords;
              
              // MapContext에 경로 데이터 전달
              const routesForMapContext: Record<number, ServerRouteResponse> = {};
              
              itineraryWithCoords.forEach(dayWithCoords => {
                routesForMapContext[dayWithCoords.day] = {
                  nodeIds: dayWithCoords.routeData?.nodeIds || [],
                  linkIds: dayWithCoords.routeData?.linkIds || [],
                  interleaved_route: dayWithCoords.interleaved_route,
                };
              });
              
              console.log("[useScheduleGenerationRunner] MapContext에 전달할 경로 데이터:", routesForMapContext);
              setServerRoutes(routesForMapContext);
              
              // 첫 날짜 선택
              if (itineraryWithCoords.length > 0) {
                setSelectedDay(itineraryWithCoords[0].day);
                
                // 일정 생성 이벤트 발생
                const event = new CustomEvent('itineraryCreated', { 
                  detail: { 
                    itinerary: itineraryWithCoords,
                    selectedDay: itineraryWithCoords[0].day
                  } 
                });
                console.log("[useScheduleGenerationRunner] 'itineraryCreated' 이벤트 발생");
                window.dispatchEvent(event);
              }
              
              // UI 강제 갱신을 위한 이벤트 추가
              setTimeout(() => {
                console.log("[useScheduleGenerationRunner] forceRerender 이벤트 발생");
                window.dispatchEvent(new Event('forceRerender'));
                
                // itineraryWithCoordinatesReady 이벤트 발생
                const coordEvent = new CustomEvent('itineraryWithCoordinatesReady', { 
                  detail: { itinerary: itineraryWithCoords } 
                });
                console.log("[useScheduleGenerationRunner] 'itineraryWithCoordinatesReady' 이벤트 발생");
                window.dispatchEvent(coordEvent);
                
                // 500ms 후에 로딩 상태 해제 (UI가 업데이트되도록 약간의 지연 추가)
                setTimeout(() => {
                  setIsLoadingState(false);
                }, 300);
              }, 100);
            } else {
              console.error("[useScheduleGenerationRunner] 파싱된 일정이 비어 있습니다");
              setIsLoadingState(false);
              toast.error("서버 응답을 처리할 수 없습니다. 다시 시도해 주세요.");
              
              // 빈 일정이라도 이벤트는 발생시켜서 UI가 업데이트되도록 함
              const emptyEvent = new CustomEvent('itineraryCreated', { 
                detail: { 
                  itinerary: [],
                  selectedDay: null
                } 
              });
              window.dispatchEvent(emptyEvent);
            }
          } catch (error) {
            console.error("[useScheduleGenerationRunner] 서버 응답 처리 중 오류:", error);
            setIsLoadingState(false);
            toast.error("서버 응답 처리 중 오류가 발생했습니다.");
            
            // 오류가 발생해도 UI 상태 업데이트를 위해 이벤트 발생
            const errorEvent = new CustomEvent('itineraryCreated', { 
              detail: { 
                itinerary: [],
                selectedDay: null,
                error: true
              } 
            });
            window.dispatchEvent(errorEvent);
          } finally {
            // 이벤트 핸들러 제거 (중복 실행 방지)
            window.removeEventListener('rawServerResponseReceived', handleRawServerResponse);
          }
        } else {
          console.error("[useScheduleGenerationRunner] 서버 응답 이벤트에 올바른 응답이 포함되어 있지 않습니다");
          setIsLoadingState(false);
          
          // 응답이 없어도 UI 상태 업데이트를 위해 이벤트 발생
          const noResponseEvent = new CustomEvent('itineraryCreated', { 
            detail: { 
              itinerary: [],
              selectedDay: null,
              noResponse: true
            } 
          });
          window.dispatchEvent(noResponseEvent);
          
          // 이벤트 핸들러 제거
          window.removeEventListener('rawServerResponseReceived', handleRawServerResponse);
        }
      };
      
      // 이벤트 리스너 등록 - 중요: 서버 요청 전에 등록
      window.addEventListener('rawServerResponseReceived', handleRawServerResponse);

      // 서버에 일정 생성 요청을 보내고 응답을 받습니다
      const serverResponse = await generateScheduleViaHook(payload);
      console.log('[useScheduleGenerationRunner] 서버 원본 응답:', serverResponse);
      
      // 서버 응답이 없거나 유효하지 않은 경우 대체 일정 생성
      if (!serverResponse || 
          !isNewServerScheduleResponse(serverResponse) || 
          !serverResponse.route_summary || 
          serverResponse.route_summary.length === 0) {
        
        console.warn("[useScheduleGenerationRunner] 서버 응답이 없거나 유효하지 않아 클라이언트 대체 일정 생성");
        
        // 이벤트 리스너 제거 (서버 응답 대신 클라이언트 대체 일정 사용 시)
        window.removeEventListener('rawServerResponseReceived', handleRawServerResponse);
        
        if (dates && selectedPlaces.length > 0) {
          try {
            const fallbackItinerary = createItinerary(
              selectedPlaces,
              dates.startDate,
              dates.endDate,
              dates.startTime,
              dates.endTime
            );
            
            // CreatorItineraryDay[]를 CoreItineraryDay[]로 적절히 변환
            const mappedFallbackItinerary = convertCreatorToCore(fallbackItinerary, dates.startDate);
            
            // 대체 일정 저장 및 이벤트 발생을 위한 설정
            setItineraryCore(mappedFallbackItinerary);
            finalItineraryForEvent = mappedFallbackItinerary;
            
            if (mappedFallbackItinerary.length > 0) {
              setSelectedDay(mappedFallbackItinerary[0].day);
              toast.info("클라이언트에서 대체 일정을 생성했습니다.");
              
              // 일정 생성 이벤트 발생
              const event = new CustomEvent('itineraryCreated', { 
                detail: { 
                  itinerary: mappedFallbackItinerary,
                  selectedDay: mappedFallbackItinerary[0].day,
                  isFallback: true
                } 
              });
              window.dispatchEvent(event);
              
              // UI 강제 갱신을 위한 이벤트 추가
              setTimeout(() => {
                window.dispatchEvent(new Event('forceRerender'));
              }, 100);
            }
          } catch (fallbackError) {
            console.error("[useScheduleGenerationRunner] 클라이언트 대체 일정 생성 중 오류:", fallbackError);
            toast.error("일정 생성에 실패했습니다. 다시 시도해주세요.");
          }
        } else {
          toast.error("일정 생성에 필요한 정보가 부족합니다.");
        }
        
        // 로딩 상태 해제
        setIsLoadingState(false);
      }
      // 참고: 서버 응답이 정상적인 경우, handleRawServerResponse에서 처리됨
    } catch (error) {
      console.error("일정 생성 중 오류 발생 (useScheduleGenerationRunner):", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
      
      // 로딩 상태 해제
      setIsLoadingState(false);
      
      // 에러가 발생해도 UI 업데이트를 위한 이벤트 발생
      const errorEvent = new CustomEvent('itineraryCreated', { 
        detail: { 
          itinerary: [],
          selectedDay: null,
          error: true
        } 
      });
      window.dispatchEvent(errorEvent);
      
      // 에러 발생 시 대체 일정 생성은 시도하지 않음
    }
  }, [
    preparePayload,
    generateScheduleViaHook,
    parseServerResponse,
    geoJsonNodes,
    selectedPlaces,
    setServerRoutes,
    dates,
    createItinerary,
    setItineraryCore,
    setSelectedDay,
    setIsLoadingState,
  ]);

  // CreatorItineraryDay[]를 CoreItineraryDay[]로 변환하는 유틸리티 함수
  const convertCreatorToCore = (creatorItinerary: CreatorItineraryDay[], startDate: Date): CoreItineraryDay[] => {
    return creatorItinerary.map((creatorDay, index) => {
      const currentDayDate = new Date(startDate);
      currentDayDate.setDate(startDate.getDate() + index);
      
      const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDayDate.getDay()];
      const date = `${(currentDayDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDayDate.getDate().toString().padStart(2, '0')}`;
      
      // 기본 필드를 모두 포함하는 CoreItineraryDay 객체 반환
      return {
        day: creatorDay.day,
        places: creatorDay.places.map(p => ({
          ...p,
          // 필요한 추가 필드가 있다면 여기에 추가
        })),
        totalDistance: creatorDay.totalDistance,
        // core.ts에서 정의한 필수 필드 추가
        routeData: { 
          nodeIds: [], 
          linkIds: [],
          segmentRoutes: [] 
        },
        interleaved_route: [],
        dayOfWeek: dayOfWeek,
        date: date
      };
    });
  };

  return { 
    runScheduleGenerationProcess,
  };
};
