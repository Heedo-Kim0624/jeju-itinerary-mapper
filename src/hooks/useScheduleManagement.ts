import { useState, useCallback } from 'react';
import { Place, SelectedPlace, ItineraryDay as DomainItineraryDay, ItineraryPlaceWithTime } from '@/types/supabase';
import { toast } from 'sonner';
import { useItineraryCreator, ItineraryDay as CreatorItineraryDay } from '@/hooks/use-itinerary-creator';
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { ServerRouteResponse, SchedulePayload, ServerScheduleResponse as ServerResponseType } from '@/types/schedule'; 

type ItineraryDay = DomainItineraryDay;

interface UseScheduleManagementProps {
  selectedPlaces: SelectedPlace[];
  dates: { startDate: Date; endDate: Date; startTime: string; endTime: string; } | null;
  // These are now the locally formatted strings "YYYY-MM-DDTHH:mm:ss"
  startDatetimeLocal: string | null; 
  endDatetimeLocal: string | null;
}

export const useScheduleManagement = ({
  selectedPlaces,
  dates,
  startDatetimeLocal, // Changed from startDatetimeISO
  endDatetimeLocal,   // Changed from endDatetimeISO
}: UseScheduleManagementProps) => {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isLoadingState, setIsLoadingState] = useState<boolean>(true);

  const { createItinerary } = useItineraryCreator();
  const { generateSchedule: generateScheduleViaHook, isGenerating: isServerGenerating } = useScheduleGeneratorHook();
  const { setServerRoutes } = useMapContext();

  const preparePayload = useCallback((): SchedulePayload | null => {
    if (!startDatetimeLocal || !endDatetimeLocal) {
      // Toast will be handled by the caller or runScheduleGenerationProcess
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
      start_datetime: startDatetimeLocal, // Use local formatted string
      end_datetime: endDatetimeLocal    // Use local formatted string
    };
    
    console.log("📤 서버 요청 payload (from useScheduleManagement, local time strings):", JSON.stringify(payload, null, 2));
    return payload;
  }, [selectedPlaces, startDatetimeLocal, endDatetimeLocal]);

  const parseServerResponse = useCallback((response: ServerResponseType, currentSelectedPlaces: SelectedPlace[]): ItineraryDay[] => {
    if (response.itinerary && Array.isArray(response.itinerary)) {
      return response.itinerary.map((day: any): ItineraryDay => ({ // Explicitly type the return of map
        day: day.day,
        places: day.places.map((placeInfo: any): ItineraryPlaceWithTime => { // Explicitly type here
          let placeId: string | number;
          let placeName: string | undefined;
          let serverPlaceDetails: Partial<ItineraryPlaceWithTime> = {};

          if (typeof placeInfo === 'string' || typeof placeInfo === 'number') {
            placeId = placeInfo.toString();
          } else if (typeof placeInfo === 'object' && placeInfo !== null && (placeInfo.id || placeInfo.id === 0) ) {
            placeId = placeInfo.id.toString();
            placeName = placeInfo.name;
            // Capture all properties from placeInfo, including time_block
            serverPlaceDetails = { ...placeInfo };
          } else {
            // Fallback for malformed placeInfo
            return { 
              id: 'unknown_id_' + Math.random(), name: '알 수 없는 장소 (형식 오류)', category: 'unknown', 
              x: 0, y: 0, address: '', phone: '', description: '', rating: 0, 
              image_url: '', road_address: '', homepage: '', isSelected: false, isCandidate: false,
              time_block: undefined // Ensure all ItineraryPlaceWithTime fields
            };
          }

          const existingPlace = currentSelectedPlaces.find(p => p.id.toString() === placeId.toString());
          
          const base = existingPlace || { 
            id: placeId, name: placeName || `장소 ${placeId}`, category: 'unknown', 
            x: 0, y: 0, address: '', phone: '', description: '', rating: 0, 
            image_url: '', road_address: '', homepage: '', isSelected: false, isCandidate: false,
            time_block: undefined
          };
          
          // Merge, giving precedence to serverPlaceDetails for fields like time_block,
          // but ensuring all core Place fields are there from existingPlace or defaults.
          return {
            ...base, // Base fields from selectedPlaces or defaults
            ...serverPlaceDetails, // Override with server data (name, category, time_block, potentially x,y,address too)
            id: placeId.toString(), // Ensure ID is consistently string or number as per Place type
            name: serverPlaceDetails.name || base.name, // Prioritize server name
            category: serverPlaceDetails.category || base.category, // Prioritize server category
          } as ItineraryPlaceWithTime; // Cast to ensure type compliance
        }),
        totalDistance: day.totalDistance || 0,
        routeData: response.routes?.[day.day] ? {
          nodeIds: response.routes[day.day].nodeIds?.map(String),
          linkIds: response.routes[day.day].linkIds?.map(String),
          interleaved_route: response.routes[day.day].interleaved_route
        } : undefined
      }));
    }
    
    // ... keep existing code (client-side fallback itinerary creation)
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
        places: day.places.map(p => ({...p, time_block: undefined }) as ItineraryPlaceWithTime), 
      }));
    }
    
    return [];
  }, [dates, createItinerary]);

  const runScheduleGenerationProcess = useCallback(async () => {
    setIsLoadingState(true);
    try {
      const payload = preparePayload();
      if (!payload) {
        toast.error("⚠️ 선택한 장소 정보 또는 경로 계산이 부족하여 일정을 생성하지 못했습니다. (날짜 정보 누락)");
        setIsLoadingState(false);
        return; 
      }

      const serverResponse = await generateScheduleViaHook(payload);
      console.log("🔍 서버 응답 (raw, from useScheduleManagement):", serverResponse);

      if (serverResponse && serverResponse.itinerary && serverResponse.itinerary.length > 0) {
        console.log("🔍 서버 응답 (parsed for itinerary, from useScheduleManagement):", serverResponse);
        
        const parsedItinerary = parseServerResponse(serverResponse, selectedPlaces);
        
        if (parsedItinerary.length === 0 || parsedItinerary.every(day => day.places.length === 0)) {
          toast.error("⚠️ 선택한 장소 정보 또는 경로 계산이 부족하여 일정을 생성하지 못했습니다.");
          setItinerary([]); // Set to empty itinerary
        } else {
          setItinerary(parsedItinerary);
          toast.success("서버로부터 일정을 성공적으로 생성했습니다!");
        }
        
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
        
        if (parsedItinerary.length > 0 && !parsedItinerary.every(day => day.places.length === 0)) {
          setSelectedDay(parsedItinerary.find(day => day.places.length > 0)?.day || parsedItinerary[0].day);
        } else {
          setSelectedDay(null);
        }

      } else {
        toast.error("⚠️ 선택한 장소 정보 또는 경로 계산이 부족하여 일정을 생성하지 못했습니다. (서버 응답 없음/비정상)");
        console.warn("서버 응답이 없거나 형식이 맞지 않아 클라이언트 측 일정을 생성합니다.");
        // ... keep existing code (client-side fallback)
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
                places: day.places.map(p => ({...p, time_block: undefined }) as ItineraryPlaceWithTime),
            }));
            
            if (domainItinerary.length === 0 || domainItinerary.every(day => day.places.length === 0)) {
              toast.error("⚠️ 선택한 장소 정보 또는 경로 계산이 부족하여 일정을 생성하지 못했습니다. (클라이언트 생성 실패)");
              setItinerary([]);
            } else {
              setItinerary(domainItinerary);
              toast.success("클라이언트에서 일정이 성공적으로 생성되었습니다!");
            }

            if (domainItinerary.length > 0 && !domainItinerary.every(day => day.places.length === 0)) {
              setSelectedDay(domainItinerary.find(day => day.places.length > 0)?.day || domainItinerary[0].day);
            } else {
              setSelectedDay(null);
            }
        } else {
            toast.error("⚠️ 선택한 장소 정보 또는 경로 계산이 부족하여 일정을 생성하지 못했습니다. (날짜 정보 없음)");
            setItinerary([]);
        }
      }
    } catch (error) {
      console.error("일정 생성 오류 (useScheduleManagement):", error);
      toast.error("⚠️ 선택한 장소 정보 또는 경로 계산이 부족하여 일정을 생성하지 못했습니다. (처리 중 오류)");
      // ... keep existing code (client-side fallback on error)
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
            places: day.places.map(p => ({...p, time_block: undefined }) as ItineraryPlaceWithTime),
        }));
        setItinerary(domainItinerary); // Still set client itinerary on error as a fallback
        if (domainItinerary.length > 0 && !domainItinerary.every(day => day.places.length === 0)) {
          setSelectedDay(domainItinerary.find(day => day.places.length > 0)?.day || domainItinerary[0].day);
        } else {
           setSelectedDay(null);
        }
      } else {
        setItinerary([]);
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
