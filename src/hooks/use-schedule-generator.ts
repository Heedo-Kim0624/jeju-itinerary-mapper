
import { useCallback, useState, useRef } from 'react';
import type { SchedulePayload, NewServerScheduleResponse } from '@/types/schedule';
import { isNewServerScheduleResponse } from '@/types/core';
import { toast } from 'sonner';

// import { convertPlannerResponseToNewResponse } from '@/types/schedule';

export const useScheduleGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const lastSentPayloadRef = useRef<SchedulePayload | null>(null);

  const generateSchedule = useCallback(async (payload: SchedulePayload): Promise<NewServerScheduleResponse | null> => {
    // 서버로 보내는 Payload 상세 로깅
    console.group('[SERVER_PAYLOAD] 서버로 보내는 데이터');
    console.log('전체 Payload:', JSON.stringify(payload, null, 2));
    console.log('선택된 장소 수:', payload.selected_places?.length || 0);
    console.log('후보 장소 수:', payload.candidate_places?.length || 0);
    console.log('시작 일시:', payload.start_datetime);
    console.log('종료 일시:', payload.end_datetime);
    
    // 선택된 장소 ID-이름 매핑 테이블 출력
    if (payload.selected_places && payload.selected_places.length > 0) {
      console.log('선택된 장소 ID-이름 매핑:');
      const selectedMapping: Record<string | number, string> = {};
      payload.selected_places.forEach(p => {
        selectedMapping[p.id] = p.name;
      });
      console.table(selectedMapping);
    }
    
    // 후보 장소 ID-이름 매핑 테이블 출력
    if (payload.candidate_places && payload.candidate_places.length > 0) {
      console.log('후보 장소 ID-이름 매핑:');
      const candidateMapping: Record<string | number, string> = {};
      payload.candidate_places.forEach(p => {
        candidateMapping[p.id] = p.name;
      });
      console.table(candidateMapping);
    }
    console.groupEnd(); 
    
    setIsGenerating(true);
    
    // 서버로 보내는 데이터를 메모리에 저장
    lastSentPayloadRef.current = payload;

    try {
      const baseApiUrl = import.meta.env.VITE_SCHEDULE_API;
      if (!baseApiUrl) {
        console.error('[use-schedule-generator] VITE_SCHEDULE_API 환경 변수가 설정되지 않았습니다.');
        toast.error('API 설정 오류. 관리자에게 문의하세요.');
        setIsGenerating(false);
        return null;
      }
      
      const API_URL = `${baseApiUrl}/generate_schedule`;
      console.log(`[use-schedule-generator] Full API URL: ${API_URL}`);
            
      const formattedPayload = {
        ...payload,
        selected_places: payload.selected_places.map(place => ({
          ...place,
          id: typeof place.id === 'string' && !isNaN(parseInt(place.id, 10)) ? parseInt(place.id, 10) : place.id,
        })),
        candidate_places: payload.candidate_places.map(place => ({
          ...place,
          id: typeof place.id === 'string' && !isNaN(parseInt(place.id, 10)) ? parseInt(place.id, 10) : place.id,
        })),
      };
      console.log('[use-schedule-generator] Formatted payload for server (IDs to int if possible):', formattedPayload);
      
      const requestStartTime = Date.now();
      console.log(`[use-schedule-generator] Request started at: ${new Date(requestStartTime).toISOString()}`);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedPayload), // Send formatted payload
      });
      
      const requestEndTime = Date.now();
      console.log(`[use-schedule-generator] Request completed at: ${new Date(requestEndTime).toISOString()}, took ${requestEndTime - requestStartTime}ms`);
      
      console.log('[use-schedule-generator] Response status:', response.status);
      
      if (!response.ok) {
        let errorData: { message?: string } = {};
        const responseText = await response.text();
        try {
          errorData = JSON.parse(responseText);
          console.error('[use-schedule-generator] Server error response (parsed JSON):', errorData);
        } catch (e) {
          console.error('[use-schedule-generator] Failed to parse error response as JSON. Response text:', responseText);
          if (responseText.trim().startsWith('<!doctype html>') || responseText.trim().startsWith('<html')) {
            errorData = { message: `서버 연결 오류가 발생했습니다. (응답 내용이 HTML임) Status: ${response.status}` };
          } else {
             errorData = { message: `서버 응답 오류: ${response.status}. 응답: ${responseText.substring(0, 200)}...` };
          }
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const rawData = await response.json();
      
      // 서버 응답 데이터 상세 로깅
      console.group('[SERVER_RESPONSE] 서버 응답 데이터');
      console.log('전체 원본 응답 데이터:', JSON.stringify(rawData, null, 2));

      let data: NewServerScheduleResponse;
      // Nested result processing (copied from existing logic)
      if (rawData && typeof rawData === 'object' && 'schedule' in rawData && 'route_summary' in rawData) {
         data = rawData as NewServerScheduleResponse;
      } else if (rawData && typeof rawData === 'object' && 'result' in rawData && (rawData.result as any)?.schedule && (rawData.result as any)?.route_summary) {
        console.log('[use-schedule-generator] Converting nested result format');
        data = {
          schedule: (rawData.result as any).schedule,
          route_summary: (rawData.result as any).route_summary,
          total_reward: (rawData.result as any).total_reward,
        };
      } else {
         console.error('[use-schedule-generator] Unexpected server response format. Trying to use as is.', rawData);
         data = rawData as NewServerScheduleResponse; // Potentially problematic, but keep existing behavior
      }
      
      if (data.schedule) {
        console.log('일정 항목 수:', data.schedule.length);
        console.table(data.schedule.map(item => ({
          id: item.id ?? 'N/A', // Use nullish coalescing for potentially undefined id
          place_name: item.place_name,
          place_type: item.place_type,
          time_block: item.time_block
        })));
      }
      
      if (data.route_summary) {
        console.log('경로 요약 정보:', data.route_summary.length, '일차');
        data.route_summary.forEach((day, idx) => {
          console.log(`${idx + 1}일차 경로:`, {
            day: day.day,
            status: day.status,
            total_distance_m: day.total_distance_m,
            interleaved_route_length: day.interleaved_route?.length || 0
          });
          
          if (day.interleaved_route && day.interleaved_route.length > 0) {
            console.log(`${idx + 1}일차 interleaved_route:`, day.interleaved_route);
          }
        });
      }
      console.groupEnd();

      if (!isNewServerScheduleResponse(data)) {
        console.error('[use-schedule-generator] Invalid server response format after processing:', data);
        console.error('[use-schedule-generator] Original raw data was:', rawData);
        throw new Error('서버 응답 형식이 올바르지 않습니다.');
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
      setIsGenerating(false);
    }
  }, []);

  const getLastSentPayload = useCallback(() => {
    return lastSentPayloadRef.current;
  }, []);

  return { generateSchedule, isGenerating, getLastSentPayload };
};

