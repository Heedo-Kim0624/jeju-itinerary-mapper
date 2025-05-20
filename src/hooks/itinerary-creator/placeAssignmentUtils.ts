
import { Place, ItineraryPlaceWithTime } from '@/types/core';
import { format, addMinutes } from 'date-fns';
import { findNearestPlace, PlaceWithUsedFlag } from '../../utils/schedule';
import { calculateTotalDistance } from '../../utils/distance';
import { ItineraryDay } from './useItineraryCreatorCore'; // ItineraryDay 타입을 가져옵니다.

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
  // 장소 분류하기 - 사용 여부 플래그 추가 및 초기화
  const accommodations = places
    .filter(p => p.category === 'accommodation')
    .map(p => ({ ...p, usedInItinerary: false } as PlaceWithUsedFlag)); // usedInItinerary 명시적 초기화
  
  const attractions = places
    .filter(p => p.category === 'attraction')
    .map(p => ({ ...p, usedInItinerary: false } as PlaceWithUsedFlag)); // usedInItinerary 명시적 초기화
  
  const restaurants = places
    .filter(p => p.category === 'restaurant')
    .map(p => ({ ...p, usedInItinerary: false } as PlaceWithUsedFlag)); // usedInItinerary 명시적 초기화
  
  const cafes = places
    .filter(p => p.category === 'cafe')
    .map(p => ({ ...p, usedInItinerary: false } as PlaceWithUsedFlag)); // usedInItinerary 명시적 초기화
  
  // 일자별로 방문할 장소 수 계산 (균등하게 분배)
  const attractionsPerDay = Math.ceil(attractions.length / numDays);
  const restaurantsPerDay = Math.ceil(restaurants.length / numDays);
  const cafesPerDay = Math.ceil(cafes.length / numDays);
  
  console.log(`장소 분배: 관광지=${attractionsPerDay}개/일, 식당=${restaurantsPerDay}개/일, 카페=${cafesPerDay}개/일`);
  
  const itinerary: ItineraryDay[] = []; // ItineraryDay 타입 사용
  
  // Helper function for distance calculation compatible with findNearestPlace
  const distanceBetweenPlaces = (p1: Place, p2: Place): number => {
    if (p1.y && p1.x && p2.y && p2.x) {
      return calculateDistance(p1.y, p1.x, p2.y, p2.x);
    }
    return Infinity; // If coordinates are missing, treat as infinitely far
  };

  // 각 일자별 일정 생성
  for (let day = 1; day <= numDays; day++) {
    const dayPlacesRaw: Place[] = []; // Store raw places first to calculate total distance correctly. Use Place type here.
    const dayPlacesWithTime: ItineraryPlaceWithTime[] = [];
    let currentPlace: PlaceWithUsedFlag | null = null; // Type from schedule.ts
    
    // 해당 일자의 시작 시간 설정
    let currentTime = new Date(startDate); // Use startDate as base for date calculations
    currentTime.setDate(startDate.getDate() + day - 1); // Set correct date for the current day
    currentTime.setHours(startHour, startMinute, 0, 0);
    
    // Add accommodation if available (첫 날에만 추가)
    if (day === 1 && accommodations.length > 0) {
      const accommodation = accommodations.find(a => !a.usedInItinerary);
      if (accommodation) {
        accommodation.usedInItinerary = true;
        
        const placeWithTime: ItineraryPlaceWithTime = {
          ...accommodation,
          arriveTime: format(currentTime, 'HH:mm'),
          timeBlock: getTimeBlock(day, currentTime.getHours()),
          // ItineraryPlaceWithTime에 필요한 다른 속성들을 여기서 추가해야 합니다.
          // 예를 들어, id, name, x, y 등 Place에서 가져오거나 기본값을 설정합니다.
          id: accommodation.id,
          name: accommodation.name,
          address: accommodation.address,
          phone: accommodation.phone,
          category: accommodation.category,
          description: accommodation.description,
          rating: accommodation.rating,
          x: accommodation.x,
          y: accommodation.y,
          image_url: accommodation.image_url,
          road_address: accommodation.road_address,
          homepage: accommodation.homepage,
          geoNodeId: accommodation.id, // 예시: geoNodeId를 id로 설정
        };
        
        dayPlacesWithTime.push(placeWithTime);
        dayPlacesRaw.push(accommodation); // Add original Place object
        currentPlace = accommodation;
        
        // 숙소에서 30분 머무른다고 가정
        currentTime = addMinutes(currentTime, 30);
      }
    }
    
    // 관광지 추가
    let attractionsAdded = 0;
    for (let i = 0; i < attractionsPerDay && attractions.some(a => !a.usedInItinerary); i++) {
      let attractionToAdd: PlaceWithUsedFlag | null = null;
      if (!currentPlace && attractions.some(a => !a.usedInItinerary)) {
        attractionToAdd = attractions.find(a => !a.usedInItinerary)!;
      } else if (currentPlace) {
        // findNearestPlace의 두 번째 인자는 PlaceWithUsedFlag[] 타입이어야 합니다.
        attractionToAdd = findNearestPlace(currentPlace, attractions.filter(a => !a.usedInItinerary), distanceBetweenPlaces);
      }

      if (attractionToAdd) {
        attractionToAdd.usedInItinerary = true;
        const distance = (currentPlace?.y && currentPlace?.x && attractionToAdd.y && attractionToAdd.x) ? calculateDistance(currentPlace.y, currentPlace.x, attractionToAdd.y, attractionToAdd.x) : 0;
        const travelTime = estimateTravelTime(distance);
        if (dayPlacesWithTime.length > 0 && currentPlace) dayPlacesWithTime[dayPlacesWithTime.length - 1].travelTimeToNext = `${travelTime}분`;
        
        if (currentPlace) { // currentPlace가 있어야 이동시간을 더함
            currentTime = addMinutes(currentTime, travelTime);
        }

        const placeWithTime: ItineraryPlaceWithTime = {
          ...attractionToAdd,
          arriveTime: format(currentTime, 'HH:mm'),
          timeBlock: getTimeBlock(day, currentTime.getHours()),
          id: attractionToAdd.id,
          name: attractionToAdd.name,
          address: attractionToAdd.address,
          phone: attractionToAdd.phone,
          category: attractionToAdd.category,
          description: attractionToAdd.description,
          rating: attractionToAdd.rating,
          x: attractionToAdd.x,
          y: attractionToAdd.y,
          image_url: attractionToAdd.image_url,
          road_address: attractionToAdd.road_address,
          homepage: attractionToAdd.homepage,
          geoNodeId: attractionToAdd.id,
        };
        dayPlacesWithTime.push(placeWithTime);
        dayPlacesRaw.push(attractionToAdd); // Add original Place object
        currentPlace = attractionToAdd;
        currentTime = addMinutes(currentTime, 60); // 1 hour at attraction
        attractionsAdded++;
      }
    }
    
    // 식당 추가
    let restaurantsAdded = 0;
    for (let i = 0; i < restaurantsPerDay && restaurants.some(r => !r.usedInItinerary); i++) {
      if (!currentPlace) continue;
      // findNearestPlace의 두 번째 인자는 PlaceWithUsedFlag[] 타입이어야 합니다.
      const nearest = findNearestPlace(currentPlace, restaurants.filter(r => !r.usedInItinerary), distanceBetweenPlaces);
      if (nearest) {
        nearest.usedInItinerary = true;
        const distance = (currentPlace.y && currentPlace.x && nearest.y && nearest.x) ? calculateDistance(currentPlace.y, currentPlace.x, nearest.y, nearest.x) : 0;
        const travelTime = estimateTravelTime(distance);
        if (dayPlacesWithTime.length > 0) dayPlacesWithTime[dayPlacesWithTime.length - 1].travelTimeToNext = `${travelTime}분`;
        currentTime = addMinutes(currentTime, travelTime);
        const placeWithTime: ItineraryPlaceWithTime = {
          ...nearest,
          arriveTime: format(currentTime, 'HH:mm'),
          timeBlock: getTimeBlock(day, currentTime.getHours()),
          id: nearest.id,
          name: nearest.name,
          address: nearest.address,
          phone: nearest.phone,
          category: nearest.category,
          description: nearest.description,
          rating: nearest.rating,
          x: nearest.x,
          y: nearest.y,
          image_url: nearest.image_url,
          road_address: nearest.road_address,
          homepage: nearest.homepage,
          geoNodeId: nearest.id,
        };
        dayPlacesWithTime.push(placeWithTime);
        dayPlacesRaw.push(nearest); // Add original Place object
        currentPlace = nearest;
        currentTime = addMinutes(currentTime, 90); // 1.5 hours at restaurant
        restaurantsAdded++;
      }
    }
    
    // 카페 추가
    let cafesAdded = 0;
    for (let i = 0; i < cafesPerDay && cafes.some(c => !c.usedInItinerary); i++) {
      if (!currentPlace) continue;
      // findNearestPlace의 두 번째 인자는 PlaceWithUsedFlag[] 타입이어야 합니다.
      const nearest = findNearestPlace(currentPlace, cafes.filter(c => !c.usedInItinerary), distanceBetweenPlaces);
      if (nearest) {
        nearest.usedInItinerary = true;
        const distance = (currentPlace.y && currentPlace.x && nearest.y && nearest.x) ? calculateDistance(currentPlace.y, currentPlace.x, nearest.y, nearest.x) : 0;
        const travelTime = estimateTravelTime(distance);
        if (dayPlacesWithTime.length > 0) dayPlacesWithTime[dayPlacesWithTime.length - 1].travelTimeToNext = `${travelTime}분`;
        currentTime = addMinutes(currentTime, travelTime);
        const placeWithTime: ItineraryPlaceWithTime = {
          ...nearest,
          arriveTime: format(currentTime, 'HH:mm'),
          timeBlock: getTimeBlock(day, currentTime.getHours()),
          id: nearest.id,
          name: nearest.name,
          address: nearest.address,
          phone: nearest.phone,
          category: nearest.category,
          description: nearest.description,
          rating: nearest.rating,
          x: nearest.x,
          y: nearest.y,
          image_url: nearest.image_url,
          road_address: nearest.road_address,
          homepage: nearest.homepage,
          geoNodeId: nearest.id,
        };
        dayPlacesWithTime.push(placeWithTime);
        dayPlacesRaw.push(nearest); // Add original Place object
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
