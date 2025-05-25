
import React, { createContext, useContext } from 'react';
import { Place, ItineraryDay } from '@/types/supabase';
import useMapCore from './useMapCore'; // useMapCore 임포트
import { SegmentRoute } from '@/types/schedule'; 
import type { ServerRouteDataForDay } from '@/hooks/map/useServerRoutes';

interface MapContextType {
  map: any;
  mapContainer: React.RefObject<HTMLDivElement>;
  isMapInitialized: boolean;
  isNaverLoaded: boolean;
  isMapError: boolean;
  addMarkers: (places: Place[], opts?: { 
    highlight?: boolean; 
    isItinerary?: boolean; 
    useRecommendedStyle?: boolean;
    useColorByCategory?: boolean;
    // onClick 콜백의 place 타입을 Place | ItineraryPlaceWithTime 으로 확장 가능성 고려
    onClick?: (place: Place /* | ItineraryPlaceWithTime */, index: number) => void;
  }) => any[];
  calculateRoutes: (placesToRoute: Place[]) => void;
  clearMarkersAndUiElements: () => void;
  panTo: (locationOrCoords: string | {lat: number, lng: number}) => void;
  showGeoJson: boolean;
  toggleGeoJsonVisibility: () => void;
  renderItineraryRoute: ( 
    itineraryDay: ItineraryDay | null, 
    allServerRoutes?: Record<number, ServerRouteDataForDay>,
    onComplete?: () => void
  ) => void;
  clearAllRoutes: () => void;
  // handleGeoJsonLoaded 파라미터 타입 구체화 (GeoNode[], GeoLink[] 등)
  handleGeoJsonLoaded: (nodes: any[], links: any[]) => void; 
  highlightSegment: (segment: SegmentRoute | null) => void;
  clearPreviousHighlightedPath: () => void;
  isGeoJsonLoaded: boolean;
  checkGeoJsonMapping: (places: Place[]) => {
    totalPlaces: number;
    mappedPlaces: number;
    mappingRate: string;
    averageDistance: number | string; 
    success: boolean;
    message: string;
  };
  mapPlacesWithGeoNodes: (places: Place[]) => Place[];
  showRouteForPlaceIndex: (placeIndex: number, itineraryDay: ItineraryDay, onComplete?: () => void) => void;
  renderGeoJsonRoute: (route: SegmentRoute) => void;
  geoJsonNodes: any[]; // 실제 타입으로 변경 (e.g., GeoJsonNodeFeature[])
  geoJsonLinks: any[]; // 실제 타입으로 변경 (e.g., GeoJsonLinkFeature[])
  setServerRoutes: (
    dayRoutes: Record<number, ServerRouteDataForDay> | 
               ((prevRoutes: Record<number, ServerRouteDataForDay>) => Record<number, ServerRouteDataForDay>)
  ) => void;
  serverRoutesData: Record<number, ServerRouteDataForDay>;
  updateDayPolylinePaths: (day: number, polylinePaths: { lat: number; lng: number }[][]) => void;
}

// defaultContext의 geoJsonNodes, geoJsonLinks, addMarkers onClick 타입을 좀 더 명확히 하거나 실제 타입과 일치시킵니다.
const defaultContext: MapContextType = {
  map: null,
  mapContainer: { current: null } as React.RefObject<HTMLDivElement>,
  isMapInitialized: false,
  isNaverLoaded: false,
  isMapError: false,
  addMarkers: () => [],
  calculateRoutes: () => {},
  clearMarkersAndUiElements: () => {},
  panTo: () => {},
  showGeoJson: false,
  toggleGeoJsonVisibility: () => {},
  renderItineraryRoute: () => {}, 
  clearAllRoutes: () => {},
  handleGeoJsonLoaded: () => {},
  highlightSegment: () => {}, 
  clearPreviousHighlightedPath: () => {},
  isGeoJsonLoaded: false,
  checkGeoJsonMapping: (places) => ({ 
    totalPlaces: places.length, 
    mappedPlaces: 0, 
    mappingRate: '0%', 
    averageDistance: 'N/A',
    success: false,
    message: 'GeoJSON 데이터가 로드되지 않았습니다.'
  }),
  mapPlacesWithGeoNodes: (places) => places,
  showRouteForPlaceIndex: () => {},
  renderGeoJsonRoute: () => {}, 
  geoJsonNodes: [], // 초기값
  geoJsonLinks: [], // 초기값
  setServerRoutes: () => {},
  serverRoutesData: {},
  updateDayPolylinePaths: () => {},
};

const MapContext = createContext<MapContextType>(defaultContext);

export const useMapContext = () => useContext(MapContext);

export const MapProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const mapCoreValues = useMapCore(); 
  
  // useMapCore의 실제 반환 타입과 MapContextType 간의 불일치 가능성 때문에 타입 단언 사용.
  // useMapCore가 MapContextType에 정의된 모든 속성 (특히 updateDayPolylinePaths)을 반환하도록 수정되면
  // 이 타입 단언은 제거할 수 있습니다.
  const contextValue = mapCoreValues as unknown as MapContextType;

  // 디버깅 로그 추가하여 contextValue의 실제 내용을 확인
  if (process.env.NODE_ENV === 'development') { // 개발 모드에서만 로그 실행
    console.log("[MapProvider] 제공되는 Context 값:", {
      isMapInitialized: contextValue.isMapInitialized,
      isNaverLoaded: contextValue.isNaverLoaded,
      isGeoJsonLoaded: contextValue.isGeoJsonLoaded,
      geoJsonNodesCount: contextValue.geoJsonNodes?.length || 0,
      geoJsonLinksCount: contextValue.geoJsonLinks?.length || 0,
      serverRoutesDataKeys: Object.keys(contextValue.serverRoutesData || {}),
      hasRenderItineraryRoute: typeof contextValue.renderItineraryRoute === 'function',
      hasUpdateDayPolylinePaths: typeof contextValue.updateDayPolylinePaths === 'function',
      hasSetServerRoutes: typeof contextValue.setServerRoutes === 'function',
    });
    if (typeof contextValue.updateDayPolylinePaths !== 'function') {
        console.warn("[MapProvider] updateDayPolylinePaths 함수가 context에 제공되지 않았습니다. useMapCore 반환값을 확인하세요.");
    }
  }
  
  return (
    <MapContext.Provider value={contextValue}>
      {children}
    </MapContext.Provider>
  );
};
