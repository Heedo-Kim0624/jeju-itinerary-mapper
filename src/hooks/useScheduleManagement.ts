import { useState, useCallback, useEffect } from 'react';
import { Place, SelectedPlace, ItineraryDay as DomainItineraryDay, ItineraryPlaceWithTime } from '@/types/supabase';
import { toast } from 'sonner';
import { useItineraryCreator, ItineraryDay as CreatorItineraryDay } from '@/hooks/use-itinerary-creator';
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { ServerRouteResponse, SchedulePayload, ServerScheduleResponse as ServerResponseType } from '@/types/schedule'; // Renamed ServerScheduleResponse to ServerResponseType to avoid conflict with const
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser'; // 요청사항 4

type ItineraryDay = DomainItineraryDay;

interface UseScheduleManagementProps {
  selectedPlaces: SelectedPlace[];
  dates: { startDate: Date; endDate: Date; startTime: string; endTime: string; } | null;
  startDatetimeISO: string | null; // 이제 로컬 타임존 문자열 (YYYY-MM-DDTHH:mm:ss)
  endDatetimeISO: string | null;   // 이제 로컬 타임존 문자열 (YYYY-MM-DDTHH:mm:ss)
}

export const useScheduleManagement = ({
  selectedPlaces,
  dates,
  startDatetimeISO, // 이 값은 이제 로컬 시간 기준 문자열
  endDatetimeISO,   // 이 값은 이제 로컬 시간 기준 문자열
}: UseScheduleManagementProps) => {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isLoadingState, setIsLoadingState] = useState<boolean>(true); 

  const { createItinerary } = useItineraryCreator();
  const { generateSchedule: generateScheduleViaHook, isGenerating: isServerGenerating } = useScheduleGeneratorHook();
  const { setServerRoutes, clearAllRoutes: clearMapRoutes, renderGeoJsonRoute } = useMapContext();

  const preparePayload = useCallback((): SchedulePayload | null => {
    if (!startDatetimeISO || !endDatetimeISO) {
      // toast는 호출하는 컴포넌트 (ScheduleGenerator)에서 처리
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
      start_datetime: startDatetimeISO, // 로컬 시간 기준 문자열 사용
      end_datetime: endDatetimeISO    // 로컬 시간 기준 문자열 사용
    };
    
    console.log("📤 서버 요청 payload (from useScheduleManagement):", JSON.stringify(payload, null, 2));
    return payload;
  }, [selectedPlaces, startDatetimeISO, endDatetimeISO]);

  const parseServerResponse = useCallback((response: ServerResponseType, currentSelectedPlaces: SelectedPlace[]): ItineraryDay[] => {
    if (response.itinerary && Array.isArray(response.itinerary)) {
      return response.itinerary.map((dayData: any) => {
        const dayPlaces: ItineraryPlaceWithTime[] = dayData.places.map((placeInfo: any) => {
          let placeId: string;
          let placeName: string | undefined;
          let timeBlock: string | undefined = placeInfo.time_block; // 요청사항 7

          if (typeof placeInfo === 'string') { // ID만 오는 경우
            placeId = placeInfo;
          } else if (typeof placeInfo === 'object' && placeInfo !== null && placeInfo.id) { // 객체로 오는 경우
            placeId = placeInfo.id.toString();
            placeName = placeInfo.name;
            // 추가 정보 파싱 (예: arriveTime, departTime, stayDuration)
          } else { // 알 수 없는 형식
            console.warn("Unknown placeInfo format in server response:", placeInfo);
            return { 
              id: 'unknown_id', name: '알 수 없는 장소 (형식 오류)', category: 'unknown', 
              x: 0, y: 0, address: '', phone: '', description: '', rating: 0, 
              image_url: '', road_address: '', homepage: '', isSelected: false, isCandidate: false,
              timeBlock: '시간 정보 없음'
            } as ItineraryPlaceWithTime;
          }

          const basePlace = currentSelectedPlaces.find(p => p.id.toString() === placeId);
          if (basePlace) {
            return {
              ...basePlace,
              timeBlock: timeBlock || `${placeInfo.arriveTime || ''}${placeInfo.stayDuration ? ` (체류 ${placeInfo.stayDuration}분)` : ''}`, // 예시 timeBlock 구성
              // arriveTime, departTime, stayDuration 등 서버 응답에 따라 채우기
            } as ItineraryPlaceWithTime;
          }
          return { 
            id: placeId, name: placeName || '알 수 없는 장소 (ID로 못찾음)', category: 'unknown', 
            x: 0, y: 0, address: '', phone: '', description: '', rating: 0, 
            image_url: '', road_address: '', homepage: '', isSelected: false, isCandidate: false,
            timeBlock: timeBlock || '시간 정보 없음'
          } as ItineraryPlaceWithTime;
        });

        const dayRouteData = response.routes?.[dayData.day];
        return {
          day: dayData.day,
          places: dayPlaces,
          totalDistance: dayData.totalDistance || 0,
          interleaved_route: dayRouteData?.interleaved_route, // 요청사항 4, 5
          // routeData는 interleaved_route로 대체되거나 함께 사용될 수 있음
          routeData: dayRouteData ? {
            nodeIds: dayRouteData.nodeIds?.map(String),
            linkIds: dayRouteData.linkIds?.map(String),
            // segmentRoutes 등 기존 구조가 있다면 유지하거나 interleaved_route 기반으로 재구성
          } : undefined
        };
      });
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
        places: day.places.map(p => ({...p, timeBlock: "시간 정보 없음"} as ItineraryPlaceWithTime)), 
      }));
    }
    return [];
  }, [dates, createItinerary]);

  const runScheduleGenerationProcess = useCallback(async () => {
    setIsLoadingState(true);
    try {
      const payload = preparePayload();
      if (!payload) {
        setIsLoadingState(false);
        return; 
      }

      const serverResponse = await generateScheduleViaHook(payload);
      console.log("🔍 서버 응답 (raw, from useScheduleManagement):", serverResponse);

      if (serverResponse && serverResponse.itinerary && serverResponse.itinerary.length > 0) {
        const parsedItinerary = parseServerResponse(serverResponse, selectedPlaces);
        setItinerary(parsedItinerary);
        
        if (serverResponse.routes) {
          const routesData: Record<number, ServerRouteResponse> = {};
          Object.entries(serverResponse.routes).forEach(([dayStr, routeData]) => {
            const dayNum = parseInt(dayStr, 10);
            if (!isNaN(dayNum)) {
              routesData[dayNum] = routeData as ServerRouteResponse; // interleaved_route 포함
            }
          });
          setServerRoutes(routesData); // MapContext에 서버 경로 데이터 전달 (interleaved_route 포함)
        }
        
        if (parsedItinerary.length > 0) {
          setSelectedDay(parsedItinerary[0].day);
          toast.success("서버로부터 일정을 성공적으로 생성했습니다!");
        } else {
          // 요청사항 6: 일정이 비어있을 경우
          toast.error("⚠️ 선택한 장소 정보 또는 경로 계산이 부족하여 일정을 생성하지 못했습니다.");
        }
      } else {
        // 요청사항 6: 서버 응답이 없거나 itinerary가 비어 있을 경우
        toast.error("⚠️ 선택한 장소 정보 또는 경로 계산이 부족하여 일정을 생성하지 못했습니다.");
        console.warn("서버 응답이 없거나 형식이 맞지 않아 클라이언트 측 일정을 생성합니다.");
        if (dates) {
            // ... keep existing code (client fallback with toast)
            const generatedItinerary: CreatorItineraryDay[] = createItinerary(
              selectedPlaces,
              dates.startDate,
              dates.endDate,
              dates.startTime,
              dates.endTime
            );
            const domainItinerary = generatedItinerary.map(day => ({
                ...day,
                places: day.places.map(p => ({...p, timeBlock: "시간 정보 없음"} as ItineraryPlaceWithTime)),
            }));
            setItinerary(domainItinerary);

            if (domainItinerary.length > 0) {
              setSelectedDay(domainItinerary[0].day);
            }
            toast.info("클라이언트에서 기본 일정이 생성되었습니다. (서버 데이터 없음)");
        } else {
            // toast.error("서버 응답이 없고, 클라이언트 fallback을 위한 날짜 정보도 없습니다."); // 이미 위에서 처리
        }
      }
    } catch (error) {
      console.error("일정 생성 오류 (useScheduleManagement):", error);
      // 요청사항 6: 에러 발생 시
      toast.error("⚠️ 선택한 장소 정보 또는 경로 계산이 부족하여 일정을 생성하지 못했습니다.");
      if (dates) {
        // ... keep existing code (client fallback on error)
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
            places: day.places.map(p => ({...p, timeBlock: "시간 정보 없음"} as ItineraryPlaceWithTime)),
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

  const handleSelectDay = useCallback((day: number) => {
    setSelectedDay(day);
    // 선택된 날짜의 경로를 지도에 다시 그리도록 MapContext에 알릴 수 있음
    // 예: clearMapRoutes(); renderDayRoute(day);
    // 실제 렌더링은 MapMarkers 또는 useMapFeatures에서 selectedDay 변경을 감지하여 처리
  }, []);

  // useEffect to update map when selectedDay or itinerary changes
  useEffect(() => {
    if (selectedDay !== null && itinerary.length > 0 && renderGeoJsonRoute && clearMapRoutes) {
      const currentDayData = itinerary.find(d => d.day === selectedDay);
      if (currentDayData?.interleaved_route) {
        clearMapRoutes(); // 이전 경로 지우기
        const nodes = extractAllNodesFromRoute(currentDayData.interleaved_route).map(String);
        const links = extractAllLinksFromRoute(currentDayData.interleaved_route).map(String);
        console.log(`Rendering day ${selectedDay} with ${nodes.length} nodes and ${links.length} links from interleaved_route.`);
        renderGeoJsonRoute(nodes, links, { strokeColor: '#3366FF', strokeWeight: 5, strokeOpacity: 0.8 });
        
        // 여기서 장소 마커도 찍어야 함
        // const placeNodes = currentDayData.interleaved_route?.filter((item, index) => index % 2 === 0).map(String);
        // const placesForMarkers = currentDayData.places.filter(p => placeNodes?.includes(p.geoNodeId || p.id));
        // addMarkers(placesForMarkers...); // useMapContext에서 addMarkers 가져와서 사용
      } else if (currentDayData) {
        // fallback to old route rendering if interleaved_route is not available
        // This part needs to be handled by the existing renderItineraryRoute in MapContext/useMapCore
        console.log(`Day ${selectedDay} does not have interleaved_route. Fallback rendering needed.`);
      }
    }
  }, [selectedDay, itinerary, renderGeoJsonRoute, clearMapRoutes]);

  return {
    itinerary,
    selectedDay,
    isLoading: isLoadingState || isServerGenerating,
    handleSelectDay,
    runScheduleGenerationProcess,
  };
};
