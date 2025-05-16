
import { useState } from 'react';
// ServerScheduleResponse 타입을 새로운 정의로 사용
import { SchedulePayload, ServerScheduleResponse } from '@/types/schedule';
import { toast } from 'sonner';
// useItineraryCreator와 ParsedRoute는 직접 사용하지 않으므로 제거 가능 (필요시 유지)

// 서버 URL 환경 변수에서 가져오기 (환경변수가 없으면 고정 URL 사용)
// const SERVER_URL = process.env.REACT_APP_SCHEDULE_SERVER_URL || "https://<your-ngrok-or-server-url>";
// 위 예시처럼 환경변수를 사용하거나, 지금처럼 고정된 값을 사용합니다.
// 사용자가 제공한 URL (generate_schedule 경로 포함)
const SERVER_URL = "https://fa3f-34-91-44-214.ngrok-free.app/generate_schedule";

export const useScheduleGenerator = () => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<Error | null>(null);
  // useItineraryCreator는 서버 응답을 직접 사용하므로 여기서는 제거
  
  const generateSchedule = async (payload: SchedulePayload): Promise<ServerScheduleResponse | null> => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      console.log('[일정 생성] 서버 요청 URL:', SERVER_URL);
      console.log('[일정 생성] 서버에 일정 생성 요청 전송:', JSON.stringify(payload, null, 2));
      
      // fetch 호출 시 SERVER_URL을 직접 사용 (URL에 이미 /generate_schedule 포함됨)
      const response = await fetch(SERVER_URL, { // 수정됨
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[일정 생성] 서버 오류 (${response.status}): ${errorText}`);
        throw new Error(`서버 오류 (${response.status}): ${errorText}`);
      }
      
      const data: ServerScheduleResponse = await response.json();
      console.log('[일정 생성] 서버로부터 받은 전체 응답 데이터:', data);

      // 응답 데이터 상세 로깅 (새로운 구조에 맞춰)
      if (data.schedule) {
        console.log(`[일정 생성] 수신된 스케줄 항목 ${data.schedule.length}개`);
        if (data.schedule.length > 0) {
          console.log('[일정 생성] 첫번째 스케줄 항목 샘플:', data.schedule[0]);
        }
      } else {
        console.warn('[일정 생성] 스케줄 데이터 (schedule) 누락');
      }

      if (data.route_summary) {
        console.log(`[일정 생성] 수신된 경로 요약 ${data.route_summary.length}개`);
        if (data.route_summary.length > 0) {
          console.log('[일정 생성] 첫번째 경로 요약 샘플:', data.route_summary[0]);
          console.log('[일정 생성] 첫번째 경로 요약의 interleaved_route 길이:', data.route_summary[0].interleaved_route?.length);
        }
      } else {
        console.warn('[일정 생성] 경로 요약 데이터 (route_summary) 누락');
      }
      
      return data;
    } catch (error) {
      console.error('[일정 생성] 오류 발생:', error);
      setGenerationError(error instanceof Error ? error : new Error('알 수 없는 오류'));
      toast.error('일정 생성에 실패했습니다. 서버 연결 또는 응답을 확인해주세요.');
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
