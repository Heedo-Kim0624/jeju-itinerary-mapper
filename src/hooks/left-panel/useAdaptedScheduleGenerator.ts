
import { useCallback } from 'react';
import type { Place, SelectedPlace, ItineraryDay, SchedulePayload } from '@/types';
// import type { CategoryName } from '@/utils/categoryUtils'; // No longer needed here
import { convertPlacesToSelectedPlaces } from '@/utils/typeConversionUtils'; // Import the new utility

/**
 * Place 타입을 SelectedPlace 타입으로 변환하는 유틸리티 함수 - 삭제됨
 * const convertToSelectedPlaces = (places: Place[]): SelectedPlace[] => {
 *   return places.map(place => ({
 *     ...place,
 *     category: place.category as CategoryName, // 타입 캐스팅 수행
 *     isSelected: place.isSelected || false,
 *     isCandidate: place.isCandidate || false,
 *   }));
 * };
 */

interface UseAdaptedScheduleGeneratorArgs {
  runScheduleGenerationFromRunner: (
    payload: SchedulePayload,
    selectedPlaces: SelectedPlace[],
    tripStartDate: Date | null
  ) => Promise<ItineraryDay[] | null>;
  selectedCorePlaces: Place[]; // These are still Place[] as input
  candidateCorePlaces: Place[]; // These are still Place[] as input
  tripStartDateFromDetails: Date | null;
}

export const useAdaptedScheduleGenerator = ({
  runScheduleGenerationFromRunner,
  selectedCorePlaces,
  candidateCorePlaces,
  tripStartDateFromDetails,
}: UseAdaptedScheduleGeneratorArgs) => {
  const adaptedRunScheduleGeneration = useCallback(
    async (payload: SchedulePayload): Promise<ItineraryDay[] | null> => {
      // Convert Place[] to SelectedPlace[] using the new utility
      const allPlacesInput: Place[] = [...selectedCorePlaces, ...candidateCorePlaces];
      const convertedSelectedPlaces: SelectedPlace[] = convertPlacesToSelectedPlaces(allPlacesInput);

      // Pass the converted SelectedPlace[] to the runner
      return runScheduleGenerationFromRunner(
        payload,
        convertedSelectedPlaces,
        tripStartDateFromDetails
      );
    },
    [
      runScheduleGenerationFromRunner,
      selectedCorePlaces,
      candidateCorePlaces,
      tripStartDateFromDetails,
    ]
  );

  return { adaptedRunScheduleGeneration };
};

