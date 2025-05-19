
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useAtom } from 'jotai';
import {
  tripDetailsAtom, // 사용한다고 가정
  itineraryAtom,
  selectedDayAtom,
  isLoadingAtom,
  rawServerResponseAtom,
  showItineraryPanelAtom,
  currentLeftPanelAtom,
  serverRoutesAtom // 추가
} from '@/store/itineraryStore'; // 생성된 스토어 사용
import {
  type Place,
  type ItineraryDay,
  type SchedulePayload,
  type NewServerScheduleResponse,
  isNewServerScheduleResponse,
  type TripDetailsState, // 추가
  // ServerRouteResponse // src/types/schedule 에서 가져오므로 여기서는 직접 import 안 함
} from '@/types';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useScheduleGenerator } from '@/hooks/use-schedule-generator';
import { useItineraryCreator } from '@/hooks/useItineraryCreator'; // 생성된 임시 훅 사용
import { useScheduleParser } from '@/hooks/schedule/useScheduleParser';


export const useItineraryHandlers = () => {
  const { clearMarkersAndUiElements, setServerRoutes: setMapServerRoutes } = useMapContext();
  const { generateSchedule, isGenerating: serverIsGenerating } = useScheduleGenerator();
  const { generateItineraryFallback } = useItineraryCreator(); // 임시 폴백 사용
  
  const [, setItinerary] = useAtom(itineraryAtom);
  const [, setSelectedDay] = useAtom(selectedDayAtom);
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  const [, setRawServerResponse] = useAtom(rawServerResponseAtom);
  const [, setTripDetails] = useAtom(tripDetailsAtom); // tripDetailsAtom 사용
  const [, setShowItineraryPanel] = useAtom(showItineraryPanelAtom);
  const [, setCurrentLeftPanel] = useAtom(currentLeftPanelAtom);
  const [, setServerRoutesData] = useAtom(serverRoutesAtom); // Jotai atom for server routes

  // currentSelectedPlaces는 이 훅의 범위 밖이므로, useScheduleParser를 여기서 직접 호출하지 않음
  // 대신, parseServerResponse 함수 자체를 가져와서 필요시 호출할 수 있도록 함.
  // 또는, parseServerResponse가 필요한 곳에서 currentSelectedPlaces와 함께 호출.
  // 여기서는 handleCreateItinerary 내에서 직접 사용하지 않고, 이벤트 통해 전달된 데이터를 처리하는 구조.

  const handleCreateItinerary = useCallback(async (
    currentTripDetails: TripDetailsState, // TripDetailsState 사용
    selectedPlacesInput: Place[],
    prepareSchedulePayloadFn: (
        userSelectedPlaces: Place[],
        startDatetimeISO: string | null,
        endDatetimeISO: string | null
    ) => SchedulePayload | null
  ): Promise<boolean> => {
    console.log('[handleCreateItinerary] 호출됨', { currentTripDetails, selectedPlacesCount: selectedPlacesInput.length });

    if (!currentTripDetails.dates || !currentTripDetails.startDatetime || !currentTripDetails.endDatetime) {
      toast.error("여행 날짜와 시간을 먼저 설정해주세요.");
      return false;
    }
    
    if (selectedPlacesInput.length === 0) {
      toast.error("선택된 장소가 없습니다. 장소를 선택해주세요.");
      return false;
    }

    setIsLoading(true);
    setTripDetails(currentTripDetails); // 여행 정보 Jotai atom에 저장

    const payloadForServer = prepareSchedulePayloadFn(
      selectedPlacesInput,
      currentTripDetails.startDatetime,
      currentTripDetails.endDatetime
    );

    if (payloadForServer) {
      console.log("[handleCreateItinerary] 서버 일정 생성 요청:", payloadForServer);
      try {
        const serverResponse = await generateSchedule(payloadForServer);
        console.log("[handleCreateItinerary] 서버 응답 수신:", serverResponse);

        if (serverResponse && isNewServerScheduleResponse(serverResponse) && serverResponse.route_summary?.length > 0) {
          setRawServerResponse(serverResponse); // 원본 응답 저장
          
          // 서버 응답을 기반으로 지도 경로 데이터 설정 준비 (구체적인 로직은 useScheduleParser 등에서 처리된 결과를 받아야 함)
          // 예시: 각 day의 interleaved_route를 ServerRouteResponse 형식으로 변환하여 setMapServerRoutes 및 setServerRoutesData 호출
          // 이 부분은 rawServerResponseAtom 구독자가 처리하도록 변경 가능
          const newMapRoutes: Record<number, import('@/types').ServerRouteResponse> = {};
          serverResponse.route_summary.forEach((summary, index) => {
            // day 문자열 (e.g., "Tue")을 숫자 day (1, 2, ...)로 변환 필요. 여기서는 index + 1로 가정
            const dayNumber = index + 1; 
            newMapRoutes[dayNumber] = {
              nodeIds: summary.interleaved_route.filter((_, idx) => idx % 2 === 0),
              linkIds: summary.interleaved_route.filter((_, idx) => idx % 2 !== 0),
              interleaved_route: summary.interleaved_route
            };
          });
          setMapServerRoutes(newMapRoutes); // MapContext 업데이트
          setServerRoutesData(newMapRoutes); // Jotai atom 업데이트
          
          // rawServerResponseReceived 이벤트를 통해 다른 컴포넌트/훅에서 파싱 및 itinerary 상태 업데이트
          window.dispatchEvent(new CustomEvent('rawServerResponseReceived', { detail: serverResponse }));

          setShowItineraryPanel(true);
          setCurrentLeftPanel('itinerary');
          toast.success("서버로부터 일정을 성공적으로 생성했습니다!");
          return true;
        } else {
          toast.warn("서버 응답 형식이 맞지 않거나 경로 정보가 부족합니다. 클라이언트 폴백 일정을 생성합니다.");
          // Fallback to client-side generation
          const clientItinerary = generateItineraryFallback(
            selectedPlacesInput,
            currentTripDetails.dates.startDate,
            currentTripDetails.dates.endDate,
            currentTripDetails.dates.startTime,
            currentTripDetails.dates.endTime
          );
          if (clientItinerary && clientItinerary.length > 0) {
            setItinerary(clientItinerary);
            setSelectedDay(clientItinerary[0]?.day ?? null);
            setShowItineraryPanel(true);
            setCurrentLeftPanel('itinerary');
            toast.info("클라이언트에서 기본 일정을 생성했습니다.");
            return true;
          } else {
            toast.error("클라이언트 일정 생성에도 실패했습니다.");
            return false;
          }
        }
      } catch (e: any) {
        console.error("[handleCreateItinerary] 서버 요청 중 오류:", e);
        toast.error(`서버 일정 생성 중 오류: ${e.message || '알 수 없는 오류'}. 클라이언트 폴백 일정을 생성합니다.`);
        // Fallback to client-side generation
        const clientItinerary = generateItineraryFallback(
          selectedPlacesInput,
          currentTripDetails.dates.startDate,
          currentTripDetails.dates.endDate,
          currentTripDetails.dates.startTime,
          currentTripDetails.dates.endTime
        );
        if (clientItinerary && clientItinerary.length > 0) {
          setItinerary(clientItinerary);
          setSelectedDay(clientItinerary[0]?.day ?? null);
          setShowItineraryPanel(true);
          setCurrentLeftPanel('itinerary');
          return true;
        } else {
          toast.error("클라이언트 일정 생성에도 실패했습니다.");
          return false;
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.error("일정 생성에 필요한 정보(페이로드)를 만들 수 없습니다.");
      setIsLoading(false);
      return false;
    }
  }, [
    generateSchedule, 
    generateItineraryFallback,
    setMapServerRoutes, 
    setItinerary, 
    setSelectedDay, 
    setIsLoading, 
    setRawServerResponse, 
    setTripDetails,
    setShowItineraryPanel,
    setCurrentLeftPanel,
    setServerRoutesData
  ]);

  const handleCloseItinerary = useCallback(() => {
    setShowItineraryPanel(false);
    setCurrentLeftPanel('category'); // 또는 'region' 등 기본 패널로
    setItinerary([]);
    setSelectedDay(null);
    setRawServerResponse(null);
    setMapServerRoutes({}); // 지도 경로 데이터 초기화
    setServerRoutesData({}); // Jotai atom 초기화
    clearMarkersAndUiElements();
    console.log('[handleCloseItinerary] 일정 패널 닫기 완료');
  }, [
    setShowItineraryPanel, 
    setCurrentLeftPanel, 
    setItinerary, 
    setSelectedDay, 
    setRawServerResponse, 
    clearMarkersAndUiElements, 
    setMapServerRoutes,
    setServerRoutesData
  ]);

  return {
    handleCreateItinerary,
    handleCloseItinerary,
    isGenerating: isLoading || serverIsGenerating, // 통합 로딩 상태
  };
};
