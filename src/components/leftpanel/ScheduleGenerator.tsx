import React, { useState, useEffect } from 'react';
import { Place } from '@/types/supabase';
import { toast } from 'sonner';
import { useItineraryCreator, ItineraryDay as BaseItineraryDay } from '@/hooks/use-itinerary-creator';
import ItineraryPanel from './ItineraryPanel';
import { useScheduleGenerator } from '@/hooks/use-schedule-generator';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { ServerRouteResponse, ExtractedRouteData, EnrichedItineraryDay } from '@/types/schedule';

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
  const [itinerary, setItinerary] = useState<EnrichedItineraryDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { createItinerary } = useItineraryCreator();
  const { generateSchedule: generateScheduleViaHook, isGenerating } = useScheduleGenerator();
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

    runScheduleGenerationProcess();
  }, []); // Ensure this runs once

  const runScheduleGenerationProcess = async () => {
    if (!dates) return;
    
    try {
      setLoading(true);
      
      const payload = {
        selected_places: selectedPlaces.map(p => ({ id: p.id, name: p.name })),
        candidate_places: [], 
        start_datetime: dates.startDate.toISOString(),
        end_datetime: dates.endDate.toISOString()
      };
      
      console.log("📤 서버 요청 payload:", JSON.stringify(payload, null, 2));
      
      const serverResponse = await generateScheduleViaHook(payload);
      
      console.log("🔍 서버 응답 (raw):", serverResponse);

      if (serverResponse && serverResponse.itinerary) {
        console.log("🔍 서버 응답 (parsed for itinerary):", serverResponse);
        
        if (serverResponse.routes) {
          console.log("📊 서버 응답 경로 데이터 요약:");
          Object.entries(serverResponse.routes).forEach(([day, route]: [string, any]) => {
            if (route && route.nodeIds) {
              console.log(`📌 ${day}일차 nodeIds.length = ${route.nodeIds.length}`);
              console.log(`🔍 ${day}일차 nodeIds 샘플 =`, route.nodeIds.slice(0, 10), "...");
              
              const nodeTypes = new Set();
              route.nodeIds.forEach((nodeId: any) => {
                nodeTypes.add(typeof nodeId);
              });
              console.log(`📊 ${day}일차 nodeIds 타입:`, [...nodeTypes]);
            } else {
              console.log(`❌ ${day}일차 nodeIds 없음`);
            }
          });
        } else {
          console.log("❌ serverResponse.routes 없음");
        }
        
        const parsedItinerary = parseServerResponse(serverResponse, selectedPlaces);
        setItinerary(parsedItinerary);
        
        if (serverResponse.routes) {
          const routesData: Record<number, ServerRouteResponse> = {};
          
          Object.entries(serverResponse.routes).forEach(([dayStr, routeData]) => {
            const day = parseInt(dayStr, 10);
            if (!isNaN(day)) {
              routesData[day] = routeData as ServerRouteResponse;
              
              const nodeIds = (routeData as ServerRouteResponse).nodeIds || [];
              console.log(`📊 ${dayStr}일차 경로 정보 저장:`, {
                노드수: nodeIds.length,
                샘플: nodeIds.slice(0, 5).join(", ") + "..."
              });
            }
          });
          
          console.log("📊 모든 일자 경로 데이터 저장 완료");
          setServerRoutes(routesData);
        }
        
        if (parsedItinerary.length > 0) {
          setSelectedDay(parsedItinerary[0].day);
        }
        toast.success("서버로부터 일정을 성공적으로 생성했습니다!");
      } else {
        console.warn("서버 응답이 없거나 형식이 맞지 않아 클라이언트 측 일정을 생성합니다.");
        const baseItinerary = createItinerary(
          selectedPlaces,
          dates.startDate,
          dates.endDate,
          dates.startTime,
          dates.endTime
        );
        const enrichedFallbackItinerary = baseItinerary.map(day => ({...day, routeData: undefined}));
        setItinerary(enrichedFallbackItinerary);

        if (enrichedFallbackItinerary.length > 0) {
          setSelectedDay(enrichedFallbackItinerary[0].day);
        }
        toast.success("클라이언트에서 일정이 성공적으로 생성되었습니다!");
      }
    } catch (error) {
      console.error("일정 생성 오류:", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
      if (dates) {
        console.warn("오류 발생으로 클라이언트 측 일정을 생성합니다.");
        const baseItinerary = createItinerary(
          selectedPlaces,
          dates.startDate,
          dates.endDate,
          dates.startTime,
          dates.endTime
        );
        const enrichedFallbackItinerary = baseItinerary.map(day => ({...day, routeData: undefined}));
        setItinerary(enrichedFallbackItinerary);
        if (enrichedFallbackItinerary.length > 0) {
          setSelectedDay(enrichedFallbackItinerary[0].day);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const parseServerResponse = (response: any, places: Place[]): EnrichedItineraryDay[] => {
    console.log("서버 응답 파싱 시작");
    
    if (response.itinerary && Array.isArray(response.itinerary)) {
      const parsedItinerary: EnrichedItineraryDay[] = response.itinerary.map((day: any) => {
        const mappedPlaces = day.places.map((placeInfo: any) => { 
          let placeId: string;
          let placeName: string | undefined;

          if (typeof placeInfo === 'string') {
            placeId = placeInfo;
          } else if (typeof placeInfo === 'object' && placeInfo !== null && placeInfo.id) {
            placeId = placeInfo.id;
            placeName = placeInfo.name;
          } else {
            return { id: 'unknown_id', name: '알 수 없는 장소', category: 'unknown', x: 0, y: 0 } as Place;
          }

          const place = places.find(p => p.id === placeId);
          return place || { 
            id: placeId, 
            name: placeName || '알 수 없는 장소', 
            category: 'unknown', 
            x: 0, 
            y: 0 
          } as Place;
        });
        
        let routeData: ExtractedRouteData | undefined = undefined;
        if (response.routes && response.routes[day.day]) {
          const dayRoute = response.routes[day.day];
          routeData = {
            nodeIds: dayRoute.nodeIds || [],
            linkIds: dayRoute.linkIds || [],
            totalDistance: dayRoute.totalDistance || 0, // Assuming totalDistance is part of routeData from server
          };
          
          console.log(`${day.day}일차 경로 데이터:`, {
            노드수: routeData.nodeIds.length,
            링크수: routeData.linkIds ? routeData.linkIds.length : '없음'
          });
        }
        
        return {
          day: day.day,
          places: mappedPlaces,
          totalDistance: day.totalDistance || 0,
          routeData 
        };
      });
      
      console.log(`서버에서 ${parsedItinerary.length}일 일정 파싱 완료`);
      return parsedItinerary;
    }
    
    if (dates) {
      console.log("유효한 서버 응답 없음 - 클라이언트 일정 생성 시작");
      const baseItinerary = createItinerary(
        places,
        dates.startDate,
        dates.endDate,
        dates.startTime,
        dates.endTime
      );
      return baseItinerary.map(day => ({...day, routeData: undefined}));
    }
    
    return [];
  };

  const handleSelectDay = (day: number) => {
    console.log(`${day}일차 선택됨`);
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
