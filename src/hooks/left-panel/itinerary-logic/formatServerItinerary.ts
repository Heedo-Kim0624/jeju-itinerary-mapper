// 기존 임포트에서 CategoryName 직접 임포트 추가
import { Place, ItineraryDay, ItineraryPlaceWithTime, CategoryName } from '@/types/core';
import { formatTimeString } from '@/utils/date-utils';

// 서버 응답을 클라이언트 일정 형식으로 변환
export const convertServerToClientItinerary = (
  serverItinerary: any[], 
  startDate: Date
): ItineraryDay[] => {
  if (!serverItinerary || !Array.isArray(serverItinerary)) {
    console.error('Invalid server itinerary format:', serverItinerary);
    return [];
  }

  // 날짜 포맷팅 함수
  const formatDate = (dayOffset: number): string => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + dayOffset);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  // 요일 매핑
  const getDayOfWeek = (dayOffset: number): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + dayOffset);
    return days[date.getDay()];
  };

  try {
    return serverItinerary.map((day, dayIndex) => {
      // 일정 일자 정보 설정
      const dayNumber = dayIndex + 1;
      const dayOfWeek = getDayOfWeek(dayIndex);
      const date = formatDate(dayIndex);

      // 장소 정보 변환
      const places: ItineraryPlaceWithTime[] = day.places.map((place: any, placeIndex: number) => {
        // 기본 시간 정보 설정
        const baseTime = 9 * 60; // 9:00 AM in minutes
        const stayDuration = 60; // 1 hour in minutes
        const timePerPlace = 90; // 1.5 hours per place (including travel)
        
        // 도착 시간 계산 (9:00 + 1.5시간 * 장소 인덱스)
        const arriveTimeMinutes = baseTime + (timePerPlace * placeIndex);
        const arriveHour = Math.floor(arriveTimeMinutes / 60);
        const arriveMinute = arriveTimeMinutes % 60;
        const arriveTime = `${arriveHour.toString().padStart(2, '0')}:${arriveMinute.toString().padStart(2, '0')}`;
        
        // 출발 시간 계산 (도착 시간 + 체류 시간)
        const departTimeMinutes = arriveTimeMinutes + stayDuration;
        const departHour = Math.floor(departTimeMinutes / 60);
        const departMinute = departTimeMinutes % 60;
        const departTime = `${departHour.toString().padStart(2, '0')}:${departMinute.toString().padStart(2, '0')}`;
        
        // 다음 장소까지 이동 시간 (기본 30분)
        const travelTimeToNext = placeIndex < day.places.length - 1 ? '30분' : 'N/A';
        
        // 시간 블록 형식 (예: "Mon_0900")
        const timeBlock = `${dayOfWeek}_${arriveHour.toString().padStart(2, '0')}${arriveMinute.toString().padStart(2, '0')}`;

        // Place 타입에 명시적으로 isSelected와 isCandidate 추가
        const placeWithMeta: Place = {
          ...place,
          isSelected: true, // Place 인터페이스에 이 속성이 추가되었으므로 문제 없음
          isCandidate: false // Place 인터페이스에 이 속성이 추가되었으므로 문제 없음
        };

        // ItineraryPlaceWithTime 객체 생성
        return {
          ...placeWithMeta,
          timeBlock,
          arriveTime,
          departTime,
          stayDuration,
          travelTimeToNext
        };
      });

      // 일정 일자 객체 생성
      return {
        day: dayNumber,
        dayOfWeek,
        date,
        places,
        totalDistance: day.totalDistance || 0,
        routeData: day.routeData || { nodeIds: [], linkIds: [], segmentRoutes: [] },
        interleaved_route: day.interleaved_route || []
      };
    });
  } catch (error) {
    console.error('Error converting server itinerary:', error);
    return [];
  }
};

// 클라이언트 일정을 서버 형식으로 변환 (필요한 경우)
export const convertClientToServerItinerary = (
  clientItinerary: ItineraryDay[]
): any[] => {
  if (!clientItinerary || !Array.isArray(clientItinerary)) {
    return [];
  }

  return clientItinerary.map(day => {
    return {
      day: day.day,
      places: day.places.map(place => ({
        id: place.id,
        name: place.name,
        category: place.category,
        x: place.x,
        y: place.y,
        address: place.address,
        road_address: place.road_address,
        time_block: place.timeBlock
      })),
      totalDistance: day.totalDistance,
      routeData: day.routeData,
      interleaved_route: day.interleaved_route
    };
  });
};

// 일정 데이터 유효성 검사
export const validateItineraryFormat = (itinerary: any): boolean => {
  if (!itinerary || !Array.isArray(itinerary)) {
    return false;
  }

  for (const day of itinerary) {
    if (!day.day || !Array.isArray(day.places)) {
      return false;
    }
    
    for (const place of day.places) {
      if (!place.id || !place.name || !place.x || !place.y) {
        return false;
      }
    }
  }

  return true;
};

// 일정 요약 정보 생성
export const generateItinerarySummary = (itinerary: ItineraryDay[]): string => {
  if (!itinerary || itinerary.length === 0) {
    return "일정이 없습니다.";
  }

  const totalDays = itinerary.length;
  const totalPlaces = itinerary.reduce((sum, day) => sum + day.places.length, 0);
  const placesPerDay = itinerary.map(day => day.places.length);
  
  return `${totalDays}일 일정, 총 ${totalPlaces}개 장소 (일자별: ${placesPerDay.join(', ')})`;
};
