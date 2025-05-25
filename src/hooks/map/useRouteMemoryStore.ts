
import { create } from 'zustand';
import type { DayRouteData, DayMarkerData, ItineraryPlace } from '@/types/core/route-data';
import { dayStringToIndex } from '@/utils/date/dayMapping';

interface RouteMemoryState {
  routeDataByDay: Record<number, DayRouteData>;
  markerDataByDay: Record<number, DayMarkerData>;
  selectedDay: number;
  setDayRouteData: (day: number, data: Partial<DayRouteData>) => void; // Allow partial updates
  setDayMarkerData: (day: number, data: Partial<DayMarkerData>) => void; // Allow partial updates
  setSelectedDay: (day: number) => void;
  getDayRouteData: (day: number) => DayRouteData | undefined;
  getDayMarkerData: (day: number) => DayMarkerData | undefined;
  initializeFromServerResponse: (serverResponse: any) => void;
  clearAllData: () => void;
}

export const useRouteMemoryStore = create<RouteMemoryState>((set, get) => ({
  routeDataByDay: {},
  markerDataByDay: {},
  selectedDay: 1,
  
  setDayRouteData: (day, data) => set(state => {
    const existingData = state.routeDataByDay[day] || { day, nodeIds: [], linkIds: [] };
    return {
      routeDataByDay: {
        ...state.routeDataByDay,
        [day]: { ...existingData, ...data }
      }
    };
  }),
  
  setDayMarkerData: (day, data) => set(state => {
    const existingData = state.markerDataByDay[day] || { day, places: [] };
    return {
      markerDataByDay: {
        ...state.markerDataByDay,
        [day]: { ...existingData, ...data }
      }
    };
  }),
  
  setSelectedDay: (day) => {
    console.log(`[RouteMemoryStore] Setting selected day to: ${day}`);
    set({ selectedDay: day });
  },
  
  getDayRouteData: (day) => get().routeDataByDay[day],
  
  getDayMarkerData: (day) => get().markerDataByDay[day],
  
  initializeFromServerResponse: (serverResponse) => {
    if (!serverResponse) {
      console.warn('[RouteMemoryStore] initializeFromServerResponse: No server response provided.');
      return;
    }
    
    const { schedule, route_summary } = serverResponse;
    if (!schedule || !route_summary) {
      console.warn('[RouteMemoryStore] initializeFromServerResponse: Schedule or route_summary missing in server response.');
      return;
    }
    
    const newRouteDataByDay: Record<number, DayRouteData> = {};
    const newMarkerDataByDay: Record<number, DayMarkerData> = {};
    
    route_summary.forEach((summary: any) => {
      const dayOfWeek = summary.day;
      const dayNumber = dayStringToIndex(dayOfWeek);
      
      if (dayNumber > 0) {
        newRouteDataByDay[dayNumber] = {
          day: dayNumber,
          nodeIds: summary.nodeIds || summary.node_ids || summary.places_routed || [], // Added places_routed as a fallback
          linkIds: summary.linkIds || summary.link_ids || (summary.interleaved_route || []).filter((_:any, idx:number) => idx % 2 === 1).map(String),
          interleaved_route: summary.interleaved_route || [],
          totalDistance: summary.total_distance_m || 0,
          segmentRoutes: summary.segment_routes || []
        };
      }
    });
    
    const placesByDayAggregated: Record<number, ItineraryPlace[]> = {};
    
    schedule.forEach((item: any) => {
      const timeBlock = item.time_block || '';
      const dayOfWeek = timeBlock.split('_')[0]; 
      const dayNumber = dayStringToIndex(dayOfWeek);
      
      if (dayNumber > 0) {
        if (!placesByDayAggregated[dayNumber]) {
          placesByDayAggregated[dayNumber] = [];
        }
        
        const place: ItineraryPlace = {
          id: item.id?.toString() || item.place_name, // Ensure ID is string
          name: item.place_name || '정보 없음',
          category: item.place_type || '기타',
          time: timeBlock,
          timeBlock: timeBlock, // For ItineraryPlaceWithTime compatibility
          x: parseFloat(item.longitude || item.x || '0'), 
          y: parseFloat(item.latitude || item.y || '0'),  
          address: item.address || item.road_address || '정보 없음',
          road_address: item.road_address,
          description: item.description,
          image_url: item.image_url,
          phone: item.phone,
          rating: item.rating,
          homepage: item.homepage,
          geoNodeId: item.id?.toString(), // Ensure string
          isFallback: !item.id,
          details: {
            categories: item.categories_details || '',
            link: item.link || '',
            instagram: item.instagram || ''
          },
          numericDbId: typeof item.id === 'number' ? item.id : null,
        };
        
        const existingPlaceIndex = placesByDayAggregated[dayNumber].findIndex(p => p.id === place.id);
        if (existingPlaceIndex === -1) {
          placesByDayAggregated[dayNumber].push(place);
        }
      }
    });
    
    Object.entries(placesByDayAggregated).forEach(([dayStr, places]) => {
      const dayNumber = parseInt(dayStr, 10);
      newMarkerDataByDay[dayNumber] = {
        day: dayNumber,
        places
      };
    });
    
    set({
      routeDataByDay: newRouteDataByDay,
      markerDataByDay: newMarkerDataByDay,
      selectedDay: 1 
    });
    
    console.log('[RouteMemoryStore] Server response initialized:', {
      routeDataByDay: newRouteDataByDay,
      markerDataByDay: newMarkerDataByDay
    });
  },
  
  clearAllData: () => {
    console.log('[RouteMemoryStore] Clearing all data.');
    set({
      routeDataByDay: {},
      markerDataByDay: {},
      selectedDay: 1
    });
  }
}));
