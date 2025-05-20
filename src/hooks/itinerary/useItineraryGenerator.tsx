
import { toast } from 'sonner';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types';
import { useItineraryCreator, ItineraryDay as CreatorItineraryDay } from '../use-itinerary-creator';
import { getDayOfWeekString, getDateStringMMDD } from './itineraryUtils';

interface UseItineraryGeneratorProps {
  setItinerary: (itinerary: ItineraryDay[] | null) => void;
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
  ): ItineraryDay[] => { 
    try {
      if (placesToUse.length === 0) {
        toast.error("선택된 장소가 없습니다.");
        return [];
      }

      const creatorItineraryResult: CreatorItineraryDay[] = clientSideCreateItinerary(
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

      const mappedItinerary: ItineraryDay[] = creatorItineraryResult.map((creatorDay, index) => {
        const currentDayDate = new Date(startDate);
        currentDayDate.setDate(startDate.getDate() + index);
        
        const mappedPlaces: ItineraryPlaceWithTime[] = creatorDay.places.map(p_creator => ({
            ...p_creator,
            x: p_creator.x ?? 0, 
            y: p_creator.y ?? 0, 
        } as ItineraryPlaceWithTime));

        return {
          day: creatorDay.day,
          places: mappedPlaces,
          totalDistance: creatorDay.totalDistance,
          dayOfWeek: getDayOfWeekString(currentDayDate),
          date: getDateStringMMDD(currentDayDate),
          routeData: { nodeIds: [], linkIds: [], segmentRoutes: [] }, 
          interleaved_route: [], 
        };
      });

      setItinerary(mappedItinerary); 
      setIsItineraryCreated(true);
      setSelectedItineraryDay(1);
      setShowItinerary(true);

      console.log("일정 생성 완료 (useItineraryGenerator):", {
        일수: mappedItinerary.length,
      });

      return mappedItinerary; 
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
