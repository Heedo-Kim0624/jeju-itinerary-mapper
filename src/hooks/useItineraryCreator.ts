
import { ItineraryDay, ItineraryPlaceWithTime, Place } from '@/types';
import { calculateDurationInDays, getDayOfWeek, formatDate } from '@/lib/dateUtils'; // dateUtils 필요

// 임시 dateUtils - 실제 프로젝트에 맞게 경로 및 내용 수정 필요
// 파일: src/lib/dateUtils.ts
/*
export const calculateDurationInDays = (startDate: Date, endDate: Date): number => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

export const getDayOfWeek = (date: Date): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
};

export const formatDate = (date: Date): string => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}/${day}`;
};
*/


// 임시 폴백용 일정 생성기
// 실제 로직은 use-schedule-generator.ts 또는 useScheduleParser.ts 와 통합/조정 필요
export const useItineraryCreator = () => {
  const generateItineraryFallback = (
    places: Place[],
    startDate: Date,
    endDate: Date,
    _startTime: string, // _startTime, _endTime 일단 미사용
    _endTime: string
  ): ItineraryDay[] => {
    if (!places.length || !startDate || !endDate) return [];

    const durationDays = calculateDurationInDays(startDate, endDate);
    const itineraryDays: ItineraryDay[] = [];
    const placesPerDay = Math.ceil(places.length / durationDays);

    for (let i = 0; i < durationDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const dayPlaces = places.slice(i * placesPerDay, (i + 1) * placesPerDay);
      const itineraryPlaces: ItineraryPlaceWithTime[] = dayPlaces.map((place, index) => ({
        ...place,
        // id는 이미 string이어야 함
        category: place.category, // 이미 CategoryName 이어야 함
        timeBlock: `시간 ${index + 1}`, // 임시 시간 블록
      }));

      itineraryDays.push({
        day: i + 1,
        date: formatDate(currentDate),
        dayOfWeek: getDayOfWeek(currentDate),
        places: itineraryPlaces,
        totalDistance: 0, // 폴백에서는 거리 계산 안 함
      });
    }
    return itineraryDays;
  };

  return { generateItineraryFallback };
};
