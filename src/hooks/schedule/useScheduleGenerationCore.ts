
import { useCallback } from 'react';
import { toast } from 'sonner';
import type { NewServerScheduleResponse, ItineraryDay, SelectedPlace } from '@/types/core';
import { useSupabaseDataFetcher } from '../data/useSupabaseDataFetcher';
import { useItineraryEnricher } from '../itinerary/useItineraryEnricher';
import { parseServerResponse } from './useServerResponseHandler'; 
import type { ServerRouteDataForDay } from '../map/useServerRoutes'; // ServerRouteDataForDay 타입 임포트

interface ScheduleGenerationCoreProps {
  selectedPlaces: SelectedPlace[];
  startDate: Date;
  geoJsonNodes: any[]; 
  setItinerary: (itinerary: ItineraryDay[]) => void;
  setSelectedDay: (day: number) => void;
  setServerRoutes: (
    dayRoutes: Record<number, ServerRouteDataForDay> | 
               ((prevRoutes: Record<number, ServerRouteDataForDay>) => Record<number, ServerRouteDataForDay>)
  ) => void; // 타입 업데이트
  setIsLoadingState: (isLoading: boolean) => void;
}

export const useScheduleGenerationCore = ({
  selectedPlaces,
  startDate,
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
        await fetchAllCategoryData();
        console.log('[useScheduleGenerationCore] Supabase 데이터 로드 완료');

        const parsedItinerary = parseServerResponse(serverResponse, startDate);
        if (!parsedItinerary || parsedItinerary.length === 0) {
          console.error('[useScheduleGenerationCore] 서버 응답 파싱 결과가 비어 있습니다.');
          toast.error('일정 생성 실패: 서버 응답을 파싱할 수 없습니다.');
          setIsLoadingState(false);
          return;
        }
        console.log('[useScheduleGenerationCore] 서버 응답 기본 파싱 완료', parsedItinerary.length, '일차');

        const enrichedItinerary = enrichItineraryData(parsedItinerary);
        console.log('[useScheduleGenerationCore] 데이터 보강 완료', enrichedItinerary);

        setItinerary(enrichedItinerary);
        setSelectedDay(1); 
        setIsLoadingState(false); // setServerRoutes 호출 전에 로딩 상태 변경

        // 서버 경로 데이터 변환 및 설정
        const routeDataForMap: Record<number, ServerRouteDataForDay> = {};
        if (serverResponse.route_summary && Array.isArray(serverResponse.route_summary)) {
          // NewServerScheduleResponse의 route_summary 내부 객체가 ServerRouteDataForDay와 호환된다고 가정
          // 또는 필요한 필드(day, nodeIds, linkIds 등)를 가지고 있다고 가정
          serverResponse.route_summary.forEach((daySummary: any) => { 
            if (daySummary && typeof daySummary.day === 'number') {
              routeDataForMap[daySummary.day] = {
                day: daySummary.day,
                nodeIds: daySummary.nodeIds || daySummary.node_ids || [],
                linkIds: daySummary.linkIds || daySummary.link_ids || [],
                interleaved_route: daySummary.interleaved_route,
                // ServerRouteDataForDay에 필요한 다른 필드가 있다면 여기서 추가/매핑
              };
            } else {
               console.warn('[useScheduleGenerationCore] route_summary에 유효하지 않은 일차 데이터 포함:', daySummary);
            }
          });
        }
        
        console.log('[useScheduleGenerationCore] 지도에 설정할 경로 데이터:', routeDataForMap);
        setServerRoutes(routeDataForMap); // 변환된 데이터로 지도 컨텍스트 업데이트

        toast.success(`${enrichedItinerary.length}일 일정이 생성되었습니다.`);
      } catch (error) {
        console.error('[useScheduleGenerationCore] 서버 응답 처리 중 오류:', error);
        toast.error('일정 생성 처리 중 오류가 발생했습니다.');
        setIsLoadingState(false);
      }
    },
    [startDate, setItinerary, setSelectedDay, setServerRoutes, setIsLoadingState, fetchAllCategoryData, enrichItineraryData, parseServerResponse]
  );

  return {
    processServerResponse,
  };
};
