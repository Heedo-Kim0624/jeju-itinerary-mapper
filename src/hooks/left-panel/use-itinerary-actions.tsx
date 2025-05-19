
import { useCallback } from 'react';
import { toast } from 'sonner';
import { CategoryName } from '@/utils/categoryUtils';
import { Place, ItineraryDay } from '@/types';
import { ItineraryDay as ServerItineraryDay } from '@/hooks/use-itinerary';

export interface ItineraryActions {
  createItinerary: () => Promise<boolean>;
  closeItinerary: () => void;
}

export interface UseItineraryActionsProps {
  selectedPlaces: Place[];
  dates: {
    startDate: Date | null;
    endDate: Date | null;
    startTime: string;
    endTime: string;
  };
  selectedRegions: string[];
  setShowItinerary: (show: boolean) => void;
  setItinerary: (itinerary: ItineraryDay[] | ServerItineraryDay[]) => void;
  setSelectedItineraryDay: (day: number | null) => void;
  categoriesWithPlaces: CategoryName[];
  runScheduleGenerationProcess?: () => Promise<void>;
}

export const useItineraryActions = ({
  selectedPlaces,
  dates,
  selectedRegions,
  setShowItinerary,
  setItinerary,
  setSelectedItineraryDay,
  categoriesWithPlaces,
  runScheduleGenerationProcess
}: UseItineraryActionsProps): ItineraryActions => {
  
  const createItinerary = useCallback(async (): Promise<boolean> => {
    if (!dates.startDate || !dates.endDate) {
      toast.error("여행 날짜를 선택해주세요.");
      return false;
    }
    
    if (selectedRegions.length === 0) {
      toast.error("지역을 선택해주세요.");
      return false;
    }
    
    if (selectedPlaces.length === 0) {
      toast.error("최소 한 개 이상의 장소를 선택해주세요.");
      return false;
    }
    
    if (categoriesWithPlaces.length < 2) {
      toast.error("최소 두 종류 이상의 카테고리에서 장소를 선택해주세요.");
      return false;
    }

    try {
      if (runScheduleGenerationProcess) {
        await runScheduleGenerationProcess();
        return true;
      } else {
        console.error("runScheduleGenerationProcess 함수가 제공되지 않았습니다.");
        return false;
      }
    } catch (error) {
      console.error("일정 생성 중 오류:", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
      return false;
    }
  }, [
    dates.startDate, 
    dates.endDate,
    selectedRegions,
    selectedPlaces,
    categoriesWithPlaces,
    runScheduleGenerationProcess
  ]);
    
  const closeItinerary = useCallback(() => {
    setShowItinerary(false);
    setSelectedItineraryDay(null);
  }, [setShowItinerary, setSelectedItineraryDay]);

  return {
    createItinerary,
    closeItinerary
  };
};
