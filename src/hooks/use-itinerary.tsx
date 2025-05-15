import { useState } from 'react';
import { Itinerary } from '@/types/itinerary';
import { toast } from 'sonner';

// Helper function to generate a random ID
const generateRandomId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const useItinerary = () => {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [title, setTitle] = useState<string>("");

  /**
   * 생성된 일정 처리 함수
   */
  const handleItineraryCreated = async (generatedSchedule: any) => {
    if (!generatedSchedule || generatedSchedule.length === 0) {
      toast.error("일정 생성에 실패했습니다.");
      return false;
    }

    try {
      setItinerary({
        id: generateRandomId(), 
        title: title || "제주도 여행",
        schedule: generatedSchedule,
        totalDays: generatedSchedule.length,
        createdAt: new Date().toISOString()
      });
      
      // 일정 생성 성공 토스트 메시지
      toast.success(`${generatedSchedule.length}일 일정이 생성되었습니다!`);
      
      // 일정 통계 계산
      const totalPlaces = generatedSchedule.reduce((acc: number, day: any) => acc + day.places.length, 0);
      console.log(`[일정 생성] 총 ${generatedSchedule.length}일, ${totalPlaces}개 장소`);
      
      return true;
    } catch (error) {
      console.error("일정 저장 중 오류 발생:", error);
      toast.error("일정을 저장하는 중에 오류가 발생했습니다.");
      return false;
    }
  };

  const clearItinerary = () => {
    setItinerary(null);
  };

  return {
    itinerary,
    setItinerary: handleItineraryCreated,
    clearItinerary,
    title,
    setTitle
  };
};
