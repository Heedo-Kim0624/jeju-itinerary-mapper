
import { useCallback } from 'react';
import { toast } from 'sonner';
import type { SelectedPlace as CoreSelectedPlace } from '@/types/core'; // CoreSelectedPlace로 사용
import type { SchedulePayload, NewServerScheduleResponse, ItineraryDay } from '@/types/schedule'; // SchedulePayload, NewServerScheduleResponse, ItineraryDay 사용
import { useScheduleGenerator } from '@/hooks/use-schedule-generator'; // use-schedule-generator 사용
import { useItineraryParser } from '@/hooks/itinerary/useItineraryParser'; // useItineraryParser 사용
import { useItinerary } from '@/hooks/use-itinerary'; // use-itinerary 사용
import { summarizeServerResponse, summarizeItineraryData } from '@/utils/debugUtils';

export const useScheduleGenerationRunner = () => {
  const { generateSchedule, isGenerating: isLoadingScheduleGenerator } = useScheduleGenerator(); // 이름 변경
  const { parseServerResponse } = useItineraryParser();
  const { handleServerItineraryResponse } = useItinerary(); // 여기서 상태 업데이트

  const runScheduleGeneration = useCallback(async (
    payload: SchedulePayload,
    selectedPlaces: CoreSelectedPlace[], // CoreSelectedPlace 사용
    tripStartDate: Date | null = null // 여행 시작 날짜 추가
  ): Promise<ItineraryDay[] | null> => { // 반환 타입 명시
    console.log('[useScheduleGenerationRunner] 생성기 호출 직전, Payload:', payload, '여행 시작일:', tripStartDate?.toISOString());
    
    // isLoadingScheduleGenerator를 여기서 직접 UI 로딩 상태로 사용하거나,
    // 이 함수를 호출하는 컴포넌트(LeftPanel)에서 자체 로딩 상태를 관리해야 합니다.
    // useScheduleGenerator의 isGenerating은 API 호출 동안만 true입니다.

    try {
      const serverResponse: NewServerScheduleResponse | null = await generateSchedule(payload);
      
      console.log('[useScheduleGenerationRunner] 서버 응답 데이터 요약:', summarizeServerResponse(serverResponse));

      if (!serverResponse) {
        console.error('[useScheduleGenerationRunner] 서버 응답이 null입니다.');
        toast.error('일정 생성에 실패했습니다. (서버 응답 없음)');
        // 실패 시 빈 일정 이벤트 또는 null 반환
        handleServerItineraryResponse([]); // 빈 일정으로 UI 업데이트 시도
        return null;
      }
      
      const parsedItinerary = parseServerResponse(serverResponse, selectedPlaces, tripStartDate);
      
      console.log('[useScheduleGenerationRunner] 파싱된 일정 데이터 요약:', summarizeItineraryData(parsedItinerary));
      
      if (parsedItinerary.length === 0 || parsedItinerary.every(day => day.places.length === 0)) {
        console.warn('[useScheduleGenerationRunner] 파싱된 일정에 유의미한 장소가 없습니다.');
        toast.info('생성된 일정에 포함할 장소가 부족하거나 없습니다.');
        // 장소 없는 일정도 일단 전달하여 UI에서 처리하도록 함
      }
      
      // 파싱된 일정을 상태로 반영 (useItinerary 훅의 함수 사용)
      console.log(`[useScheduleGenerationRunner] 생성기로부터 결과 받음: ${parsedItinerary.length}일치 일정. UI 업데이트 호출.`);
      const finalItinerary = handleServerItineraryResponse(parsedItinerary); // 이 함수가 UI 업데이트 및 이벤트 트리거
      
      if (finalItinerary && finalItinerary.length > 0 && finalItinerary.some(day => day.places.length > 0)) {
        toast.success('일정이 성공적으로 생성되었습니다!');
      }
      console.log('[useScheduleGenerationRunner] 일정 생성 및 처리 완료.');
      return finalItinerary;

    } catch (error) {
      console.error('[useScheduleGenerationRunner] 일정 생성 중 오류 발생:', error);
      toast.error(`일정 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      handleServerItineraryResponse([]); // 오류 시 빈 일정으로 UI 업데이트
      return null;
    }
  }, [generateSchedule, parseServerResponse, handleServerItineraryResponse]);

  return { runScheduleGeneration, isGenerating: isLoadingScheduleGenerator }; // isGenerating 상태 반환
};
