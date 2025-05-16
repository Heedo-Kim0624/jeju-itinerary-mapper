
import React, { useState, useEffect } from 'react';
import { Place } from '@/types/supabase';
import { toast } from 'sonner';
import { useItineraryCreator, ItineraryDay } from '@/hooks/use-itinerary-creator';
import ItineraryPanel from './ItineraryPanel';
import { useScheduleGenerator } from '@/hooks/use-schedule-generator';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { ServerRouteResponse, SchedulePayload } from '@/types/schedule';

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
  }, []); // Run once on mount after checks

  // Create a function to prepare payload based on the expected format
  const preparePayload = (): SchedulePayload => {
    if (!dates) throw new Error("Dates not provided");
    
    // 사용자가 선택한 장소와 자동 보완 장소 분리
    const directlySelectedPlaces = selectedPlaces.filter(p => !p.isCandidate);
    const autoCompletedPlaces = selectedPlaces.filter(p => p.isCandidate);
    
    // 서버에 보낼 형식으로 변환 (id, name만 포함)
    const selectedPlacesPayload = directlySelectedPlaces.map(p => ({ 
      id: typeof p.id === 'string' ? parseInt(p.id, 10) || p.id : p.id, 
      name: p.name || 'Unknown Place' 
    }));
    
    const candidatePlacesPayload = autoCompletedPlaces.map(p => ({ 
      id: typeof p.id === 'string' ? parseInt(p.id, 10) || p.id : p.id, 
      name: p.name || 'Unknown Place' 
    }));
    
    // 날짜를 ISO 타임스탬프로 변환
    const formatDateWithTime = (date: Date, time: string): string => {
      const [hours, minutes] = time.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes, 0, 0);
      return newDate.toISOString();
    };
    
    // Build and log the payload for debugging
    const payload: SchedulePayload = {
      selected_places: selectedPlacesPayload,
      candidate_places: candidatePlacesPayload,
      start_datetime: formatDateWithTime(dates.startDate, dates.startTime),
      end_datetime: formatDateWithTime(dates.endDate, dates.endTime)
    };
    
    console.log("📤 서버 요청 payload:", JSON.stringify(payload, null, 2));
    
    return payload;
  };

  // Renamed local async function
  const runScheduleGenerationProcess = async () => {
    if (!dates) return;
    
    try {
      setLoading(true);
      
      // Build the payload according to the expected format
      const payload = preparePayload();
      
      // Call the hook's renamed function
      const serverResponse = await generateScheduleViaHook(payload);
      
      // Log the full server response
      console.log("🔍 서버 응답 (raw):", serverResponse);

      if (serverResponse && serverResponse.itinerary) {
        console.log("🔍 서버 응답 (parsed for itinerary):", serverResponse);
        // Log nodeIds from server response if available
        if (serverResponse.routes) {
            Object.values(serverResponse.routes).forEach((route: any, index: number) => {
                if (route && route.nodeIds) {
                    console.log(`📌 Day ${index + 1} nodeIds.length = ${route.nodeIds.length}`);
                    console.log(`📌 Day ${index + 1} nodeIds (first 20) =`, route.nodeIds.slice(0, 20));
                } else {
                    console.log(`📌 Day ${index + 1} nodeIds not found in route data.`);
                }
            });
        } else {
            console.log("📌 serverResponse.routes not found.");
        }
        
        const parsedItinerary = parseServerResponse(serverResponse, selectedPlaces);
        setItinerary(parsedItinerary);
        
        if (serverResponse.routes) {
          const routesData: Record<number, ServerRouteResponse> = {};
          Object.entries(serverResponse.routes).forEach(([dayStr, routeData]) => {
            const day = parseInt(dayStr, 10);
            if (!isNaN(day)) {
              routesData[day] = routeData as ServerRouteResponse;
            }
          });
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
    // 서버 응답 형식에 따라 구현 필요
    // 임시 구현 (서버 응답 형식에 맞게 수정 필요)
    if (response.itinerary && Array.isArray(response.itinerary)) {
      return response.itinerary.map((day: any) => ({
        day: day.day,
        places: day.places.map((placeInfo: any) => { // Assuming placeInfo could be an ID or an object
          let placeId: string;
          let placeName: string | undefined;

          if (typeof placeInfo === 'string') {
            placeId = placeInfo;
          } else if (typeof placeInfo === 'object' && placeInfo !== null && placeInfo.id) {
            placeId = placeInfo.id.toString();
            placeName = placeInfo.name;
          } else {
            // Fallback for unexpected format
            return { id: 'unknown_id', name: '알 수 없는 장소 (형식 오류)', category: 'unknown', x: 0, y: 0 };
          }

          const place = places.find(p => p.id === placeId);
          return place || { id: placeId, name: placeName || '알 수 없는 장소 (ID로 못찾음)', category: 'unknown', x: 0, y: 0 };
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
