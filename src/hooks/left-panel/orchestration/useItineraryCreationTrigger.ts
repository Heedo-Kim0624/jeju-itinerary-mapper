
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

    // 경로 생성 전에 지도의 모든 마커와 UI 요소를 제거
    console.log("[useItineraryCreationTrigger] Clearing map markers and UI elements before itinerary creation.");
    if (clearMarkersAndUiElements) {
      clearMarkersAndUiElements();
    } else {
      console.warn("[useItineraryCreationTrigger] clearMarkersAndUiElements function is not available.");
    }

    // 이전에 그려진 모든 경로 제거 - 명확한 로깅 추가
    console.log("[useItineraryCreationTrigger] Clearing previous routes before itinerary creation.");
    if (clearAllRoutes) {
      clearAllRoutes();
    } else {
      console.warn("[useItineraryCreationTrigger] clearAllRoutes function is not available.");
    }
    
    // 일정 생성 함수 실행
    const result = await createItineraryFunction();
    return result;
  }, [isCurrentlyGenerating, createItineraryFunction, clearMarkersAndUiElements, clearAllRoutes]);

  return {
    handleTriggerCreateItinerary,
  };
};
