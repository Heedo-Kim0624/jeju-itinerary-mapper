
import { useState, useCallback } from 'react';
import { ItineraryDay, Place, SchedulePayload } from '@/types';
import { toast } from 'sonner';
import { summarizeItineraryData } from '@/utils/debugUtils';

interface CreateItineraryHandlerDeps {
  placesManagement: {
    selectedPlaces: Place[];
    candidatePlaces: Place[];
    prepareSchedulePayload: (places: Place[], startTime?: string, endTime?: string) => SchedulePayload;
    handleAutoCompletePlaces?: (category: string, placesFromApi: any[], travelDays: number | null) => void;
  };
  // tripDetails 타입을 수정하여 필요한 속성만 명시적으로 받도록 함
  tripDetails: {
    dates?: {
      startDate: Date | null;
      endDate: Date | null;
      startTime?: string;
      endTime?: string;
    };
    // 필요한 경우 startTime과 endTime을 직접 추가
    startTime?: string;
    endTime?: string;
  };
  runScheduleGeneration: (payload: SchedulePayload) => Promise<ItineraryDay[] | null>;
}

export const useCreateItineraryHandler = ({
  placesManagement,
  tripDetails,
  runScheduleGeneration,
}: CreateItineraryHandlerDeps) => {
  const [isCreatingItinerary, setIsCreatingItinerary] = useState(false);

  const createItinerary = useCallback(async () => {
    try {
      setIsCreatingItinerary(true);
      
      // 여행 날짜가 없으면 중단
      if (!tripDetails.dates?.startDate || !tripDetails.dates?.endDate) {
        toast.error("여행 시작일과 종료일을 설정해주세요.");
        setIsCreatingItinerary(false);
        return null;
      }
      
      const allPlaces = [
        ...placesManagement.selectedPlaces,
        ...placesManagement.candidatePlaces
      ];
      
      if (allPlaces.length === 0) {
        toast.error("여행지 장소를 선택해주세요.");
        setIsCreatingItinerary(false);
        return null;
      }
      
      // startTime과 endTime을 먼저 dates에서 찾고, 없으면 tripDetails에서 직접 찾음
      const startTime = tripDetails.dates?.startTime || tripDetails.startTime || "09:00";
      const endTime = tripDetails.dates?.endTime || tripDetails.endTime || "21:00";
      
      const payload = placesManagement.prepareSchedulePayload(
        allPlaces,
        startTime,
        endTime
      );
      
      console.log("[CreateItineraryHandler] 일정 생성 요청:", {
        places: allPlaces.length,
        startDate: tripDetails.dates?.startDate?.toISOString(),
        endDate: tripDetails.dates?.endDate?.toISOString(),
        startTime,
        endTime,
      });
      
      // 일정 생성 실행
      const itinerary = await runScheduleGeneration(payload);
      
      if (itinerary) {
        console.log("[CreateItineraryHandler] 일정 생성 결과:", summarizeItineraryData(itinerary));
        return itinerary;
      } else {
        console.error("[CreateItineraryHandler] 일정 생성 실패: 결과가 null입니다.");
        toast.error("일정 생성에 실패했습니다.");
        return null;
      }
    } catch (error) {
      console.error("[CreateItineraryHandler] 일정 생성 중 오류:", error);
      toast.error(`일정 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    } finally {
      setIsCreatingItinerary(false);
    }
  }, [placesManagement, tripDetails, runScheduleGeneration]);

  return {
    createItinerary,
    isCreatingItinerary
  };
};
