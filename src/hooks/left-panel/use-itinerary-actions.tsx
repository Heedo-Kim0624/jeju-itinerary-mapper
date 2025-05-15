import { useState } from 'react';
import { toast } from 'sonner';
import { useItineraryCreator } from '../use-itinerary-creator';
import { useTripContext } from '@/components/leftpanel/TripContext';
import { usePanelVisibility } from '../use-panel-visibility';
import { calculateDaysBetween } from '@/utils/dateUtils';

export const useItineraryActions = () => {
  const { selectedPlaces } = useTripContext();
  const { dates } = useTripContext();
  const { createItinerary, setItinerary } = useItineraryCreator();
  const [isGenerating, setIsGenerating] = useState(false);
  const { setItineraryPanelDisplayed } = usePanelVisibility();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  /**
   * 일정 생성 처리 함수
   */
  const handleCreateItinerary = async () => {
    if (!selectedPlaces || selectedPlaces.length === 0) {
      toast.error("선택한 장소가 없습니다.");
      return false;
    }
    
    if (!dates?.startDate || !dates?.endDate) {
      toast.error("여행 기간을 선택해주세요.");
      return false;
    }
    
    try {
      setIsGenerating(true);
      
      const dayCount = calculateDaysBetween(dates.startDate, dates.endDate);
      const timeSettings = {
        startTime: dates.startTime || "09:00",
        endTime: dates.endTime || "21:00"
      };
      
      console.log(`[일정 생성 시작] ${dayCount}일 일정, ${selectedPlaces.length}개 장소로 생성 중...`);
      
      // 일정 생성 호출
      const generatedSchedule = await createItinerary(
        selectedPlaces, 
        dayCount,
        timeSettings.startTime,
        timeSettings.endTime
      );
      
      if (generatedSchedule.length === 0) {
        toast.error("일정 생성에 실패했습니다.");
        return false;
      }
      
      // 생성된 일정 설정
      setItinerary(generatedSchedule);
      setSelectedDay(1); // 첫째날 선택
      setItineraryPanelDisplayed(true);
      
      // 일정 생성 성공 토스트 메시지
      toast.success(`${generatedSchedule.length}일 일정이 생성되었습니다!`);
      
      // 통계 로그
      console.log(`[일정 생성 완료] ${generatedSchedule.length}일 일정이 생성되었습니다.`);
      return true;
      
    } catch (error) {
      console.error("일정 생성 중 오류 발생:", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    handleCreateItinerary
  };
};
