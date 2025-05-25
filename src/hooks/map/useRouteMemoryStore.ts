
import { create } from 'zustand';
import { dayStringToIndex } from '@/utils/date/dayMapping';
import type { ServerRouteSummaryItem, NewServerScheduleResponse } from '@/types/core';

// 일자별 경로 및 마커 데이터 타입 정의
export interface DayRouteData {
  linkIds: string[];
  nodeIds: string[];
  polylines: any[]; // Naver Polyline instances
  markers: any[];   // Naver Marker instances
  bounds: any | null; // Naver LatLngBounds instance
}

interface RouteMemoryState {
  routeDataByDay: Map<number, DayRouteData>;
  selectedDay: number;
  setDayRouteData: (day: number, data: Partial<DayRouteData>) => void;
  initializeFromServerResponse: (serverResponse: NewServerScheduleResponse, startDate: Date) => void;
  setSelectedDay: (day: number) => void;
  getCurrentDayRouteData: () => DayRouteData; // Return type changed to non-undefined
  getDayRouteData: (day: number) => DayRouteData; // Return type changed to non-undefined
  clearAllRouteData: () => void;
  clearDayPolylines: (day: number) => void;
  clearDayMarkers: (day: number) => void;
}

const emptyRouteData: DayRouteData = {
  linkIds: [],
  nodeIds: [],
  polylines: [],
  markers: [],
  bounds: null
};

export const useRouteMemoryStore = create<RouteMemoryState>((set, get) => ({
  routeDataByDay: new Map(),
  selectedDay: 1,

  setDayRouteData: (day, data) => {
    set(state => {
      const currentData = state.routeDataByDay.get(day) || { ...emptyRouteData }; // Keep spread for new day initialization
      const newData = { ...currentData, ...data };
      const newMap = new Map(state.routeDataByDay);
      newMap.set(day, newData);
      console.log(`[RouteMemoryStore] Day ${day} route data updated:`, {
        linkIds: newData.linkIds.length,
        nodeIds: newData.nodeIds.length,
        polylines: newData.polylines.length,
        markers: newData.markers.length,
      });
      return { routeDataByDay: newMap };
    });
  },

  initializeFromServerResponse: (serverResponse, startDate) => {
    if (!serverResponse || !serverResponse.route_summary || !Array.isArray(serverResponse.route_summary)) {
      console.warn('[RouteMemoryStore] Invalid server response or missing route_summary.');
      set({ routeDataByDay: new Map() }); // Clear if invalid response
      return;
    }

    const newRouteDataByDay = new Map<number, DayRouteData>();
    
    serverResponse.route_summary.forEach((summary: ServerRouteSummaryItem, index: number) => {
      const dayIndex = index + 1; 

      const linkIds = (summary.interleaved_route || []).filter((_, idx) => idx % 2 === 1).map(String);
      const nodeIds = (summary.interleaved_route || []).filter((_, idx) => idx % 2 === 0).map(String);
      
      newRouteDataByDay.set(dayIndex, {
        ...emptyRouteData, // Start with empty defaults, spread is fine here for initialization
        linkIds,
        nodeIds,
      });

      console.log(`[RouteMemoryStore] Day ${dayIndex} (Server Day Key: ${summary.day}) route data initialized:`, {
        linkIds: linkIds.length,
        nodeIds: nodeIds.length
      });
    });
    set({ routeDataByDay: newRouteDataByDay });
  },

  setSelectedDay: (day) => {
    set({ selectedDay: day });
    console.log(`[RouteMemoryStore] Selected day changed to: ${day}`);
  },

  getCurrentDayRouteData: () => {
    const { selectedDay, routeDataByDay } = get();
    return routeDataByDay.get(selectedDay) || emptyRouteData; // Return stable emptyRouteData
  },

  getDayRouteData: (day) => {
    return get().routeDataByDay.get(day) || emptyRouteData; // Return stable emptyRouteData
  },
  
  clearDayPolylines: (day: number) => {
    const dayData = get().routeDataByDay.get(day);
    if (dayData && dayData.polylines) {
      dayData.polylines.forEach(p => {
        if (p && typeof p.setMap === 'function') {
          p.setMap(null);
        }
      });
      get().setDayRouteData(day, { polylines: [] });
      console.log(`[RouteMemoryStore] Cleared polylines for day ${day}`);
    }
  },

  clearDayMarkers: (day: number) => {
    const dayData = get().routeDataByDay.get(day);
    if (dayData && dayData.markers) {
      dayData.markers.forEach(m => {
        if (m && typeof m.setMap === 'function') {
          m.setMap(null);
        }
      });
      get().setDayRouteData(day, { markers: [] });
      console.log(`[RouteMemoryStore] Cleared markers for day ${day}`);
    }
  },

  clearAllRouteData: () => {
    get().routeDataByDay.forEach((dayData, day) => {
        if (dayData.polylines) {
          dayData.polylines.forEach(p => {
            if (p && typeof p.setMap === 'function') {
              p.setMap(null);
            }
          });
        }
        if (dayData.markers) {
          dayData.markers.forEach(m => {
            if (m && typeof m.setMap === 'function') {
              m.setMap(null);
            }
          });
        }
    });
    set({ routeDataByDay: new Map(), selectedDay: 1 });
    console.log('[RouteMemoryStore] All route data cleared');
  }
}));
