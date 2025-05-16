
import { useState } from 'react';
import { Place, SelectedPlace, SchedulePayload } from '@/types/supabase';
import { toast } from 'sonner';
import { useItineraryCreator } from './use-itinerary-creator';

// 서버 URL 환경 변수에서 가져오기 (환경변수가 없으면 고정 URL 사용)
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "https://62e5-34-9-140-65.ngrok-free.app";

export const useScheduleGenerator = () => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<Error | null>(null);
  const { createItinerary } = useItineraryCreator();
  
  // 서버에 일정 생성 요청
  const generateSchedule = async (payload: SchedulePayload) => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      console.log('[일정 생성] 서버 요청 URL:', SERVER_URL);
      console.log('[일정 생성] 서버에 일정 생성 요청 전송:', JSON.stringify(payload, null, 2));
      
      // 서버에 요청
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
      
      const data = await response.json();
      console.log('[일정 생성] 서버로부터 받은 일정 데이터:', data);
      
      // 서버 응답에 route 데이터가 있는지 디버깅
      if (data.routes) {
        console.log('[일정 생성] 경로 데이터 포함:', 
          Object.keys(data.routes).length + '일치 경로 데이터 수신');
        
        // 샘플 경로 데이터 출력
        const firstRouteDay = Object.keys(data.routes)[0];
        if (firstRouteDay) {
          const firstRoute = data.routes[firstRouteDay];
          console.log(`[일정 생성] ${firstRouteDay}일차 경로 샘플:`, {
            nodeIds_길이: firstRoute.nodeIds?.length || 0,
            첫20개: firstRoute.nodeIds?.slice(0, 20) || []
          });
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
