
import { useEffect } from 'react';

interface UseMarkerEventListenersProps {
  clearAllMarkers: () => void;
  forceMarkerUpdate: () => void;
  prevSelectedDayRef: React.MutableRefObject<number | null>;
}

export const useMarkerEventListeners = ({
  clearAllMarkers,
  forceMarkerUpdate,
  prevSelectedDayRef,
}: UseMarkerEventListenersProps) => {

  // Global event listeners for map markers
  useEffect(() => {
    // 일정 생성 시작 시 모든 마커 제거
    const handleStartGeneration = () => {
      console.log("[useMarkerEventListeners] startScheduleGeneration event detected");
      clearAllMarkers();
    };

    // 일차 선택 시 마커 업데이트
    const handleDaySelected = (event: any) => {
      if (!event.detail || typeof event.detail.day !== 'number') return;

      const { day } = event.detail;
      console.log(`[useMarkerEventListeners] itineraryDaySelected event received with day: ${day}`);

      // 일차가 변경된 경우에만 처리 (불필요한 업데이트 방지)
      if (prevSelectedDayRef.current !== day) {
        console.log(`[useMarkerEventListeners] Selected day changed from ${prevSelectedDayRef.current} to ${day}, forcing update.`);
        prevSelectedDayRef.current = day;
        
        // 모든 마커 초기화 후 강제 업데이트
        clearAllMarkers();
        forceMarkerUpdate();
      } else {
        console.log(`[useMarkerEventListeners] Same day selected (${day}), still updating markers for consistency.`);
        // 동일한 일차여도 마커 초기화 후 업데이트 (일관성 유지)
        clearAllMarkers();
        forceMarkerUpdate();
      }
    };

    // 시각화 시작 이벤트 처리
    const handleStartVisualization = (event: any) => {
      console.log("[useMarkerEventListeners] startScheduleVisualization event detected");
      const day = event.detail?.day;
      
      if (day) {
        console.log(`[useMarkerEventListeners] Visualization for day ${day}`);
        prevSelectedDayRef.current = day;
      }
      
      clearAllMarkers();
      forceMarkerUpdate();
    };

    // 이벤트 리스너 등록 및 삭제
    window.addEventListener('startScheduleGeneration', handleStartGeneration);
    window.addEventListener('itineraryDaySelected', handleDaySelected);
    window.addEventListener('startScheduleVisualization', handleStartVisualization);

    return () => {
      window.removeEventListener('startScheduleGeneration', handleStartGeneration);
      window.removeEventListener('itineraryDaySelected', handleDaySelected);
      window.removeEventListener('startScheduleVisualization', handleStartVisualization);
    };
  }, [clearAllMarkers, forceMarkerUpdate, prevSelectedDayRef]);
};
