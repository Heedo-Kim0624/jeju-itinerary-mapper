import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useSchedulePayload } from './places/use-schedule-payload';
import { Place, SchedulePayload } from '@/types/supabase';
import { CategoryName } from '@/utils/categoryUtils';
import { ExtractedRouteData, EnrichedItineraryDay } from '@/types/schedule';

export interface ItineraryDayState extends EnrichedItineraryDay {}

export const useItinerary = () => {
  const [itinerary, setItinerary] = useState<ItineraryDayState[] | null>(null);
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number | null>(null);
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  const { toast } = useToast();

  const handleSelectItineraryDay = (day: number) => {
    setSelectedItineraryDay(day);
  };

  const generateItinerary = async (schedulePayload: SchedulePayload | null) => {
    if (!schedulePayload) {
      toast({
        title: "일정 생성 실패",
        description: "날짜와 시간이 올바르게 선택되지 않았습니다.",
        variant: "destructive"
      });
      return null;
    }

    try {
      console.log('[일정 생성] API 호출 시작', schedulePayload);
      
      // Mock API call
      const mockResponse = await new Promise<ItineraryDayState[]>(resolve => {
        setTimeout(() => {
          resolve([
            {
              day: 1,
              places: schedulePayload.selected_places.slice(0, 3).map(sp => {
                return {
                  id: sp.id,
                  name: sp.name,
                  address: "Mock Address",
                  phone: "123-456-7890",
                  category: "restaurant",
                  description: "Mock description",
                  rating: 4.5,
                  x: 126.5702,
                  y: 33.4500,
                  image_url: "",
                  road_address: "Mock Road Address",
                  homepage: ""
                } as Place;
              }),
              totalDistance: 15000,
              routeData: {
                nodeIds: ['1', '2', '3'],
                linkIds: ['101', '102'],
                totalDistance: 15000
              }
            },
            {
              day: 2,
              places: schedulePayload.selected_places.slice(3, 6).map(sp => {
                return {
                  id: sp.id,
                  name: sp.name,
                  address: "Mock Address Day 2",
                  phone: "123-456-7890",
                  category: "attraction",
                  description: "Mock description day 2",
                  rating: 4.0,
                  x: 126.6000,
                  y: 33.5000,
                  image_url: "",
                  road_address: "Mock Road Address Day 2",
                  homepage: ""
                } as Place;
              }),
              totalDistance: 12000,
              routeData: {
                nodeIds: ['4', '5', '6'],
                linkIds: ['103', '104'],
                totalDistance: 12000
              }
            }
          ]);
        }, 1500);
      });

      console.log('[일정 생성] 응답 데이터:', mockResponse);
      
      setItinerary(mockResponse);
      setSelectedItineraryDay(1);
      setShowItinerary(true);
      
      toast({
        title: "일정 생성 성공",
        description: `${mockResponse.length}일 일정이 생성되었습니다.`
      });
      
      return mockResponse;
    } catch (error) {
      console.error('[일정 생성] 오류 발생:', error);
      
      toast({
        title: "일정 생성 실패",
        description: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive"
      });
      
      return null;
    }
  };

  return {
    itinerary,
    selectedItineraryDay,
    showItinerary,
    setItinerary,
    setSelectedItineraryDay,
    setShowItinerary,
    handleSelectItineraryDay,
    generateItinerary
  };
};
