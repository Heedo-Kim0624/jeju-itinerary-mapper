import { toast } from 'sonner';
import type { ItineraryDay, ItineraryPlaceWithTime } from '@/types';
// Removed RouteData as it's not directly used in parsing logic, but ItineraryDay includes it.
// If parseServerResponse needs to construct complex RouteData, it might need more types.

// Assuming getDayOfWeekString and getDateStringMMDD might be needed if server response lacks this.
// For now, the parser seems to construct these based on dayIndex and current date if not directly from server.
// The provided parseServerResponse doesn't use these directly for dayOfWeek/date but rather dayKey and dayIndex.
// Let's keep the import for getDateStringMMDD as it is used.
import { getDateStringMMDD } from './itineraryUtils';


export const useItineraryParser = () => {
  // 서버 응답을 ItineraryDay[] 형태로 파싱하는 함수
  const parseServerResponse = (serverResponse: any): ItineraryDay[] => {
    try {
      console.log("[useItineraryParser] parseServerResponse 시작:", {
        schedule: serverResponse.schedule?.length,
        route_summary: serverResponse.route_summary?.length,
        schedule_first: serverResponse.schedule?.[0] || {},
        route_first: serverResponse.route_summary?.[0] || {}
      });
      
      if (!serverResponse.schedule || !serverResponse.route_summary || 
          !Array.isArray(serverResponse.schedule) || !Array.isArray(serverResponse.route_summary)) {
        console.error("[useItineraryParser] 서버 응답 형식이 올바르지 않습니다.");
        toast.error("서버 응답 형식이 올바르지 않습니다.");
        return [];
      }
      
      const placeCoordinates: Record<string, {x: number, y: number}> = {};
      
      serverResponse.schedule.forEach((item: any) => {
        const idKey = item.id || item.place_id; 
        if (idKey && (item.x !== undefined || item.longitude !== undefined) && 
            (item.y !== undefined || item.latitude !== undefined)) {
          placeCoordinates[String(idKey)] = { 
            x: parseFloat(item.x || item.longitude || '0'), 
            y: parseFloat(item.y || item.latitude || '0') 
          };
        } else if (idKey) {
          console.warn(`[useItineraryParser] 장소 '${item.place_name}' (ID: ${idKey})에 대한 좌표 정보가 서버 응답에 없습니다.`);
        }
      });
      
      const dayGroups: Record<string, any[]> = {};
      serverResponse.schedule.forEach((item: any) => {
        const dayMatch = item.time_block?.match(/^([A-Za-z]+)_/); 
        if (dayMatch && dayMatch[1]) {
          const day = dayMatch[1];
          if (!dayGroups[day]) {
            dayGroups[day] = [];
          }
          dayGroups[day].push(item);
        } else {
          console.warn(`[useItineraryParser] 항목에서 요일을 추출할 수 없음:`, item);
        }
      });
      
      const result: ItineraryDay[] = [];
      let dayIndex = 1; 
      
      for (const routeInfo of serverResponse.route_summary) {
        const dayKey = routeInfo.day; 
        const dayPlacesRaw = dayGroups[dayKey] || [];
        
        const places: ItineraryPlaceWithTime[] = dayPlacesRaw.map((placeRaw: any) => {
          const timeMatch = placeRaw.time_block?.match(/_([^_]+)$/);
          const timeBlock = timeMatch ? timeMatch[1] : 'N/A';
          const placeIdFromServer = String(placeRaw.id || placeRaw.place_id || Math.random().toString(36).substring(7));
          let coordsInput = placeCoordinates[placeIdFromServer];
          let defaultCoordsUsed = false;
          if (!coordsInput) {
              coordsInput = { x: 126.5311884, y: 33.4996213 }; // Default Jeju coords
              defaultCoordsUsed = true;
          }
          const coords = { ...coordsInput };
          if (defaultCoordsUsed) {
              console.warn(`[useItineraryParser] 장소 ID '${placeIdFromServer}' (${placeRaw.place_name})에 대한 좌표를 찾지 못해 기본값을 사용합니다.`);
          }
          
          return {
            id: placeIdFromServer,
            name: placeRaw.place_name || '이름 없는 장소',
            category: placeRaw.place_type || '기타',
            timeBlock: timeBlock,
            address: placeRaw.address || '',
            x: coords.x,
            y: coords.y,
            arriveTime: timeBlock, 
            departTime: '',     
            stayDuration: placeRaw.stay_time_minutes || 60, 
            travelTimeToNext: placeRaw.travel_time_to_next_min ? `${placeRaw.travel_time_to_next_min}분` : '',
            phone: placeRaw.phone || '',
            description: placeRaw.description || '',
            image_url: placeRaw.image_url || '',
            rating: parseFloat(placeRaw.rating || '0'),
            road_address: placeRaw.road_address || '',
            homepage: placeRaw.homepage || '',
            geoNodeId: placeIdFromServer, 
          } as ItineraryPlaceWithTime;
        });
        
        const currentDate = new Date(); // TODO: 실제 여행 시작일(tripDetails.dates.startDate) 사용. This needs to be passed or obtained.
                                      // For now, this matches original behavior, but it's a known issue if startDate is not today.
                                      // The ItineraryDay type includes date and dayOfWeek, which should reflect the actual trip dates.
        currentDate.setDate(currentDate.getDate() + dayIndex -1);
        
        const nodeIds = routeInfo.places_routed?.map((id: any) => String(id)) || [];
        const linkIds = routeInfo.links_routed?.map((id: any) => String(id)) || [];
        const interleaved = routeInfo.interleaved_route?.map((id: any) => String(id)) || [];

        const itineraryDay: ItineraryDay = {
          day: dayIndex,
          dayOfWeek: dayKey.substring(0,3), 
          date: getDateStringMMDD(currentDate), // This will use the dummy `currentDate` for now.
          places: places,
          totalDistance: parseFloat(routeInfo.total_distance_m || '0') / 1000, 
          routeData: {
            nodeIds: nodeIds,
            linkIds: linkIds, 
            segmentRoutes: [], 
          },
          interleaved_route: interleaved.length > 0 ? interleaved : nodeIds, 
        };
        
        result.push(itineraryDay);
        dayIndex++;
      }
      
      console.log("[useItineraryParser] parseServerResponse 완료:", {
        생성된일정수: result.length,
        첫날장소수: result[0]?.places?.length || 0,
      });
      
      return result;
    } catch (error) {
      console.error("[useItineraryParser] parseServerResponse 오류:", error);
      toast.error("서버 응답 처리 중 오류 발생");
      return [];
    }
  };

  return { parseServerResponse };
};
