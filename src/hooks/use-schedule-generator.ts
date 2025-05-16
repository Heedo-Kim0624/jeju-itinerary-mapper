import { useState } from 'react';
import { Place, SelectedPlace } from '@/types/supabase';
import { toast } from 'sonner';
import { useItineraryCreator } from './use-itinerary-creator';
import { SchedulePayload, ServerScheduleResponse, ParsedRoute } from '@/types/schedule';
import { parseInterleavedRoute as parseInterleavedRouteUtil } from '@/utils/routeParser';

// 서버 URL 환경 변수에서 가져오기 (환경변수가 없으면 고정 URL 사용)
const SERVER_URL = "https://fa3f-34-91-44-214.ngrok-free.app";

export const useScheduleGenerator = () => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<Error | null>(null);
  const { createItinerary } = useItineraryCreator();
  
  // 서버에 일정 생성 요청
  const generateSchedule = async (payload: SchedulePayload): Promise<ServerScheduleResponse | null> => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      console.log('[일정 생성] 서버 요청 URL:', SERVER_URL);
      console.log('[일정 생성] 서버에 일정 생성 요청 전송:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(`${SERVER_URL}/generate-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`서버 오류 (${response.status}): ${errorText}`);
      }
      
      const data: ServerScheduleResponse = await response.json();
      console.log('[일정 생성] 서버로부터 받은 일정 데이터:', data);
      
      if (data.routes) {
        console.log('[일정 생성] 경로 데이터 포함:', 
          Object.keys(data.routes).length + '일치 경로 데이터 수신');
        
        const firstRouteDayKey = Object.keys(data.routes)[0];
        if (firstRouteDayKey) {
          const firstRoute = data.routes[firstRouteDayKey];
          console.log(`[일정 생성] ${firstRouteDayKey}일차 경로 샘플:`, {
            nodeIds_길이: firstRoute.nodeIds?.length || 0,
            linkIds_길이: firstRoute.linkIds?.length || 0,
            interleaved_route_길이: firstRoute.interleaved_route?.length || 0,
            첫20개_노드: firstRoute.nodeIds?.slice(0, 20) || [],
            첫20개_인터리브드: firstRoute.interleaved_route?.slice(0, 20) || []
          });
          
          if (firstRoute.interleaved_route) {
            // Use the utility function for parsing
            const parsedSegments = parseInterleavedRouteUtil(firstRoute.interleaved_route);
            console.log(`[일정 생성] ${firstRouteDayKey}일차 파싱된 경로 (util):`, parsedSegments);
          }
        }
      } else {
        console.warn('[일정 생성] 경로 데이터 누락: 서버 응답에 routes 필드가 없습니다!');
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
