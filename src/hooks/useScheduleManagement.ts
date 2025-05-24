
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useServerResponseHandler } from '@/hooks/schedule/useServerResponseHandler';
import { useScheduleStateAndEffects } from '@/hooks/schedule/useScheduleStateAndEffects';
import { useScheduleGenerationCore } from '@/hooks/schedule/useScheduleGenerationCore';
import { useMapContext } from '@/components/rightpanel/MapContext';
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
  const { clearMarkersAndUiElements, clearAllRoutes, setServerRoutes } = useMapContext();
  
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
    geoJsonNodes: [], 
    setItinerary,
    setSelectedDay,
    setServerRoutes,
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

    // 선택된 장소가 없는 경우 에러 처리
    if (selectedPlaces.length === 0) {
      toast.error("선택된 장소가 없습니다. 장소를 선택해주세요.");
      return;
    }

    // 날짜 정보가 없는 경우 에러 처리
    if (!startDatetime || !endDatetime) {
      toast.error("여행 날짜와 시간 정보가 올바르지 않습니다.");
      return;
    }

    // 명확한 단계별 로그 추가
    console.log("[useScheduleManagement] 마커와 경로 초기화 시작...");
    
    // 1. 먼저 모든 마커 초기화 이벤트 발생 (이 이벤트가 다른 컴포넌트에서 처리됨)
    window.dispatchEvent(new CustomEvent("startScheduleGeneration"));
    console.log("[useScheduleManagement] startScheduleGeneration 이벤트 발생 완료 (마커 초기화)");
    
    // 2. 약간의 지연 후 모든 경로 제거 - 명시적으로 호출
    setTimeout(() => {
      if (clearAllRoutes) {
        clearAllRoutes();
        console.log("[useScheduleManagement] 모든 경로 초기화 완료");
      }
      
      // 3. 모든 마커 및 UI 요소 명시적 제거
      if (clearMarkersAndUiElements) {
        clearMarkersAndUiElements();
        console.log("[useScheduleManagement] 모든 마커 및 UI 요소 초기화 완료");
      }
      
      // 4. 로딩 상태 시작
      setIsManuallyGenerating(true);
      setIsLoadingState(true);
      console.log("[useScheduleManagement] 로딩 상태 설정 완료");
      
      // 5. 실제 일정 생성 이벤트는 추가 지연 후 발생
      setTimeout(() => {
        try {
          const event = new CustomEvent("startScheduleGeneration", {
            detail: {
              selectedPlaces,
              startDatetime,
              endDatetime,
            },
          });
          
          console.log("[useScheduleManagement] 일정 생성 이벤트 발생:", {
            selectedPlaces: selectedPlaces.length,
            startDatetime,
            endDatetime,
          });
          
          window.dispatchEvent(event);
          
          // 30초 후에 자동으로 로딩 상태 해제 (타임아웃 처리)
          setTimeout(() => {
            if (combinedIsLoading) {
              console.log("[useScheduleManagement] 일정 생성 타임아웃 (30초)");
              setIsManuallyGenerating(false);
              setIsLoadingState(false);
              toast.error("일정 생성 시간이 초과되었습니다. 다시 시도해주세요.");
            }
          }, 30000);
        } catch (error) {
          console.error("[useScheduleManagement] 일정 생성 이벤트 발생 중 오류:", error);
          setIsManuallyGenerating(false);
          setIsLoadingState(false);
          toast.error("일정 생성 요청 중 오류가 발생했습니다.");
        }
      }, 300); // 마커 초기화 후 약간의 지연 시간 추가
    }, 100);
    
  }, [
    combinedIsLoading,
    selectedPlaces,
    startDatetime, 
    endDatetime, 
    isListenerRegistered,
    clearMarkersAndUiElements,
    clearAllRoutes,
    setIsLoadingState,
  ]);

  // 서버 응답 처리 완료 시 상태 초기화
  useEffect(() => {
    if (itinerary && itinerary.length > 0 && isManuallyGenerating) {
      console.log("[useScheduleManagement] 서버 응답 처리 완료, 로딩 상태 해제");
      setIsManuallyGenerating(false);
    }
  }, [itinerary, isManuallyGenerating]);

  return {
    itinerary,
    selectedDay,
    isLoading: combinedIsLoading,
    handleSelectDay,
    runScheduleGenerationProcess
  };
};
