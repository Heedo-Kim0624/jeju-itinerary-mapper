
import { useCallback } from 'react';
import type { Place, SelectedPlace, ItineraryDay, SchedulePayload } from '@/types';
import type { CategoryName } from '@/utils/categoryUtils';

/**
 * Place 타입을 SelectedPlace 타입으로 변환하는 유틸리티 함수
 */
const convertToSelectedPlaces = (places: Place[]): SelectedPlace[] => {
  return places.map(place => ({
    ...place,
    category: place.category as CategoryName, // 타입 캐스팅 수행
    isSelected: place.isSelected || false,
    isCandidate: place.isCandidate || false,
  }));
};

interface UseAdaptedScheduleGeneratorArgs {
  runScheduleGenerationFromRunner: (
    payload: SchedulePayload,
    selectedPlaces: SelectedPlace[],
    tripStartDate: Date | null
  ) => Promise<ItineraryDay[] | null>;
  selectedCorePlaces: Place[];
  candidateCorePlaces: Place[];
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
      const allPlacesForRunner = [...selectedCorePlaces, ...candidateCorePlaces];
      const convertedPlaces = convertToSelectedPlaces(allPlacesForRunner);

      return runScheduleGenerationFromRunner(
        payload,
        convertedPlaces,
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
