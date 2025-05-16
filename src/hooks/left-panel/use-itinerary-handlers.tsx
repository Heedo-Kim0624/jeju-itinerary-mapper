
import { useCallback } from 'react';
import { toast } from 'sonner';
import { Place, SchedulePayload, ItineraryDay } from '@/types/supabase';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useScheduleGenerator } from '@/hooks/use-schedule-generator';

/**
 * 일정 관련 핸들러 훅
 */
export const useItineraryHandlers = () => {
  const { clearMarkersAndUiElements } = useMapContext();
  const { generateSchedule } = useScheduleGenerator();

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
    console.log('[handleCreateItinerary] 함수 호출됨, 인자:', {
      tripDetails: tripDetails ? {
        startDatetime: tripDetails.startDatetime,
        endDatetime: tripDetails.endDatetime,
        hasDates: !!tripDetails.dates
      } : 'null',
      selectedPlacesCount: selectedPlaces.length,
    });
    
    if (!tripDetails.dates || !tripDetails.startDatetime || !tripDetails.endDatetime) {
      toast.error("여행 날짜와 시간을 먼저 설정해주세요.");
      return false;
    }
    
    if (selectedPlaces.length === 0) {
      toast.error("선택된 장소가 없습니다. 장소를 선택해주세요.");
      return false;
    }
    
    // 경로 생성 페이로드 준비 (using startDatetime and endDatetime from tripDetails)
    const payload = prepareSchedulePayloadFn(selectedPlaces, tripDetails.startDatetime, tripDetails.endDatetime);

    if (payload) {
      console.log("[handleCreateItinerary] 서버 일정 생성 요청 시작, payload:", JSON.stringify(payload, null, 2));
      
      try {
        // 서버에 일정 생성 요청
        const serverResponse = await generateSchedule(payload);
        
        if (serverResponse && serverResponse.route_summary && serverResponse.route_summary.length > 0) {
          console.log("[handleCreateItinerary] 서버 응답 성공:", serverResponse);
          setShowItinerary(true);
          setCurrentPanel('itinerary');
          return true;
        } else {
          console.warn("[handleCreateItinerary] 서버 응답 없거나 불완전함, 클라이언트 측 일정 생성으로 폴백");
          // 서버 응답이 없거나 불완전할 경우 클라이언트 측 일정 생성으로 폴백
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
        }
      } catch (error) {
        console.error("[handleCreateItinerary] 서버 요청 중 오류 발생:", error);
        // 오류 발생 시 클라이언트 측 일정 생성으로 폴백
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
      }
    } else {
      console.error("[handleCreateItinerary] 페이로드 생성 실패");
      toast.error("일정 생성에 필요한 정보가 부족합니다.");
      return false;
    }
  }, [generateSchedule]);

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
