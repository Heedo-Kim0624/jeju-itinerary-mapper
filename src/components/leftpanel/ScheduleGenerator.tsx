
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

    // Call the local async function that handles the generation process
    runScheduleGenerationProcess();
  }, []); // Removed dependencies to ensure it runs once on mount after checks

  // Renamed local async function
  const runScheduleGenerationProcess = async () => {
    if (!dates) return;
    
    try {
      setLoading(true);
      
      const payload = {
        selected_places: selectedPlaces.map(p => ({ id: p.id, name: p.name })),
        candidate_places: [], // This might be populated by prepareSchedulePayload if used earlier
        start_datetime: dates.startDate.toISOString(),
        end_datetime: dates.endDate.toISOString()
      };
      
      // Log the payload being sent to the server
      console.log("📤 서버 요청 payload:", JSON.stringify(payload, null, 2));
      
      // Call the hook's renamed function
      const serverResponse = await generateScheduleViaHook(payload);
      
      // Log the full server response
      console.log("🔍 서버 응답 (raw):", serverResponse);

      if (serverResponse && serverResponse.itinerary) {
        console.log("🔍 서버 응답 (parsed for itinerary):", serverResponse);
        
        // Log nodeIds from server response if available
        if (serverResponse.routes) {
          console.log("📊 서버 응답 경로 데이터 요약:");
          Object.entries(serverResponse.routes).forEach(([day, route]: [string, any]) => {
            if (route && route.nodeIds) {
              console.log(`📌 ${day}일차 nodeIds.length = ${route.nodeIds.length}`);
              console.log(`🔍 ${day}일차 nodeIds 샘플 =`, route.nodeIds.slice(0, 10), "...");
              
              // 분석: nodeId가 있는 요소의 타입 확인
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
        
        // 서버에서 받은 경로 데이터가 있으면 저장하고 로그 출력
        if (serverResponse.routes) {
          const routesData: Record<number, ServerRouteResponse> = {};
          
          Object.entries(serverResponse.routes).forEach(([dayStr, routeData]) => {
            const day = parseInt(dayStr, 10);
            if (!isNaN(day)) {
              // 서버 응답을 적절한 형태로 변환
              routesData[day] = routeData as ServerRouteResponse;
              
              // 경로 데이터 디버깅
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
        // Fallback to client-side generation if server response is not as expected
        console.warn("서버 응답이 없거나 형식이 맞지 않아 클라이언트 측 일정을 생성합니다.");
        const generatedItinerary = createItinerary(
          selectedPlaces,
          dates.startDate,
          dates.endDate,
          dates.startTime,
          dates.endTime
        );
        setItinerary(generatedItinerary);
        if (generatedItinerary.length > 0) {
          setSelectedDay(generatedItinerary[0].day);
        }
        toast.success("클라이언트에서 일정이 성공적으로 생성되었습니다!");
      }
    } catch (error) {
      console.error("일정 생성 오류:", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
      // Fallback to client-side generation on error
      if (dates) {
        console.warn("오류 발생으로 클라이언트 측 일정을 생성합니다.");
        const generatedItinerary = createItinerary(
          selectedPlaces,
          dates.startDate,
          dates.endDate,
          dates.startTime,
          dates.endTime
        );
        setItinerary(generatedItinerary);
        if (generatedItinerary.length > 0) {
          setSelectedDay(generatedItinerary[0].day);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // 서버 응답 파싱 함수 (서버 API 응답 형식에 맞게 수정 필요)
  const parseServerResponse = (response: any, places: Place[]): ItineraryDay[] => {
    console.log("서버 응답 파싱 시작");
    
    // 서버 응답 형식에 따라 구현 필요
    if (response.itinerary && Array.isArray(response.itinerary)) {
      const parsedItinerary = response.itinerary.map((day: any) => {
        // 장소 매핑
        const mappedPlaces = day.places.map((placeInfo: any) => { 
          let placeId: string;
          let placeName: string | undefined;

          if (typeof placeInfo === 'string') {
            placeId = placeInfo;
          } else if (typeof placeInfo === 'object' && placeInfo !== null && placeInfo.id) {
            placeId = placeInfo.id;
            placeName = placeInfo.name;
          } else {
            return { id: 'unknown_id', name: '알 수 없는 장소', category: 'unknown', x: 0, y: 0 };
          }

          const place = places.find(p => p.id === placeId);
          return place || { 
            id: placeId, 
            name: placeName || '알 수 없는 장소', 
            category: 'unknown', 
            x: 0, 
            y: 0 
          };
        });
        
        // 경로 데이터 추출
        let routeData;
        if (response.routes && response.routes[day.day]) {
          const dayRoute = response.routes[day.day];
          routeData = {
            nodeIds: dayRoute.nodeIds || [],
            linkIds: dayRoute.linkIds || []
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
          routeData // GeoJSON 연동을 위한 경로 데이터
        };
      });
      
      console.log(`서버에서 ${parsedItinerary.length}일 일정 파싱 완료`);
      return parsedItinerary;
    }
    
    // 기본 폴백: 클라이언트 측 일정 생성
    if (dates) {
      console.log("유효한 서버 응답 없음 - 클라이언트 일정 생성 시작");
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
