
import { useCallback, useState } from 'react';
import { useItinerary } from './use-itinerary'; // 프롬프트 1에서 요청
import { toast } from 'sonner';
// 프롬프트 1에서 정의한 타입을 가져옵니다.
import { 
  ItineraryDay, 
  NewServerScheduleResponse, 
  SchedulePayload,
  ItineraryPlace,
  ServerScheduleItem // extractPlacesFromRoute 에서 schedule 파라미터 타입으로 사용
} from '@/types/schedule'; 
// import { ServerRouteResponse } from '@/types/schedule'; // 이 타입은 프롬프트 1의 generateSchedule 함수 내에서 직접 사용되지 않음

export const useScheduleGenerator = () => {
  const [isGenerating, setIsGeneratingInternal] = useState<boolean>(false); // 원래 있던 isGenerating 상태 관리 유지
  const { setItinerary, setSelectedItineraryDay } = useItinerary();
  
  // 원래 있던 setIsGenerating 함수 유지
  const setIsGenerating = (generating: boolean) => {
    console.log(`[use-schedule-generator] setIsGenerating called with: ${generating}`);
    setIsGeneratingInternal(generating);
  };

  // 서버 응답을 처리하고 메모리에 저장하는 함수
  const processServerResponse = (
    data: NewServerScheduleResponse, 
    requestPayload: SchedulePayload // 날짜 계산을 위해 payload 사용
  ): ItineraryDay[] => {
    console.log("[use-schedule-generator] 서버 응답 데이터 처리 시작", data);
    
    const processedItinerary: ItineraryDay[] = [];
    const tripStartDate = new Date(requestPayload.start_datetime);
    
    data.route_summary.forEach((routeDayData, index) => {
      const day = index + 1;
      
      const currentDayDate = new Date(tripStartDate);
      currentDayDate.setDate(tripStartDate.getDate() + index);
      
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; // getDay()는 0(일)부터 시작
      const dayOfWeek = dayNames[currentDayDate.getDay()];
      
      const places = extractPlacesFromRoute(routeDayData, data.schedule);
      
      const itineraryDay: ItineraryDay = {
        day,
        dayOfWeek,
        date: formatDate(currentDayDate),
        places,
        totalDistance: routeDayData.interleaved_route_length / 1000,
        interleaved_route: routeDayData.first_20_interleaved, // 서버 응답의 number[]를 그대로 사용
        routeData: routeDayData 
      };
      
      processedItinerary.push(itineraryDay);
    });
    
    console.log("[use-schedule-generator] 처리된 일정 데이터:", processedItinerary);
    return processedItinerary;
  };
  
  // 경로 데이터에서 장소 정보 추출하는 함수 (ServerScheduleItem[] 타입을 schedule 파라미터에 명시)
  const extractPlacesFromRoute = (
    routeDayData: NewServerScheduleResponse['route_summary'][0], 
    schedule: ServerScheduleItem[] // any[] 대신 ServerScheduleItem[] 사용
  ): ItineraryPlace[] => {
    const places: ItineraryPlace[] = [];
    
    const placeNodeIds = routeDayData.first_20_interleaved.filter((_, i: number) => i % 2 === 0);
    
    placeNodeIds.forEach((nodeId: number) => {
      const placeInfoFromServer = schedule.find((item: ServerScheduleItem) => 
        item.node_id === nodeId || 
        (item.place_info && item.place_info.node_id === nodeId) ||
        // ID 직접 매칭 시도 (서버 스펙에 따라 place_id 또는 id 필드 사용 가능성)
        (typeof item.id === 'number' && item.id === nodeId) || 
        (typeof item.place_id === 'number' && item.place_id === nodeId)
      );
      
      if (placeInfoFromServer) {
        places.push({
          id: placeInfoFromServer.place_id || placeInfoFromServer.id || nodeId,
          name: placeInfoFromServer.place_name || `장소 ${nodeId}`,
          x: placeInfoFromServer.place_info?.x || 0,
          y: placeInfoFromServer.place_info?.y || 0,
          category: placeInfoFromServer.place_type || '기타',
          node_id: nodeId,
          time: placeInfoFromServer.time_block?.split('_')[1] || placeInfoFromServer.time_block || ''
        });
      } else {
        places.push({
          id: nodeId,
          name: `경유지 ${nodeId}`,
          node_id: nodeId,
          x: 0,
          y: 0,
          category: '경유지'
        });
      }
    });
    
    return places;
  };
  
  // 날짜 포맷팅 함수
  const formatDate = (date: Date): string => {
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  };

  // 서버에 일정 생성 요청을 보내는 함수
  const generateSchedule = useCallback(async (payload: SchedulePayload): Promise<NewServerScheduleResponse | null> => {
    console.log("[use-schedule-generator] 일정 생성 요청 시작");
    setIsGenerating(true); // 원래 로직대로 setIsGenerating 사용
    
    try {
      console.log("[use-schedule-generator] 서버 요청 payload:", payload);
      
      // VITE_SCHEDULE_API 환경 변수 사용 (기존 로직 참고)
      const SERVER_BASE_URL = import.meta.env.VITE_SCHEDULE_API;
      // 프롬프트에서는 /api/generate-itinerary 였으나, 기존 로직 및 환경변수 일관성 위해 수정
      // 만약 '/api/generate-itinerary'가 맞다면 해당 주석 해제 및 아래 URL 수정
      const SCHEDULE_GENERATION_ENDPOINT = "/generate_schedule"; 
      const fullApiUrl = `${SERVER_BASE_URL}${SCHEDULE_GENERATION_ENDPOINT}`;

      const response = await fetch(fullApiUrl, { // fullApiUrl 사용
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      console.log("[use-schedule-generator] Server response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[use-schedule-generator] 서버 응답 오류: ${response.status} - ${errorText}`);
        throw new Error(`서버 응답 오류: ${response.status} - ${errorText}`);
      }
      
      const data: NewServerScheduleResponse = await response.json();
      console.log("[use-schedule-generator] Raw data from server:", data);
      
      if (isNewServerScheduleResponse(data)) { // 타입 가드 사용
        console.log("[use-schedule-generator] Response is NewServerScheduleResponse type.");
        console.log(`[use-schedule-generator] Received ${data.route_summary.length} days of route summary.`);
        
        if (data.route_summary.length > 0) {
          console.log("[use-schedule-generator] First day route sample:", data.route_summary[0]);
        }
        
        const processedItinerary = processServerResponse(data, payload);
        
        setItinerary(processedItinerary);
        
        if (processedItinerary.length > 0) {
          setSelectedItineraryDay(processedItinerary[0].day);
        }
        
        const event = new CustomEvent('itineraryCreated', { 
          detail: { 
            itinerary: processedItinerary,
            selectedDay: processedItinerary.length > 0 ? processedItinerary[0].day : null // 실제 day 값 사용
          } 
        });
        window.dispatchEvent(event);
        
        console.log("[use-schedule-generator] 일정 데이터가 메모리에 저장되었습니다:", processedItinerary);
        toast.success(`${processedItinerary.length}일 일정이 생성되었습니다.`); // 사용자 피드백
        return data;
      } else {
        console.error("[use-schedule-generator] 서버 응답 데이터 형식이 올바르지 않습니다.", data);
        toast.error("서버 응답 데이터 형식이 올바르지 않습니다.");
        return null;
      }
    } catch (error) {
      console.error("[use-schedule-generator] 일정 생성 중 오류 발생:", error);
      toast.error(`일정 생성 중 오류: ${error instanceof Error ? error.message : '알 수 없는 문제'}`);
      return null;
    } finally {
      console.log("[use-schedule-generator] Entering finally block. Attempting to set isGenerating to false.");
      setIsGenerating(false); // 원래 로직대로 setIsGenerating 사용
      // console.log("[use-schedule-generator] setIsGenerating called with: false"); // 중복 로그 제거
      console.log("[use-schedule-generator] setIsGenerating(false) has been called in finally block.");
    }
  }, [setItinerary, setSelectedItineraryDay]); // processServerResponse는 useCallback의 의존성이 아님
  
  return {
    generateSchedule,
    isGenerating: isGeneratingInternal, // 상태 반환 시 isGeneratingInternal 사용
    // generationError는 프롬프트 1에서 제거되었으므로 반환 객체에서도 제거
  };
};
