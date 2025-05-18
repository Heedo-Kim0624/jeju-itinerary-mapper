
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  SchedulePayload, 
  NewServerScheduleResponse, 
  PlannerServerRouteResponse, 
  isNewServerScheduleResponse, 
  isPlannerServerRouteResponseArray, 
  convertPlannerResponseToNewResponse 
} from '@/types/schedule';
import { parseInterleavedRoute as parseInterleavedRouteUtil } from '@/utils/routeParser';

// 서버 URL 환경 변수에서 가져오기
const SERVER_BASE_URL = import.meta.env.VITE_SCHEDULE_API;
const SCHEDULE_GENERATION_ENDPOINT = "/generate_schedule"; // 경로 추가

export const useScheduleGenerator = () => {
  const [isGenerating, setIsGeneratingInternal] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<Error | null>(null);
  const [lastGenerateCallTime, setLastGenerateCallTime] = useState<number | null>(null);
  const [lastGenerateFinishTime, setLastGenerateFinishTime] = useState<number | null>(null);

  // isGenerating 상태 변화 추적
  useEffect(() => {
    console.log(`[use-schedule-generator] isGenerating 상태 변경: ${isGenerating}`);
    
    if (isGenerating) {
      setLastGenerateCallTime(Date.now());
    } else if (!isGenerating && lastGenerateCallTime) {
      const now = Date.now();
      setLastGenerateFinishTime(now);
      console.log(`[use-schedule-generator] 일정 생성 소요 시간: ${(now - lastGenerateCallTime) / 1000}초`);
      
      // 일정 생성 완료 이벤트 발생 (추가 안전장치)
      const event = new CustomEvent('scheduleGenerationCompleted', { 
        detail: { timestamp: now } 
      });
      window.dispatchEvent(event);
    }
  }, [isGenerating, lastGenerateCallTime]);

  const setIsGenerating = (generating: boolean) => {
    console.log(`[use-schedule-generator] setIsGenerating 호출됨: ${generating}`);
    setIsGeneratingInternal(generating);
  };

  // 서버에 일정 생성 요청
  const generateSchedule = async (payload: SchedulePayload): Promise<NewServerScheduleResponse | null> => {
    console.log('[use-schedule-generator] generateSchedule 호출됨. isGenerating을 true로 설정.');
    setIsGenerating(true);
    setGenerationError(null);
    
    const fullApiUrl = `${SERVER_BASE_URL}${SCHEDULE_GENERATION_ENDPOINT}`;
    console.log('[use-schedule-generator] API URL:', fullApiUrl);
    console.log('[use-schedule-generator] 서버로 전송되는 페이로드:', JSON.stringify(payload, null, 2));
    
    try {
      const response = await fetch(fullApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('[use-schedule-generator] 서버 응답 상태:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[use-schedule-generator] 서버 오류 (${response.status}): ${errorText}`);
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[use-schedule-generator] 서버 원본 데이터:', data);
      
      let typedResponse: NewServerScheduleResponse;

      if (isNewServerScheduleResponse(data)) {
        typedResponse = data;
        console.log('[use-schedule-generator] 응답이 이미 NewServerScheduleResponse 형식입니다.');
      } else if (isPlannerServerRouteResponseArray(data)) {
        console.log('[use-schedule-generator] 응답이 PlannerServerRouteResponse[] 형식입니다. 변환합니다.');
        typedResponse = convertPlannerResponseToNewResponse(data);
      } else {
        console.error('[use-schedule-generator] 예상치 못한 서버 응답 형식:', data);
        toast.error('서버 응답 형식이 올바르지 않습니다.');
        throw new Error('Unexpected server response format.');
      }
      
      if (typedResponse.route_summary && typedResponse.route_summary.length > 0) {
        console.log(`[use-schedule-generator] ${typedResponse.route_summary.length}일 경로 요약 데이터 수신됨.`);

        const firstRouteSummary = typedResponse.route_summary[0];
        if (firstRouteSummary && firstRouteSummary.interleaved_route) {
          console.log(`[use-schedule-generator] 첫 번째 날짜(${firstRouteSummary.day}) 경로 샘플:`, {
            interleaved_route_length: firstRouteSummary.interleaved_route.length,
            first_20_interleaved: firstRouteSummary.interleaved_route.slice(0, 20)
          });
        }
      } else {
        console.warn('[use-schedule-generator] route_summary가 없거나 비어 있습니다.');
      }
      
      return typedResponse;
    } catch (error) {
      console.error('[use-schedule-generator] generateSchedule 오류:', error);
      setGenerationError(error instanceof Error ? error : new Error('Unknown error'));
      return null;
    } finally {
      console.log('[use-schedule-generator] finally 블록 실행. isGenerating을 false로 설정 시도.');
      setIsGenerating(false);
      console.log('[use-schedule-generator] setIsGenerating(false) 호출이 완료되었습니다.');
      
      // 전역 이벤트 발생 - 일정 생성 프로세스 종료 신호
      const event = new CustomEvent('scheduleGenerationFinished');
      window.dispatchEvent(event);
    }
  };
  
  // scheduleGenerationFinished 이벤트 리스너 등록
  useEffect(() => {
    const handleGenerationFinished = () => {
      if (isGenerating) {
        console.log('[use-schedule-generator] scheduleGenerationFinished 이벤트 수신. isGenerating이 여전히 true라면 강제 false로 설정.');
        setIsGenerating(false);
      }
    };
    
    window.addEventListener('scheduleGenerationFinished', handleGenerationFinished);
    return () => {
      window.removeEventListener('scheduleGenerationFinished', handleGenerationFinished);
    };
  }, [isGenerating]);
  
  return {
    generateSchedule,
    isGenerating,
    generationError,
  };
};
