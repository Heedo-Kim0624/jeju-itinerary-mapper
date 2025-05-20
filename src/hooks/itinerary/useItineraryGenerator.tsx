import { toast } from 'sonner';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core'; // ItineraryDay를 @/types/core에서 직접 임포트
import { useItineraryCreator } from '../use-itinerary-creator'; // CreatorItineraryDayType 제거
import { getDayOfWeekString, getDateStringMMDD } from './itineraryUtils';

interface UseItineraryGeneratorProps {
  setItinerary: (itinerary: ItineraryDay[] | null) => void; // CoreItineraryDayType -> ItineraryDay
  setSelectedItineraryDay: (day: number | null) => void;
  setShowItinerary: (show: boolean) => void;
  setIsItineraryCreated: (created: boolean) => void;
}

export const useItineraryGenerator = ({
  setItinerary,
  setSelectedItineraryDay,
  setShowItinerary,
  setIsItineraryCreated,
}: UseItineraryGeneratorProps) => {
  const { createItinerary: clientSideCreateItinerary } = useItineraryCreator();

  const generateItinerary = (
    placesToUse: Place[], 
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string
  ): ItineraryDay[] => { // CoreItineraryDayType -> ItineraryDay
    try {
      if (placesToUse.length === 0) {
        toast.error("선택된 장소가 없습니다.");
        return [];
      }

      // clientSideCreateItinerary는 이제 Core ItineraryDay[]를 반환합니다.
      const creatorItineraryResult: ItineraryDay[] = clientSideCreateItinerary(
        placesToUse,
        startDate,
        endDate,
        startTime,
        endTime
      );

      if (!creatorItineraryResult || creatorItineraryResult.length === 0) {
        toast.error("일정을 생성할 수 없습니다. 더 많은 장소를 선택해주세요.");
        return [];
      }

      // CreatorItineraryDayType[]를 CoreItineraryDayType[]로 매핑하는 과정이 더 이상 필요하지 않거나,
      // creatorItineraryResult가 이미 CoreItineraryDayType의 모든 필드를 가지고 있어야 합니다.
      // useItineraryCreatorCore가 반환하는 ItineraryDay가 모든 필수 필드를 포함하도록 수정되었다고 가정합니다.
      // 추가적인 필드(dayOfWeek, date, routeData, interleaved_route)는 여기서 채워줍니다.
      const finalItinerary: ItineraryDay[] = creatorItineraryResult.map((dayData, index) => {
        const currentDayDate = new Date(startDate);
        currentDayDate.setDate(startDate.getDate() + index);

        // ItineraryPlaceWithTime 타입은 이미 createItinerary에서 반환된 구조에 맞아야 합니다.
        // 필요한 경우, 여기서 추가적인 검증이나 변환을 수행할 수 있습니다.
        const ensuredPlaces: ItineraryPlaceWithTime[] = dayData.places.map(p => ({
            ...p, // 기존 p의 모든 속성 포함
            // ItineraryPlaceWithTime에 필요한 모든 속성을 여기서 보장
            x: p.x ?? 0, 
            y: p.y ?? 0,
            arriveTime: p.arriveTime || "", 
            departTime: p.departTime || "", 
            stayDuration: p.stayDuration || 0, 
            travelTimeToNext: p.travelTimeToNext || "",
            timeBlock: p.timeBlock || "", 
            geoNodeId: p.geoNodeId || (typeof p.id === 'number' ? String(p.id) : p.id),
        }));
        
        return {
          ...dayData, // day, places, totalDistance from creatorDayResult
          dayOfWeek: getDayOfWeekString(currentDayDate),
          date: getDateStringMMDD(currentDayDate),
          // CoreItineraryDayType에 필요한 나머지 필수 필드 기본값 또는 계산된 값으로 추가
          routeData: dayData.routeData || { nodeIds: [], linkIds: [], segmentRoutes: [] }, 
          interleaved_route: dayData.interleaved_route || [], 
          places: ensuredPlaces, // 보장된 타입의 장소들로 교체
        };
      });

      setItinerary(finalItinerary); 
      setIsItineraryCreated(true);
      setSelectedItineraryDay(1);
      setShowItinerary(true);

      console.log("일정 생성 완료 (useItineraryGenerator):", {
        일수: finalItinerary.length,
      });

      return finalItinerary; 
    } catch (error) {
      console.error("일정 생성 오류 (useItineraryGenerator):", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
      return [];
    }
  };
  
  const createDebugItinerary = (startDateInput: Date | null): ItineraryDay[] => { 
    const result: ItineraryDay[] = []; 
    const startDateToUse = startDateInput || new Date(); 
    
    for (let i = 0; i < 3; i++) {
      const currentDate = new Date(startDateToUse);
      currentDate.setDate(startDateToUse.getDate() + i);
      
      const places: ItineraryPlaceWithTime[] = []; 
      for (let j = 0; j < 3 + Math.floor(Math.random() * 2); j++) {
        const placeIdNum = 4060000000 + i * 10000 + j * 100;
        const placeIdStr = String(placeIdNum);
        const debugCategory = ['attraction', 'restaurant', 'cafe', 'accommodation'][j % 4];
        places.push({
          id: placeIdStr, 
          name: `디버깅 장소 ${i+1}-${j+1}`,
          address: '제주특별자치도',
          phone: 'N/A',
          category: debugCategory as any, // Cast to avoid type issues with string literal vs CategoryName
          description: '디버그용 장소 설명',
          rating: 4.0 + Math.random(),
          x: 126.5 + (Math.random() * 0.5 - 0.25), 
          y: 33.4 + (Math.random() * 0.2 - 0.1),   
          image_url: '',
          road_address: '제주특별자치도 도로명',
          homepage: '',
          timeBlock: `${(9 + j * 2).toString().padStart(2, '0')}:00`, 
          geoNodeId: placeIdStr, 
          arriveTime: `${(9 + j * 2).toString().padStart(2, '0')}:00`,
          departTime: `${(9 + j * 2 + 1).toString().padStart(2, '0')}:00`,
          stayDuration: 60,
          travelTimeToNext: "15분",
          // isSelected, isCandidate는 ItineraryPlaceWithTime에 없으므로 제거하거나 타입에 맞게 처리
        } as ItineraryPlaceWithTime); 
      }
      
      const nodeIdsNum = places.map(p => Number(p.id));
      const linkIdsNum: number[] = [];
      for (let j = 0; j < nodeIdsNum.length - 1; j++) {
        linkIdsNum.push(5060000000 + i * 10000 + j * 100);
      }
      
      const interleavedRouteNum: (string | number)[] = [];
      for (let j = 0; j < nodeIdsNum.length; j++) {
        interleavedRouteNum.push(String(nodeIdsNum[j]));
        if (j < linkIdsNum.length) {
          interleavedRouteNum.push(String(linkIdsNum[j]));
        }
      }

      result.push({
        day: i + 1,
        places: places,
        totalDistance: parseFloat((10 + Math.random() * 20).toFixed(2)),
        routeData: { 
          nodeIds: nodeIdsNum.map(String),
          linkIds: linkIdsNum.map(String),
          segmentRoutes: [] 
        },
        interleaved_route: interleavedRouteNum.map(String), 
        dayOfWeek: getDayOfWeekString(currentDate), 
        date: getDateStringMMDD(currentDate), 
      });
    }
    return result;
  };

  return { generateItinerary, createDebugItinerary };
};
