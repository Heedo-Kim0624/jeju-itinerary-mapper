import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useServerResponseHandler } from '@/hooks/schedule/useServerResponseHandler';
import { useScheduleStateAndEffects } from '@/hooks/schedule/useScheduleStateAndEffects';
import { useScheduleGenerationCore } from '@/hooks/schedule/useScheduleGenerationCore';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { type ItineraryDay, type SelectedPlace, type NewServerScheduleResponse } from '@/types/core';

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

  const runScheduleGenerationProcess = useCallback(() => {
    console.log("[useScheduleManagement] Starting schedule generation process");
    
    if (combinedIsLoading) {
      console.log("[useScheduleManagement] Already generating schedule");
      return;
    }

    if (selectedPlaces.length === 0) {
      toast.error("선택된 장소가 없습니다. 장소를 선택해주세요.");
      return;
    }

    if (!startDatetime || !endDatetime) {
      toast.error("여행 날짜와 시간 정보가 올바르지 않습니다.");
      return;
    }
    
    console.log("[useScheduleManagement] Starting marker and route cleanup...");
    
    const clearEvent = new Event("startScheduleGeneration");
    window.dispatchEvent(clearEvent);
    console.log("[useScheduleManagement] startScheduleGeneration event dispatched (marker cleanup)");
    
    setTimeout(() => {
      if (clearAllRoutes) {
        clearAllRoutes();
        console.log("[useScheduleManagement] All routes cleared");
      }
      
      if (clearMarkersAndUiElements) {
        clearMarkersAndUiElements();
        console.log("[useScheduleManagement] All markers and UI elements cleared");
      }
      
      setIsManuallyGenerating(true);
      setIsLoadingState(true);
      console.log("[useScheduleManagement] Loading state set");
      
      setTimeout(() => {
        try {
          const event = new CustomEvent("startScheduleGeneration", {
            detail: {
              selectedPlaces,
              startDatetime,
              endDatetime,
              // Pass the callback that will process the server response.
              // The actual WebSocket/event listener for server data will call this.
              // This structure assumes that the actual server communication is managed elsewhere (e.g. global event listener)
              // and it will call `rawServerResponseReceived` event, which `useServerResponseHandler` listens to.
              // And `useServerResponseHandler` then calls its `onServerResponse` prop (which is `processServerResponse` from `useScheduleGenerationCore`).
            },
          });
          
          console.log("[useScheduleManagement] Detailed schedule generation event dispatched:", {
            selectedPlacesCount: selectedPlaces.length,
            startDatetime,
            endDatetime,
          });
          
          window.dispatchEvent(event);
          
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
