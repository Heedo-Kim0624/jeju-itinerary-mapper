
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useServerResponseHandler } from '@/hooks/schedule/useServerResponseHandler';
import { useScheduleStateAndEffects } from '@/hooks/schedule/useScheduleStateAndEffects';
import { useScheduleGenerationCore } from '@/hooks/schedule/useScheduleGenerationCore';
import { useMapContext } from '@/components/rightpanel/MapContext'; // 추가: MapContext import
import { type ItineraryDay, type SelectedPlace } from '@/types/core';

interface ScheduleManagementProps {
  selectedPlaces: SelectedPlace[];
  dates: {
    startDate: Date | null;
    endDate: Date | null;
    startTime: string;
    endTime: string;
  } | null;
  startDatetime: string | null;
  endDatetime: string | null;
}

export const useScheduleManagement = ({
  selectedPlaces,
  dates,
  startDatetime,
  endDatetime
}: ScheduleManagementProps) => {
  const [isManuallyGenerating, setIsManuallyGenerating] = useState(false);
  const { clearMarkersAndUiElements } = useMapContext(); // 추가: MapContext에서 clearMarkersAndUiElements 가져오기
  
  const {
    itinerary,
    setItinerary,
    selectedDay,
    setSelectedDay,
    isLoadingState,
    setIsLoadingState,
    handleSelectDay,
  } = useScheduleStateAndEffects();

  const { processServerResponse } = useScheduleGenerationCore({
    selectedPlaces,
    startDate: dates?.startDate || new Date(),
    geoJsonNodes: [], // 사용하지 않으므로 빈 배열 전달
    setItinerary,
    setSelectedDay,
    setServerRoutes: () => {}, // 더미 함수
    setIsLoadingState,
  });

  const { isListenerRegistered } = useServerResponseHandler({
    onServerResponse: processServerResponse,
    enabled: isManuallyGenerating || isLoadingState
  });

  const combinedIsLoading = isLoadingState || isManuallyGenerating;

  // 일정 생성 프로세스 실행 함수
  const runScheduleGenerationProcess = useCallback(() => {
    console.log("[useScheduleManagement] 일정 생성 프로세스 시작");
    
    // 이미 생성 중이면 중복 실행 방지
    if (combinedIsLoading) {
      console.log("[useScheduleManagement] 이미 일정 생성 중입니다");
      return;
    }

    // 일정 생성 전에 마커 초기화
    if (clearMarkersAndUiElements) {
      console.log("[useScheduleManagement] 일정 생성 전 지도 마커 초기화");
      clearMarkersAndUiElements();
    } else {
      console.warn("[useScheduleManagement] clearMarkersAndUiElements 함수를 찾을 수 없습니다");
    }
    
    setIsManuallyGenerating(true);
    setIsLoadingState(true);
    
    // 서버 이벤트가 등록되어 있는지 확인
    if (!isListenerRegistered) {
      console.warn("[useScheduleManagement] 서버 응답 이벤트 리스너가 등록되어 있지 않습니다");
    }
    
    // 일정 생성 이벤트 발생 (외부 서버로 요청)
    try {
      const event = new CustomEvent("startScheduleGeneration", {
        detail: {
          selectedPlaces,
          startDatetime,
          endDatetime,
        },
      });
      
      console.log("[useScheduleManagement] startScheduleGeneration 이벤트 발생:", {
        selectedPlaces: selectedPlaces.length,
        startDatetime,
        endDatetime,
      });
      
      window.dispatchEvent(event);
      
      // 10초 후에 자동으로 로딩 상태 해제 (타임아웃 처리)
      setTimeout(() => {
        if (combinedIsLoading) {
          console.log("[useScheduleManagement] 일정 생성 타임아웃 (10초)");
          setIsManuallyGenerating(false);
          setIsLoadingState(false);
          toast.error("일정 생성 시간이 초과되었습니다. 다시 시도해주세요.");
        }
      }, 10000);
      
    } catch (error) {
      console.error("[useScheduleManagement] 일정 생성 이벤트 발생 중 오류:", error);
      setIsManuallyGenerating(false);
      setIsLoadingState(false);
      toast.error("일정 생성 요청 중 오류가 발생했습니다.");
    }
  }, [
    combinedIsLoading,
    selectedPlaces,
    startDatetime, 
    endDatetime, 
    isListenerRegistered,
    setIsLoadingState,
    clearMarkersAndUiElements
  ]);

  // 서버 응답 처리 완료 시 상태 초기화
  useEffect(() => {
    if (itinerary && itinerary.length > 0 && isManuallyGenerating) {
      console.log("[useScheduleManagement] 서버 응답 처리 완료, 로딩 상태 해제");
      setIsManuallyGenerating(false);
      setIsLoadingState(false);
    }
  }, [itinerary, isManuallyGenerating, setIsLoadingState]);

  return {
    itinerary,
    selectedDay,
    isLoading: combinedIsLoading,
    handleSelectDay,
    runScheduleGenerationProcess
  };
};
