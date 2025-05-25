import { create } from 'zustand';

// 일자별 경로 및 마커 데이터 타입 정의
export interface DayRouteData {
  linkIds: string[];
  nodeIds: string[];
  polylines: any[];
  markers: any[];
  bounds: any;
}

interface RouteMemoryState {
  // 일자별 경로 및 마커 데이터 저장
  routeDataByDay: Map<number, DayRouteData>;
  
  // 현재 선택된 일자
  selectedDay: number;
  
  // 일자별 데이터 설정
  setDayRouteData: (day: number, data: Partial<DayRouteData>) => void;
  
  // 서버 응답에서 일자별 데이터 초기화
  initializeFromServerResponse: (serverResponse: any) => void;
  
  // 선택된 일자 변경
  setSelectedDay: (day: number) => void;
  
  // 현재 선택된 일자의 데이터 가져오기
  getCurrentDayRouteData: () => DayRouteData; // 반환 타입을 DayRouteData | undefined 에서 DayRouteData로 변경 (항상 emptyRouteData 반환 보장)
  
  // 특정 일자의 데이터 가져오기
  getDayRouteData: (day: number) => DayRouteData; // 반환 타입을 DayRouteData | undefined 에서 DayRouteData로 변경
  
  // 특정 일자의 폴리라인 데이터 삭제
  clearDayPolylines: (day: number) => void;
  
  // 모든 경로 데이터 초기화
  clearAllRouteData: () => void;
}

// 기본 빈 경로 데이터 (상수 참조)
const emptyRouteData: DayRouteData = {
  linkIds: [],
  nodeIds: [],
  polylines: [],
  markers: [],
  bounds: null
};

// 상태 저장소 생성
export const useRouteMemoryStore = create<RouteMemoryState>((set, get) => ({
  routeDataByDay: new Map(),
  selectedDay: 1,
  
  setDayRouteData: (day, data) => {
    set(state => {
      const currentData = state.routeDataByDay.get(day) || emptyRouteData; // Use emptyRouteData directly
      const newData = { ...currentData, ...data };
      const newMap = new Map(state.routeDataByDay);
      newMap.set(day, newData);
      
      console.log(`[RouteMemoryStore] 일자 ${day} 경로 데이터 업데이트:`, newData);
      
      return { routeDataByDay: newMap };
    });
  },
  
  // ... keep existing code (initializeFromServerResponse)
  initializeFromServerResponse: (serverResponse) => {
    if (!serverResponse || !serverResponse.route_summary || !Array.isArray(serverResponse.route_summary)) {
      console.warn('[RouteMemoryStore] 유효한 서버 응답이 아닙니다.');
      return;
    }
    
    // 기존 데이터 초기화
    set({ routeDataByDay: new Map() });
    
    // 서버 응답에서 일자별 데이터 추출 및 저장
    serverResponse.route_summary.forEach((summary: any) => {
      if (!summary || !summary.day) return;
      
      // 일자가 숫자 형식인지 확인
      const dayIndex = typeof summary.day === 'number' ? summary.day : parseInt(summary.day, 10);
      if (isNaN(dayIndex)) {
        console.warn(`[RouteMemoryStore] 유효하지 않은 일자: ${summary.day}`);
        return;
      }
      
      // 링크 ID 및 노드 ID 추출
      const linkIds = summary.interleaved_route || [];
      const nodeIds = summary.places_routed || [];
      
      // 일자별 데이터 저장
      get().setDayRouteData(dayIndex, {
        linkIds,
        nodeIds,
        polylines: [], // Ensure polylines and markers are initialized as empty arrays
        markers: [],
        bounds: null
      });
      
      console.log(`[RouteMemoryStore] 일자 ${dayIndex} 경로 데이터 초기화 완료:`, {
        linkIds: linkIds.length,
        nodeIds: nodeIds.length
      });
    });
  },
  
  setSelectedDay: (day) => {
    set({ selectedDay: day });
    console.log(`[RouteMemoryStore] 선택된 일자 변경: ${day}`);
  },
  
  getCurrentDayRouteData: () => {
    const { selectedDay, routeDataByDay } = get();
    return routeDataByDay.get(selectedDay) || emptyRouteData; // Return constant emptyRouteData if not found
  },
  
  getDayRouteData: (day) => {
    return get().routeDataByDay.get(day) || emptyRouteData; // Return constant emptyRouteData if not found
  },
  
  // ... keep existing code (clearDayPolylines and clearAllRouteData)
  clearDayPolylines: (day) => {
    const dayData = get().getDayRouteData(day); // This will now return emptyRouteData if not found
    // Check if dayData is not the emptyRouteData reference before trying to access its properties
    if (dayData && dayData !== emptyRouteData && dayData.polylines) {
      // 기존 폴리라인 제거
      dayData.polylines.forEach(polyline => {
        if (polyline && typeof polyline.setMap === 'function') {
          polyline.setMap(null);
        }
      });
      
      // 데이터 업데이트
      get().setDayRouteData(day, {
        polylines: []
      });
      
      console.log(`[RouteMemoryStore] 일자 ${day} 폴리라인 삭제 완료`);
    } else if (dayData === emptyRouteData) {
      console.log(`[RouteMemoryStore] 일자 ${day}에 대한 데이터가 없어 폴리라인 삭제 스킵`);
    }
  },
  
  clearAllRouteData: () => {
    const { routeDataByDay } = get();
    
    // 모든 시각적 요소 제거
    routeDataByDay.forEach((dayData, day) => {
      // 폴리라인 제거
      if (dayData.polylines) {
        dayData.polylines.forEach(polyline => {
          if (polyline && typeof polyline.setMap === 'function') {
            polyline.setMap(null);
          }
        });
      }
      
      // 마커 제거
      if (dayData.markers) {
        dayData.markers.forEach(marker => {
          if (marker && typeof marker.setMap === 'function') {
            marker.setMap(null);
          }
        });
      }
    });
    
    // 데이터 초기화
    set({ routeDataByDay: new Map() });
    console.log('[RouteMemoryStore] 모든 경로 데이터 초기화');
  }
}));
