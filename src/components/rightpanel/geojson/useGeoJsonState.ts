import { useState, useCallback, useRef } from 'react';
import { GeoNode, GeoLink, RouteStyle, GeoJsonLayerRef } from './GeoJsonTypes';

const useGeoJsonState = (map: any) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [nodes, setNodes] = useState<GeoNode[]>([]);
  const [links, setLinks] = useState<GeoLink[]>([]);
  
  // 활성화된 마커와 폴리라인을 추적하는 refs
  const activeMarkersRef = useRef<any[]>([]);
  const activePolylinesRef = useRef<any[]>([]);
  
  // 노드 및 링크 맵 (ID로 빠르게 조회)
  const nodeMapRef = useRef<Map<string, GeoNode>>(new Map());
  const linkMapRef = useRef<Map<string, GeoLink>>(new Map());
  
  // 데이터 로딩 성공 처리
  const handleLoadSuccess = useCallback((loadedNodes: GeoNode[], loadedLinks: GeoLink[]) => {
    setIsLoading(false);
    setIsLoaded(true);
    setNodes(loadedNodes);
    setLinks(loadedLinks);
    
    // 맵 생성
    const nodeMap = new Map<string, GeoNode>();
    const linkMap = new Map<string, GeoLink>();
    
    loadedNodes.forEach(node => nodeMap.set(node.id, node));
    loadedLinks.forEach(link => linkMap.set(link.id, link));
    
    nodeMapRef.current = nodeMap;
    linkMapRef.current = linkMap;
    
    console.log('GeoJSON 상태 초기화 완료:', {
      노드: loadedNodes.length,
      링크: loadedLinks.length
    });
  }, []);
  
  // 데이터 로딩 오류 처리
  const handleLoadError = useCallback((loadError: Error) => {
    setIsLoading(false);
    setError(loadError);
    console.error('GeoJSON 데이터 로드 실패:', loadError);
  }, []);
  
  // 활성 피처 변경 처리
  const handleDisplayedFeaturesChange = useCallback((markers: any[], polylines: any[]) => {
    activeMarkersRef.current = markers;
    activePolylinesRef.current = polylines;
  }, []);
  
  // 모든 활성 피처 제거
  const clearDisplayedFeatures = useCallback(() => {
    // 마커 제거
    activeMarkersRef.current.forEach(marker => {
      if (marker && typeof marker.setMap === 'function') {
        marker.setMap(null);
      }
    });
    activeMarkersRef.current = [];
    
    // 폴리라인 제거
    activePolylinesRef.current.forEach(polyline => {
      if (polyline && typeof polyline.setMap === 'function') {
        polyline.setMap(null);
      }
    });
    activePolylinesRef.current = [];
  }, []);
  
  // 노드 ID로 노드 조회
  const getNodeById = useCallback((id: string): GeoNode | undefined => {
    return nodeMapRef.current.get(id);
  }, []);
  
  // 링크 ID로 링크 조회
  const getLinkById = useCallback((id: string): GeoLink | undefined => {
    return linkMapRef.current.get(id);
  }, []);
  
  // 경로 렌더링 함수
  const renderRoute = useCallback((nodeIds: string[], linkIds: string[], style: RouteStyle = {
    strokeColor: '#2196F3',
    strokeWeight: 5,
    strokeOpacity: 0.8
  }): any[] => {
    if (!map || !window.naver || !window.naver.maps) return [];
    
    // 기존에 표시된 피처 제거
    clearDisplayedFeatures();
    
    const renderedFeatures: any[] = [];
    
    // 링크 렌더링
    linkIds.forEach(linkId => {
      const link = getLinkById(linkId);
      if (!link) {
        console.warn(`링크 ID ${linkId}를 찾을 수 없습니다.`);
        return;
      }
      
      // naver.maps.Polyline을 사용하여 링크 렌더링
      if (window.naver && window.naver.maps) {
        try {
          const path = link.coordinates.map(coord => 
            new window.naver.maps.LatLng(coord[1], coord[0])
          );
          
          const polyline = new window.naver.maps.Polyline({
            map,
            path,
            strokeColor: style.strokeColor,
            strokeWeight: style.strokeWeight,
            strokeOpacity: style.strokeOpacity,
            zIndex: style.zIndex || 100
          });
          
          renderedFeatures.push(polyline);
          activePolylinesRef.current.push(polyline);
          link.naverPolyline = polyline;
        } catch (e) {
          console.error(`링크 ${linkId} 렌더링 중 오류:`, e);
        }
      }
    });
    
    // 노드 렌더링
    nodeIds.forEach(nodeId => {
      const node = getNodeById(nodeId);
      if (!node) {
        console.warn(`노드 ID ${nodeId}를 찾을 수 없습니다.`);
        return;
      }
      
      // naver.maps.Marker를 사용하여 노드 렌더링
      if (window.naver && window.naver.maps) {
        try {
          const position = new window.naver.maps.LatLng(
            node.coordinates[1],
            node.coordinates[0]
          );
          
          const marker = new window.naver.maps.Marker({
            map,
            position,
            icon: {
              content: `<div style="
                width: 8px;
                height: 8px;
                background-color: ${style.fillColor || '#FF5722'};
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
              "></div>`,
              anchor: new window.naver.maps.Point(4, 4)
            },
            zIndex: (style.zIndex || 100) + 1
          });
          
          renderedFeatures.push(marker);
          activeMarkersRef.current.push(marker);
          node.naverMarker = marker;
        } catch (e) {
          console.error(`노드 ${nodeId} 렌더링 중 오류:`, e);
        }
      }
    });
    
    return renderedFeatures;
  }, [map, clearDisplayedFeatures, getLinkById, getNodeById]);
  
  // 전체 네트워크 렌더링 함수 추가
  const renderAllNetwork = useCallback((style: RouteStyle = {
    strokeColor: '#2196F3',
    strokeWeight: 3,
    strokeOpacity: 0.6
  }): any[] => {
    if (!map || !window.naver || !window.naver.maps) return [];
    
    // 기존에 표시된 피처 제거
    clearDisplayedFeatures();
    
    console.log('전체 GeoJSON 네트워크 렌더링 시도:', { 
      노드수: nodes.length, 
      링크수: links.length 
    });
    
    const renderedFeatures: any[] = [];
    const linkLimit = Math.min(500, links.length);
    const linkStep = links.length > 0 ? Math.max(1, Math.floor(links.length / linkLimit)) : 1;
    
    for (let i = 0; i < links.length; i += linkStep) {
      const link = links[i];
      if (!link) continue;
      
      // naver.maps.Polyline을 사용하여 링크 렌더링
      if (window.naver && window.naver.maps) {
        try {
          const path = link.coordinates.map(coord => 
            new window.naver.maps.LatLng(coord[1], coord[0])
          );
          
          const polyline = new window.naver.maps.Polyline({
            map,
            path,
            strokeColor: style.strokeColor,
            strokeWeight: style.strokeWeight,
            strokeOpacity: style.strokeOpacity,
            zIndex: style.zIndex || 100
          });
          
          renderedFeatures.push(polyline);
          activePolylinesRef.current.push(polyline);
        } catch (e) {
          console.error(`전체 네트워크 렌더링 중 오류:`, e);
        }
      }
    }
    
    console.log(`전체 네트워크 렌더링 완료: ${renderedFeatures.length}개 피처`);
    return renderedFeatures;
  }, [map, clearDisplayedFeatures, nodes, links]);
  
  // 전역 인터페이스 등록
  const registerGlobalInterface = useCallback(() => {
    // 전역에 GeoJSON 레이어 인터페이스 제공
    const layerInterface: GeoJsonLayerRef = {
      renderRoute,
      clearDisplayedFeatures,
      getNodeById,
      getLinkById,
      renderAllNetwork
    };
    
    window.geoJsonLayer = layerInterface;
    
    // 클리어 함수 반환 (컴포넌트 언마운트 시 호출됨)
    return () => {
      clearDisplayedFeatures();
      if (window.geoJsonLayer === layerInterface) {
        delete window.geoJsonLayer;
      }
    };
  }, [renderRoute, clearDisplayedFeatures, getNodeById, getLinkById, renderAllNetwork]);
  
  return {
    isLoading,
    error,
    isLoaded,
    nodes,
    links,
    handleLoadSuccess,
    handleLoadError,
    handleDisplayedFeaturesChange,
    clearDisplayedFeatures,
    getNodeById,
    getLinkById,
    renderRoute,
    renderAllNetwork,
    registerGlobalInterface
  };
};

export default useGeoJsonState;
