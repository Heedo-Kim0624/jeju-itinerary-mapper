
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { SelectedPlace } from '@/types/supabase';
import { NewServerScheduleResponse, isNewServerScheduleResponse, ItineraryDay } from '@/types/core';
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useSchedulePayload } from './useSchedulePayload';
import { useScheduleGenerationCore } from './useScheduleGenerationCore';
import { useFallbackItineraryGenerator } from './useFallbackItineraryGenerator';
import { MapContextGeoNode } from './parser-utils/coordinateTypes'; // Updated import path
import { useServerResponseHandler } from './useServerResponseHandler'; // Added this import

interface UseScheduleGenerationRunnerProps {
  selectedPlaces: SelectedPlace[];
  dates: { startDate: Date; endDate: Date; startTime: string; endTime: string; } | null;
  startDatetime: string | null;
  endDatetime: string | null;
  setItinerary: (itinerary: ItineraryDay[]) => void;
  setSelectedDay: (day: number | null) => void;
  setIsLoadingState: (loading: boolean) => void;
}

export const useScheduleGenerationRunner = ({
  selectedPlaces,
  dates,
  startDatetime, 
  endDatetime,   
  setItinerary,
  setSelectedDay,
  setIsLoadingState,
}: UseScheduleGenerationRunnerProps) => {
  const { generateSchedule: generateScheduleViaHook } = useScheduleGeneratorHook();
  const { setServerRoutes, geoJsonNodes } = useMapContext();
  
  const { preparePayload } = useSchedulePayload({ 
    selectedPlaces, 
    startDatetimeISO: startDatetime, 
    endDatetimeISO: endDatetime 
  });
  
  const { generateFallbackItinerary } = useFallbackItineraryGenerator();
  
  const { processServerResponse } = useScheduleGenerationCore({
    selectedPlaces,
    startDate: dates?.startDate || new Date(),
    geoJsonNodes: geoJsonNodes as MapContextGeoNode[],
    setItinerary,
    setSelectedDay,
    setServerRoutes,
    setIsLoadingState
  });
  
  const handleServerResponse = useCallback((response: NewServerScheduleResponse) => {
    processServerResponse(response);
    setTimeout(() => {
      setIsLoadingState(false);
    }, 500);
  }, [processServerResponse, setIsLoadingState]);
  
  useServerResponseHandler({
    onServerResponse: handleServerResponse,
    enabled: true // Assuming we always want this enabled when the runner is used. Adjust if needed.
  });

  const runScheduleGenerationProcess = useCallback(async () => {
    console.log("[useScheduleGenerationRunner] runScheduleGenerationProcess 시작");
    setIsLoadingState(true);
    
    try {
      const payload = preparePayload();
      console.log('Server request payload:', payload);
      
      if (!payload) {
        toast.error("일정 생성에 필요한 정보가 부족합니다.");
        setIsLoadingState(false);
        return;
      }

      const serverResponse = await generateScheduleViaHook(payload);
      console.log('[useScheduleGenerationRunner] 서버 원본 응답:', serverResponse);
      
      if (!serverResponse || 
          !isNewServerScheduleResponse(serverResponse) || 
          !serverResponse.route_summary || 
          serverResponse.route_summary.length === 0) {
        
        console.warn("[useScheduleGenerationRunner] 서버 응답이 유효하지 않아 대체 일정 생성");
        
        if (dates && selectedPlaces.length > 0) {
          const fallbackItinerary = generateFallbackItinerary(
            selectedPlaces,
            dates.startDate,
            dates.endDate,
            dates.startTime,
            dates.endTime
          );
          
          if (fallbackItinerary && fallbackItinerary.length > 0) {
            setItinerary(fallbackItinerary);
            setSelectedDay(fallbackItinerary[0].day);
            
            const event = new CustomEvent('itineraryCreated', { 
              detail: { 
                itinerary: fallbackItinerary,
                selectedDay: fallbackItinerary[0].day,
                isFallback: true
              } 
            });
            window.dispatchEvent(event);
            
            setTimeout(() => {
              window.dispatchEvent(new Event('forceRerender'));
            }, 100);
          }
        } else {
          toast.error("일정 생성에 필요한 정보가 부족합니다.");
        }
        
        setIsLoadingState(false);
      }
      // The 'else' block where serverResponse is valid is handled by the useServerResponseHandler
      // through the 'rawServerResponseReceived' event, which then calls processServerResponse.
      // So, no explicit call to processServerResponse(serverResponse) is needed here.
      // The `setIsLoadingState(false)` will be called in `handleServerResponse` or in the catch/finally block.

    } catch (error) {
      console.error("[useScheduleGenerationRunner] 일정 생성 중 오류:", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
      setIsLoadingState(false);
      
      const errorEvent = new CustomEvent('itineraryCreated', { 
        detail: { 
          itinerary: [],
          selectedDay: null,
          error: true
        } 
      });
      window.dispatchEvent(errorEvent);
    }
    // setIsLoadingState(false) should be handled more carefully.
    // If serverResponse is valid, handleServerResponse (via event) will set it.
    // If serverResponse is invalid (fallback case), it's set above.
    // If there's an error, it's set in the catch block.
    // Consider if there's any path where setIsLoadingState(false) is missed.
    // For now, the existing logic where handleServerResponse sets loading to false seems okay.
  }, [
    preparePayload,
    generateScheduleViaHook,
    // processServerResponse, // Removed because it's handled by the event listener
    selectedPlaces,
    dates,
    generateFallbackItinerary,
    setItinerary,
    setSelectedDay,
    setIsLoadingState,
    // handleServerResponse, // This is stable as it's wrapped in useCallback
  ]);

  return { 
    runScheduleGenerationProcess,
  };
};
