import React, { useState, useEffect } from 'react';
import { Place, SelectedPlace } from '@/types/supabase';
import { toast } from 'sonner';
import { useItineraryCreator, ItineraryDay } from '@/hooks/use-itinerary-creator';
import ItineraryPanel from './ItineraryPanel';
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { ServerRouteResponse, SchedulePayload } from '@/types/schedule';

interface ScheduleGeneratorProps {
  selectedPlaces: SelectedPlace[];
  dates: {
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
  } | null;
  startDatetimeISO: string | null;
  endDatetimeISO: string | null;
  onClose: () => void;
}

export const ScheduleGenerator: React.FC<ScheduleGeneratorProps> = ({
  selectedPlaces,
  dates,
  startDatetimeISO,
  endDatetimeISO,
  onClose
}) => {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { createItinerary } = useItineraryCreator();
  const { generateSchedule: generateScheduleViaHook, isGenerating } = useScheduleGeneratorHook();
  const { setServerRoutes } = useMapContext();

  useEffect(() => {
    if (!startDatetimeISO || !endDatetimeISO) {
      toast.error("여행 날짜와 시간 정보가 올바르지 않아 일정을 생성할 수 없습니다.");
      onClose();
      return;
    }

    if (selectedPlaces.length === 0) {
      toast.error("선택된 장소가 없습니다.");
      onClose();
      return;
    }

    runScheduleGenerationProcess();
  }, [startDatetimeISO, endDatetimeISO, selectedPlaces, onClose]);

  const preparePayload = (): SchedulePayload => {
    if (!startDatetimeISO || !endDatetimeISO) {
      toast.error("날짜 및 시간을 먼저 선택해주세요.");
      throw new Error("시작 또는 종료 날짜/시간 ISO 문자열이 유효하지 않습니다.");
    }
    
    const directlySelectedPlaces = selectedPlaces.filter(p => !p.isCandidate);
    const autoCompletedPlaces = selectedPlaces.filter(p => p.isCandidate);
    
    const selectedPlacesPayload = directlySelectedPlaces.map(p => ({ 
      id: typeof p.id === 'string' ? parseInt(p.id, 10) || p.id : p.id, 
      name: p.name || 'Unknown Place' 
    }));
    
    const candidatePlacesPayload = autoCompletedPlaces.map(p => ({ 
      id: typeof p.id === 'string' ? parseInt(p.id, 10) || p.id : p.id, 
      name: p.name || 'Unknown Place' 
    }));
        
    const payload: SchedulePayload = {
      selected_places: selectedPlacesPayload,
      candidate_places: candidatePlacesPayload,
      start_datetime: startDatetimeISO,
      end_datetime: endDatetimeISO
    };
    
    console.log("📤 서버 요청 payload:", JSON.stringify(payload, null, 2));
    return payload;
  };

  const runScheduleGenerationProcess = async () => {
    try {
      setLoading(true);
      const payload = preparePayload();
      const serverResponse = await generateScheduleViaHook(payload);
      
      console.log("🔍 서버 응답 (raw):", serverResponse);

      if (serverResponse && serverResponse.itinerary) {
        console.log("🔍 서버 응답 (parsed for itinerary):", serverResponse);
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
        console.warn("서버 응답이 없거나 형식이 맞지 않아 클라이언트 측 일정을 생성합니다.");
        if (dates) {
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
        } else {
            toast.error("서버 응답이 없고, 클라이언트 fallback을 위한 날짜 정보도 없습니다.");
        }
      }
    } catch (error) {
      console.error("일정 생성 오류:", error);
      if (error instanceof Error && error.message.includes("날짜 및 시간을 먼저 선택해주세요")) {
      } else {
        toast.error("일정 생성 중 오류가 발생했습니다.");
      }
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

  const parseServerResponse = (response: any, places: SelectedPlace[]): ItineraryDay[] => {
    if (response.itinerary && Array.isArray(response.itinerary)) {
      return response.itinerary.map((day: any) => ({
        day: day.day,
        places: day.places.map((placeInfo: any) => { 
          let placeId: string;
          let placeName: string | undefined;

          if (typeof placeInfo === 'string') {
            placeId = placeInfo;
          } else if (typeof placeInfo === 'object' && placeInfo !== null && placeInfo.id) {
            placeId = placeInfo.id.toString();
            placeName = placeInfo.name;
          } else {
            return { id: 'unknown_id', name: '알 수 없는 장소 (형식 오류)', category: 'unknown', x: 0, y: 0, isSelected: false, isCandidate: false };
          }

          const place = places.find(p => p.id.toString() === placeId);
          return place || { id: placeId, name: placeName || '알 수 없는 장소 (ID로 못찾음)', category: 'unknown', x: 0, y: 0, isSelected: false, isCandidate: false };
        }),
        totalDistance: day.totalDistance || 0,
        routeData: response.routes?.[day.day] ? {
          nodeIds: response.routes[day.day].nodeIds,
          linkIds: response.routes[day.day].linkIds,
          interleaved_route: response.routes[day.day].interleaved_route
        } : undefined
      }));
    }
    
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
