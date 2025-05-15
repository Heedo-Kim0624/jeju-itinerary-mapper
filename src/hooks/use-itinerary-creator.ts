import { useState, useCallback } from 'react';
import { Place } from '@/types/supabase';
import { ServerRouteResponse } from '@/types/schedule';

export interface ItineraryDay {
  day: number;
  places: Place[];
  startTime?: string;
  endTime?: string;
  routeData?: {
    nodeIds: string[];
    linkIds?: string[];
  };
  totalDistance?: number; // Added to match the type in supabase
}

export interface Itinerary {
  id?: string;
  title: string;
  startDate: Date;
  endDate: Date;
  days: number;
  schedule: ItineraryDay[];
}

interface UseItineraryCreatorProps {
  initialItinerary?: Itinerary;
}

interface UseItineraryCreatorReturn {
  itinerary: Itinerary;
  updateItineraryTitle: (title: string) => void;
  updateItineraryDates: (startDate: Date, endDate: Date) => void;
  addPlaceToDay: (day: number, place: Place) => void;
  removePlaceFromDay: (day: number, placeId: string) => void;
  movePlaceToDay: (fromDay: number, toDay: number, placeId: string) => void;
  setDayRouteData: (day: number, routeData: { nodeIds: string[]; linkIds?: string[] | undefined; }) => void;
  clearDayRouteData: (day: number) => void;
  initializeItinerary: (newItinerary: Itinerary) => void;
  resetItinerary: () => void;
}

/**
 * 일정 생성 및 관리 훅
 */
export const useItineraryCreator = ({ initialItinerary }: UseItineraryCreatorProps = {}): UseItineraryCreatorReturn => {
  const [itinerary, setItinerary] = useState<Itinerary>(
    initialItinerary || {
      title: '나의 새로운 여행 일정',
      startDate: new Date(),
      endDate: new Date(),
      days: 1,
      schedule: [{ day: 1, places: [] }],
    }
  );

  // 일정 제목 업데이트
  const updateItineraryTitle = useCallback((title: string) => {
    setItinerary(prev => ({ ...prev, title }));
  }, []);

  // 일정 시작/종료 날짜 업데이트
  const updateItineraryDates = useCallback((startDate: Date, endDate: Date) => {
    const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    setItinerary(prev => {
      // 기존 schedule 유지하고 날짜만 업데이트
      const updatedSchedule = prev.schedule.map((daySchedule, index) => ({
        ...daySchedule,
        day: index + 1, // day 속성도 업데이트
      }));

      // 날짜 변경에 따른 schedule 조정
      if (days > prev.days) {
        // 늘어난 날짜만큼 schedule에 추가
        for (let i = prev.days; i < days; i++) {
          updatedSchedule.push({ day: i + 1, places: [] });
        }
      } else if (days < prev.days) {
        // 줄어든 날짜만큼 schedule에서 제거
        updatedSchedule.length = days;
      }

      return {
        ...prev,
        startDate,
        endDate,
        days,
        schedule: updatedSchedule,
      };
    });
  }, []);

  // 특정 날짜에 장소 추가
  const addPlaceToDay = useCallback((day: number, place: Place) => {
    setItinerary(prev => {
      const updatedSchedule = prev.schedule.map(daySchedule => {
        if (daySchedule.day === day) {
          return { ...daySchedule, places: [...daySchedule.places, place] };
        }
        return daySchedule;
      });

      return { ...prev, schedule: updatedSchedule };
    });
  }, []);

  // 특정 날짜에서 장소 제거
  const removePlaceFromDay = useCallback((day: number, placeId: string) => {
    setItinerary(prev => {
      const updatedSchedule = prev.schedule.map(daySchedule => {
        if (daySchedule.day === day) {
          return {
            ...daySchedule,
            places: daySchedule.places.filter(place => place.id !== placeId),
          };
        }
        return daySchedule;
      });

      return { ...prev, schedule: updatedSchedule };
    });
  }, []);

  // 특정 날짜에서 다른 날짜로 장소 이동
  const movePlaceToDay = useCallback((fromDay: number, toDay: number, placeId: string) => {
    setItinerary(prev => {
      let movedPlace: Place | undefined;

      const updatedSchedule = prev.schedule.map(daySchedule => {
        if (daySchedule.day === fromDay) {
          const placeToRemove = daySchedule.places.find(place => place.id === placeId);
          if (placeToRemove) {
            movedPlace = placeToRemove;
          }
          return {
            ...daySchedule,
            places: daySchedule.places.filter(place => place.id !== placeId),
          };
        }
        return daySchedule;
      });

      if (movedPlace) {
        const finalSchedule = updatedSchedule.map(daySchedule => {
          if (daySchedule.day === toDay) {
            return { ...daySchedule, places: [...daySchedule.places, movedPlace!] };
          }
          return daySchedule;
        });
        return { ...prev, schedule: finalSchedule };
      }

      return prev;
    });
  }, []);

  // 특정 날짜에 대한 경로 데이터 설정
  const setDayRouteData = useCallback((day: number, routeData: { nodeIds: string[]; linkIds?: string[] | undefined; }) => {
    setItinerary(prev => {
      const updatedSchedule = prev.schedule.map(daySchedule => {
        if (daySchedule.day === day) {
          return { ...daySchedule, routeData: routeData };
        }
        return daySchedule;
      });
      return { ...prev, schedule: updatedSchedule };
    });
  }, []);

  // 특정 날짜에 대한 경로 데이터 초기화
  const clearDayRouteData = useCallback((day: number) => {
    setItinerary(prev => {
      const updatedSchedule = prev.schedule.map(daySchedule => {
        if (daySchedule.day === day) {
          return { ...daySchedule, routeData: undefined };
        }
        return daySchedule;
      });
      return { ...prev, schedule: updatedSchedule };
    });
  }, []);

  // 외부에서 itinerary data를 받아와서 초기화
  const initializeItinerary = useCallback((newItinerary: Itinerary) => {
    setItinerary(newItinerary);
  }, []);

  // 일정 초기화
  const resetItinerary = useCallback(() => {
    setItinerary({
      title: '나의 새로운 여행 일정',
      startDate: new Date(),
      endDate: new Date(),
      days: 1,
      schedule: [{ day: 1, places: [] }],
    });
  }, []);

  return {
    itinerary,
    updateItineraryTitle,
    updateItineraryDates,
    addPlaceToDay,
    removePlaceFromDay,
    movePlaceToDay,
    setDayRouteData,
    clearDayRouteData,
    initializeItinerary,
    resetItinerary,
  };
};
