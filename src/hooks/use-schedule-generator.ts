
import { useState } from 'react';
import { toast } from 'sonner';
import { SchedulePayload, NewServerScheduleResponse, PlannerServerRouteResponse, isNewServerScheduleResponse, isPlannerServerRouteResponseArray, convertPlannerResponseToNewResponse } from '@/types/schedule';
import { parseInterleavedRoute as parseInterleavedRouteUtil } from '@/utils/routeParser';

// 서버 URL 환경 변수에서 가져오기
const SERVER_BASE_URL = import.meta.env.VITE_SCHEDULE_API;
const SCHEDULE_GENERATION_ENDPOINT = "/generate_schedule"; // 경로 추가

export const useScheduleGenerator = () => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<Error | null>(null);
  // plannerRouteData 상태는 제거하고, generateSchedule이 NewServerScheduleResponse를 직접 반환하도록 합니다.

  // 서버에 일정 생성 요청
  const generateSchedule = async (payload: SchedulePayload): Promise<NewServerScheduleResponse | null> => {
    setIsGenerating(true);
    setGenerationError(null);
    
    const fullApiUrl = `${SERVER_BASE_URL}${SCHEDULE_GENERATION_ENDPOINT}`;
    console.log('[일정 생성] 환경 변수 확인:', {
      VITE_SCHEDULE_API: import.meta.env.VITE_SCHEDULE_API,
      SERVER_BASE_URL,
      SCHEDULE_GENERATION_ENDPOINT,
      fullApiUrl
    });
    console.log('[일정 생성] 서버 요청 URL:', fullApiUrl);
    console.log('[일정 생성] 서버에 일정 생성 요청 전송 (use-schedule-generator):', JSON.stringify(payload, null, 2));
    
    try {
      const response = await fetch(fullApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('[일정 생성] Fetch 요청 보낸 후, 응답 상태:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[일정 생성] 서버 오류 (${response.status}): ${errorText}`);
        throw new Error(`서버 오류 (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[일정 생성] 서버로부터 받은 원본 데이터 (use-schedule-generator):', data);
      
      let typedResponse: NewServerScheduleResponse;

      if (isNewServerScheduleResponse(data)) {
        typedResponse = data;
        console.log('[일정 생성] 서버 응답이 이미 NewServerScheduleResponse 형태입니다.');
      } else if (isPlannerServerRouteResponseArray(data)) {
        console.log('[일정 생성] 서버 응답이 PlannerServerRouteResponse[] 형태입니다. 변환합니다.');
        typedResponse = convertPlannerResponseToNewResponse(data);
      } else {
        console.error('[일정 생성] 예상치 못한 서버 응답 형태:', data);
        toast.error('서버 응답 형식이 올바르지 않습니다.');
        throw new Error('서버 응답 형식이 예상과 다릅니다.');
      }
      
      // 응답 데이터 로깅 및 유효성 검사
      if (typedResponse.route_summary && typedResponse.route_summary.length > 0) {
        console.log(`[일정 생성] ${typedResponse.route_summary.length}일치 경로 요약 데이터 수신 완료.`);
        toast.success(`${typedResponse.route_summary.length}일 일정이 성공적으로 생성되었습니다!`);

        // 상세 로깅 (예시: 첫 날 경로)
        const firstRouteSummary = typedResponse.route_summary[0];
        if (firstRouteSummary && firstRouteSummary.interleaved_route) {
          console.log(`[일정 생성] 첫 날 (${firstRouteSummary.day}) 경로 샘플:`, {
            interleaved_route_길이: firstRouteSummary.interleaved_route.length,
            첫20개_인터리브드: firstRouteSummary.interleaved_route.slice(0, 20)
          });
          const parsedSegments = parseInterleavedRouteUtil(firstRouteSummary.interleaved_route);
          console.log(`[일정 생성] 첫 날 (${firstRouteSummary.day}) 파싱된 경로 (util):`, parsedSegments);
        }
      } else {
        console.warn('[일정 생성] 경로 요약 데이터(route_summary)가 없거나 비어있습니다.');
        toast.warn('경로 정보가 부족하여 일부 기능이 제한될 수 있습니다.');
        // 이 경우에도 typedResponse 자체는 반환될 수 있으나, 내용이 부족할 수 있음을 인지해야 함
      }
      
      return typedResponse; // 성공적으로 처리된 NewServerScheduleResponse 반환
    } catch (error) {
      console.error('[일정 생성] 오류 발생 (use-schedule-generator):', error);
      setGenerationError(error instanceof Error ? error : new Error('알 수 없는 오류'));
      toast.error(`일정 생성 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 문제'}`);
      return null; // 오류 발생 시 null 반환
    } finally {
      setIsGenerating(false);
    }
  };
  
  return {
    generateSchedule,
    isGenerating,
    generationError,
    // plannerRouteData는 더 이상 여기서 관리하지 않음
  };
};
