
import React, { useState, useEffect } from 'react';
import { Place } from '@/types/supabase';
import { toast } from 'sonner';
import { useItineraryCreator, ItineraryDay } from '@/hooks/use-itinerary-creator';
import ItineraryPanel from './ItineraryPanel';
import { useScheduleGenerator } from '@/hooks/use-schedule-generator';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { ServerRouteResponse } from '@/types/schedule';

interface ScheduleGeneratorProps {
  selectedPlaces: Place[];
  dates: {
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
  } | null;
  onClose: () => void;
}

export const ScheduleGenerator: React.FC<ScheduleGeneratorProps> = ({
  selectedPlaces,
  dates,
  onClose
}) => {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { createItinerary } = useItineraryCreator();
  const { generateSchedule, isGenerating } = useScheduleGenerator();
  const { setServerRoutes } = useMapContext();

  useEffect(() => {
    if (!dates) {
      toast.error("여행 날짜와 시간 정보가 없습니다.");
      onClose();
      return;
    }

    if (selectedPlaces.length === 0) {
      toast.error("선택된 장소가 없습니다.");
      onClose();
      return;
    }

    generateSchedule();
  }, []);

  const generateSchedule = async () => {
    if (!dates) return;
    
    try {
      setLoading(true);
      
      // 서버에 일정 생성 요청
      const payload = {
        selected_places: selectedPlaces.map(p => ({ id: p.id, name: p.name })),
        candidate_places: [],
        start_datetime: dates.startDate.toISOString(),
        end_datetime: dates.endDate.toISOString()
      };
      
      const serverResponse = await generateSchedule(payload);
      
      if (!serverResponse) {
        // 서버 응답이 없으면 클라이언트 측에서 일정 생성 (폴백)
        const generatedItinerary = createItinerary(
          selectedPlaces,
          dates.startDate,
          dates.endDate,
          dates.startTime,
          dates.endTime
        );
        
        setItinerary(generatedItinerary);
        
        // 첫 번째 일자 선택
        if (generatedItinerary.length > 0) {
          setSelectedDay(generatedItinerary[0].day);
        }
      } else {
        // 서버 응답으로부터 일정 생성
        console.log('서버로부터 일정 데이터 수신:', serverResponse);
        
        // 서버 응답 형식에 따라 파싱 로직 구현 필요
        const parsedItinerary = parseServerResponse(serverResponse, selectedPlaces);
        setItinerary(parsedItinerary);
        
        // 경로 데이터 저장
        if (serverResponse.routes) {
          const routesData: Record<number, ServerRouteResponse> = {};
          
          // 일자별 경로 데이터 추출
          Object.entries(serverResponse.routes).forEach(([dayStr, routeData]) => {
            const day = parseInt(dayStr, 10);
            if (!isNaN(day)) {
              routesData[day] = routeData as ServerRouteResponse;
            }
          });
          
          // 맵 컨텍스트에 경로 데이터 저장
          setServerRoutes(routesData);
        }
        
        // 첫 번째 일자 선택
        if (parsedItinerary.length > 0) {
          setSelectedDay(parsedItinerary[0].day);
        }
      }
      
      toast.success("일정이 성공적으로 생성되었습니다!");
    } catch (error) {
      console.error("일정 생성 오류:", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 서버 응답 파싱 함수 (서버 API 응답 형식에 맞게 수정 필요)
  const parseServerResponse = (response: any, places: Place[]): ItineraryDay[] => {
    // 서버 응답 형식에 따라 구현 필요
    // 임시 구현 (서버 응답 형식에 맞게 수정 필요)
    if (response.itinerary && Array.isArray(response.itinerary)) {
      return response.itinerary.map((day: any) => ({
        day: day.day,
        places: day.places.map((placeId: string) => {
          const place = places.find(p => p.id === placeId);
          return place || { id: placeId, name: '알 수 없는 장소', category: 'unknown', x: 0, y: 0 };
        }),
        totalDistance: day.totalDistance || 0,
        // GeoJSON 연동을 위한 경로 데이터
        routeData: response.routes?.[day.day] ? {
          nodeIds: response.routes[day.day].nodeIds,
          linkIds: response.routes[day.day].linkIds
        } : undefined
      }));
    }
    
    // 기본 폴백: 클라이언트 측 일정 생성
    if (dates) {
      return createItinerary(
        places,
        dates.startDate,
        dates.endDate,
        dates.startTime,
        dates.endTime
      );
    }
    
    return [];
  };

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
  };

  if (loading || isGenerating) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-medium">일정을 생성하는 중...</p>
        <p className="text-sm text-muted-foreground mt-2">잠시만 기다려주세요</p>
      </div>
    );
  }

  return (
    <ItineraryPanel 
      itinerary={itinerary} 
      startDate={dates?.startDate || new Date()}
      onSelectDay={handleSelectDay}
      onClose={onClose}
      selectedDay={selectedDay}
    />
  );
};
