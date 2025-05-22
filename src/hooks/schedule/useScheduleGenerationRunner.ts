
import { useCallback } from 'react';
import { toast } from 'sonner';
import type { SelectedPlace } from '@/types/core';
import type { SchedulePayload, NewServerScheduleResponse, ItineraryDay } from '@/types/schedule';
import { useScheduleGenerator } from '@/hooks/use-schedule-generator';
import { useItineraryParser } from '@/hooks/itinerary/useItineraryParser';
import { useItinerary } from '@/hooks/use-itinerary';
import { summarizeServerResponse, summarizeItineraryData } from '@/utils/debugUtils';

export const useScheduleGenerationRunner = () => {
  const { generateSchedule, isGenerating: isLoadingScheduleGenerator, getLastSentPayload } = useScheduleGenerator();
  const { parseServerResponse } = useItineraryParser();
  const { handleServerItineraryResponse } = useItinerary();

  const runScheduleGeneration = useCallback(async (
    payload: SchedulePayload,
    selectedPlaces: SelectedPlace[], // This is still passed for now, but parseServerResponse won't use it directly for place details
    tripStartDate: Date | null = null
  ): Promise<ItineraryDay[] | null> => {
    console.log('[useScheduleGenerationRunner] 생성기 호출 직전, Payload:', payload, '여행 시작일:', tripStartDate?.toISOString());
    console.log('[useScheduleGenerationRunner] Conceptual Backend Interaction: The payload (above) is about to be sent to the server. The server will likely use its internal logic (e.g., optimization algorithms, database lookups) to process selected/candidate places against the provided timeline and constraints, generating raw schedule and route data.');
    
    try {
      const serverResponse: NewServerScheduleResponse | null = await generateSchedule(payload);
      
      console.log('[useScheduleGenerationRunner] 서버 응답 데이터 요약:', summarizeServerResponse(serverResponse));

      if (!serverResponse) {
        console.error('[useScheduleGenerationRunner] 서버 응답이 null입니다.');
        toast.error('일정 생성에 실패했습니다. (서버 응답 없음)');
        handleServerItineraryResponse([]);
        return null;
      }
      
      console.log('[useScheduleGenerationRunner] Conceptual Backend Interaction: Raw data received from server. The frontend will now parse this into an application-specific format.');
      
      const parsedItinerary = parseServerResponse(serverResponse, tripStartDate); 
      
      console.log('[useScheduleGenerationRunner] 파싱된 일정 데이터 요약:', summarizeItineraryData(parsedItinerary));
      
      if (parsedItinerary.length === 0 || parsedItinerary.every(day => day.places.length === 0)) {
        console.warn('[useScheduleGenerationRunner] 파싱된 일정에 유의미한 장소가 없습니다.');
        // toast.info("생성된 일정에 장소가 없으나, 서버 응답은 있었습니다."); // This could be too noisy if empty itineraries are common
      }
      
      console.log(`[useScheduleGenerationRunner] 생성기로부터 결과 받음: ${parsedItinerary.length}일치 일정. UI 업데이트 호출.`);
      console.log('[useScheduleGenerationRunner] Frontend Data Handling: The raw server response has been parsed and transformed by the frontend into a structured ItineraryDay[] format. This data is now being passed to handleServerItineraryResponse for state management.');
      const finalItinerary = handleServerItineraryResponse(parsedItinerary);
      
      console.log('[useScheduleGenerationRunner] 일정 생성 및 처리 완료.');
      return finalItinerary;

    } catch (error) {
      console.error('[useScheduleGenerationRunner] 일정 생성 중 오류 발생:', error);
      toast.error(`일정 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      handleServerItineraryResponse([]);
      return null;
    }
  }, [generateSchedule, parseServerResponse, handleServerItineraryResponse]);

  return { runScheduleGeneration, isGenerating: isLoadingScheduleGenerator };
};
