
import { useState, useCallback } from 'react';
import { ItineraryDay, Place, SchedulePayload } from '@/types';
import { toast } from 'sonner';
import { summarizeItineraryData } from '@/utils/debugUtils';
import { CategoryName } from '@/utils/categoryUtils';

// Place를 SelectedPlace로 변환하는 타입 가드 함수 
function ensureCategoryName(category: string): CategoryName {
  const validCategories: CategoryName[] = ['숙소', '관광지', '음식점', '카페'];
  if (validCategories.includes(category as CategoryName)) {
    return category as CategoryName;
  }
  console.warn(`유효하지 않은 카테고리: ${category}, 기본값 '관광지'로 설정합니다.`);
  return '관광지';
}

interface CreateItineraryHandlerDeps {
  placesManagement: {
    selectedPlaces: Place[]; // Place[]는 SelectedPlace[] 할당 가능하도록 타입 어댑터 적용
    candidatePlaces: Place[]; // Place[]는 SelectedPlace[] 할당 가능하도록 타입 어댑터 적용
    // prepareSchedulePayload 시그니처를 useSelectedPlaces에서 제공하는 것과 일치시킴
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
  // runScheduleGeneration 시그니처는 payload만 받도록 유지 (어댑터가 외부에서 제공)
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
      
      // 전달받은 Place[] 배열 사용
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

      // ISO 8601 형식의 datetime 문자열 생성
      const startDatetimeISO = `${tripDetails.dates.startDate.toISOString().split('T')[0]}T${startTime}:00`;
      const endDatetimeISO = `${tripDetails.dates.endDate.toISOString().split('T')[0]}T${endTime}:00`;
      
      // 변경된 prepareSchedulePayload 호출 방식
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
        placesCount: allPlaces.length, // Log purposes
        startDatetime: startDatetimeISO,
        endDatetime: endDatetimeISO,
      });
      
      // payload만 전달하는 간소화된 함수 호출 (내부적으로 필요한 변환 처리)
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
