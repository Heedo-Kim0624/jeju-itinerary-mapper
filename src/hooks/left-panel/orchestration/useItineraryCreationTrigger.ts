
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
      // 1단계: 먼저 마커 초기화 이벤트 발생 - 이 이벤트는 모든 마커를 즉시 제거
      console.log("[useItineraryCreationTrigger] startScheduleGeneration 이벤트 발생 (마커 초기화)");
      window.dispatchEvent(new CustomEvent('startScheduleGeneration'));
      await new Promise(resolve => setTimeout(resolve, 50)); // 이벤트 처리를 위한 짧은 지연
      
      // 2단계: 명시적으로 마커와 UI 요소 제거 함수 호출
      if (clearMarkersAndUiElements) {
        clearMarkersAndUiElements();
        console.log("[useItineraryCreationTrigger] 마커 및 UI 요소 제거 완료");
      } else {
        console.warn("[useItineraryCreationTrigger] clearMarkersAndUiElements 함수를 사용할 수 없습니다.");
      }

      // 3단계: 이전에 그려진 모든 경로 제거
      console.log("[useItineraryCreationTrigger] 이전에 그려진 모든 경로를 제거합니다.");
      if (clearAllRoutes) {
        clearAllRoutes();
        console.log("[useItineraryCreationTrigger] 경로 제거 완료");
      } else {
        console.warn("[useItineraryCreationTrigger] clearAllRoutes 함수를 사용할 수 없습니다.");
      }
      
      // 약간의 지연 후 일정 생성 시작 - 브라우저가 렌더링을 완료할 시간을 주기 위함
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // 일정 생성 함수 실행
      console.log("[useItineraryCreationTrigger] 일정 생성 함수 실행 시작");
      const result = await createItineraryFunction();
      console.log("[useItineraryCreationTrigger] 일정 생성 함수 실행 완료:", result ? `${result.length}일 일정` : "결과 없음");
      
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
