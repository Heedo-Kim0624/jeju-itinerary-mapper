import { useState } from 'react';
import { Place, SelectedPlace } from '@/types/supabase';
import { toast } from 'sonner';
import { useItineraryCreator } from './use-itinerary-creator';
import { SchedulePayload, NewServerScheduleResponse } from '@/types/schedule';
import { parseInterleavedRoute as parseInterleavedRouteUtil } from '@/utils/routeParser';

// 서버 URL 환경 변수에서 가져오기 (환경변수가 없으면 고정 URL 사용)
const SERVER_BASE_URL = "https://fa3f-34-91-44-214.ngrok-free.app"; // 서버 기본 주소
const SCHEDULE_GENERATION_ENDPOINT = "/generate_schedule"; // 엔드포인트

export const useScheduleGenerator = () => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<Error | null>(null);
  const { createItinerary } = useItineraryCreator();
  
  // 서버에 일정 생성 요청
  const generateSchedule = async (payload: SchedulePayload): Promise<NewServerScheduleResponse | null> => {
    setIsGenerating(true);
    setGenerationError(null);
    
    const fullServerUrl = `${SERVER_BASE_URL}${SCHEDULE_GENERATION_ENDPOINT}`;
    try {
      console.log('[일정 생성] 서버 요청 URL:', fullServerUrl);
      console.log('[일정 생성] 서버에 일정 생성 요청 전송:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(fullServerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[일정 생성] 서버 오류 응답 (${response.status}): ${errorText}`);
        throw new Error(`서버 오류 (${response.status}): ${errorText}`);
      }
      
      const data: NewServerScheduleResponse = await response.json();
      console.log('[일정 생성] 서버로부터 받은 일정 데이터:', data);
      
      if (data.route_summary && data.route_summary.length > 0) {
        console.log('[일정 생성] 경로 요약 데이터 포함:', 
          data.route_summary.length + '일치 경로 데이터 수신');
        
        const firstRouteDay = data.route_summary[0];
        if (firstRouteDay) {
          console.log(`[일정 생성] ${firstRouteDay.day} 경로 샘플:`, {
            interleaved_route_길이: firstRouteDay.interleaved_route?.length || 0,
            첫20개_인터리브드: firstRouteDay.interleaved_route?.slice(0, 20) || []
          });
          
          if (firstRouteDay.interleaved_route) {
            // Use the utility function for parsing
            // const parsedSegments = parseInterleavedRouteUtil(firstRouteDay.interleaved_route);
            // console.log(`[일정 생성] ${firstRouteDay.day} 파싱된 경로 (util):`, parsedSegments);
          }
        }
      } else {
        console.warn('[일정 생성] 경로 요약 데이터(route_summary) 누락 또는 비어있음!');
      }
      
      return data;
    } catch (error) {
      console.error('[일정 생성] 오류 발생:', error);
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
