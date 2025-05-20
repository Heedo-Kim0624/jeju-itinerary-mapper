import { useCallback } from 'react';
import { toast } from 'sonner';
import { useTripDetails } from '@/hooks/use-trip-details';
import { Place, ItineraryDay, SchedulePayload } from '@/types/core';

interface UseItineraryCreationProps {
  tripDetails: ReturnType<typeof useTripDetails>;
  userDirectlySelectedPlaces: Place[];
  autoCompleteCandidatePlaces: Place[];
  prepareSchedulePayload: (
    startDatetimeISO: string | null,
    endDatetimeISO: string | null
  ) => SchedulePayload | null;
  generateItinerary: (payload: SchedulePayload) => Promise<ItineraryDay[] | null>;
  setShowItinerary: (show: boolean) => void;
  setCurrentPanel: (panel: 'region' | 'date' | 'category' | 'itinerary' | null) => void;
  setIsGenerating: (generating: boolean) => void;
  setItineraryReceived: (received: boolean) => void;
}

export const useItineraryCreation = ({
  tripDetails,
  userDirectlySelectedPlaces,
  autoCompleteCandidatePlaces,
  prepareSchedulePayload,
  generateItinerary,
  setShowItinerary,
  setCurrentPanel,
  setIsGenerating,
  setItineraryReceived,
}: UseItineraryCreationProps) => {
  const handleInitiateItineraryCreation = useCallback(async (): Promise<boolean> => {
    console.log("[ItineraryCreation] 일정 생성 시작 요청됨");
    setIsGenerating(true);
    setItineraryReceived(false); // Reset before new generation

    // tripDetails.dates 객체 내부의 startDate와 endDate, 그리고 tripDetails의 startDatetime, endDatetime을 직접 확인
    if (!tripDetails.dates.startDate || !tripDetails.dates.endDate || !tripDetails.startDatetime || !tripDetails.endDatetime) {
      toast.error("여행 날짜와 시간을 먼저 선택해주세요.");
      setIsGenerating(false);
      return false;
    }

    // Combine user-selected and auto-completed places for validation or other pre-checks if needed.
    // This list itself is not directly passed to the (new) prepareSchedulePayload.
    const allPlacesForValidation = [...userDirectlySelectedPlaces, ...autoCompleteCandidatePlaces];

    if (allPlacesForValidation.length === 0) {
      toast.info("경로를 생성하려면 최소한 하나 이상의 장소를 선택해주세요.");
      setIsGenerating(false);
      return false;
    }
    
    // Ensure all places for payload have IDs (checking combined list before payload prep)
    if (allPlacesForValidation.some(p => p.id === undefined || p.id === null)) {
      console.error("[ItineraryCreation] Some places for payload are missing IDs:", allPlacesForValidation.filter(p => p.id === undefined || p.id === null));
      toast.error("일부 장소 정보에 오류가 있어 일정을 생성할 수 없습니다. 장소 선택을 다시 확인해주세요.");
      setIsGenerating(false);
      return false;
    }
    
    // Call the updated prepareSchedulePayload (it uses selectedPlaces and candidatePlaces from its own closure)
    const payload = prepareSchedulePayload(
      tripDetails.startDatetime, // tripDetails에서 직접 startDatetime (local string) 사용
      tripDetails.endDatetime    // tripDetails에서 직접 endDatetime (local string) 사용
    );

    if (!payload) {
      // Error message already handled by prepareSchedulePayload or date checks
      setIsGenerating(false);
      return false;
    }

    try {
      console.log("[ItineraryCreation] 생성기 호출 직전, Payload:", JSON.stringify(payload, null, 2));
      const itineraryResult = await generateItinerary(payload);
      console.log("[ItineraryCreation] 생성기로부터 결과 받음:", itineraryResult ? `${itineraryResult.length}일치 일정` : "결과 없음");

      if (itineraryResult && itineraryResult.length > 0) {
        setShowItinerary(true);
        setCurrentPanel('itinerary');
        setItineraryReceived(true); 
        console.log("[ItineraryCreation] 일정 생성 성공 및 표시됨");
        return true;
      } else {
        toast.error("일정 생성에 실패했거나, 생성된 일정이 없습니다. 조건을 변경하여 다시 시도해 주세요.");
        setIsGenerating(false); 
        return false;
      }
    } catch (error) {
      console.error("[ItineraryCreation] 일정 생성 중 오류:", error);
      toast.error(`일정 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setIsGenerating(false); 
      return false;
    }
  }, [
    tripDetails,
    userDirectlySelectedPlaces, 
    autoCompleteCandidatePlaces,
    prepareSchedulePayload,
    generateItinerary,
    setShowItinerary,
    setCurrentPanel,
    setIsGenerating,
    setItineraryReceived,
  ]);

  const handleCloseItineraryPanel = useCallback(() => {
    setShowItinerary(false);
    setCurrentPanel(null); // Or 'category' or appropriate previous panel
  }, [setShowItinerary, setCurrentPanel]);

  return {
    handleInitiateItineraryCreation,
    handleCloseItineraryPanel,
  };
};
