import { Place, ItineraryPlaceWithTime } from '@/types/supabase';
import { PlaceWithUsedFlag, findNearestPlace, categorizeAndFlagPlaces } from '../utils/schedule';
import { calculateDistance, calculateTotalDistance } from '../utils/distance';
import { format, addMinutes, parse } from 'date-fns';

export interface ItineraryDay {
  day: number;
  places: ItineraryPlaceWithTime[];
  totalDistance: number;
}

// 이동 시간을 추정하는 함수 (거리에 기반한 간단한 추정)
const estimateTravelTime = (distance: number): number => {
  // 거리(km)에 따라 소요 시간(분) 추정 
  // 평균 속도 40km/h로 가정 (40km/60min = 0.667km/min)
  return Math.ceil(distance / 0.667);
};

// 시간대 블록을 결정하는 함수
const getTimeBlock = (day: number, hour: number): string => {
  if (hour < 12) return `${day}일차 오전`;
  if (hour < 17) return `${day}일차 오후`;
  return `${day}일차 저녁`;
};

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
      
      // Add accommodation if available
      if (accommodations.length > 0) {
        const accommodation = accommodations.find(a => !a.usedInItinerary);
        if (accommodation) {
          accommodation.usedInItinerary = true;
          
          const placeWithTime: ItineraryPlaceWithTime = {
            ...accommodation,
            arrival_time: format(currentTime, 'HH:mm'),
            time_block: getTimeBlock(day, currentTime.getHours())
          };
          
          dayPlaces.push(placeWithTime);
          currentPlace = accommodation;
          
          // 숙소에서 30분 머무른다고 가정
          currentTime = addMinutes(currentTime, 30);
        }
      }
      
      // Start with an attraction if no accommodation
      if (!currentPlace && attractions.length > 0) {
        const attraction = attractions.find(a => !a.usedInItinerary);
        if (attraction) {
          attraction.usedInItinerary = true;
          
          const placeWithTime: ItineraryPlaceWithTime = {
            ...attraction,
            arrival_time: format(currentTime, 'HH:mm'),
            time_block: getTimeBlock(day, currentTime.getHours())
          };
          
          dayPlaces.push(placeWithTime);
          currentPlace = attraction;
          
          // 관광지에서 1시간 머무른다고 가정
          currentTime = addMinutes(currentTime, 60);
        }
      }
      
      // Fallback to any available place
      if (!currentPlace && places.length > 0) {
        const anyPlaceFromOriginal = places.find(p => 
          !accommodations.some(a => a.id === p.id) && 
          !attractions.some(a => a.id === p.id) && 
          !restaurants.some(r => r.id === p.id) && 
          !cafes.some(c => c.id === p.id)
        );
        
        if (anyPlaceFromOriginal) {
          const placeWithUsedFlag: PlaceWithUsedFlag = { ...anyPlaceFromOriginal, usedInItinerary: true };
          
          const placeWithTime: ItineraryPlaceWithTime = {
            ...placeWithUsedFlag,
            arrival_time: format(currentTime, 'HH:mm'),
            time_block: getTimeBlock(day, currentTime.getHours())
          };
          
          dayPlaces.push(placeWithTime);
          currentPlace = placeWithUsedFlag;
          
          // 기본 장소에서 45분 머무른다고 가정
          currentTime = addMinutes(currentTime, 45);
        }
      }
      
      // 이전 장소 위치에서 다음 장소를 선택하며 일정 구성
      if (currentPlace) {
        // Add attractions
        for (let i = 0; i < attractionsPerDay && attractions.some(a => !a.usedInItinerary); i++) {
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
            currentTime = addMinutes(currentTime, travelTime);
            
            const placeWithTime: ItineraryPlaceWithTime = {
              ...nearest,
              arrival_time: format(currentTime, 'HH:mm'),
              time_block: getTimeBlock(day, currentTime.getHours())
            };
            
            dayPlaces.push(placeWithTime);
            currentPlace = nearest;
            
            // 관광지에서 보내는 시간 (60분)
            currentTime = addMinutes(currentTime, 60);
          }
        }
        
        // Add restaurants
        for (let i = 0; i < restaurantsPerDay && restaurants.some(r => !r.usedInItinerary); i++) {
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
            currentTime = addMinutes(currentTime, travelTime);
            
            const placeWithTime: ItineraryPlaceWithTime = {
              ...nearest,
              arrival_time: format(currentTime, 'HH:mm'),
              time_block: getTimeBlock(day, currentTime.getHours())
            };
            
            dayPlaces.push(placeWithTime);
            currentPlace = nearest;
            
            // 식당에서 보내는 시간 (90분)
            currentTime = addMinutes(currentTime, 90);
          }
        }
        
        // Add cafes
        for (let i = 0; i < cafesPerDay && cafes.some(c => !c.usedInItinerary); i++) {
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
            currentTime = addMinutes(currentTime, travelTime);
            
            const placeWithTime: ItineraryPlaceWithTime = {
              ...nearest,
              arrival_time: format(currentTime, 'HH:mm'),
              time_block: getTimeBlock(day, currentTime.getHours())
            };
            
            dayPlaces.push(placeWithTime);
            currentPlace = nearest;
            
            // 카페에서 보내는 시간 (60분)
            currentTime = addMinutes(currentTime, 60);
          }
        }
        
        // 마지막 장소는 travel_time_to_next가 없음
        if (dayPlaces.length > 0) {
          dayPlaces[dayPlaces.length - 1].travel_time_to_next = "-";
        }
        
        const totalDistance = calculateTotalDistance(dayPlaces);
        
        itinerary.push({
          day,
          places: dayPlaces,
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
