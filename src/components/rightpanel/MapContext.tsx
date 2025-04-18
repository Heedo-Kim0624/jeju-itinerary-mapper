// src/components/rightpanel/MapContext.tsx (이 행 삭제 금지)
import React, { createContext, useContext, ReactNode } from 'react';
import { Place, ItineraryDay } from '@/types/supabase';

export interface MapContextType {
  map: any;
  isMapInitialized: boolean;
  isNaverLoaded: boolean;
  isMapError: boolean;
  /** 문자열 주소 혹은 좌표로 지도를 이동/확대 */
  panTo: (target: string | { lat: number; lng: number }) => void;
  /** 장소 배열에 핀을 찍습니다. highlight=true 면 추천 핀, isItinerary=true 면 일정용 핀 */
  addMarkers: (
    places: Place[],
    opts?: { highlight?: boolean; isItinerary?: boolean }
  ) => void;
  /** 일정 경로 그리기 등 경로 계산 */
  calculateRoutes: (places: Place[]) => void;
  /** 마커와 경로, 기타 UI 요소 전부 제거 */
  clearMarkersAndUiElements: () => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

interface MapProviderProps {
  children: ReactNode;
  value: MapContextType;
}

export const MapProvider: React.FC<MapProviderProps> = ({ children, value }) => {
  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

export const useMapContext = (): MapContextType => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
};
