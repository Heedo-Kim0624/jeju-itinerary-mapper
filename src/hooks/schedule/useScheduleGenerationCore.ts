import { useCallback } from 'react';
import { toast } from 'sonner';
import type { ItineraryDay, Place as SelectedPlace, NewServerScheduleResponse } from '@/types/core';
import type { GeoJsonNodeFeature } from '@/components/rightpanel/geojson/GeoJsonTypes';
import { useItineraryParser } from '@/hooks/itinerary/useItineraryParser';
import type { ServerRouteDataForDay } from '@/hooks/map/useServerRoutes';

interface UseScheduleGenerationCoreProps {
  selectedPlaces: SelectedPlace[];
  startDate: Date;
  geoJsonNodes: GeoJsonNodeFeature[];
  setItinerary: (itinerary: ItineraryDay[]) => void;
  setSelectedDay: (day: number | null) => void;
  setServerRoutes: (
    routes: Record<number, ServerRouteDataForDay> | 
            ((prevRoutes: Record<number, ServerRouteDataForDay>) => Record<number, ServerRouteDataForDay>)
  ) => void;
  setIsLoadingState: (loading: boolean) => void;
}

export const useScheduleGenerationCore = ({
  selectedPlaces,
  startDate,
  geoJsonNodes,
  setItinerary,
  setSelectedDay,
  setServerRoutes,
  setIsLoadingState,
}: UseScheduleGenerationCoreProps) => {
  const { parseServerResponse } = useItineraryParser();

  const processServerResponse = useCallback(async (response: NewServerScheduleResponse) => {
    console.log('[ScheduleGenCore] 서버 응답 수신:', response);
    setIsLoadingState(true);

    if (!response || !response.schedule || !response.route_summary) {
      toast.error('잘못된 서버 응답입니다. 다시 시도해주세요.');
      console.error('[ScheduleGenCore] Invalid server response:', response);
      setIsLoadingState(false);
      return;
    }

    try {
      const parsedItineraryDays = parseServerResponse(response, startDate);

      if (!parsedItineraryDays || parsedItineraryDays.length === 0) {
        toast.error('일정 생성에 실패했습니다. 입력값을 확인해주세요.');
        console.error('[ScheduleGenCore] Failed to parse itinerary or empty result.');
        setIsLoadingState(false);
        return;
      }
      
      console.log('[ScheduleGenCore] 파싱된 일정:', parsedItineraryDays.map(d => ({ day: d.day, placesCount: d.places.length, date: d.date, dayOfWeek: d.dayOfWeek })));
      setItinerary(parsedItineraryDays);

      const newServerRoutesData: Record<number, ServerRouteDataForDay> = {};
      parsedItineraryDays.forEach(dayData => {
        // Ensure all fields of ServerRouteDataForDay are initialized
        newServerRoutesData[dayData.day] = {
          day: dayData.day,
          itineraryDayData: dayData, // Store the full ItineraryDay object
          nodeIds: dayData.routeData?.nodeIds || [],
          linkIds: dayData.routeData?.linkIds || [],
          interleaved_route: dayData.interleaved_route || [], 
          polylinePaths: [], // Initialize with empty array for future caching
        };
      });

      console.log('[ScheduleGenCore] 생성된 ServerRoutesData (키 목록):', Object.keys(newServerRoutesData));
      if (parsedItineraryDays.length > 0 && newServerRoutesData[parsedItineraryDays[0].day]) {
        console.log('[ScheduleGenCore] 첫째 날 ServerRouteData 샘플:', newServerRoutesData[parsedItineraryDays[0].day]);
      }
      // Use functional update for setServerRoutes
      setServerRoutes(prevRoutes => ({ ...prevRoutes, ...newServerRoutesData }));


      if (parsedItineraryDays.length > 0) {
        setSelectedDay(parsedItineraryDays[0].day);
        toast.success('일정이 성공적으로 생성되었습니다!');
      }
      
      window.dispatchEvent(new CustomEvent('forceRerender'));

    } catch (error) {
      toast.error('일정 처리 중 오류가 발생했습니다.');
      console.error('[ScheduleGenCore] Error processing server response:', error);
    } finally {
      setIsLoadingState(false);
      console.log('[ScheduleGenCore] Process server response finished.');
    }
  }, [
    parseServerResponse,
    startDate,
    setItinerary,
    setSelectedDay,
    setServerRoutes,
    setIsLoadingState,
    // geoJsonNodes is not directly used in processServerResponse but is a prop, keep if necessary for other reasons
    // selectedPlaces is not directly used in processServerResponse
  ]);

  return { processServerResponse };
};
