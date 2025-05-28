
import { useCallback } from 'react';
import { NewServerScheduleResponse } from '@/types/core';

export interface SimpleItineraryDay {
  day: number;
  date: string;
  dayOfWeek: string;
  places: Array<{
    id: string;
    name: string;
    category: string;
    timeBlock: string;
  }>;
  totalDistance: number;
}

export const useSimpleScheduleParser = () => {
  const parseServerResponse = useCallback((
    serverResponse: NewServerScheduleResponse,
    startDate: Date
  ): SimpleItineraryDay[] => {
    console.log('[SimpleScheduleParser] 서버 응답 파싱 시작:', serverResponse);
    
    if (!serverResponse || !serverResponse.schedule || !serverResponse.route_summary) {
      console.error('[SimpleScheduleParser] 서버 응답에 필수 데이터가 없습니다');
      return [];
    }

    // 요일별로 일정 그룹화
    const scheduleByDay = serverResponse.schedule.reduce((acc, item) => {
      const dayKey = item.time_block.split('_')[0]; 
      if (!acc[dayKey]) {
        acc[dayKey] = [];
      }
      acc[dayKey].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    // 경로 요약에서 거리 정보 추출
    const distanceByDay = serverResponse.route_summary.reduce((acc, routeItem) => {
      acc[routeItem.day] = routeItem.total_distance_m / 1000; // m -> km
      return acc;
    }, {} as Record<string, number>);

    const daysOfWeek = serverResponse.route_summary.map(item => item.day);

    return daysOfWeek.map((dayOfWeekKey, index) => {
      const dayNumber = index + 1;
      const dayScheduleItems = scheduleByDay[dayOfWeekKey] || [];
      const totalDistance = distanceByDay[dayOfWeekKey] || 0;
      
      // 날짜 계산
      const currentDayDate = new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000);
      const dateStr = `${String(currentDayDate.getMonth() + 1).padStart(2, '0')}/${String(currentDayDate.getDate()).padStart(2, '0')}`;

      // 장소 데이터 변환 (route 데이터 제외)
      const places = dayScheduleItems.map((scheduleItem) => ({
        id: scheduleItem.id?.toString() || scheduleItem.place_name,
        name: scheduleItem.place_name,
        category: scheduleItem.place_type,
        timeBlock: scheduleItem.time_block,
      }));

      return {
        day: dayNumber,
        date: dateStr,
        dayOfWeek: dayOfWeekKey,
        places,
        totalDistance,
      };
    });
  }, []);

  return { parseServerResponse };
};
