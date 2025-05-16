
import { useState, useCallback } from 'react';
import { Place, SelectedPlace, ItineraryDay as DomainItineraryDay } from '@/types/supabase';
import { toast } from 'sonner';
import { useItineraryCreator, ItineraryDay as CreatorItineraryDay } from '@/hooks/use-itinerary-creator';
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { ServerRouteResponse, SchedulePayload, ServerScheduleResponse as ServerResponseType } from '@/types/schedule'; // Renamed ServerScheduleResponse to ServerResponseType to avoid conflict with const

type ItineraryDay = DomainItineraryDay;

interface UseScheduleManagementProps {
  selectedPlaces: SelectedPlace[];
  dates: { startDate: Date; endDate: Date; startTime: string; endTime: string; } | null;
  startDatetimeISO: string | null;
  endDatetimeISO: string | null;
}

export const useScheduleManagement = ({
  selectedPlaces,
  dates,
  startDatetimeISO,
  endDatetimeISO,
}: UseScheduleManagementProps) => {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isLoadingState, setIsLoadingState] = useState<boolean>(true); // Internal loading state

  const { createItinerary } = useItineraryCreator();
  const { generateSchedule: generateScheduleViaHook, isGenerating: isServerGenerating } = useScheduleGeneratorHook();
  const { setServerRoutes } = useMapContext();

  const preparePayload = useCallback((): SchedulePayload | null => {
    if (!startDatetimeISO || !endDatetimeISO) {
      // This toast is now handled by the component calling runScheduleGenerationProcess
      // toast.error("날짜 및 시간을 먼저 선택해주세요."); 
      return null;
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
    
    console.log("📤 서버 요청 payload (from useScheduleManagement):", JSON.stringify(payload, null, 2));
    return payload;
  }, [selectedPlaces, startDatetimeISO, endDatetimeISO]);

  const parseServerResponse = useCallback((response: ServerResponseType, currentSelectedPlaces: SelectedPlace[]): ItineraryDay[] => {
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
            return { 
              id: 'unknown_id', name: '알 수 없는 장소 (형식 오류)', category: 'unknown', 
              x: 0, y: 0, address: '', phone: '', description: '', rating: 0, 
              image_url: '', road_address: '', homepage: '', isSelected: false, isCandidate: false 
            };
          }

          const place = currentSelectedPlaces.find(p => p.id.toString() === placeId);
          return place || { 
            id: placeId, name: placeName || '알 수 없는 장소 (ID로 못찾음)', category: 'unknown', 
            x: 0, y: 0, address: '', phone: '', description: '', rating: 0, 
            image_url: '', road_address: '', homepage: '', isSelected: false, isCandidate: false 
          };
        }),
        totalDistance: day.totalDistance || 0,
        routeData: response.routes?.[day.day] ? {
          nodeIds: response.routes[day.day].nodeIds?.map(String),
          linkIds: response.routes[day.day].linkIds?.map(String),
          interleaved_route: response.routes[day.day].interleaved_route
        } : undefined
      }));
    }
    
    if (dates) {
      const clientItinerary: CreatorItineraryDay[] = createItinerary(
        currentSelectedPlaces,
        dates.startDate,
        dates.endDate,
        dates.startTime,
        dates.endTime
      );
      return clientItinerary.map(day => ({
        ...day,
        places: day.places as Place[], 
      }));
    }
    
    return [];
  }, [dates, createItinerary]);

  const runScheduleGenerationProcess = useCallback(async () => {
    setIsLoadingState(true);
    try {
      const payload = preparePayload();
      if (!payload) {
        // Error toast handled by the calling component's useEffect
        setIsLoadingState(false);
        return; 
      }

      const serverResponse = await generateScheduleViaHook(payload);
      console.log("🔍 서버 응답 (raw, from useScheduleManagement):", serverResponse);

      if (serverResponse && serverResponse.itinerary) {
        console.log("🔍 서버 응답 (parsed for itinerary, from useScheduleManagement):", serverResponse);
        
        const parsedItinerary = parseServerResponse(serverResponse, selectedPlaces);
        setItinerary(parsedItinerary);
        
        if (serverResponse.routes) {
          const routesData: Record<number, ServerRouteResponse> = {};
          Object.entries(serverResponse.routes).forEach(([dayStr, routeData]) => {
            const dayNum = parseInt(dayStr, 10);
            if (!isNaN(dayNum)) {
              routesData[dayNum] = routeData as ServerRouteResponse;
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
            const generatedItinerary: CreatorItineraryDay[] = createItinerary(
              selectedPlaces,
              dates.startDate,
              dates.endDate,
              dates.startTime,
              dates.endTime
            );
            const domainItinerary = generatedItinerary.map(day => ({
                ...day,
                places: day.places as Place[],
            }));
            setItinerary(domainItinerary);

            if (domainItinerary.length > 0) {
              setSelectedDay(domainItinerary[0].day);
            }
            toast.success("클라이언트에서 일정이 성공적으로 생성되었습니다!");
        } else {
            toast.error("서버 응답이 없고, 클라이언트 fallback을 위한 날짜 정보도 없습니다.");
        }
      }
    } catch (error) {
      console.error("일정 생성 오류 (useScheduleManagement):", error);
      if (!(error instanceof Error && error.message.includes("날짜 및 시간을 먼저 선택해주세요"))) {
        toast.error("일정 생성 중 오류가 발생했습니다.");
      }
      if (dates) {
        console.warn("오류 발생으로 클라이언트 측 일정을 생성합니다 (useScheduleManagement).");
        const generatedItinerary: CreatorItineraryDay[] = createItinerary(
          selectedPlaces,
          dates.startDate,
          dates.endDate,
          dates.startTime,
          dates.endTime
        );
        const domainItinerary = generatedItinerary.map(day => ({
            ...day,
            places: day.places as Place[],
        }));
        setItinerary(domainItinerary);
        if (domainItinerary.length > 0) {
          setSelectedDay(domainItinerary[0].day);
        }
      }
    } finally {
      setIsLoadingState(false);
    }
  }, [
    preparePayload, 
    generateScheduleViaHook, 
    parseServerResponse, 
    selectedPlaces, 
    setServerRoutes, 
    dates, 
    createItinerary
  ]);

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
  };

  return {
    itinerary,
    selectedDay,
    isLoading: isLoadingState || isServerGenerating,
    handleSelectDay,
    runScheduleGenerationProcess,
  };
};
