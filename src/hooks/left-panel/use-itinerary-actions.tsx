
import { useCallback } from 'react';
import { toast } from 'sonner';
// Removed CategoryName import from '@/utils/categoryUtils'
import { CategoryName, Place, ItineraryDay, SchedulePayload } from '@/types';
import { TripDetailsState } from '../use-trip-details'; // Assuming this path

interface ItineraryActionsDeps {
  tripDetails: TripDetailsState;
  selectedPlaces: Place[];
  prepareSchedulePayload: () => SchedulePayload | null;
  generateItinerary: (payload: SchedulePayload) => Promise<ItineraryDay[] | null>;
  setShowItinerary: (show: boolean) => void;
  setCurrentPanel: (panel: 'region' | 'date' | 'category' | 'itinerary') => void;
}

export const useItineraryActions = (dependencies: ItineraryActionsDeps) => {
  const {
    tripDetails,
    selectedPlaces,
    prepareSchedulePayload,
    generateItinerary,
    setShowItinerary,
    setCurrentPanel,
  } = dependencies;

  const [isGenerating, setIsGenerating] = React.useState(false);


  const handleCreateItinerary = useCallback(async () => {
    if (!tripDetails.dates?.startDate || !tripDetails.dates?.endDate || !tripDetails.startDatetime || !tripDetails.endDatetime) {
      toast.error("여행 날짜와 시간을 먼저 설정해주세요.");
      return false;
    }
    if (selectedPlaces.length === 0) {
      toast.error("선택된 장소가 없습니다. 장소를 선택해주세요.");
      return false;
    }

    const schedulePayload = prepareSchedulePayload();
    if (!schedulePayload) {
      toast.error("일정 생성에 필요한 정보를 준비하지 못했습니다.");
      return false;
    }
    
    setIsGenerating(true);
    try {
      const itineraryData = await generateItinerary(schedulePayload);
      if (itineraryData) {
        setShowItinerary(true);
        setCurrentPanel('itinerary');
        toast.success("일정이 성공적으로 생성되었습니다!");
        return true;
      } else {
        toast.error("일정 생성에 실패했습니다. 다시 시도해주세요.");
        return false;
      }
    } catch (error) {
      console.error("Error creating itinerary:", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, [
    tripDetails,
    selectedPlaces,
    prepareSchedulePayload,
    generateItinerary,
    setShowItinerary,
    setCurrentPanel,
  ]);

  const handleCloseItinerary = useCallback(() => {
    setShowItinerary(false);
    setCurrentPanel('category'); // Or 'date' or 'region' depending on desired flow
    // Potentially clear itinerary data from state if needed
  }, [setShowItinerary, setCurrentPanel]);

  return {
    handleCreateItinerary,
    handleCloseItinerary,
    isGenerating,
  };
};
