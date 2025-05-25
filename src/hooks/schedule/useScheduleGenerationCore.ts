
import { useCallback } from 'react';
import { toast } from 'sonner';
import type { SelectedPlace, GeoJsonNode, ItineraryDay, NewServerScheduleResponse } from '@/types/core';
// import { parseServerResponse } from './useScheduleParser'; // 더 이상 여기서 직접 사용하지 않음
import { useSupabaseDataFetcher } from '@/hooks/data/useSupabaseDataFetcher';
import { useItineraryEnricher } from '@/hooks/itinerary/useItineraryEnricher';
// import { useRouteMemoryStore } from '@/hooks/map/useRouteMemoryStore'; // onServerResponse에서 이미 처리
import type { ServerRouteDataForDay } from '@/hooks/map/useServerRoutes';

interface ScheduleGenerationCoreProps {
  selectedPlaces: SelectedPlace[];
  startDate: Date;
  geoJsonNodes: GeoJsonNode[]; 
  setItinerary: React.Dispatch<React.SetStateAction<ItineraryDay[]>>;
  setSelectedDay: (day: number) => void;
  setServerRoutes: (
    dayRoutes: Record<number, ServerRouteDataForDay> | 
               ((prevRoutes: Record<number, ServerRouteDataForDay>) => Record<number, ServerRouteDataForDay>)
  ) => void;
  setIsLoadingState: (loading: boolean) => void;
}

export const useScheduleGenerationCore = ({
  selectedPlaces,
  startDate,
  setItinerary,
  setSelectedDay,
  // setServerRoutes, // This is now handled within initializeFromServerResponse in useRouteMemoryStore
  setIsLoadingState,
}: ScheduleGenerationCoreProps) => {
  const { fetchAllCategoryData } = useSupabaseDataFetcher();
  const { enrichItineraryData } = useItineraryEnricher();
  // const { initializeFromServerResponse } = useRouteMemoryStore(); // onServerResponse에서 이미 처리

  // processServerResponse는 서버 응답을 받아 최종 itinerary를 만드는 역할
  // 이 함수가 onServerResponse 콜백으로 사용됨
  const processServerResponse = useCallback(async (serverResponse: NewServerScheduleResponse) => {
    console.log("[ScheduleGenerationCore] Processing server response in core hook:", serverResponse);
    setIsLoadingState(true);
    try {
      await fetchAllCategoryData(); 
      
      // 서버 응답 파싱 및 데이터 변환 (기존 parseServerResponse의 역할 일부)
      // ItineraryDay[]를 생성하는 로직이 필요.
      // 현재 useServerResponseHandler의 handleRawServerResponse가 이 역할을 하고,
      // 그 결과로 onServerResponse(이 함수의 인스턴스)를 호출.
      // 따라서 이 함수는 서버 응답을 받은 *후* 추가 처리(enrichment)를 담당.

      // 예시: 서버 응답에서 직접 ItineraryDay[]를 추출하거나 변환하는 로직이 있다면 여기서 수행.
      // 지금은 onServerResponse로 이미 NewServerScheduleResponse가 왔다고 가정.
      // 여기서 필요한 것은 NewServerScheduleResponse에서 ItineraryDay[]를 만드는 것.
      // 이 로직은 원래 parseServerResponse에 있었을 것으로 추정.
      // 임시로 빈 ItineraryDay[]를 생성하여 enrich하는 것으로 가정.
      // 실제로는 serverResponse.schedule 등을 파싱해야 함.

      const parsedItineraryDays: ItineraryDay[] = []; // TODO: Replace with actual parsing logic from serverResponse
      if (serverResponse && serverResponse.schedule) {
        // Basic parsing logic should be here or in a dedicated utility
        // For now, assuming serverResponse directly contains what enrichItineraryData needs
        // This part is complex and depends on the exact structure of NewServerScheduleResponse vs ItineraryDay[]
        // Let's assume for now that enrichItineraryData can handle some of this, or needs pre-parsed days.
        // For the sake of unblocking, we'll pass an empty array to enrich,
        // acknowledging this is a placeholder for actual parsing logic.
      }


      const enrichedItinerary = enrichItineraryData(parsedItineraryDays); // 임시로 빈 배열 전달
      
      setItinerary(enrichedItinerary);
      if (enrichedItinerary.length > 0) {
        setSelectedDay(1);
        toast.success("여행 일정이 생성되었습니다!");
      } else {
        toast.error("일정 생성 중 오류가 발생했거나, 생성된 일정이 없습니다.");
      }
    } catch (error) {
      console.error("Error processing server response in core:", error);
      toast.error("일정 처리 중 오류가 발생했습니다.");
      setItinerary([]);
    } finally {
      setIsLoadingState(false);
    }
  }, [
    setIsLoadingState, 
    fetchAllCategoryData, 
    enrichItineraryData, 
    setItinerary, 
    setSelectedDay
  ]);

  return { processServerResponse };
};

