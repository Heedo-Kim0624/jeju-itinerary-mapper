import { useState, useEffect, useCallback, useRef } from 'react';
import type { Feature, Point, LineString, Position } from 'geojson'; // Import specific GeoJSON types
import type { GeoNode, GeoLink, RouteStyle, GeoJsonLayerRef, GeoCoordinates } from './GeoJsonTypes'; // GeoCoordinates 추가


// 기본 경로 스타일 정의
const defaultRouteStyle: RouteStyle = {
  strokeColor: '#2196F3', 
  strokeWeight: 5,
  strokeOpacity: 0.8,
  fillColor: '#FF5722',   
  fillOpacity: 1,        
  zIndex: 100,
};

// This hook will now be used by MapContext and provide data via context,
// rather than being used directly by GeoJsonLayer component for loading.
// The GeoJsonLoader component will call onGeoJsonLoaded from context,
// which in turn would call handleLoadSuccess here.

const useGeoJsonState = (map: window.naver.maps.Map | null) => { // map 타입 수정
  const [isLoading, setIsLoading] = useState(false); // For data fetching state
  const [error, setError] = useState<Error | null>(null);
  const [isLoaded, setIsLoaded] = useState(false); // Indicates if data is processed and ready
  
  // Store processed nodes and links
  const [nodes, setNodes] = useState<GeoNode[]>([]);
  const [links, setLinks] = useState<GeoLink[]>([]);
  
  const activeMarkersRef = useRef<window.naver.maps.Marker[]>([]); // 타입 수정
  const activePolylinesRef = useRef<window.naver.maps.Polyline[]>([]); // 타입 수정
  
  const nodeMapRef = useRef<Map<string, GeoNode>>(new Map());
  const linkMapRef = useRef<Map<string, GeoLink>>(new Map());

  // This function will be called by GeoJsonLoader via context
  const handleLoadSuccess = useCallback((loadedNodes: GeoNode[], loadedLinks: GeoLink[]) => {
    setIsLoading(false);
    setIsLoaded(true); // Mark as loaded
    setNodes(loadedNodes);
    setLinks(loadedLinks);
    
    const newNodeMap = new Map<string, GeoNode>();
    loadedNodes.forEach(node => newNodeMap.set(String(node.id), node));
    nodeMapRef.current = newNodeMap;
    
    const newLinkMap = new Map<string, GeoLink>();
    loadedLinks.forEach(link => newLinkMap.set(String(link.id), link));
    linkMapRef.current = newLinkMap;
    
    console.log('[useGeoJsonState] GeoJSON 데이터 처리 및 상태 업데이트 완료:', {
      노드수: newNodeMap.size,
      링크수: newLinkMap.size
    });
  }, []);
  
  const handleLoadError = useCallback((loadError: Error) => {
    setIsLoading(false);
    setError(loadError);
    setIsLoaded(false);
    console.error('[useGeoJsonState] GeoJSON 데이터 로드/처리 실패:', loadError);
  }, []);

  const clearDisplayedFeatures = useCallback(() => {
    activeMarkersRef.current.forEach(marker => marker.setMap(null));
    activeMarkersRef.current = [];
    activePolylinesRef.current.forEach(polyline => polyline.setMap(null));
    activePolylinesRef.current = [];
    console.log('[useGeoJsonState] 모든 GeoJSON 경로 피처(마커, 폴리라인) 제거됨');
  }, []);
  
  const getNodeById = useCallback((id: string): GeoNode | undefined => {
    return nodeMapRef.current.get(id);
  }, []);
  
  const getLinkById = useCallback((id: string): GeoLink | undefined => {
    const link = linkMapRef.current.get(id);
    // if (!link) {
    //   console.warn(`[useGeoJsonState] GetLinkByID: 링크 ID ${id}를 찾을 수 없습니다.`);
    // }
    return link;
  }, []);
  
  const renderRoute = useCallback((nodeIds: string[], linkIds: string[], style: RouteStyle = defaultRouteStyle): (window.naver.maps.Marker | window.naver.maps.Polyline)[] => { // 반환 타입 수정
    if (!map || !isLoaded || !window.naver || !window.naver.maps) {
      console.warn('[useGeoJsonState] renderRoute: 지도 미초기화, GeoJSON 미로드, 또는 Naver API 미준비.');
      return [];
    }
    
    clearDisplayedFeatures(); 
    
    const newRenderedFeatures: (window.naver.maps.Marker | window.naver.maps.Polyline)[] = []; // 타입 수정
    const newPolylines: window.naver.maps.Polyline[] = []; // 타입 수정
    const newMarkers: window.naver.maps.Marker[] = []; // 타입 수정

    linkIds.forEach(linkId => {
      const link = getLinkById(String(linkId)); // Ensure linkId is string
      // GeoLink.coordinates is number[][] which is Position[]
      if (!link || !link.coordinates || !Array.isArray(link.coordinates) || link.coordinates.length < 2) {
        console.warn(`[useGeoJsonState] 링크 ID ${linkId}를 찾을 수 없거나 좌표가 유효하지 않습니다. Coordinates:`, link?.coordinates);
        return;
      }
      
      try {
        const path = link.coordinates.map((coord: GeoCoordinates) =>  // coord 타입 GeoCoordinates로 수정
          new window.naver.maps.LatLng(coord[1], coord[0]) 
        );
        
        const polyline = new window.naver.maps.Polyline({ // window.naver.maps 사용
          map,
          path,
          strokeColor: style.strokeColor || defaultRouteStyle.strokeColor,
          strokeWeight: style.strokeWeight || defaultRouteStyle.strokeWeight,
          strokeOpacity: style.strokeOpacity || defaultRouteStyle.strokeOpacity,
          zIndex: style.zIndex || defaultRouteStyle.zIndex,
        });
        
        newPolylines.push(polyline);
        newRenderedFeatures.push(polyline);
      } catch (e) {
        console.error(`[useGeoJsonState] 링크 ${linkId} 렌더링 중 오류:`, e, link);
      }
    });
    
    nodeIds.forEach(nodeId => {
      const node = getNodeById(String(nodeId)); // Ensure nodeId is string
      // GeoNode.coordinates is number[] which is Position
      if (!node || !node.coordinates || !Array.isArray(node.coordinates) || node.coordinates.length < 2) {
        console.warn(`[useGeoJsonState] 노드 ID ${nodeId}를 찾을 수 없거나 좌표가 유효하지 않습니다. Coordinates:`, node?.coordinates);
        return;
      }
      
      try {
        const position = new window.naver.maps.LatLng( // window.naver.maps 사용
          node.coordinates[1], // GeoJSON is [lng, lat], so node.coordinates[1] is lat
          node.coordinates[0]  // node.coordinates[0] is lng
        );
        
        const marker = new window.naver.maps.Marker({ // window.naver.maps 사용
          map,
          position,
          icon: {
            content: `<div style="width: 8px; height: 8px; background-color: ${style.fillColor || defaultRouteStyle.fillColor}; border-radius: 50%; border: 1px solid white; box-shadow: 0 0 2px rgba(0,0,0,0.5);"></div>`,
            anchor: new window.naver.maps.Point(4, 4) // window.naver.maps 사용
          },
          zIndex: (style.zIndex || defaultRouteStyle.zIndex || 100) + 1 
        });
        
        newMarkers.push(marker);
        newRenderedFeatures.push(marker);
      } catch (e) {
        console.error(`[useGeoJsonState] 노드 ${nodeId} 렌더링 중 오류:`, e, node);
      }
    });
    
    activePolylinesRef.current = newPolylines;
    activeMarkersRef.current = newMarkers;
    console.log(`[useGeoJsonState] 경로 렌더링 완료: ${newPolylines.length} 링크, ${newMarkers.length} 노드`);
    return newRenderedFeatures;
  }, [map, isLoaded, clearDisplayedFeatures, getLinkById, getNodeById]);
  
  const registerGlobalInterface = useCallback(() => {
    if (typeof window !== 'undefined') {
      const layerInterface: GeoJsonLayerRef = {
        renderRoute,
        clearDisplayedFeatures,
        getNodeById,
        getLinkById,
        isLoaded: () => isLoaded, // Provide a way to check if loaded
      };
      (window as any).geoJsonLayer = layerInterface;
      
      return () => {
        clearDisplayedFeatures();
        if ((window as any).geoJsonLayer === layerInterface) {
          delete (window as any).geoJsonLayer;
        }
      };
    }
    return () => {}; // No-op for SSR or non-browser env
  }, [renderRoute, clearDisplayedFeatures, getNodeById, getLinkById, isLoaded]);

  // Effect to register/cleanup global interface
  useEffect(() => {
    // Only register if map is available, to ensure Naver API context is potentially ready
    if (map && window.naver && window.naver.maps) {
      const cleanupGlobalInterface = registerGlobalInterface();
      return cleanupGlobalInterface;
    }
  }, [map, registerGlobalInterface]); // Added map dependency
  
  return {
    isLoading, // For initial data fetch state via GeoJsonLoader
    error,
    isLoaded, // Data processed and ready for use
    nodes, // Raw processed nodes (GeoNode[])
    links, // Raw processed links (GeoLink[])
    handleLoadSuccess, // Called by context when GeoJsonLoader succeeds
    handleLoadError,   // Called by context when GeoJsonLoader fails
    clearDisplayedFeatures, // Method to clear drawn routes
    getNodeById, // Accessor for node data
    getLinkById,   // Accessor for link data
    renderRoute,   // Method to draw a route
    // No longer returning registerGlobalInterface as it's handled by useEffect
  };
};

export default useGeoJsonState;
