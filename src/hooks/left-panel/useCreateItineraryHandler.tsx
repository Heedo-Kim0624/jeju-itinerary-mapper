import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { SchedulePayload, Place, SelectedPlace as CoreSelectedPlace, ItineraryDay, CategoryName } from '@/types/core'; // Use CategoryName from core
import { summarizeItineraryData } from '@/utils/debugUtils';

interface UseCreateItineraryHandlerProps {
  placesManagement: {
    selectedPlaces: Place[]; // Expect Place[]
    candidatePlaces: Place[]; // Expect Place[]
  };
  tripDetails: {
    dates?: {
      startDate: Date | null;
      endDate: Date | null;
    };
    startDatetime?: string | null;
    endDatetime?: string | null;
  };
  runScheduleGeneration: (
    payload: SchedulePayload,
    selectedPlaces: CoreSelectedPlace[], // Expects CoreSelectedPlace[]
    tripStartDate: Date
  ) => Promise<ItineraryDay[] | null>;
}

export const useCreateItineraryHandler = ({
  placesManagement,
  tripDetails,
  runScheduleGeneration,
}: UseCreateItineraryHandlerProps) => {
  const [isCreatingItineraryUiLock, setIsCreatingItineraryUiLock] = useState(false);

  const createItinerary = useCallback(async () => {
    if (placesManagement.selectedPlaces.length === 0) {
      toast.error("선택된 장소가 없습니다. 장소를 선택해주세요.");
      return null;
    }

    if (!tripDetails.dates?.startDate || !tripDetails.dates?.endDate || !tripDetails.startDatetime || !tripDetails.endDatetime) {
      toast.error("여행 날짜와 시간을 먼저 설정해주세요.");
      return null;
    }
    
    setIsCreatingItineraryUiLock(true);
    let result: ItineraryDay[] | null = null;
    try {
      // Convert Place[] to CoreSelectedPlace[] for runScheduleGeneration
      const selectedCorePlaces: CoreSelectedPlace[] = placesManagement.selectedPlaces.map(p => ({
        ...p, // Spread all properties from Place
        id: String(p.id), // Ensure ID is string
        category: p.category as CategoryName, // Cast to CoreCategoryName
        isSelected: p.isSelected !== undefined ? p.isSelected : true, // Default isSelected
        isCandidate: p.isCandidate !== undefined ? p.isCandidate : false, // Default isCandidate
      }));

      const selectedPlaceIds = new Set(selectedCorePlaces.map(p => String(p.id)));
      const candidateSchedulePlaces = placesManagement.candidatePlaces
        .filter(p => !selectedPlaceIds.has(String(p.id)))
        .map(p => ({ 
          id: String(p.id), // Ensure ID is string for SchedulePlace
          name: p.name 
        }));

      const payload: SchedulePayload = {
        selected_places: selectedCorePlaces.map(p => ({ id: String(p.id), name: p.name })), // Ensure ID is string
        candidate_places: candidateSchedulePlaces,
        start_datetime: tripDetails.startDatetime!,
        end_datetime: tripDetails.endDatetime!,
      };
      
      console.log("[CreateItineraryHook] 일정 생성 시작, 페이로드:", {
        선택된장소수: payload.selected_places.length,
        후보장소수: payload.candidate_places.length,
        시작일시: payload.start_datetime,
        종료일시: payload.end_datetime,
        여행시작일_파서전달용: tripDetails.dates.startDate.toISOString()
      });
      
      result = await runScheduleGeneration(
        payload, 
        selectedCorePlaces, 
        tripDetails.dates.startDate
      );
      
      if (result) {
        console.log("[CreateItineraryHook] createItinerary 완료. 결과 요약:", summarizeItineraryData(result));
      } else {
        console.warn("[CreateItineraryHook] createItinerary: runScheduleGeneration returned null or empty.");
      }
    } catch (error) {
      console.error("[CreateItineraryHook] 일정 생성 중 오류:", error);
      toast.error(`일정 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없음'}`);
    } finally {
      setIsCreatingItineraryUiLock(false);
    }
    return result;
  }, [
    placesManagement.selectedPlaces, 
    placesManagement.candidatePlaces,
    tripDetails.dates, 
    tripDetails.startDatetime, 
    tripDetails.endDatetime,
    runScheduleGeneration
  ]);

  return {
    createItinerary,
    isCreatingItinerary: isCreatingItineraryUiLock,
  };
};
