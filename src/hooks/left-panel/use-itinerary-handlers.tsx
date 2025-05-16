import { useCallback } from 'react';
import { toast } from 'sonner';
import { Place, SchedulePayload, ItineraryDay } from '@/types/supabase';
import { useMapContext } from '@/components/rightpanel/MapContext';

/**
 * 일정 관련 핸들러 훅
 */
export const useItineraryHandlers = () => {
  const { clearMarkersAndUiElements } = useMapContext();

  // Define a more specific type for tripDetails based on useTripDetails hook structure
  interface TripDetailsForItinerary {
    dates: {
      startDate: Date;
      endDate: Date;
      startTime: string;
      endTime: string;
    } | null; // Ensure dates can be null initially
    startDatetime: string | null;
    endDatetime: string | null;
  }

  // 일정 생성 핸들러
  const handleCreateItinerary = useCallback(async (
    tripDetails: TripDetailsForItinerary,
    selectedPlaces: Place[],
    prepareSchedulePayloadFn: (places: Place[], startISO: string | null, endISO: string | null) => SchedulePayload | null,
    generateItineraryFn: (placesToUse: Place[], startDate: Date, endDate: Date, startTime: string, endTime: string) => ItineraryDay[] | null,
    setShowItinerary: (show: boolean) => void,
    setCurrentPanel: (panel: string) => void
  ) => {
    if (!tripDetails.dates || !tripDetails.startDatetime || !tripDetails.endDatetime) {
      toast.error("여행 날짜와 시간을 먼저 설정해주세요.");
      return false;
    }
    
    if (selectedPlaces.length === 0) {
      toast.error("선택된 장소가 없습니다. 장소를 선택해주세요.");
      return false;
    }
    
    // The recommendedPlacesGroupedByCategory logic seemed to be only for logging and wasn't used in payload generation.
    // If it's needed for other purposes, it should be re-evaluated. For now, removing to simplify.
    // console.log("추천 장소 (카테고리별 그룹화): ...); // This part is removed

    // 경로 생성 페이로드 준비 (using startDatetime and endDatetime from tripDetails)
    const payload = prepareSchedulePayloadFn(selectedPlaces, tripDetails.startDatetime, tripDetails.endDatetime);

    if (payload) {
      console.log("클라이언트 측 일정 생성 요청됨, 생성 함수 호출"); // Clarified this is client-side
      const result = generateItineraryFn(
        selectedPlaces, 
        tripDetails.dates.startDate, 
        tripDetails.dates.endDate, 
        tripDetails.dates.startTime, 
        tripDetails.dates.endTime
      );
      
      if (result) {
        setShowItinerary(true);
        setCurrentPanel('itinerary');
      }
      
      return !!result;
    } else {
      // prepareSchedulePayloadFn should handle its own error toasts if payload creation fails due to missing dates.
      // Or, if it returns null for other reasons, a generic error might be needed here.
      // For now, assuming prepareSchedulePayloadFn handles toasts for critical failures like missing dates.
      console.error("일정 생성에 필요한 정보가 부족하여 페이로드를 생성할 수 없습니다.");
      // toast.error("일정 생성에 필요한 정보가 부족합니다."); // This might be redundant if prepareSchedulePayloadFn toasts.
      return false;
    }
  }, []);

  // 일정 닫기 핸들러
  const handleCloseItinerary = useCallback((
    setShowItinerary: (show: boolean) => void,
    setCurrentPanel: (panel: string) => void
  ) => {
    setShowItinerary(false);
    clearMarkersAndUiElements(); // 지도 마커와 경로 제거
    setCurrentPanel('category'); // 또는 마지막 관련 패널로
  }, [clearMarkersAndUiElements]);

  return {
    handleCreateItinerary,
    handleCloseItinerary
  };
};
