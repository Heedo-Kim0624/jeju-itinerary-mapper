
import { useItinerary } from '../use-itinerary';
import { usePanelVisibility } from '../use-panel-visibility';
import { Place } from '@/types/supabase';
import { toast } from 'sonner';

export const useItineraryHandling = () => {
  const {
    itinerary,
    selectedItineraryDay,
    handleSelectItineraryDay,
    generateItinerary
  } = useItinerary();
  
  const { showItinerary, setShowItinerary } = usePanelVisibility();
  
  // Itinerary creation handler
  const handleCreateItinerary = (
    selectedPlaces: Place[], 
    startDate?: Date, 
    endDate?: Date, 
    startTime?: string, 
    endTime?: string
  ) => {
    if (!startDate || !endDate || !startTime || !endTime) {
      toast.error("여행 날짜와 시간을 선택해주세요");
      return;
    }
    
    if (selectedPlaces.length > 0) {
      console.log("경로 생성 시작:", {
        장소수: selectedPlaces.length,
        날짜: { startDate, endDate, startTime, endTime }
      });
      
      const generatedItinerary = generateItinerary(
        selectedPlaces,
        startDate,
        endDate,
        startTime,
        endTime
      );
      
      if (generatedItinerary) {
        setShowItinerary(true);
      }
    } else {
      console.error("경로 생성 불가:", { 날짜있음: !!(startDate && endDate), 장소수: selectedPlaces.length });
      toast.error("선택된 장소가 없습니다. 장소를 선택해주세요.");
    }
  };

  return {
    itinerary,
    selectedItineraryDay,
    showItinerary,
    setShowItinerary,
    handleSelectItineraryDay,
    handleCreateItinerary
  };
};
