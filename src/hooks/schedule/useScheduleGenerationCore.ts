
import { useCallback } from 'react';
import { toast } from 'sonner';
// GeoJsonNode 타입을 any로 변경하거나, 실제 정의된 경로에서 가져와야 합니다.
// 현재는 GeoJsonNode가 사용되지 않는 것으로 보여 any[]로 처리합니다.
import type { NewServerScheduleResponse, ItineraryDay, SelectedPlace } from '@/types/core';
import { useSupabaseDataFetcher } from '../data/useSupabaseDataFetcher';
import { useItineraryEnricher } from '../itinerary/useItineraryEnricher';
import { parseServerResponse } from './useServerResponseHandler'; // parseServerResponse는 useServerResponseHandler에서 export 되어야 합니다.

interface ScheduleGenerationCoreProps {
  selectedPlaces: SelectedPlace[];
  startDate: Date;
  geoJsonNodes: any[]; // GeoJsonNode[]에서 any[]로 변경
  setItinerary: (itinerary: ItineraryDay[]) => void;
  setSelectedDay: (day: number) => void;
  setServerRoutes: (routes: any) => void;
  setIsLoadingState: (isLoading: boolean) => void;
}

export const useScheduleGenerationCore = ({
  selectedPlaces,
  startDate,
  // geoJsonNodes, // 이 파라미터는 현재 사용되지 않는 것으로 보입니다.
  setItinerary,
  setSelectedDay,
  setServerRoutes,
  setIsLoadingState,
}: ScheduleGenerationCoreProps) => {
  const { fetchAllCategoryData } = useSupabaseDataFetcher();
  const { enrichItineraryData } = useItineraryEnricher();

  const processServerResponse = useCallback(
    async (serverResponse: NewServerScheduleResponse) => {
      console.log('[useScheduleGenerationCore] 서버 응답 처리 시작');

      try {
        // 1. Supabase 데이터 로드 확인
        await fetchAllCategoryData();
        console.log('[useScheduleGenerationCore] Supabase 데이터 로드 완료');

        // 2. 서버 응답 기본 파싱
        // parseServerResponse 함수는 useServerResponseHandler.ts 에서 가져옵니다.
        const parsedItinerary = parseServerResponse(serverResponse, startDate);
        if (!parsedItinerary || parsedItinerary.length === 0) {
          console.error('[useScheduleGenerationCore] 서버 응답 파싱 결과가 비어 있습니다.');
          toast.error('일정 생성 실패: 서버 응답을 파싱할 수 없습니다.');
          setIsLoadingState(false);
          return;
        }
        console.log('[useScheduleGenerationCore] 서버 응답 기본 파싱 완료', parsedItinerary.length, '일차');

        // 3. Supabase 데이터로 보강
        const enrichedItinerary = enrichItineraryData(parsedItinerary);
        console.log('[useScheduleGenerationCore] 데이터 보강 완료', enrichedItinerary);

        // 4. 상태 업데이트
        setItinerary(enrichedItinerary);
        setSelectedDay(1); // 첫 번째 날짜 선택
        setServerRoutes(serverResponse.route_summary || []);
        setIsLoadingState(false);

        toast.success(`${enrichedItinerary.length}일 일정이 생성되었습니다.`);
      } catch (error) {
        console.error('[useScheduleGenerationCore] 서버 응답 처리 중 오류:', error);
        toast.error('일정 생성 처리 중 오류가 발생했습니다.');
        setIsLoadingState(false);
      }
    },
    [startDate, setItinerary, setSelectedDay, setServerRoutes, setIsLoadingState, fetchAllCategoryData, enrichItineraryData, parseServerResponse] // parseServerResponse 추가
  );

  return {
    processServerResponse,
  };
};

