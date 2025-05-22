
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { SchedulePayload, Place, SelectedPlace as CoreSelectedPlace, ItineraryDay } from '@/types';
import { summarizeItineraryData } from '@/utils/debugUtils'; // For logging consistency
import type { CategoryName } from '@/types/core'; // Added CategoryName import

interface UseCreateItineraryHandlerProps {
  placesManagement: {
    selectedPlaces: Place[];
    candidatePlaces: Place[];
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
    selectedPlaces: CoreSelectedPlace[],
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
      const selectedCorePlaces: CoreSelectedPlace[] = placesManagement.selectedPlaces.map(p => ({
        id: String(p.id),
        name: p.name,
        category: p.category as CategoryName, // Cast to CategoryName
        x: p.x,
        y: p.y,
        address: p.address,
        road_address: p.road_address,
        phone: p.phone,
        description: p.description,
        rating: p.rating,
        image_url: p.image_url,
        homepage: p.homepage,
        geoNodeId: p.geoNodeId,
        isSelected: true, // Place.isSelected가 undefined이면 true로 설정
        isCandidate: false, // Place.isCandidate가 undefined이면 false로 설정
      }));

      const selectedPlaceIds = new Set(selectedCorePlaces.map(p => String(p.id))); // Ensure string IDs
      const candidateSchedulePlaces = placesManagement.candidatePlaces
        .filter(p => !selectedPlaceIds.has(String(p.id)))
        .map(p => ({ 
          id: String(p.id),
          name: p.name 
        }));

      const payload: SchedulePayload = {
        selected_places: selectedCorePlaces.map(p => ({ id: String(p.id), name: p.name })),
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
