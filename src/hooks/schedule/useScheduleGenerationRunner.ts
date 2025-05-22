
import { useCallback } from 'react';
import { toast } from 'sonner';
import type { Place as CoreSelectedPlace } from '@/types/core'; // Renamed to avoid conflict with Place type
import type { SchedulePayload, NewServerScheduleResponse, ItineraryDay } from '@/types/schedule';
import { useScheduleGenerator } from '@/hooks/use-schedule-generator';
import { useItineraryParser } from '@/hooks/itinerary/useItineraryParser';
import { useItinerary } from '@/hooks/use-itinerary';
import { summarizeServerResponse, summarizeItineraryData } from '@/utils/debugUtils';

export const useScheduleGenerationRunner = () => {
  const { generateSchedule, isGenerating: isLoadingScheduleGenerator, getLastSentPayload } = useScheduleGenerator();
  const { parseServerResponse } = useItineraryParser();
  const { handleServerItineraryResponse } = useItinerary(); // handleServerItineraryResponse expects (parsedItinerary: ItineraryDay[])

  const runScheduleGeneration = useCallback(async (
    payload: SchedulePayload,
    selectedPlacesForParser: CoreSelectedPlace[], // These are the original selected places for context in parser
    tripStartDate: Date | null = null
  ): Promise<ItineraryDay[] | null> => {
    console.log('[useScheduleGenerationRunner] 생성기 호출 직전, Payload:', payload, '여행 시작일:', tripStartDate?.toISOString());
    
    try {
      const serverResponse: NewServerScheduleResponse | null = await generateSchedule(payload);
      
      console.log('[useScheduleGenerationRunner] 서버 응답 데이터 요약:', summarizeServerResponse(serverResponse));

      if (!serverResponse) {
        console.error('[useScheduleGenerationRunner] 서버 응답이 null입니다.');
        toast.error('일정 생성에 실패했습니다. (서버 응답 없음)');
        if (handleServerItineraryResponse) { // Check if handler exists
            handleServerItineraryResponse([]); // Update state with empty itinerary
        }
        return null;
      }
      
      const lastSentPayload = getLastSentPayload(); 
      console.log('[useScheduleGenerationRunner] 파서에 전달할 lastSentPayload:', lastSentPayload);
      
      // Ensure all arguments for parseServerResponse are provided
      const parsedItinerary = parseServerResponse(
        serverResponse, 
        selectedPlacesForParser, // Original selection for parser context
        tripStartDate, 
        lastSentPayload
      ); 
      
      console.log('[useScheduleGenerationRunner] 파싱된 일정 데이터 요약:', summarizeItineraryData(parsedItinerary));
      
      if (parsedItinerary.length === 0 || parsedItinerary.every(day => day.places.length === 0)) {
        console.warn('[useScheduleGenerationRunner] 파싱된 일정에 유의미한 장소가 없습니다.');
      }
      
      console.log(`[useScheduleGenerationRunner] 생성기로부터 결과 받음: ${parsedItinerary.length}일치 일정. UI 업데이트 호출.`);
      if (handleServerItineraryResponse) { // Check if handler exists
        handleServerItineraryResponse(parsedItinerary); // This will set itinerary state, returns void
      }
      
      console.log('[useScheduleGenerationRunner] 일정 생성 및 처리 완료.');
      return parsedItinerary; // Return the parsed itinerary directly

    } catch (error) {
      console.error('[useScheduleGenerationRunner] 일정 생성 중 오류 발생:', error);
      toast.error(`일정 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      if (handleServerItineraryResponse) { // Check if handler exists
        handleServerItineraryResponse([]); // Update state with empty itinerary on error
      }
      return null;
    }
  }, [generateSchedule, getLastSentPayload, parseServerResponse, handleServerItineraryResponse]);

  return { runScheduleGeneration, isGenerating: isLoadingScheduleGenerator };
};
