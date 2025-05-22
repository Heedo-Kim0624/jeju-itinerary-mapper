
import { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { estimateTravelTime, getTimeBlock } from './timeUtils';
import { assignPlacesToDays } from './placeAssignmentUtils';
import { calculateDistance } from '../../utils/distance';

export const useItineraryCreator = () => {
  const createItinerary = (
    places: Place[], // Input places are core Place type
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string
  ): ItineraryDay[] => {
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const numDays = Math.max(1, daysDiff);
    
    console.log(`일정 생성 시작: ${numDays}일간의 여행 (${places.length}개 장소)`);
    
    const [startHour, startMinute] = startTime.split(':').map(Number);

    // Ensure places passed to assignPlacesToDays have string IDs if they might not
    const placesWithStrIds = places.map(p => ({...p, id: String(p.id)}));

    const itinerary: ItineraryDay[] = assignPlacesToDays({
      places: placesWithStrIds, // Pass places with string IDs
      numDays,
      startDate,
      startHour,
      startMinute,
      calculateDistance,
      estimateTravelTime,
      getTimeBlock
    });
    
    // Ensure all ItineraryPlaceWithTime in the result have string IDs
    const finalItinerary = itinerary.map(day => ({
      ...day,
      places: day.places.map(p => ({...p, id: String(p.id)} as ItineraryPlaceWithTime))
    }));
    
    console.log(`일정 생성 완료: ${finalItinerary.length}일 일정, 총 ${finalItinerary.reduce((sum, dayItinerary) => sum + dayItinerary.places.length, 0)}개 장소`);
    
    return finalItinerary;
  };

  return { createItineraryFromPlaces: createItinerary }; // Keep alias if used elsewhere, or change to createItinerary
};
