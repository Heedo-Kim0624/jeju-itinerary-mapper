
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  SchedulePayload, 
  NewServerScheduleResponse, 
  PlannerServerRouteResponse, 
  isNewServerScheduleResponse, 
  isPlannerServerRouteResponseArray, 
  convertPlannerResponseToNewResponse 
} from '@/types/schedule';

// 서버 URL 환경 변수에서 가져오기
const SERVER_BASE_URL = import.meta.env.VITE_SCHEDULE_API;
const SCHEDULE_GENERATION_ENDPOINT = "/generate_schedule";

export const useScheduleGenerator = () => {
  const [isGenerating, setIsGeneratingInternal] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<Error | null>(null);

  // 로딩 상태 변경 함수 (로깅 포함)
  const setIsGenerating = useCallback((generating: boolean) => {
    console.log(`[use-schedule-generator] 로딩 상태 변경: ${generating}`);
    setIsGeneratingInternal(generating);
  }, []);

  // 서버에 일정 생성 요청
  const generateSchedule = useCallback(async (payload: SchedulePayload): Promise<NewServerScheduleResponse | null> => {
    console.log('[use-schedule-generator] 일정 생성 시작, 로딩 상태 true로 설정');
    setIsGenerating(true);
    setGenerationError(null);
    
    const fullApiUrl = `${SERVER_BASE_URL}${SCHEDULE_GENERATION_ENDPOINT}`;
    console.log('[use-schedule-generator] API URL:', fullApiUrl);
    
    try {
      console.log('[use-schedule-generator] 서버에 요청 전송');
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
      console.log('[use-schedule-generator] 서버 응답 데이터 수신');
      
      let typedResponse: NewServerScheduleResponse;

      if (isNewServerScheduleResponse(data)) {
        typedResponse = data;
        console.log('[use-schedule-generator] 응답이 NewServerScheduleResponse 형식입니다.');
      } else if (isPlannerServerRouteResponseArray(data)) {
        console.log('[use-schedule-generator] 응답이 PlannerServerRouteResponse[] 형식입니다. 변환 중...');
        typedResponse = convertPlannerResponseToNewResponse(data);
      } else {
        console.error('[use-schedule-generator] 예상치 못한 서버 응답 형식:', data);
        toast.error('서버 응답 형식이 올바르지 않습니다.');
        throw new Error('Unexpected server response format.');
      }
      
      if (typedResponse.route_summary && typedResponse.route_summary.length > 0) {
        console.log(`[use-schedule-generator] ${typedResponse.route_summary.length}일 일정 데이터 수신 완료`);
      } else {
        console.warn('[use-schedule-generator] route_summary가 없거나 비어 있습니다.');
      }
      
      return typedResponse;
    } catch (error) {
      console.error('[use-schedule-generator] 일정 생성 중 오류:', error);
      setGenerationError(error instanceof Error ? error : new Error('Unknown error'));
      return null;
    } finally {
      console.log('[use-schedule-generator] finally 블록 실행, 로딩 상태 false로 설정');
      // 타임아웃을 사용하여 상태 업데이트 경쟁 상태 방지 (중요!)
      setTimeout(() => {
        setIsGenerating(false);
        console.log('[use-schedule-generator] 로딩 상태 false로 설정 완료');
      }, 0);
    }
  }, [setIsGenerating]);
  
  return {
    generateSchedule,
    isGenerating,
    generationError,
    setIsGenerating, // 외부에서 직접 상태를 변경할 수 있도록 노출
  };
};
