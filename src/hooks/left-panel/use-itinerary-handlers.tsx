import { useCallback } from 'react';
import { toast } from 'sonner';
import { Place, SchedulePayload, ItineraryDay, SelectedPlace } from '@/types/supabase';
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
    // These are now the locally formatted strings "YYYY-MM-DDTHH:mm:ss"
    startDatetimeLocal: string | null; 
    endDatetimeLocal: string | null;
    // ISO versions might still be around if needed by other parts, but payload uses local
    startDatetime: string | null; // ISO
    endDatetime: string | null;   // ISO
  }
  
  // The signature of generateItineraryFn should match what useItinerary.generateItinerary provides.
  // Assuming useItinerary.generateItinerary now expects local time strings.
  type GenerateItineraryFnType = (
    placesToUse: SelectedPlace[], // Changed Place[] to SelectedPlace[] for consistency
    tripDates: { startDate: Date; endDate: Date; startTime: string; endTime: string; },
    startLocal: string, // local formatted string
    endLocal: string    // local formatted string
  ) => Promise<ItineraryDay[] | null>; // Assuming it might be async if it calls schedule generation

  // 일정 생성 핸들러
  const handleCreateItinerary = useCallback(async (
    tripDetails: TripDetailsForItinerary,
    selectedPlaces: SelectedPlace[],
    generateItineraryFn: GenerateItineraryFnType,
    setShowItinerary: (show: boolean) => void,
    setCurrentPanel: (panel: string) => void
  ) => {
    if (!tripDetails.dates || !tripDetails.startDatetimeLocal || !tripDetails.endDatetimeLocal) {
      toast.error("여행 날짜와 시간을 먼저 설정해주세요.");
      return false;
    }
    
    if (selectedPlaces.length === 0) {
      toast.error("선택된 장소가 없습니다. 장소를 선택해주세요.");
      return false;
    }
    
    console.log("일정 생성 요청 (useItineraryHandlers):", {
      start: tripDetails.startDatetimeLocal,
      end: tripDetails.endDatetimeLocal
    });

    // generateItineraryFn (from useItinerary) is now responsible for calling useScheduleManagement
    // with all necessary details including startDatetimeLocal and endDatetimeLocal.
    const result = await generateItineraryFn(
      selectedPlaces, 
      tripDetails.dates, // Pass full dates object
      tripDetails.startDatetimeLocal,
      tripDetails.endDatetimeLocal
    );
      
    if (result && result.length > 0 && result.some(day => day.places.length > 0) ) {
      setShowItinerary(true);
      setCurrentPanel('itinerary');
      toast.success("일정이 준비되었습니다."); // More generic success
      return true;
    } else {
      // Error toast for empty/failed generation is now handled within useScheduleManagement
      // or if generateItineraryFn itself returns null for a known reason.
      // If result is null or empty, it implies failure that should have been toasted.
      console.error("일정 생성 실패 또는 빈 일정 반환됨 (useItineraryHandlers)");
      // setShowItinerary(false); // Keep itinerary view potentially, to show "no schedule" message
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
