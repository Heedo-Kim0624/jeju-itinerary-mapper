
import { useCallback, useState } from 'react';
import { SchedulePayload, NewServerScheduleResponse } from '@/types/schedule';
import { toast } from 'sonner';
import { mockServerResponseData } from '@/temp/mockServerData'; // 모의 데이터 임포트

// 임시 플래그: true로 설정하면 모의 데이터를 사용합니다.
const USE_MOCK_DATA = true;

export const useScheduleGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSchedule = useCallback(async (payload: SchedulePayload): Promise<NewServerScheduleResponse | null> => {
    console.log('[use-schedule-generator] Payload for server:', payload);
    setIsGenerating(true);

    if (USE_MOCK_DATA) {
      console.log('[use-schedule-generator] Using MOCK DATA');
      // 모의 데이터가 NewServerScheduleResponse 타입과 일치하는지 확인 필요
      // 현재 mockServerResponseData는 해당 타입을 따르므로 바로 사용 가능
      return new Promise((resolve) => {
        setTimeout(() => { // 실제 API 호출처럼 약간의 딜레이를 줍니다.
          setIsGenerating(false);
          console.log('[use-schedule-generator] Mock data returned:', mockServerResponseData);
          resolve(mockServerResponseData);
        }, 1000); // 1초 딜레이
      });
    }

    // 기존 서버 호출 로직 (USE_MOCK_DATA가 false일 때 실행)
    try {
      // const API_URL = process.env.REACT_APP_SCHEDULE_API_URL || '/api/generate_schedule';
      // TODO: API_URL 환경변수 설정 또는 직접 URL 입력
      // 현재 API URL이 없으므로, 환경 변수 사용 예시를 주석 처리하고 임시 URL을 사용합니다.
      // 실제 배포 시에는 올바른 API URL로 교체해야 합니다.
      const API_URL = '/api/generate_schedule_placeholder'; // 임시 플레이스홀더 URL

      console.log(`[use-schedule-generator] Sending request to: ${API_URL}`);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('[use-schedule-generator] Response status:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('[use-schedule-generator] Server error response:', errorData);
        } catch (e) {
          console.error('[use-schedule-generator] Failed to parse error JSON, response text:', await response.text());
          errorData = { message: `서버 응답 오류: ${response.status}` };
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: NewServerScheduleResponse = await response.json();
      console.log('[use-schedule-generator] Data from server:', data);
      toast.success('서버로부터 일정을 성공적으로 생성했습니다.');
      return data;

    } catch (error) {
      console.error('[use-schedule-generator] Error in generateSchedule:', error);
      // toast.error(`일정 생성 실패: ${error instanceof Error ? error.message : String(error)}`);
      // 실패 시 null을 반환하여 fallback 로직이 실행되도록 합니다.
      // 이 부분은 useScheduleGenerationRunner에서 이미 toast 처리를 하고 있으므로 중복을 피할 수 있습니다.
      return null;
    } finally {
      console.log('[use-schedule-generator] Entering finally block. Attempting to set isGenerating to false.');
      setIsGenerating(false);
      console.log('[use-schedule-generator] setIsGenerating called with: false');
      console.log('[use-schedule-generator] setIsGenerating(false) has been called in finally block.');
    }
  }, []);

  return { generateSchedule, isGenerating };
};
