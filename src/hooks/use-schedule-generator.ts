
import { useCallback, useState } from 'react';
// SchedulePayload, NewServerScheduleResponse는 @/types/schedule에서, isNewServerScheduleResponse는 @/types/core에서 가져옵니다.
import type { SchedulePayload, NewServerScheduleResponse } from '@/types/schedule';
import { isNewServerScheduleResponse } from '@/types/core'; // 직접 core에서 가져오도록 경로 수정
import { toast } from 'sonner';

// convertPlannerResponseToNewResponse 함수는 현재 프로젝트에 정의되어 있지 않으므로,
// 해당 import는 주석 처리하거나 실제 함수를 정의해야 합니다.
// import { convertPlannerResponseToNewResponse } from '@/types/schedule';


export const useScheduleGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSchedule = useCallback(async (payload: SchedulePayload): Promise<NewServerScheduleResponse | null> => {
    console.log('[use-schedule-generator] Initial payload for server:', payload);
    setIsGenerating(true);

    try {
      // 1. 환경 변수 확인
      const baseApiUrl = import.meta.env.VITE_SCHEDULE_API;
      console.log('[use-schedule-generator] Environment variable VITE_SCHEDULE_API:', baseApiUrl);
      
      if (!baseApiUrl) {
        console.error('[use-schedule-generator] VITE_SCHEDULE_API 환경 변수가 설정되지 않았습니다.');
        toast.error('API 설정 오류. 관리자에게 문의하세요.');
        setIsGenerating(false);
        return null;
      }
      
      // 2. API URL 구성
      const API_URL = `${baseApiUrl}/generate_schedule`;
      console.log(`[use-schedule-generator] Full API URL: ${API_URL}`);
      
      // 3. 페이로드 상세 로깅
      console.log(`[use-schedule-generator] Payload details:`, {
        selected_places_count: payload.selected_places.length,
        candidate_places_count: payload.candidate_places.length,
        start_datetime: payload.start_datetime,
        end_datetime: payload.end_datetime,
        // 배열이 비어있을 수 있으므로 optional chaining 사용
        sample_selected_place: payload.selected_places?.[0], 
        sample_candidate_place: payload.candidate_places?.[0]
      });
      
      // 4. 페이로드 형식 조정 (id를 숫자로 변환)
      // useSchedulePayload.ts 에서 이미 id를 숫자로 변환 시도 (parseInt(p.id, 10) || p.id)하므로,
      // 여기서의 변환은 서버가 반드시 숫자 ID만을 기대하는 경우에 대비한 추가 확인/강제 변환으로 볼 수 있습니다.
      // 또는 useSchedulePayload에서 변환된 값이 여전히 문자열일 가능성을 다룹니다.
      const formattedPayload = {
        selected_places: payload.selected_places.map(place => ({
          id: typeof place.id === 'string' && !isNaN(parseInt(place.id, 10)) ? parseInt(place.id, 10) : place.id,
          name: place.name
        })),
        candidate_places: payload.candidate_places.map(place => ({
          id: typeof place.id === 'string' && !isNaN(parseInt(place.id, 10)) ? parseInt(place.id, 10) : place.id,
          name: place.name
        })),
        start_datetime: payload.start_datetime,
        end_datetime: payload.end_datetime
      };
      console.log('[use-schedule-generator] Formatted payload for server:', formattedPayload);
      
      // 5. 네트워크 요청 시작 시간 기록
      const requestStartTime = Date.now();
      console.log(`[use-schedule-generator] Request started at: ${new Date(requestStartTime).toISOString()}`);
      
      // 6. 실제 API 요청
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': 'Bearer your-token-here', // 필요한 경우 인증 헤더 추가
        },
        body: JSON.stringify(formattedPayload),
      });
      
      // 7. 네트워크 요청 완료 시간 및 소요 시간 기록
      const requestEndTime = Date.now();
      console.log(`[use-schedule-generator] Request completed at: ${new Date(requestEndTime).toISOString()}`);
      console.log(`[use-schedule-generator] Request took ${requestEndTime - requestStartTime}ms`);
      
      // 8. 응답 상태 및 헤더 로깅
      console.log('[use-schedule-generator] Response status:', response.status);
      // Header 값을 로깅하기 위해 Object.fromEntries 사용
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      console.log('[use-schedule-generator] Response headers:', responseHeaders);

      // 9. 응답 오류 처리
      if (!response.ok) {
        let errorData: { message?: string } = {};
        const responseText = await response.text(); // 응답 텍스트를 먼저 읽음
        try {
          errorData = JSON.parse(responseText); // JSON 파싱 시도
          console.error('[use-schedule-generator] Server error response (parsed JSON):', errorData);
        } catch (e) {
          console.error('[use-schedule-generator] Failed to parse error response as JSON. Response text:', responseText);
          if (responseText.trim().startsWith('<!doctype html>') || responseText.trim().startsWith('<html')) {
            console.error('[use-schedule-generator] Received HTML response instead of JSON. Possible proxy or infrastructure issue.');
            errorData = { message: `서버 연결 오류가 발생했습니다. (응답 내용이 HTML임) Status: ${response.status}` };
          } else {
            // JSON이 아닌 다른 텍스트 응답일 경우, 해당 텍스트를 메시지로 사용
             errorData = { message: `서버 응답 오류: ${response.status}. 응답: ${responseText.substring(0, 100)}...` };
          }
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // 10. 응답 데이터 파싱 및 변환
      const rawData = await response.json();
      console.log('[use-schedule-generator] Raw data from server:', rawData);

      // 11. 응답 구조가 다른 경우 변환 로직
      let data: NewServerScheduleResponse;

      if (rawData && typeof rawData === 'object' && 'result' in rawData && rawData.result && typeof rawData.result === 'object' && 'schedule' in rawData.result) {
        // 예: 서버가 { result: { schedule: [...], route_summary: [...] } } 형식으로 응답하는 경우
        console.log('[use-schedule-generator] Converting nested result format');
        data = {
          schedule: (rawData.result as any).schedule,
          route_summary: (rawData.result as any).route_summary,
          total_reward: (rawData.result as any).total_reward, // Optional
        };
      } else if (Array.isArray(rawData)) {
        // 예: 서버가 배열 형식으로 응답하는 경우 (PlannerServerRouteResponse[] 등)
        console.warn('[use-schedule-generator] Received array response format. Direct conversion to NewServerScheduleResponse not implemented without convertPlannerResponseToNewResponse. Attempting to use as is if structure matches, otherwise will fail validation.');
        // data = convertPlannerResponseToNewResponse(rawData); // 이 함수가 정의되어 있다면 사용
        // convertPlannerResponseToNewResponse 함수가 없으므로, 일단 rawData를 그대로 사용하거나,
        // 타입 가드에서 걸러지도록 합니다. 혹은 null 처리.
        // 여기서는 isNewServerScheduleResponse 타입 가드에 의존합니다.
        // 만약 이 케이스를 적절히 처리하려면, 변환 함수가 필요합니다.
        // 임시로, 타입단언을 하되, isNewServerScheduleResponse에서 실패할 가능성이 높습니다.
        data = rawData as unknown as NewServerScheduleResponse; 
      } else {
        // 기본 케이스
        console.log('[use-schedule-generator] Assuming standard response format.');
        data = rawData as NewServerScheduleResponse;
      }

      // 12. 데이터 유효성 검사
      if (!isNewServerScheduleResponse(data)) {
        console.error('[use-schedule-generator] Invalid server response format after processing:', data);
        // 서버에서 받은 원본 데이터도 함께 로깅하면 디버깅에 도움
        console.error('[use-schedule-generator] Original raw data was:', rawData);
        throw new Error('서버 응답 형식이 올바르지 않습니다. 수신된 데이터를 확인해주세요.');
      }

      console.log('[use-schedule-generator] Processed data from server:', data);
      toast.success('서버로부터 일정을 성공적으로 생성했습니다.');
      return data;

    } catch (error) {
      console.error('[use-schedule-generator] Error in generateSchedule:', error);
      if (error instanceof Error) {
        toast.error(`일정 생성 오류: ${error.message}`);
      } else {
        toast.error('일정 생성 중 알 수 없는 오류가 발생했습니다.');
      }
      return null;
    } finally {
      console.log('[use-schedule-generator] Entering finally block. Attempting to set isGenerating to false.');
      setIsGenerating(false);
      console.log('[use-schedule-generator] setIsGenerating called with: false. Current isGenerating state should be false.');
    }
  }, []);

  return { generateSchedule, isGenerating };
};
