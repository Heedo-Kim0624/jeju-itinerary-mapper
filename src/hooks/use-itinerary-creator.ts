
import { Place, ItineraryPlaceWithTime } from '@/types/supabase';
import { PlaceWithUsedFlag } from '../utils/schedule';
import { calculateTotalDistance } from '../utils/distance';
import {
  addAccommodationToItinerary,
  addAttractionToItinerary,
  addRestaurantToItinerary,
  addCafeToItinerary,
  addFirstPlaceToItinerary,
  finalizeItineraryDay
} from '../utils/place-assignment';

export interface ItineraryDay {
  day: number;
  places: ItineraryPlaceWithTime[];
  totalDistance: number;
}

export const useItineraryCreator = () => {
  const createItinerary = (
    places: Place[],
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string
  ): ItineraryDay[] => {
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const numDays = Math.max(1, daysDiff);
    
    // 시작 시간 파싱
    const [startHour, startMinute] = startTime.split(':').map(Number);
    
    const accommodations = places
      .filter(p => p.category === 'accommodation')
      .map(p => ({ ...p, usedInItinerary: false })) as PlaceWithUsedFlag[];
    
    const attractions = places
      .filter(p => p.category === 'attraction')
      .map(p => ({ ...p, usedInItinerary: false })) as PlaceWithUsedFlag[];
    
    const restaurants = places
      .filter(p => p.category === 'restaurant')
      .map(p => ({ ...p, usedInItinerary: false })) as PlaceWithUsedFlag[];
    
    const cafes = places
      .filter(p => p.category === 'cafe')
      .map(p => ({ ...p, usedInItinerary: false })) as PlaceWithUsedFlag[];
    
    const attractionsPerDay = Math.ceil(attractions.length / numDays);
    const restaurantsPerDay = Math.ceil(restaurants.length / numDays);
    const cafesPerDay = Math.ceil(cafes.length / numDays);
    
    const itinerary: ItineraryDay[] = [];
    
    for (let day = 1; day <= numDays; day++) {
      const dayPlaces: ItineraryPlaceWithTime[] = [];
      let currentPlace: PlaceWithUsedFlag | null = null;
      
      // 해당 일자의 시작 시간 설정
      let currentTime = new Date();
      currentTime.setHours(startHour, startMinute, 0);
      
      // 첫 번째로 숙소 추가 시도
      const accommodationResult = addAccommodationToItinerary(
        accommodations, 
        dayPlaces, 
        currentTime, 
        day
      );
      
      dayPlaces.splice(0, dayPlaces.length, ...accommodationResult.updatedDayPlaces);
      currentPlace = accommodationResult.currentPlace;
      currentTime = accommodationResult.updatedTime;
      
      // 숙소가 없다면 관광지나 다른 장소로 시작
      if (!currentPlace) {
        const firstPlaceResult = addFirstPlaceToItinerary(
          attractions, 
          places, 
          dayPlaces, 
          currentTime, 
          day
        );
        
        dayPlaces.splice(0, dayPlaces.length, ...firstPlaceResult.updatedDayPlaces);
        currentPlace = firstPlaceResult.currentPlace;
        currentTime = firstPlaceResult.updatedTime;
      }
      
      // 이전 장소 위치에서 다음 장소를 선택하며 일정 구성
      if (currentPlace) {
        // 관광지 추가
        const attractionsResult = addAttractionToItinerary(
          attractions, 
          dayPlaces, 
          currentTime, 
          day, 
          currentPlace, 
          attractionsPerDay
        );
        
        dayPlaces.splice(0, dayPlaces.length, ...attractionsResult.updatedDayPlaces);
        currentPlace = attractionsResult.currentPlace;
        currentTime = attractionsResult.updatedTime;
        
        // 식당 추가
        const restaurantResult = addRestaurantToItinerary(
          restaurants, 
          dayPlaces, 
          currentTime, 
          day, 
          currentPlace, 
          restaurantsPerDay
        );
        
        dayPlaces.splice(0, dayPlaces.length, ...restaurantResult.updatedDayPlaces);
        currentPlace = restaurantResult.currentPlace;
        currentTime = restaurantResult.updatedTime;
        
        // 카페 추가
        const cafesResult = addCafeToItinerary(
          cafes, 
          dayPlaces, 
          currentTime, 
          day, 
          currentPlace, 
          cafesPerDay
        );
        
        dayPlaces.splice(0, dayPlaces.length, ...cafesResult.updatedDayPlaces);
        
        // 마지막 장소 처리
        const finalPlaces = finalizeItineraryDay(dayPlaces);
        
        const totalDistance = calculateTotalDistance(finalPlaces);
        
        itinerary.push({
          day,
          places: finalPlaces,
          totalDistance
        });
      }
    }
    
    return itinerary;
  };

  return {
    createItinerary
  };
};
