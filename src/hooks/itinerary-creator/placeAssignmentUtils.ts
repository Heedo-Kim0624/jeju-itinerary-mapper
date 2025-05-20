
import { Place, ItineraryPlaceWithTime } from '@/types/core';
import { format, addMinutes } from 'date-fns';
import { findNearestPlace } from '../../utils/schedule';
import { calculateTotalDistance } from '../../utils/distance';

// Interface for place with used flag
export interface PlaceWithUsedFlag extends Place {
  usedInItinerary: boolean;
}

// Interface for assignment parameters
interface AssignPlacesToDaysParams {
  places: Place[];
  numDays: number;
  startDate: Date;
  startHour: number;
  startMinute: number;
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
  estimateTravelTime: (distance: number) => number;
  getTimeBlock: (day: number, hour: number) => string;
}

// Main function to assign places to days
export const assignPlacesToDays = ({
  places,
  numDays,
  startDate,
  startHour,
  startMinute,
  calculateDistance,
  estimateTravelTime,
  getTimeBlock
}: AssignPlacesToDaysParams) => {
  // 장소 분류하기 - 사용 여부 플래그 추가
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
  
  // 일자별로 방문할 장소 수 계산 (균등하게 분배)
  const attractionsPerDay = Math.ceil(attractions.length / numDays);
  const restaurantsPerDay = Math.ceil(restaurants.length / numDays);
  const cafesPerDay = Math.ceil(cafes.length / numDays);
  
  console.log(`장소 분배: 관광지=${attractionsPerDay}개/일, 식당=${restaurantsPerDay}개/일, 카페=${cafesPerDay}개/일`);
  
  const itinerary: ItineraryDay[] = [];
  
  // Helper function for distance calculation compatible with findNearestPlace
  const distanceBetweenPlaces = (p1: Place, p2: Place): number => {
    if (p1.y && p1.x && p2.y && p2.x) {
      return calculateDistance(p1.y, p1.x, p2.y, p2.x);
    }
    return Infinity; // If coordinates are missing, treat as infinitely far
  };

  // 각 일자별 일정 생성
  for (let day = 1; day <= numDays; day++) {
    const dayPlacesRaw: PlaceWithUsedFlag[] = []; // Store raw places first to calculate total distance correctly
    const dayPlacesWithTime: ItineraryPlaceWithTime[] = [];
    let currentPlace: PlaceWithUsedFlag | null = null;
    
    // 해당 일자의 시작 시간 설정
    let currentTime = new Date();
    currentTime.setHours(startHour, startMinute, 0);
    
    // Add accommodation if available (첫 날에만 추가)
    if (day === 1 && accommodations.length > 0) {
      const accommodation = accommodations.find(a => !a.usedInItinerary);
      if (accommodation) {
        accommodation.usedInItinerary = true;
        
        const placeWithTime: ItineraryPlaceWithTime = {
          ...accommodation,
          arriveTime: format(currentTime, 'HH:mm'),
          timeBlock: getTimeBlock(day, currentTime.getHours())
        };
        
        dayPlacesWithTime.push(placeWithTime);
        dayPlacesRaw.push(accommodation);
        currentPlace = accommodation;
        
        // 숙소에서 30분 머무른다고 가정
        currentTime = addMinutes(currentTime, 30);
      }
    }
    
    // 관광지 추가
    let attractionsAdded = 0;
    for (let i = 0; i < attractionsPerDay && attractions.some(a => !a.usedInItinerary); i++) {
      if (!currentPlace && attractions.find(a => !a.usedInItinerary)) { // Ensure there's an attraction to pick if no currentPlace
        const attraction = attractions.find(a => !a.usedInItinerary)!; // Non-null assertion as we checked with .some and .find
        attraction.usedInItinerary = true;
        const placeWithTime: ItineraryPlaceWithTime = {
          ...attraction,
          arriveTime: format(currentTime, 'HH:mm'),
          timeBlock: getTimeBlock(day, currentTime.getHours())
        };
        dayPlacesWithTime.push(placeWithTime);
        dayPlacesRaw.push(attraction);
        currentPlace = attraction;
        currentTime = addMinutes(currentTime, 60); // 1 hour at attraction
        attractionsAdded++;
      } else if (currentPlace) {
        const nearest = findNearestPlace(currentPlace, attractions, distanceBetweenPlaces);
        if (nearest) {
          nearest.usedInItinerary = true;
          const distance = (currentPlace.y && currentPlace.x && nearest.y && nearest.x) ? calculateDistance(currentPlace.y, currentPlace.x, nearest.y, nearest.x) : 0;
          const travelTime = estimateTravelTime(distance);
          if (dayPlacesWithTime.length > 0) dayPlacesWithTime[dayPlacesWithTime.length - 1].travelTimeToNext = `${travelTime}분`;
          currentTime = addMinutes(currentTime, travelTime);
          const placeWithTime: ItineraryPlaceWithTime = {
            ...nearest,
            arriveTime: format(currentTime, 'HH:mm'),
            timeBlock: getTimeBlock(day, currentTime.getHours())
          };
          dayPlacesWithTime.push(placeWithTime);
          dayPlacesRaw.push(nearest);
          currentPlace = nearest;
          currentTime = addMinutes(currentTime, 60); // 1 hour at attraction
          attractionsAdded++;
        }
      }
    }
    
    // 식당 추가
    let restaurantsAdded = 0;
    for (let i = 0; i < restaurantsPerDay && restaurants.some(r => !r.usedInItinerary); i++) {
      if (!currentPlace) continue;
      const nearest = findNearestPlace(currentPlace, restaurants, distanceBetweenPlaces);
      if (nearest) {
        nearest.usedInItinerary = true;
        const distance = (currentPlace.y && currentPlace.x && nearest.y && nearest.x) ? calculateDistance(currentPlace.y, currentPlace.x, nearest.y, nearest.x) : 0;
        const travelTime = estimateTravelTime(distance);
        if (dayPlacesWithTime.length > 0) dayPlacesWithTime[dayPlacesWithTime.length - 1].travelTimeToNext = `${travelTime}분`;
        currentTime = addMinutes(currentTime, travelTime);
        const placeWithTime: ItineraryPlaceWithTime = {
          ...nearest,
          arriveTime: format(currentTime, 'HH:mm'),
          timeBlock: getTimeBlock(day, currentTime.getHours())
        };
        dayPlacesWithTime.push(placeWithTime);
        dayPlacesRaw.push(nearest);
        currentPlace = nearest;
        currentTime = addMinutes(currentTime, 90); // 1.5 hours at restaurant
        restaurantsAdded++;
      }
    }
    
    // 카페 추가
    let cafesAdded = 0;
    for (let i = 0; i < cafesPerDay && cafes.some(c => !c.usedInItinerary); i++) {
      if (!currentPlace) continue;
      const nearest = findNearestPlace(currentPlace, cafes, distanceBetweenPlaces);
      if (nearest) {
        nearest.usedInItinerary = true;
        const distance = (currentPlace.y && currentPlace.x && nearest.y && nearest.x) ? calculateDistance(currentPlace.y, currentPlace.x, nearest.y, nearest.x) : 0;
        const travelTime = estimateTravelTime(distance);
        if (dayPlacesWithTime.length > 0) dayPlacesWithTime[dayPlacesWithTime.length - 1].travelTimeToNext = `${travelTime}분`;
        currentTime = addMinutes(currentTime, travelTime);
        const placeWithTime: ItineraryPlaceWithTime = {
          ...nearest,
          arriveTime: format(currentTime, 'HH:mm'),
          timeBlock: getTimeBlock(day, currentTime.getHours())
        };
        dayPlacesWithTime.push(placeWithTime);
        dayPlacesRaw.push(nearest);
        currentPlace = nearest;
        currentTime = addMinutes(currentTime, 60); // 1 hour at cafe
        cafesAdded++;
      }
    }
    
    if (dayPlacesWithTime.length > 0) {
      dayPlacesWithTime[dayPlacesWithTime.length - 1].travelTimeToNext = "-";
    }
    
    const totalDistanceForDay = calculateTotalDistance(dayPlacesRaw); // Use raw places for distance
    
    console.log(`${day}일차 일정: 관광지 ${attractionsAdded}개, 식당 ${restaurantsAdded}개, 카페 ${cafesAdded}개, 총 ${dayPlacesWithTime.length}개 장소, 총 거리 ${totalDistanceForDay.toFixed(2)}km`);
    
    itinerary.push({
      day,
      places: dayPlacesWithTime,
      totalDistance: totalDistanceForDay
    });
  }

  return itinerary;
};

// Import the ItineraryDay interface to avoid circular dependency
import { ItineraryDay } from './useItineraryCreatorCore';
