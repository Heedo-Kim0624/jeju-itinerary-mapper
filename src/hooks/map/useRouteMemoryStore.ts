
import { create } from 'zustand';
import { dayStringToIndex } from '@/utils/date/dayMapping';
import type { ItineraryPlace, ItineraryDay as CoreItineraryDay } from '@/types/core';

export interface DayRouteData {
  linkIds: string[];
  nodeIds: string[];
  polylines: any[]; 
  markers: any[];   
  bounds: any | null;  
  places?: ItineraryPlace[]; 
}

interface RouteMemoryState {
  routeDataByDay: Map<number, DayRouteData>;
  selectedMapDay: number; 
  setDayRouteData: (day: number, data: Partial<DayRouteData>) => void;
  initializeFromServerResponse: (serverResponse: any, itineraryDaysForPlaces?: CoreItineraryDay[]) => void;
  setSelectedMapDay: (day: number) => void;
  getCurrentDayRouteData: () => DayRouteData | undefined;
  getDayRouteData: (day: number) => DayRouteData | undefined;
  clearAllRouteData: () => void;
  isInitialized: boolean;
  setInitialized: (status: boolean) => void;
}

const emptyRouteData: DayRouteData = {
  linkIds: [],
  nodeIds: [],
  polylines: [],
  markers: [],
  bounds: null,
  places: [],
};

export const useRouteMemoryStore = create<RouteMemoryState>((set, get) => ({
  routeDataByDay: new Map(),
  selectedMapDay: 1,
  isInitialized: false,

  setInitialized: (status) => set({ isInitialized: status }),

  setDayRouteData: (day, data) => {
    set(state => {
      const currentData = state.routeDataByDay.get(day) || { ...emptyRouteData };
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

  initializeFromServerResponse: (serverResponse, itineraryDaysForPlaces) => {
    if (!serverResponse || !serverResponse.route_summary || !Array.isArray(serverResponse.route_summary)) {
      console.warn('[RouteMemoryStore] Invalid server response for initialization.');
      set({ isInitialized: true }); 
      return;
    }
    
    const newRouteDataByDay = new Map<number, DayRouteData>();
    
    serverResponse.route_summary.forEach((summary: any) => {
      if (!summary || !summary.day) return;

      const dayIndex = dayStringToIndex(summary.day);
      if (dayIndex === null) {
        console.warn(`[RouteMemoryStore] Unknown day string from server: ${summary.day}`);
        return;
      }

      const interleavedRoute: (string | number)[] = summary.interleaved_route || [];
      const nodeIds: string[] = [];
      const linkIds: string[] = [];

      interleavedRoute.forEach((id, index) => {
        if (index % 2 === 0) { 
          nodeIds.push(String(id));
        } else { 
          linkIds.push(String(id));
        }
      });
      
      const placesForDay = itineraryDaysForPlaces?.find(itd => itd.day === dayIndex)?.places || [];

      newRouteDataByDay.set(dayIndex, {
        ...emptyRouteData, 
        linkIds,
        nodeIds,
        places: placesForDay, 
      });
      
      console.log(`[RouteMemoryStore] Day ${dayIndex} (${summary.day}) initialized:`, {
        linkIds: linkIds.length,
        nodeIds: nodeIds.length,
        places: placesForDay.length,
      });
    });
    set({ routeDataByDay: newRouteDataByDay, isInitialized: true, selectedMapDay: 1 }); 
    console.log('[RouteMemoryStore] Initialization from server response complete. Total days processed:', newRouteDataByDay.size);
  },

  setSelectedMapDay: (day) => {
    set({ selectedMapDay: day });
    console.log(`[RouteMemoryStore] Selected map day changed to: ${day}`);
  },

  getCurrentDayRouteData: () => {
    const { selectedMapDay, routeDataByDay } = get();
    return routeDataByDay.get(selectedMapDay) || { ...emptyRouteData };
  },

  getDayRouteData: (day) => {
    return get().routeDataByDay.get(day) || { ...emptyRouteData };
  },

  clearAllRouteData: () => {
    set({ routeDataByDay: new Map(), isInitialized: false, selectedMapDay: 1 });
    console.log('[RouteMemoryStore] All route data cleared.');
  }
}));
