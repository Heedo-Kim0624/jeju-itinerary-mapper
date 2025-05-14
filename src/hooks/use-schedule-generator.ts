
import { useState } from 'react';
import { Place, SelectedPlace, SchedulePayload } from '@/types/supabase';
import { toast } from 'sonner';
import { useItineraryCreator } from './use-itinerary-creator';

// 서버 URL 환경 변수에서 가져오기
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://3479-34-74-218-238.ngrok-free.app';

export const useScheduleGenerator = () => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<Error | null>(null);
  const { createItinerary } = useItineraryCreator();
  
  // 서버에 일정 생성 요청
  const generateSchedule = async (payload: SchedulePayload) => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      console.log('서버에 일정 생성 요청 전송:', JSON.stringify(payload, null, 2));
      
      // 서버에 요청
      const response = await fetch(`${SERVER_URL}/generate-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('서버로부터 받은 일정 데이터:', data);
      
      // 서버에서 받은 데이터 형식이 다르다면 이 부분에서 변환 처리
      
      return data;
    } catch (error) {
      console.error('일정 생성 중 오류 발생:', error);
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
