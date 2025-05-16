
import { useState } from 'react';
// import { Place, SelectedPlace } from '@/types/supabase'; // Not used
import { toast } from 'sonner';
// import { useItineraryCreator } from './use-itinerary-creator'; // Not used
import { SchedulePayload, NewServerScheduleResponse } from '@/types/schedule'; // Changed to NewServerScheduleResponse
import { parseInterleavedRoute as parseInterleavedRouteUtil } from '@/utils/routeParser';

// 서버 URL 환경 변수에서 가져오기
const SERVER_BASE_URL = import.meta.env.VITE_SCHEDULE_API;
const SCHEDULE_GENERATION_ENDPOINT = "/generate_schedule"; // 경로 추가

export const useScheduleGenerator = () => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<Error | null>(null);
  // const { createItinerary } = useItineraryCreator(); // Not used here

  // 서버에 일정 생성 요청
  const generateSchedule = async (payload: SchedulePayload): Promise<NewServerScheduleResponse | null> => {
    setIsGenerating(true);
    setGenerationError(null);
    
    const fullApiUrl = `${SERVER_BASE_URL}${SCHEDULE_GENERATION_ENDPOINT}`;
    console.log('[일정 생성] 서버 요청 URL:', fullApiUrl); // Check the full URL

    try {
      console.log('[일정 생성] 서버에 일정 생성 요청 전송 (use-schedule-generator):', JSON.stringify(payload, null, 2));
      
      const response = await fetch(fullApiUrl, { // Use fullApiUrl
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('[일정 생성] Fetch 요청 보낸 후, 응답 상태 확인 전');

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[일정 생성] 서버 오류 (${response.status}): ${errorText}`);
        throw new Error(`서버 오류 (${response.status}): ${errorText}`);
      }
      
      const data: NewServerScheduleResponse = await response.json();
      console.log('[일정 생성] 서버로부터 받은 일정 데이터 (NewServerScheduleResponse):', data);
      
      // The following log block used data.routes which is part of ServerScheduleResponse, not NewServerScheduleResponse.
      // NewServerScheduleResponse has route_summary. Let's adjust or simplify for now.
      if (data.route_summary && data.route_summary.length > 0) {
        console.log('[일정 생성] 경로 요약 데이터 포함:', 
          data.route_summary.length + '일치 경로 요약 데이터 수신');
        
        const firstRouteSummary = data.route_summary[0];
        if (firstRouteSummary && firstRouteSummary.interleaved_route) {
          console.log(`[일정 생성] ${firstRouteSummary.day} 경로 샘플:`, {
            interleaved_route_길이: firstRouteSummary.interleaved_route?.length || 0,
            첫20개_인터리브드: firstRouteSummary.interleaved_route?.slice(0, 20) || []
          });
          
          // Use the utility function for parsing
          const parsedSegments = parseInterleavedRouteUtil(firstRouteSummary.interleaved_route);
          console.log(`[일정 생성] ${firstRouteSummary.day} 파싱된 경로 (util):`, parsedSegments);
        }
      } else {
        console.warn('[일정 생성] 경로 요약 데이터 누락 또는 비어있음: 서버 응답에 route_summary 필드가 없거나 비어있습니다!');
      }
      
      return data;
    } catch (error) {
      console.error('[일정 생성] 오류 발생 (use-schedule-generator):', error);
      setGenerationError(error instanceof Error ? error : new Error('알 수 없는 오류'));
      toast.error('일정 생성에 실패했습니다.');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };
  
  return {
    generateSchedule,
    isGenerating,
    generationError
  };
};

