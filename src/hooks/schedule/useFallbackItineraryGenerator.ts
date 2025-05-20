
import { toast } from 'sonner';
import { SelectedPlace, ItineraryDay as CoreItineraryDay } from '@/types/supabase';
import { useItineraryCreator, ItineraryDay as CreatorItineraryDay } from '@/hooks/use-itinerary-creator';

/**
 * 서버 응답 실패 시 클라이언트에서 대체 일정을 생성하는 훅
 */
export const useFallbackItineraryGenerator = () => {
  const { createItinerary } = useItineraryCreator();

  // 대체 일정 생성 함수
  const generateFallbackItinerary = (
    selectedPlaces: SelectedPlace[],
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string
  ): CoreItineraryDay[] | null => {
    try {
      console.log("[useFallbackItineraryGenerator] 클라이언트 대체 일정 생성 시작");
      
      if (selectedPlaces.length === 0) {
        console.warn("[useFallbackItineraryGenerator] 선택된 장소가 없어 대체 일정을 생성할 수 없습니다.");
        return null;
      }
      
      const fallbackItinerary = createItinerary(
        selectedPlaces,
        startDate,
        endDate,
        startTime,
        endTime
      );
      
      // CreatorItineraryDay[]를 CoreItineraryDay[]로 적절히 변환
      const mappedFallbackItinerary = convertCreatorToCore(fallbackItinerary, startDate);
      
      console.log("[useFallbackItineraryGenerator] 대체 일정 생성 완료:", mappedFallbackItinerary);
      toast.info("클라이언트에서 대체 일정을 생성했습니다.");
      
      return mappedFallbackItinerary;
    } catch (error) {
      console.error("[useFallbackItineraryGenerator] 클라이언트 대체 일정 생성 중 오류:", error);
      toast.error("대체 일정 생성에 실패했습니다.");
      return null;
    }
  };

  // CreatorItineraryDay[]를 CoreItineraryDay[]로 변환하는 유틸리티 함수
  const convertCreatorToCore = (creatorItinerary: CreatorItineraryDay[], startDate: Date): CoreItineraryDay[] => {
    return creatorItinerary.map((creatorDay, index) => {
      const currentDayDate = new Date(startDate);
      currentDayDate.setDate(startDate.getDate() + index);
      
      const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDayDate.getDay()];
      const date = `${(currentDayDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDayDate.getDate().toString().padStart(2, '0')}`;
      
      // 기본 필드를 모두 포함하는 CoreItineraryDay 객체 반환
      return {
        day: creatorDay.day,
        places: creatorDay.places.map(p => ({
          ...p,
          // 필요한 추가 필드가 있다면 여기에 추가
        })),
        totalDistance: creatorDay.totalDistance,
        // core.ts에서 정의한 필수 필드 추가
        routeData: { 
          nodeIds: [], 
          linkIds: [],
          segmentRoutes: [] 
        },
        interleaved_route: [],
        dayOfWeek: dayOfWeek,
        date: date
      };
    });
  };

  return {
    generateFallbackItinerary
  };
};
