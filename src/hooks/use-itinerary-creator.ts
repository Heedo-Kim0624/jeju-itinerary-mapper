
import { Place, ItineraryPlaceWithTime } from '@/types/supabase';
import { format, addMinutes } from 'date-fns';
import { useItineraryTime } from './itinerary/useItineraryTime';
import { useItineraryPlacer } from './itinerary/useItineraryPlacer';

export interface ItineraryDay {
  day: number;
  places: ItineraryPlaceWithTime[];
  totalDistance: number;
}

export const useItineraryCreator = () => {
  const { estimateTravelTime, getTimeBlock } = useItineraryTime();
  const { findNearestPlace, calculateTotalDistance } = useItineraryPlacer();
  
  const createItinerary = (
    places: Place[],
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string
  ): ItineraryDay[] => {
    // 정확한 일수 계산
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const numDays = Math.max(1, daysDiff);
    
    console.log(`일정 생성: ${numDays}일간의 여행 (${places.length}개 장소)`);
    
    // 시작 시간 파싱
    const [startHour, startMinute] = startTime.split(':').map(Number);
    
    // 장소 분류
    const categorizedPlaces = categorizePlaces(places);
    
    // 일자별로 방문할 장소 수 계산 (균등하게 분배)
    const { attractionsPerDay, restaurantsPerDay, cafesPerDay } = calculatePlacesPerDay(
      categorizedPlaces,
      numDays
    );
    
    console.log(`장소 분배: 관광지=${attractionsPerDay}개/일, 식당=${restaurantsPerDay}개/일, 카페=${cafesPerDay}개/일`);
    
    const itinerary = createDailyItinerary(
      numDays,
      categorizedPlaces,
      { attractionsPerDay, restaurantsPerDay, cafesPerDay },
      { startHour, startMinute }
    );
    
    console.log(`일정 생성 완료: ${itinerary.length}일 일정, 총 ${itinerary.reduce((sum, day) => sum + day.places.length, 0)}개 장소`);
    
    return itinerary;
  };

  // 장소를 카테고리별로 분류하는 함수
  const categorizePlaces = (places: Place[]) => {
    const accommodations = places
      .filter(p => p.category === 'accommodation')
      .map(p => ({ ...p, usedInItinerary: false }));
    
    const attractions = places
      .filter(p => p.category === 'attraction')
      .map(p => ({ ...p, usedInItinerary: false }));
    
    const restaurants = places
      .filter(p => p.category === 'restaurant')
      .map(p => ({ ...p, usedInItinerary: false }));
    
    const cafes = places
      .filter(p => p.category === 'cafe')
      .map(p => ({ ...p, usedInItinerary: false }));
      
    return { accommodations, attractions, restaurants, cafes };
  };

  // 일자별 방문 장소 수 계산
  const calculatePlacesPerDay = (
    categorizedPlaces: any,
    numDays: number
  ) => {
    const { attractions, restaurants, cafes } = categorizedPlaces;
    
    return {
      attractionsPerDay: Math.ceil(attractions.length / numDays),
      restaurantsPerDay: Math.ceil(restaurants.length / numDays),
      cafesPerDay: Math.ceil(cafes.length / numDays)
    };
  };

  // 일자별 일정 생성
  const createDailyItinerary = (
    numDays: number,
    categorizedPlaces: any,
    placesPerDay: any,
    timeSettings: any
  ): ItineraryDay[] => {
    const { accommodations, attractions, restaurants, cafes } = categorizedPlaces;
    const { attractionsPerDay, restaurantsPerDay, cafesPerDay } = placesPerDay;
    const { startHour, startMinute } = timeSettings;
    
    const itinerary: ItineraryDay[] = [];
    
    // 각 일자별 일정 생성
    for (let day = 1; day <= numDays; day++) {
      const dayPlaces: ItineraryPlaceWithTime[] = [];
      let currentPlace: any = null;
      
      // 해당 일자의 시작 시간 설정
      let currentTime = new Date();
      currentTime.setHours(startHour, startMinute, 0);
      
      // 첫날에만 숙소 추가
      if (day === 1) {
        currentPlace = addAccommodationToItinerary(
          accommodations, 
          dayPlaces, 
          currentTime,
          day,
          getTimeBlock
        );
        
        if (currentPlace) {
          // 숙소에서 30분 머무른다고 가정
          currentTime = addMinutes(currentTime, 30);
        }
      }
      
      // 관광지 추가
      const attractionsResult = addAttractionsToItinerary(
        attractions, 
        attractionsPerDay, 
        currentPlace,
        dayPlaces, 
        currentTime,
        day,
        findNearestPlace,
        estimateTravelTime,
        getTimeBlock
      );
      
      currentPlace = attractionsResult.currentPlace;
      currentTime = attractionsResult.currentTime;
      
      // 식당 추가
      const restaurantsResult = addRestaurantsToItinerary(
        restaurants,
        restaurantsPerDay,
        currentPlace,
        dayPlaces,
        currentTime,
        day,
        findNearestPlace,
        estimateTravelTime,
        getTimeBlock
      );
      
      currentPlace = restaurantsResult.currentPlace;
      currentTime = restaurantsResult.currentTime;
      
      // 카페 추가
      const cafesResult = addCafesToItinerary(
        cafes,
        cafesPerDay,
        currentPlace,
        dayPlaces,
        currentTime,
        day,
        findNearestPlace,
        estimateTravelTime,
        getTimeBlock
      );
      
      // 마지막 장소는 travel_time_to_next가 없음
      if (dayPlaces.length > 0) {
        dayPlaces[dayPlaces.length - 1].travel_time_to_next = "-";
      }
      
      // 총 거리 계산
      const totalDistance = calculateTotalDistance(dayPlaces);
      
      console.log(`${day}일차 일정: 관광지 ${attractionsResult.added}개, 식당 ${restaurantsResult.added}개, 카페 ${cafesResult.added}개, 총 ${dayPlaces.length}개 장소`);
      
      itinerary.push({
        day,
        places: dayPlaces,
        totalDistance
      });
    }
    
    return itinerary;
  };

  return {
    createItinerary
  };
};

// 숙소 추가 함수
const addAccommodationToItinerary = (
  accommodations: any[],
  dayPlaces: ItineraryPlaceWithTime[],
  currentTime: Date,
  day: number,
  getTimeBlock: (day: number, hour: number) => string
) => {
  const accommodation = accommodations.find(a => !a.usedInItinerary);
  
  if (accommodation) {
    accommodation.usedInItinerary = true;
    
    const placeWithTime: ItineraryPlaceWithTime = {
      ...accommodation,
      arrival_time: format(currentTime, 'HH:mm'),
      time_block: getTimeBlock(day, currentTime.getHours())
    };
    
    dayPlaces.push(placeWithTime);
    return accommodation;
  }
  
  return null;
};

// 관광지 추가 함수
const addAttractionsToItinerary = (
  attractions: any[],
  attractionsPerDay: number,
  currentPlace: any,
  dayPlaces: ItineraryPlaceWithTime[],
  currentTime: Date,
  day: number,
  findNearestPlace: (current: any, candidates: any[], calculateDistance: any) => any,
  estimateTravelTime: (distance: number) => number,
  getTimeBlock: (day: number, hour: number) => string
) => {
  let attractionsAdded = 0;
  let updatedCurrentPlace = currentPlace;
  let updatedCurrentTime = currentTime;
  
  for (let i = 0; i < attractionsPerDay && attractions.some(a => !a.usedInItinerary); i++) {
    // 첫 장소가 아직 없다면 첫 관광지 선택
    if (!updatedCurrentPlace) {
      const attraction = attractions.find(a => !a.usedInItinerary);
      
      if (attraction) {
        attraction.usedInItinerary = true;
        
        const placeWithTime: ItineraryPlaceWithTime = {
          ...attraction,
          arrival_time: format(updatedCurrentTime, 'HH:mm'),
          time_block: getTimeBlock(day, updatedCurrentTime.getHours())
        };
        
        dayPlaces.push(placeWithTime);
        updatedCurrentPlace = attraction;
        
        // 관광지에서 1시간 머무른다고 가정
        updatedCurrentTime = addMinutes(updatedCurrentTime, 60);
        attractionsAdded++;
      }
    } else {
      // 이전 장소에서 가장 가까운 관광지 선택
      const nearest = findNearestPlace(updatedCurrentPlace, attractions.filter(a => !a.usedInItinerary));
      
      if (nearest) {
        nearest.usedInItinerary = true;
        
        // 이동 시간 계산
        const distance = calculateDistance(updatedCurrentPlace, nearest);
        const travelTime = estimateTravelTime(distance);
        
        // 이전 장소에 이동 시간 정보 추가
        if (dayPlaces.length > 0) {
          const lastPlace = dayPlaces[dayPlaces.length - 1];
          lastPlace.travel_time_to_next = `${travelTime}분`;
        }
        
        // 이동 시간을 현재 시간에 추가
        updatedCurrentTime = addMinutes(updatedCurrentTime, travelTime);
        
        const placeWithTime: ItineraryPlaceWithTime = {
          ...nearest,
          arrival_time: format(updatedCurrentTime, 'HH:mm'),
          time_block: getTimeBlock(day, updatedCurrentTime.getHours())
        };
        
        dayPlaces.push(placeWithTime);
        updatedCurrentPlace = nearest;
        
        // 관광지에서 보내는 시간 (60분)
        updatedCurrentTime = addMinutes(updatedCurrentTime, 60);
        attractionsAdded++;
      }
    }
  }
  
  return {
    currentPlace: updatedCurrentPlace,
    currentTime: updatedCurrentTime,
    added: attractionsAdded
  };
};

// 식당 추가 함수
const addRestaurantsToItinerary = (
  restaurants: any[],
  restaurantsPerDay: number,
  currentPlace: any,
  dayPlaces: ItineraryPlaceWithTime[],
  currentTime: Date,
  day: number,
  findNearestPlace: (current: any, candidates: any[]) => any,
  estimateTravelTime: (distance: number) => number,
  getTimeBlock: (day: number, hour: number) => string
) => {
  let restaurantsAdded = 0;
  let updatedCurrentPlace = currentPlace;
  let updatedCurrentTime = currentTime;
  
  for (let i = 0; i < restaurantsPerDay && restaurants.some(r => !r.usedInItinerary); i++) {
    if (!updatedCurrentPlace) continue;
    
    const nearest = findNearestPlace(updatedCurrentPlace, restaurants.filter(r => !r.usedInItinerary));
    
    if (nearest) {
      nearest.usedInItinerary = true;
      
      // 이동 시간 계산
      const distance = calculateDistance(updatedCurrentPlace, nearest);
      const travelTime = estimateTravelTime(distance);
      
      // 이전 장소에 이동 시간 정보 추가
      if (dayPlaces.length > 0) {
        const lastPlace = dayPlaces[dayPlaces.length - 1];
        lastPlace.travel_time_to_next = `${travelTime}분`;
      }
      
      // 이동 시간을 현재 시간에 추가
      updatedCurrentTime = addMinutes(updatedCurrentTime, travelTime);
      
      const placeWithTime: ItineraryPlaceWithTime = {
        ...nearest,
        arrival_time: format(updatedCurrentTime, 'HH:mm'),
        time_block: getTimeBlock(day, updatedCurrentTime.getHours())
      };
      
      dayPlaces.push(placeWithTime);
      updatedCurrentPlace = nearest;
      
      // 식당에서 보내는 시간 (90분)
      updatedCurrentTime = addMinutes(updatedCurrentTime, 90);
      restaurantsAdded++;
    }
  }
  
  return {
    currentPlace: updatedCurrentPlace,
    currentTime: updatedCurrentTime,
    added: restaurantsAdded
  };
};

// 카페 추가 함수
const addCafesToItinerary = (
  cafes: any[],
  cafesPerDay: number,
  currentPlace: any,
  dayPlaces: ItineraryPlaceWithTime[],
  currentTime: Date,
  day: number,
  findNearestPlace: (current: any, candidates: any[]) => any,
  estimateTravelTime: (distance: number) => number,
  getTimeBlock: (day: number, hour: number) => string
) => {
  let cafesAdded = 0;
  let updatedCurrentPlace = currentPlace;
  let updatedCurrentTime = currentTime;
  
  for (let i = 0; i < cafesPerDay && cafes.some(c => !c.usedInItinerary); i++) {
    if (!updatedCurrentPlace) continue;
    
    const nearest = findNearestPlace(updatedCurrentPlace, cafes.filter(c => !c.usedInItinerary));
    
    if (nearest) {
      nearest.usedInItinerary = true;
      
      // 이동 시간 계산
      const distance = calculateDistance(updatedCurrentPlace, nearest);
      const travelTime = estimateTravelTime(distance);
      
      // 이전 장소에 이동 시간 정보 추가
      if (dayPlaces.length > 0) {
        const lastPlace = dayPlaces[dayPlaces.length - 1];
        lastPlace.travel_time_to_next = `${travelTime}분`;
      }
      
      // 이동 시간을 현재 시간에 추가
      updatedCurrentTime = addMinutes(updatedCurrentTime, travelTime);
      
      const placeWithTime: ItineraryPlaceWithTime = {
        ...nearest,
        arrival_time: format(updatedCurrentTime, 'HH:mm'),
        time_block: getTimeBlock(day, updatedCurrentTime.getHours())
      };
      
      dayPlaces.push(placeWithTime);
      updatedCurrentPlace = nearest;
      
      // 카페에서 보내는 시간 (60분)
      updatedCurrentTime = addMinutes(updatedCurrentTime, 60);
      cafesAdded++;
    }
  }
  
  return {
    currentPlace: updatedCurrentPlace,
    currentTime: updatedCurrentTime,
    added: cafesAdded
  };
};

// 두 장소 간의 거리 계산
const calculateDistance = (p1: Place, p2: Place): number => {
  // 두 지점 간 직선 거리 계산 (Haversine formula)
  const R = 6371; // 지구 반경 (km)
  if (!p1?.x || !p1?.y || !p2?.x || !p2?.y) return 0;
  
  const dLat = (p2.y - p1.y) * Math.PI / 180;
  const dLon = (p2.x - p1.x) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(p1.y * Math.PI / 180) * Math.cos(p2.y * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // km 단위 거리
};
