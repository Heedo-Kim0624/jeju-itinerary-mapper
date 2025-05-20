import { toast } from 'sonner';
import type { ItineraryDay, ItineraryPlaceWithTime, SelectedPlace as CoreSelectedPlace } from '@/types/core'; // Added CoreSelectedPlace
// Removed RouteData as it's not directly used in parsing logic, but ItineraryDay includes it.
// If parseServerResponse needs to construct complex RouteData, it might need more types.

// Assuming getDayOfWeekString and getDateStringMMDD might be needed if server response lacks this.
// For now, the parser seems to construct these based on dayIndex and current date if not directly from server.
// The provided parseServerResponse doesn't use these directly for dayOfWeek/date but rather dayKey and dayIndex.
// Let's keep the import for getDateStringMMDD as it is used.
import { getDateStringMMDD } from './itineraryUtils';


export const useItineraryParser = () => {
  // 서버 응답을 ItineraryDay[] 형태로 파싱하는 함수
  const parseServerResponse = (
    serverResponse: any,
    currentSelectedPlaces: CoreSelectedPlace[] // Changed from any to CoreSelectedPlace[] for clarity
  ): ItineraryDay[] => {
    try {
      console.log("[useItineraryParser] parseServerResponse 시작:", {
        schedule: serverResponse.schedule?.length,
        route_summary: serverResponse.route_summary?.length,
      });

      if (
        !serverResponse.schedule ||
        !serverResponse.route_summary ||
        !Array.isArray(serverResponse.schedule) ||
        !Array.isArray(serverResponse.route_summary)
      ) {
        console.error("[useItineraryParser] 서버 응답 형식이 올바르지 않습니다.");
        toast.error("서버 응답 형식이 올바르지 않습니다.");
        return [];
      }

      // Use currentSelectedPlaces passed as argument
      const allPlaces = [...(currentSelectedPlaces || [])];

      const placeNameToIdMap: Record<string, string> = {}; // Store ID as string
      allPlaces.forEach(place => {
        if (place.name && place.id) { // Ensure place.id exists
          placeNameToIdMap[place.name] = String(place.id);
        }
      });
      
      const placeCoordinates: Record<string, { x: number; y: number; nodeId?: string }> = {};

      serverResponse.schedule.forEach((item: any) => {
        const placeName = item.place_name || '';
        // Attempt to get ID from map, otherwise use item.id (server's NODE_ID) as fallback for placeId if name mapping fails
        const mappedPlaceIdByName = placeNameToIdMap[placeName];
        // The server 'item.id' is the NODE_ID. 'place.id' is the database primary key for the place.
        // We need to associate the schedule item (which has a NODE_ID) back to our database place.
        const placeIdForCoords = mappedPlaceByName || String(item.id); // Prioritize mapped ID, fallback to server node_id

        if (!placeIdForCoords) {
          console.warn(`[useItineraryParser] 장소 이름 '${placeName}'에 대한 ID를 찾지 못했고, item.id도 없습니다.`);
          return;
        }
        
        const serverNodeId = String(item.id); // This is the actual NODE_ID from the server schedule

        if (item.x !== undefined && item.y !== undefined && !isNaN(Number(item.x)) && !isNaN(Number(item.y))) {
          placeCoordinates[placeIdForCoords] = {
            x: Number(item.x),
            y: Number(item.y),
            nodeId: serverNodeId 
          };
          return;
        }

        const placeWithCoords = allPlaces.find(p => String(p.id) === placeIdForCoords);
        if (placeWithCoords && placeWithCoords.x && placeWithCoords.y && !isNaN(Number(placeWithCoords.x)) && !isNaN(Number(placeWithCoords.y))) {
          placeCoordinates[placeIdForCoords] = {
            x: Number(placeWithCoords.x),
            y: Number(placeWithCoords.y),
            nodeId: serverNodeId
          };
          return;
        }
        
        console.warn(`[useItineraryParser] 장소 ID '${placeIdForCoords}' (${placeName})에 대한 좌표를 찾지 못해 기본값을 사용합니다.`);
        placeCoordinates[placeIdForCoords] = {
          x: 126.5311884,
          y: 33.4996213,
          nodeId: serverNodeId
        };
      });
      
      const dayGroups: Record<string, any[]> = {};
      serverResponse.schedule.forEach((item: any) => {
        const placeName = item.place_name || '';
        // ID mapping similar to above
        const mappedPlaceIdByName = placeNameToIdMap[placeName];
        const scheduleItemPlaceId = mappedPlaceByName || String(item.id); // This links the schedule item to a known place ID or server node_id
        const serverNodeId = String(item.id); // This is the actual NODE_ID

        console.log("[useItineraryParser] 일정 항목 처리:", {
          place_name: placeName,
          place_id_for_grouping: scheduleItemPlaceId, // The ID we'll use for matching
          time_block: item.time_block,
          place_type: item.place_type,
          server_node_id: serverNodeId
        });

        const dayMatch = item.time_block?.match(/^([A-Za-z]+)_/);
        if (dayMatch && dayMatch[1]) {
          const dayKey = dayMatch[1]; // 'Mon', 'Tue' etc.
          if (!dayGroups[dayKey]) {
            dayGroups[dayKey] = [];
          }
          const enrichedItem = {
            ...item,
            // Key 'place_id_internal' to store our database place ID if mapped, or server node_id as fallback.
            // This is what dayPlaces.map will use to look up coordinates and other details.
            place_id_internal: scheduleItemPlaceId, 
            server_node_id: serverNodeId, // Keep server_node_id explicitly for geoNodeId
          };
          dayGroups[dayKey].push(enrichedItem);
        } else {
            console.warn(`[useItineraryParser] 항목에서 요일을 추출할 수 없음:`, item);
        }
      });

      const result: ItineraryDay[] = [];
      let dayIndex = 1;

      for (const routeInfo of serverResponse.route_summary) {
        const dayKey = routeInfo.day; // 'Mon', 'Tue' etc.
        const dayPlacesRaw = dayGroups[dayKey] || [];

        console.log("[useItineraryParser] 경로 정보 처리:", {
          day: routeInfo.day,
          status: routeInfo.status,
          total_distance_m: routeInfo.total_distance_m,
          interleaved_route_length: routeInfo.interleaved_route?.length || 0,
          raw_places_for_day: dayPlacesRaw.length
        });
        
        const places: ItineraryPlaceWithTime[] = dayPlacesRaw.map((placeRaw: any) => {
          const timeMatch = placeRaw.time_block?.match(/_([^_]+)$/);
          const timeBlock = timeMatch ? timeMatch[1] : 'N/A';
          
          // placeRaw.place_id_internal should hold our mapped DB place ID or fallback server node ID
          const internalPlaceId = placeRaw.place_id_internal; 
          const serverNodeId = placeRaw.server_node_id; // This is the definitive geoNodeId

          const coords = placeCoordinates[internalPlaceId] || {
            x: 126.5311884,
            y: 33.4996213,
            nodeId: serverNodeId, // Ensure nodeId is set even for defaults
          };
          
          return {
            id: internalPlaceId, // Use our internal ID for the place object
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
            geoNodeId: serverNodeId, // Use the server_node_id from the schedule item for GeoJSON mapping
          } as ItineraryPlaceWithTime;
        });

        const interleaved = routeInfo.interleaved_route?.map((id: any) => String(id)) || [];
        const nodeIdsFromInterleaved: string[] = [];
        const linkIdsFromInterleaved: string[] = [];

        interleaved.forEach((id: string, index: number) => {
          if (index % 2 === 0) {
            nodeIdsFromInterleaved.push(id);
          } else {
            linkIdsFromInterleaved.push(id);
          }
        });
        
        // TODO: Get actual start date of the trip, not new Date()
        const tripStartDate = new Date(); // Placeholder, replace with actual trip start date
        const currentDate = new Date(tripStartDate);
        currentDate.setDate(tripStartDate.getDate() + dayIndex - 1);

        const itineraryDay: ItineraryDay = {
          day: dayIndex,
          dayOfWeek: dayKey.substring(0, 3),
          date: getDateStringMMDD(currentDate),
          places: places,
          totalDistance: parseFloat(routeInfo.total_distance_m || '0') / 1000,
          routeData: {
            nodeIds: nodeIdsFromInterleaved,
            linkIds: linkIdsFromInterleaved,
            segmentRoutes: [],
          },
          interleaved_route: interleaved,
        };

        result.push(itineraryDay);
        dayIndex++;
      }

      console.log("[useItineraryParser] parseServerResponse 완료:", {
        생성된일정수: result.length,
        첫날장소수: result[0]?.places?.length || 0,
        첫날경로노드수: result[0]?.routeData?.nodeIds?.length || 0,
        첫날경로링크수: result[0]?.routeData?.linkIds?.length || 0,
        첫날첫장소GeoNodeId: result[0]?.places[0]?.geoNodeId
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
