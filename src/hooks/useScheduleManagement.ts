
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

  // Run schedule generation process function
  const runScheduleGenerationProcess = useCallback(() => {
    console.log("[useScheduleManagement] Starting schedule generation process");
    
    // Prevent duplicate execution
    if (combinedIsLoading) {
      console.log("[useScheduleManagement] Already generating schedule");
      return;
    }

    // Validate required data
    if (selectedPlaces.length === 0) {
      toast.error("선택된 장소가 없습니다. 장소를 선택해주세요.");
      return;
    }

    // Validate date info
    if (!startDatetime || !endDatetime) {
      toast.error("여행 날짜와 시간 정보가 올바르지 않습니다.");
      return;
    }

    // Clear step logs
    console.log("[useScheduleManagement] Starting marker and route cleanup...");
    
    // Clear all markers immediately with direct event
    const clearEvent = new Event("startScheduleGeneration");
    window.dispatchEvent(clearEvent);
    console.log("[useScheduleManagement] startScheduleGeneration event dispatched (marker cleanup)");
    
    // Chain clear operations with short delays to ensure proper sequence
    setTimeout(() => {
      // Clear all routes explicitly
      if (clearAllRoutes) {
        clearAllRoutes();
        console.log("[useScheduleManagement] All routes cleared");
      }
      
      // Clear all markers and UI elements
      if (clearMarkersAndUiElements) {
        clearMarkersAndUiElements();
        console.log("[useScheduleManagement] All markers and UI elements cleared");
      }
      
      // Set loading states
      setIsManuallyGenerating(true);
      setIsLoadingState(true);
      console.log("[useScheduleManagement] Loading state set");
      
      // Trigger actual schedule generation with detail
      setTimeout(() => {
        try {
          const event = new CustomEvent("startScheduleGeneration", {
            detail: {
              selectedPlaces,
              startDatetime,
              endDatetime,
            },
          });
          
          console.log("[useScheduleManagement] Detailed schedule generation event dispatched:", {
            selectedPlacesCount: selectedPlaces.length,
            startDatetime,
            endDatetime,
          });
          
          window.dispatchEvent(event);
          
          // Timeout safety net
          setTimeout(() => {
            if (isManuallyGenerating || isLoadingState) {
              console.log("[useScheduleManagement] Schedule generation timed out (30s)");
              setIsManuallyGenerating(false);
              setIsLoadingState(false);
              toast.error("일정 생성 시간이 초과되었습니다. 다시 시도해주세요.");
            }
          }, 30000);
        } catch (error) {
          console.error("[useScheduleManagement] Error dispatching schedule generation event:", error);
          setIsManuallyGenerating(false);
          setIsLoadingState(false);
          toast.error("일정 생성 요청 중 오류가 발생했습니다.");
        }
      }, 300);
    }, 100);
    
  }, [
    combinedIsLoading,
    selectedPlaces,
    startDatetime, 
    endDatetime, 
    clearMarkersAndUiElements,
    clearAllRoutes,
    setIsLoadingState,
    isManuallyGenerating,
    isLoadingState
  ]);

  // Reset state when server response is processed
  useEffect(() => {
    if (itinerary && itinerary.length > 0 && isManuallyGenerating) {
      console.log("[useScheduleManagement] Server response processed, resetting loading state");
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
