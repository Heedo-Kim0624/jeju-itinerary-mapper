
import { useState } from 'react';
import { toast } from 'sonner';
// SchedulePayload와 NewServerScheduleResponse는 현재 직접 사용되지 않으므로, PlannerServerRouteResponse를 임포트합니다.
// 만약 SchedulePayload가 여전히 필요하다면 유지해야 합니다. 사용자 요청에 따라 일단 PlannerServerRouteResponse 중심으로 변경합니다.
import { SchedulePayload, PlannerServerRouteResponse } from '@/types/schedule';
import { parseInterleavedRoute as parseInterleavedRouteUtil } from '@/utils/routeParser';

// 서버 URL 환경 변수에서 가져오기
const SERVER_BASE_URL = import.meta.env.VITE_SCHEDULE_API;
const SCHEDULE_GENERATION_ENDPOINT = "/generate_schedule"; // 경로 추가

export const useScheduleGenerator = () => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<Error | null>(null);
  // 파트 1 요청에 따라 새로운 상태 추가
  const [plannerRouteData, setPlannerRouteData] = useState<PlannerServerRouteResponse[]>([]);

  // 서버에 일정 생성 요청
  // 반환 타입을 PlannerServerRouteResponse[] | null 로 변경합니다.
  const generateSchedule = async (payload: SchedulePayload): Promise<PlannerServerRouteResponse[] | null> => {
    setIsGenerating(true);
    setGenerationError(null);
    setPlannerRouteData([]); // 이전 데이터 초기화
    
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
      
      // 서버 응답이 PlannerServerRouteResponse[] 형식이라고 가정합니다.
      const data: PlannerServerRouteResponse[] = await response.json();
      console.log('[일정 생성] 서버로부터 받은 일정 데이터 (PlannerServerRouteResponse[]):', data);
      
      // 데이터 유효성 검사 (사용자 제공 예시 기반)
      if (!Array.isArray(data) || 
          data.length === 0 || 
          !data.every(item => typeof item.date === 'string' && Array.isArray(item.nodeIds) && item.nodeIds.every(id => typeof id === 'number'))) {
        console.error('[일정 생성] 수신된 데이터가 PlannerServerRouteResponse[] 형식이 아닙니다:', data);
        throw new Error('유효하지 않은 응답 데이터 형식입니다.');
      }
      
      // 응답 데이터 저장
      setPlannerRouteData(data);
      
      // 성공 메시지
      toast.success(`${data.length}일 일정이 성공적으로 생성되었습니다!`);
      
      // 기존 NewServerScheduleResponse 관련 로직은 이 컨텍스트에서는 제거되거나 주석 처리됩니다.
      // 만약 이 로직이 여전히 다른 곳에서 필요하다면, 별도의 함수로 분리하거나 이 함수의 역할을 명확히 해야 합니다.
      /*
      if (data.route_summary && data.route_summary.length > 0) {
        // ... 기존 route_summary 처리 로직 ...
      } else {
        // ... 기존 경고 로직 ...
      }
      */
      
      return data;
    } catch (error) {
      console.error('[일정 생성] 오류 발생 (use-schedule-generator):', error);
      setGenerationError(error instanceof Error ? error : new Error('알 수 없는 오류'));
      toast.error('일정 생성에 실패했습니다.');
      return null;
    } finally {
      // 중요: 로딩 상태 종료
      setIsGenerating(false);
    }
  };
  
  return {
    generateSchedule,
    isGenerating,
    generationError,
    plannerRouteData // 새로 추가된 상태 반환
  };
};
