import { useState } from 'react';
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

  const setIsGenerating = (generating: boolean) => {
    console.log(`[use-schedule-generator] setIsGenerating called with: ${generating}`);
    setIsGeneratingInternal(generating);
  };

  // 서버에 일정 생성 요청
  const generateSchedule = async (payload: SchedulePayload): Promise<NewServerScheduleResponse | null> => {
    console.log('[use-schedule-generator] generateSchedule called. Setting isGenerating to true.');
    setIsGenerating(true);
    setGenerationError(null);
    
    const fullApiUrl = `${SERVER_BASE_URL}${SCHEDULE_GENERATION_ENDPOINT}`;
    console.log('[use-schedule-generator] API URL:', fullApiUrl);
    console.log('[use-schedule-generator] Payload for server:', JSON.stringify(payload, null, 2));
    
    try {
      const response = await fetch(fullApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('[use-schedule-generator] Server response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[use-schedule-generator] Server error (${response.status}): ${errorText}`);
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[use-schedule-generator] Raw data from server:', data);
      
      let typedResponse: NewServerScheduleResponse;

      if (isNewServerScheduleResponse(data)) {
        typedResponse = data;
        console.log('[use-schedule-generator] Response is already NewServerScheduleResponse type.');
      } else if (isPlannerServerRouteResponseArray(data)) {
        console.log('[use-schedule-generator] Response is PlannerServerRouteResponse[], converting.');
        typedResponse = convertPlannerResponseToNewResponse(data);
      } else {
        console.error('[use-schedule-generator] Unexpected server response format:', data);
        toast.error('Server response format is incorrect.');
        throw new Error('Unexpected server response format.');
      }
      
      if (typedResponse.route_summary && typedResponse.route_summary.length > 0) {
        console.log(`[use-schedule-generator] Received ${typedResponse.route_summary.length} days of route summary.`);
        // toast.success(`${typedResponse.route_summary.length}일 일정이 성공적으로 생성되었습니다!`); // Toast moved to runner

        const firstRouteSummary = typedResponse.route_summary[0];
        if (firstRouteSummary && firstRouteSummary.interleaved_route) {
          console.log(`[use-schedule-generator] First day (${firstRouteSummary.day}) route sample:`, {
            interleaved_route_length: firstRouteSummary.interleaved_route.length,
            first_20_interleaved: firstRouteSummary.interleaved_route.slice(0, 20)
          });
          // const parsedSegments = parseInterleavedRouteUtil(firstRouteSummary.interleaved_route);
          // console.log(`[use-schedule-generator] First day (${firstRouteSummary.day}) parsed route (util):`, parsedSegments);
        }
      } else {
        console.warn('[use-schedule-generator] route_summary is missing or empty.');
        // toast.info('경로 정보가 부족하여 일부 기능이 제한될 수 있습니다.'); // Toast moved to runner
      }
      
      return typedResponse;
    } catch (error) {
      console.error('[use-schedule-generator] Error in generateSchedule:', error);
      setGenerationError(error instanceof Error ? error : new Error('Unknown error'));
      // toast.error(`일정 생성 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 문제'}`); // Toast moved to runner
      return null;
    } finally {
      console.log('[use-schedule-generator] Entering finally block. Attempting to set isGenerating to false.');
      setIsGenerating(false);
      console.log('[use-schedule-generator] setIsGenerating(false) has been called in finally block.');
    }
  };
  
  return {
    generateSchedule,
    isGenerating,
    generationError,
  };
};
