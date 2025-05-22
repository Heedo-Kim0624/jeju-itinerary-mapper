
import { useState, useCallback } from 'react';
import { ItineraryDay, Place, SchedulePayload, SelectedPlace } from '@/types'; // SelectedPlace 추가
import { toast } from 'sonner';
import { summarizeItineraryData } from '@/utils/debugUtils';
// import { CategoryName } from '@/utils/categoryUtils'; // CategoryName 직접 사용 줄임
// import { toCategoryName } from '@/utils/typeConversionUtils'; // 직접적인 사용처 없음

// Place를 SelectedPlace로 변환하는 타입 가드 함수 - 삭제됨
// function ensureCategoryName(category: string): CategoryName {
//   const validCategories: CategoryName[] = ['숙소', '관광지', '음식점', '카페'];
//   if (validCategories.includes(category as CategoryName)) {
//     return category as CategoryName;
//   }
//   console.warn(`유효하지 않은 카테고리: ${category}, 기본값 '관광지'로 설정합니다.`);
//   return '관광지';
// }

interface CreateItineraryHandlerDeps {
  placesManagement: {
    // 이들은 useSelectedPlaces에서 오며, 해당 훅은 SelectedPlace[]를 반환해야 합니다.
    // 타입 일치를 위해 SelectedPlace[]로 변경하거나, useSelectedPlaces가 Place[]를 반환한다면
    // 여기서 변환이 필요하지만, 현재는 useAdaptedScheduleGenerator에서 변환이 일어납니다.
    // 우선 Place[]로 두고, 상위 어댑터에 의존합니다.
    selectedPlaces: Place[]; 
    candidatePlaces: Place[]; 
    prepareSchedulePayload: (startDatetimeISO: string | null, endDatetimeISO: string | null) => SchedulePayload | null;
    handleAutoCompletePlaces?: (category: string, placesFromApi: any[], travelDays: number | null) => void;
  };
  tripDetails: {
    dates?: {
      startDate: Date | null;
      endDate: Date | null;
      startTime?: string;
      endTime?: string;
    };
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
      
      if (!tripDetails.dates?.startDate || !tripDetails.dates?.endDate) {
        toast.error("여행 시작일과 종료일을 설정해주세요.");
        setIsCreatingItinerary(false);
        return null;
      }
      
      // placesManagement.selectedPlaces와 candidatePlaces는 Place[] 타입입니다.
      // 이들은 useAdaptedScheduleGenerator로 전달되어 거기서 SelectedPlace[]로 변환됩니다.
      const allPlaces = [
        ...placesManagement.selectedPlaces,
        ...placesManagement.candidatePlaces
      ];
      
      if (allPlaces.length === 0) {
        toast.error("여행지 장소를 선택해주세요.");
        setIsCreatingItinerary(false);
        return null;
      }
      
      const startTime = tripDetails.dates?.startTime || tripDetails.startTime || "09:00";
      const endTime = tripDetails.dates?.endTime || tripDetails.endTime || "21:00";

      const startDatetimeISO = `${tripDetails.dates.startDate.toISOString().split('T')[0]}T${startTime}:00`;
      const endDatetimeISO = `${tripDetails.dates.endDate.toISOString().split('T')[0]}T${endTime}:00`;
      
      const payload = placesManagement.prepareSchedulePayload(
        startDatetimeISO,
        endDatetimeISO
      );

      if (!payload) {
        console.error("[CreateItineraryHandler] Payload 생성 실패.");
        toast.error("일정 생성에 필요한 정보를 준비하지 못했습니다.");
        setIsCreatingItinerary(false);
        return null;
      }
      
      console.log("[CreateItineraryHandler] 일정 생성 요청:", {
        placesCount: allPlaces.length,
        startDatetime: startDatetimeISO,
        endDatetime: endDatetimeISO,
      });
      
      const itinerary = await runScheduleGeneration(payload); // runScheduleGeneration은 adapted된 버전
      
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

