import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { SelectedPlace } from '@/types/supabase';
import { NewServerScheduleResponse, isNewServerScheduleResponse, ItineraryDay } from '@/types/core';
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useSchedulePayload } from './useSchedulePayload';
import { useScheduleGenerationCore } from './useScheduleGenerationCore';
import { useFallbackItineraryGenerator } from './useFallbackItineraryGenerator';
import { useServerResponseHandler } from './useServerResponseHandler';
import { MapContextGeoNode } from './useScheduleParser';

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
    enabled: true
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
  }, [
    preparePayload,
    generateScheduleViaHook,
    selectedPlaces,
    dates,
    generateFallbackItinerary,
    setItinerary,
    setSelectedDay,
    setIsLoadingState,
  ]);

  return { 
    runScheduleGenerationProcess,
  };
};
