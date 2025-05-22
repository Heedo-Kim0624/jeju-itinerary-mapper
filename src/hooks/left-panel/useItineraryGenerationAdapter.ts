import { useCallback } from 'react';
import { toast } from 'sonner';
import type { Place, ItineraryDay, SchedulePayload } from '@/types/core';
import type { useItinerary } from '@/hooks/use-itinerary';
import type { useSelectedPlaces } from '@/hooks/use-selected-places';
import type { useTripDetails } from '@/hooks/use-trip-details';

type ItineraryManagementHook = ReturnType<typeof useItinerary>;
type PlacesManagementHook = ReturnType<typeof useSelectedPlaces>;
type TripDetailsHook = ReturnType<typeof useTripDetails>;

interface UseItineraryGenerationAdapterArgs {
  itineraryManagementHook: ItineraryManagementHook;
  placesManagement: PlacesManagementHook;
  tripDetailsHookResult: TripDetailsHook;
}

export const useItineraryGenerationAdapter = ({
  itineraryManagementHook,
  placesManagement,
  tripDetailsHookResult,
}: UseItineraryGenerationAdapterArgs) => {
  const generateItineraryAdapter = useCallback(async (payload: SchedulePayload): Promise<ItineraryDay[] | null> => {
    if (!tripDetailsHookResult.dates.startDate || !tripDetailsHookResult.dates.endDate) {
      console.error("[Adapter] Trip start or end date is missing in tripDetails.dates.");
      toast.error("여행 시작일 또는 종료일이 설정되지 않았습니다.");
      return null;
    }

    const placesForClientGenerator: Place[] = [
      ...(placesManagement.selectedPlaces as Place[]),
      ...(placesManagement.candidatePlaces as Place[]),
    ];

    if (placesForClientGenerator.length === 0) {
        toast.info("일정을 생성할 장소가 선택되지 않았습니다. (Adapter)");
        return null;
    }

    try {
      // This adapter seems to be for a client-side generator, not the server-side one
      // The useItineraryCreation hook later uses `runScheduleGeneration` from `useAdaptedScheduleGenerator`
      // which itself calls `runScheduleGenerationFromRunner` (i.e., server-side generation).
      // The current `generateItineraryAdapter` in `useLeftPanel` calls `itineraryManagementHook.generateItinerary`.
      // `itineraryManagementHook.generateItinerary` is from `useItineraryGenerator` which is a client-side generator.
      // This refactoring step keeps the existing logic.
      // If the goal was to use the server-side generator here, the logic in useItineraryCreation would need to change.
      return await itineraryManagementHook.generateItinerary(
        placesForClientGenerator,
        tripDetailsHookResult.dates.startDate,
        tripDetailsHookResult.dates.endDate,
        tripDetailsHookResult.startTime,
        tripDetailsHookResult.endTime
      );
    } catch (error) {
      console.error("일정 생성 어댑터에서 오류:", error);
      toast.error(`어댑터에서 일정 생성 중 오류: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }, [itineraryManagementHook, placesManagement, tripDetailsHookResult]);

  return { generateItineraryAdapter };
};
