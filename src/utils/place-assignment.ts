
import { Place, ItineraryPlaceWithTime } from '@/types/supabase';
import { PlaceWithUsedFlag, findNearestPlace } from './schedule';
import { calculateDistance } from './distance';
import { 
  estimateTravelTime, 
  getTimeBlock, 
  formatTimeToString, 
  addTravelTime,
  addStayTime
} from './time-utils';

// 일정에 숙소를 추가하는 함수
export const addAccommodationToItinerary = (
  accommodations: PlaceWithUsedFlag[],
  dayPlaces: ItineraryPlaceWithTime[],
  currentTime: Date,
  day: number
): { 
  updatedDayPlaces: ItineraryPlaceWithTime[], 
  currentPlace: PlaceWithUsedFlag | null, 
  updatedTime: Date 
} => {
  let currentPlace: PlaceWithUsedFlag | null = null;
  
  if (accommodations.length > 0) {
    const accommodation = accommodations.find(a => !a.usedInItinerary);
    if (accommodation) {
      accommodation.usedInItinerary = true;
      
      const placeWithTime: ItineraryPlaceWithTime = {
        ...accommodation,
        arrival_time: formatTimeToString(currentTime),
        time_block: getTimeBlock(day, currentTime.getHours())
      };
      
      dayPlaces.push(placeWithTime);
      currentPlace = accommodation;
      
      // 숙소에서 머무는 시간 추가
      currentTime = addStayTime(currentTime, 'accommodation');
    }
  }
  
  return { 
    updatedDayPlaces: dayPlaces, 
    currentPlace, 
    updatedTime: currentTime 
  };
};

// 일정에 관광지를 추가하는 함수
export const addAttractionToItinerary = (
  attractions: PlaceWithUsedFlag[],
  dayPlaces: ItineraryPlaceWithTime[],
  currentTime: Date,
  day: number,
  currentPlace: PlaceWithUsedFlag | null,
  count: number
): { 
  updatedDayPlaces: ItineraryPlaceWithTime[], 
  currentPlace: PlaceWithUsedFlag | null, 
  updatedTime: Date 
} => {
  if (!currentPlace || count <= 0) {
    return { 
      updatedDayPlaces: dayPlaces, 
      currentPlace, 
      updatedTime: currentTime 
    };
  }

  for (let i = 0; i < count && attractions.some(a => !a.usedInItinerary); i++) {
    if (!currentPlace) continue;
    const nearest = findNearestPlace(currentPlace, attractions, calculateDistance);
    
    if (nearest) {
      nearest.usedInItinerary = true;
      
      // 이동 시간 계산
      const distance = calculateDistance(currentPlace, nearest);
      const travelTime = estimateTravelTime(distance);
      
      // 이전 장소에 이동 시간 정보 추가
      if (dayPlaces.length > 0) {
        const lastPlace = dayPlaces[dayPlaces.length - 1];
        lastPlace.travel_time_to_next = `${travelTime}분`;
      }
      
      // 이동 시간을 현재 시간에 추가
      currentTime = addTravelTime(currentTime, travelTime);
      
      const placeWithTime: ItineraryPlaceWithTime = {
        ...nearest,
        arrival_time: formatTimeToString(currentTime),
        time_block: getTimeBlock(day, currentTime.getHours())
      };
      
      dayPlaces.push(placeWithTime);
      currentPlace = nearest;
      
      // 관광지에서 머무는 시간 추가
      currentTime = addStayTime(currentTime, 'attraction');
    }
  }
  
  return { 
    updatedDayPlaces: dayPlaces, 
    currentPlace, 
    updatedTime: currentTime 
  };
};

// 일정에 식당을 추가하는 함수
export const addRestaurantToItinerary = (
  restaurants: PlaceWithUsedFlag[],
  dayPlaces: ItineraryPlaceWithTime[],
  currentTime: Date,
  day: number,
  currentPlace: PlaceWithUsedFlag | null,
  count: number
): { 
  updatedDayPlaces: ItineraryPlaceWithTime[], 
  currentPlace: PlaceWithUsedFlag | null, 
  updatedTime: Date 
} => {
  if (!currentPlace || count <= 0) {
    return { 
      updatedDayPlaces: dayPlaces, 
      currentPlace, 
      updatedTime: currentTime 
    };
  }

  for (let i = 0; i < count && restaurants.some(r => !r.usedInItinerary); i++) {
    if (!currentPlace) continue;
    const nearest = findNearestPlace(currentPlace, restaurants, calculateDistance);
    
    if (nearest) {
      nearest.usedInItinerary = true;
      
      // 이동 시간 계산
      const distance = calculateDistance(currentPlace, nearest);
      const travelTime = estimateTravelTime(distance);
      
      // 이전 장소에 이동 시간 정보 추가
      if (dayPlaces.length > 0) {
        const lastPlace = dayPlaces[dayPlaces.length - 1];
        lastPlace.travel_time_to_next = `${travelTime}분`;
      }
      
      // 이동 시간을 현재 시간에 추가
      currentTime = addTravelTime(currentTime, travelTime);
      
      const placeWithTime: ItineraryPlaceWithTime = {
        ...nearest,
        arrival_time: formatTimeToString(currentTime),
        time_block: getTimeBlock(day, currentTime.getHours())
      };
      
      dayPlaces.push(placeWithTime);
      currentPlace = nearest;
      
      // 식당에서 머무는 시간 추가
      currentTime = addStayTime(currentTime, 'restaurant');
    }
  }
  
  return { 
    updatedDayPlaces: dayPlaces, 
    currentPlace, 
    updatedTime: currentTime 
  };
};

// 일정에 카페를 추가하는 함수
export const addCafeToItinerary = (
  cafes: PlaceWithUsedFlag[],
  dayPlaces: ItineraryPlaceWithTime[],
  currentTime: Date,
  day: number,
  currentPlace: PlaceWithUsedFlag | null,
  count: number
): { 
  updatedDayPlaces: ItineraryPlaceWithTime[], 
  currentPlace: PlaceWithUsedFlag | null, 
  updatedTime: Date 
} => {
  if (!currentPlace || count <= 0) {
    return { 
      updatedDayPlaces: dayPlaces, 
      currentPlace, 
      updatedTime: currentTime 
    };
  }

  for (let i = 0; i < count && cafes.some(c => !c.usedInItinerary); i++) {
    if (!currentPlace) continue;
    const nearest = findNearestPlace(currentPlace, cafes, calculateDistance);
    
    if (nearest) {
      nearest.usedInItinerary = true;
      
      // 이동 시간 계산
      const distance = calculateDistance(currentPlace, nearest);
      const travelTime = estimateTravelTime(distance);
      
      // 이전 장소에 이동 시간 정보 추가
      if (dayPlaces.length > 0) {
        const lastPlace = dayPlaces[dayPlaces.length - 1];
        lastPlace.travel_time_to_next = `${travelTime}분`;
      }
      
      // 이동 시간을 현재 시간에 추가
      currentTime = addTravelTime(currentTime, travelTime);
      
      const placeWithTime: ItineraryPlaceWithTime = {
        ...nearest,
        arrival_time: formatTimeToString(currentTime),
        time_block: getTimeBlock(day, currentTime.getHours())
      };
      
      dayPlaces.push(placeWithTime);
      currentPlace = nearest;
      
      // 카페에서 머무는 시간 추가
      currentTime = addStayTime(currentTime, 'cafe');
    }
  }
  
  return { 
    updatedDayPlaces: dayPlaces, 
    currentPlace, 
    updatedTime: currentTime 
  };
};

// 일정에 첫 장소를 추가하는 함수 (숙소 또는 관광지)
export const addFirstPlaceToItinerary = (
  attractions: PlaceWithUsedFlag[],
  places: Place[],
  dayPlaces: ItineraryPlaceWithTime[],
  currentTime: Date,
  day: number
): { 
  updatedDayPlaces: ItineraryPlaceWithTime[], 
  currentPlace: PlaceWithUsedFlag | null, 
  updatedTime: Date 
} => {
  let currentPlace: PlaceWithUsedFlag | null = null;
  
  // 관광지로 시작
  if (attractions.length > 0) {
    const attraction = attractions.find(a => !a.usedInItinerary);
    if (attraction) {
      attraction.usedInItinerary = true;
      
      const placeWithTime: ItineraryPlaceWithTime = {
        ...attraction,
        arrival_time: formatTimeToString(currentTime),
        time_block: getTimeBlock(day, currentTime.getHours())
      };
      
      dayPlaces.push(placeWithTime);
      currentPlace = attraction;
      
      // 관광지에서 머무는 시간 추가
      currentTime = addStayTime(currentTime, 'attraction');
    }
  }
  
  // 그래도 장소가 없으면 아무 장소나 시작
  if (!currentPlace && places.length > 0) {
    const anyPlace = places[0];
    const placeWithUsedFlag: PlaceWithUsedFlag = { ...anyPlace, usedInItinerary: true };
    
    const placeWithTime: ItineraryPlaceWithTime = {
      ...placeWithUsedFlag,
      arrival_time: formatTimeToString(currentTime),
      time_block: getTimeBlock(day, currentTime.getHours())
    };
    
    dayPlaces.push(placeWithTime);
    currentPlace = placeWithUsedFlag;
    
    // 기본 장소에서 머무는 시간 추가
    currentTime = addStayTime(currentTime, anyPlace.category);
  }
  
  return { 
    updatedDayPlaces: dayPlaces, 
    currentPlace, 
    updatedTime: currentTime 
  };
};

// 마지막 장소 처리 (travel_time_to_next 설정)
export const finalizeItineraryDay = (
  dayPlaces: ItineraryPlaceWithTime[]
): ItineraryPlaceWithTime[] => {
  // 마지막 장소는 travel_time_to_next가 없음
  if (dayPlaces.length > 0) {
    dayPlaces[dayPlaces.length - 1].travel_time_to_next = "-";
  }
  
  return dayPlaces;
};
