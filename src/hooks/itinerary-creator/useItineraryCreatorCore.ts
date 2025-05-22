
import { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core'; // ItineraryDay 임포트 변경
import { estimateTravelTime, getTimeBlock } from './timeUtils';
import { assignPlacesToDays } from './placeAssignmentUtils';
import { calculateDistance } from '../../utils/distance';

export const useItineraryCreator = () => {
  const createItinerary = (
    places: Place[],
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string
  ): ItineraryDay[] => { // 반환 타입 ItineraryDay[] (core에서 임포트)
    // 여행 일수 계산: startDate와 endDate를 모두 포함하는 일수
    // 예: startDate=5/20, endDate=5/21 -> 2일
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const numDays = Math.max(1, daysDiff); // 최소 1일 보장
    
    console.log(`일정 생성 시작: ${numDays}일간의 여행 (${places.length}개 장소)`);
    
    // 시작 시간 파싱
    const [startHour, startMinute] = startTime.split(':').map(Number);

    const itinerary: ItineraryDay[] = assignPlacesToDays({ // 타입 명시
      places,
      numDays,
      startDate,
      startHour,
      startMinute,
      calculateDistance,
      estimateTravelTime,
      getTimeBlock
    });
    
    console.log(`일정 생성 완료: ${itinerary.length}일 일정, 총 ${itinerary.reduce((sum, dayItinerary) => sum + dayItinerary.places.length, 0)}개 장소`);
    
    return itinerary;
  };

  return { createItinerary };
};
