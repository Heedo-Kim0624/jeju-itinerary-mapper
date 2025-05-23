
import { useCallback } from 'react';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { toast } from 'sonner';
import type { ItineraryDay } from '@/types';

interface UseItineraryCreationTriggerProps {
  createItineraryFunction: () => Promise<ItineraryDay[] | null>;
  isCurrentlyGenerating: boolean;
}

export const useItineraryCreationTrigger = ({
  createItineraryFunction,
  isCurrentlyGenerating,
}: UseItineraryCreationTriggerProps) => {
  const { clearAllRoutes, clearMarkersAndUiElements } = useMapContext();

  const handleTriggerCreateItinerary = useCallback(async () => {
    if (isCurrentlyGenerating) {
      toast.info("일정 생성 중입니다. 잠시만 기다려주세요.");
      return null;
    }

    // 경로 생성 전에 지도의 모든 마커와 UI 요소를 제거 - 디버그 로깅 추가
    console.log("[useItineraryCreationTrigger] 지도에서 모든 마커와 UI 요소를 제거합니다.");
    
    try {
      if (clearMarkersAndUiElements) {
        clearMarkersAndUiElements();
        console.log("[useItineraryCreationTrigger] 마커 및 UI 요소 제거 완료");
      } else {
        console.warn("[useItineraryCreationTrigger] clearMarkersAndUiElements 함수를 사용할 수 없습니다.");
      }

      // 이전에 그려진 모든 경로 제거
      console.log("[useItineraryCreationTrigger] 이전에 그려진 모든 경로를 제거합니다.");
      if (clearAllRoutes) {
        clearAllRoutes();
        console.log("[useItineraryCreationTrigger] 경로 제거 완료");
      } else {
        console.warn("[useItineraryCreationTrigger] clearAllRoutes 함수를 사용할 수 없습니다.");
      }
      
      // 경로 생성 이벤트를 먼저 발송 - 이 이벤트를 통해 마커 초기화 로직이 실행됨
      window.dispatchEvent(new CustomEvent('startScheduleGeneration'));
      console.log("[useItineraryCreationTrigger] startScheduleGeneration 이벤트 발송 완료");
      
      // 약간의 지연 후 일정 생성 시작
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 일정 생성 함수 실행
      const result = await createItineraryFunction();
      return result;
    } catch (error) {
      console.error("[useItineraryCreationTrigger] 일정 생성 중 오류 발생:", error);
      return null;
    }
  }, [isCurrentlyGenerating, createItineraryFunction, clearMarkersAndUiElements, clearAllRoutes]);

  return {
    handleTriggerCreateItinerary,
  };
};
