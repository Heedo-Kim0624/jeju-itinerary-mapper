
import { 
  ItineraryDay as ScheduleItineraryDay,
  ItineraryPlace as ScheduleItineraryPlace,
  ServerRouteSummaryItem,
  ServerScheduleItem,
  isNewServerScheduleResponse,
  NewServerScheduleResponse
} from '@/types/schedule';
import { Place } from '@/types/supabase'; // For base properties
import { CategoryName } from '@/utils/categoryUtils';


export function ensureCompatibleItineraryData(
  serverResponse: any 
): ScheduleItineraryDay[] {
  console.log("[typeCompatibility] 서버 응답 데이터 변환 시작", serverResponse);
  
  if (!isNewServerScheduleResponse(serverResponse)) {
    console.error("[typeCompatibility] 서버 응답이 예상 형식이 아닙니다:", serverResponse);
    return [];
  }
  
  const typedServerResponse = serverResponse as NewServerScheduleResponse;

  try {
    const itineraryDays: ScheduleItineraryDay[] = typedServerResponse.route_summary.map((routeDay, index) => {
      const day = index + 1;
      const dayOfWeek = routeDay.day || getDayOfWeekFromIndex(index);
      const date = getDateStringFromDayOfWeek(index, typedServerResponse.start_datetime);
      
      const places = extractPlacesForDay(typedServerResponse.schedule, routeDay);
      
      const itineraryDay: ScheduleItineraryDay = {
        day,
        dayOfWeek,
        date,
        places,
        totalDistance: routeDay.total_distance_m != null ? routeDay.total_distance_m / 1000 : 0,
        interleaved_route: routeDay.interleaved_route || [],
        routeData: {
          nodeIds: extractNodeIds(routeDay.interleaved_route || []),
          linkIds: extractLinkIds(routeDay.interleaved_route || [])
        }
      };
      
      return itineraryDay;
    });
    
    console.log("[typeCompatibility] 변환된 일정 데이터:", itineraryDays);
    return itineraryDays;
  } catch (error) {
    console.error("[typeCompatibility] 데이터 변환 중 오류 발생:", error);
    return [];
  }
}

function getDayOfWeekFromIndex(index: number): string {
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return dayNames[index % 7];
}

function getDateStringFromDayOfWeek(dayIndex: number, tripStartDateISO?: string): string {
  const startDate = tripStartDateISO ? new Date(tripStartDateISO) : new Date();
  
  const targetDate = new Date(startDate);
  targetDate.setDate(startDate.getDate() + dayIndex);

  return `${String(targetDate.getMonth() + 1).padStart(2, '0')}/${String(targetDate.getDate()).padStart(2, '0')}`;
}

function extractPlacesForDay(
  scheduleItems: ServerScheduleItem[],
  routeDay: ServerRouteSummaryItem
): ScheduleItineraryPlace[] {
  
  const nodeIdsInRoute = extractNodeIds(routeDay.interleaved_route || []);
  const places: ScheduleItineraryPlace[] = [];

  nodeIdsInRoute.forEach((nodeIdStr, index) => {
    const placeInfo = scheduleItems.find(item => 
      (item.node_id != null && String(item.node_id) === nodeIdStr) ||
      (item.id != null && String(item.id) === nodeIdStr) ||
      (item.place_info?.node_id != null && String(item.place_info.node_id) === nodeIdStr)
    );
    
    const basePlaceDefaults: Omit<Place, 'id' | 'name' | 'x' | 'y' | 'category'> & { id: string; name: string; x: number; y: number; category: string; } = {
      id: '', name: '', x: 0, y: 0, category: '',
      address: '', phone: '', description: '', rating: 0, image_url: '',
      road_address: '', homepage: '', operationTimeData: {},
      isSelected: false, isRecommended: false, isCandidate: false,
      geoNodeId: undefined, geoNodeDistance: undefined, node_id: undefined, weight: undefined, raw: undefined,
      categoryDetail: undefined, reviewCount: undefined, naverLink: undefined, instaLink: undefined, operatingHours: undefined,
    };

    if (placeInfo) {
      const place: ScheduleItineraryPlace = {
        ...basePlaceDefaults,
        id: String(placeInfo.id || placeInfo.node_id || `place_${nodeIdStr}`),
        name: placeInfo.place_name || `장소 ${index + 1}`,
        category: placeInfo.place_type as CategoryName || '기타',
        x: placeInfo.x ?? placeInfo.place_info?.x ?? 0,
        y: placeInfo.y ?? placeInfo.place_info?.y ?? 0,
        node_id: placeInfo.node_id || placeInfo.place_info?.node_id || parseInt(nodeIdStr,10),
        timeBlock: placeInfo.time_block?.split('_')[1] || '',
        address: placeInfo.address || '',
        phone: placeInfo.phone || '',
        description: placeInfo.description || '',
        rating: placeInfo.rating || 0,
        image_url: placeInfo.image_url || '',
        road_address: placeInfo.road_address || '',
        homepage: placeInfo.homepage || '',
      };
      places.push(place);
    } else {
      const place: ScheduleItineraryPlace = {
        ...basePlaceDefaults,
        id: `node_${nodeIdStr}`,
        name: `경유지 ${index + 1}`,
        category: '경유지' as CategoryName,
        x: 0, y: 0,
        node_id: parseInt(nodeIdStr,10),
      };
      places.push(place);
    }
  });
  return places;
}

function extractNodeIds(interleaved_route: (string | number)[]): string[] {
  return interleaved_route
    .filter((_, i) => i % 2 === 0)
    .map(id => String(id));
}

function extractLinkIds(interleaved_route: (string | number)[]): string[] {
  return interleaved_route
    .filter((_, i) => i % 2 === 1)
    .map(id => String(id));
}
