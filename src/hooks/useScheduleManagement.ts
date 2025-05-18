
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { ItineraryDay, Place, SelectedPlace, ItineraryPlaceWithTime } from '@/types/supabase'; // Removed ServerRouteResponse
import { useMapContext } from '@/components/rightpanel/MapContext';
// Removed createItinerary import, createItineraryClientSide is kept if used, otherwise should be removed too.
// Assuming createItineraryClientSide is still used elsewhere or intended.
import { createItinerary as createItineraryClientSide } from '@/lib/itinerary/itinerary-utils'; 
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useScheduleStateAndEffects } from './schedule/useScheduleStateAndEffects';
import { useScheduleGenerationRunner } from './schedule/useScheduleGenerationRunner'; 

interface UseScheduleManagementProps {
  selectedPlaces: SelectedPlace[];
  dates: { startDate: Date; endDate: Date; startTime: string; endTime: string; } | null;
  startDatetime: string | null; 
  endDatetime: string | null;   
}

export const useScheduleManagement = ({
  selectedPlaces,
  dates,
  startDatetime,
  endDatetime,
}: UseScheduleManagementProps) => {
  const {
    itinerary,
    setItinerary,
    selectedDay,
    setSelectedDay,
    isLoadingState, 
    setIsLoadingState,
    handleSelectDay,
  } = useScheduleStateAndEffects();

  const { isGenerating: isServerGenerating, generateSchedule: generateScheduleViaSupaFunc } = useScheduleGeneratorHook();

  useEffect(() => {
    if (!isLoadingState && itinerary && itinerary.length > 0) {
      console.log("[useScheduleManagement] Validating generated itinerary:", itinerary);
      let isValid = true;
      const problematicDays: number[] = [];

      itinerary.forEach(day => {
        if (!day.places || day.places.length === 0) {
          // console.warn(`[useScheduleManagement] Day ${day.day} has no places.`);
          // isValid = false; 
          // problematicDays.push(day.day);
        }
      });

      if (!isValid) {
        toast.warning(`일부 일자에 (${problematicDays.join(', ')}) 장소 정보가 비어있습니다. 일정을 확인해주세요.`);
      } else {
        console.log("[useScheduleManagement] Itinerary validation passed.");
      }
    }
  }, [itinerary, isLoadingState]);


  const { runScheduleGenerationProcess } = useScheduleGenerationRunner({
    selectedPlaces,
    dates,
    startDatetimeISO: startDatetime, 
    endDatetimeISO: endDatetime,     
    setItinerary, 
    setSelectedDay, 
    setIsLoadingState, 
  });

  const combinedIsLoading = isLoadingState || isServerGenerating;

  return {
    itinerary,
    selectedDay,
    isLoading: combinedIsLoading,
    handleSelectDay,
    runScheduleGenerationProcess, 
  };
};
