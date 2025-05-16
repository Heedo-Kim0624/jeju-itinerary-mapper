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
    
    console.log('GeoJSON 상태 초기화 완료 (useGeoJsonState):', {
      노드수: loadedNodes.length,
      링크수: loadedLinks.length
    });
  }, []);
  
  // 데이터 로딩 오류 처리
  const handleLoadError = useCallback((loadError: Error) => {
    setIsLoading(false);
    setError(loadError);
    console.error('GeoJSON 데이터 로드 실패 (useGeoJsonState):', loadError);
  }, []);
  
  // 활성 피처 변경 처리
  const handleDisplayedFeaturesChange = useCallback((markers: any[], polylines: any[]) => {
    activeMarkersRef.current = markers;
    activePolylinesRef.current = polylines;
  }, []);
  
  // 모든 활성 피처 제거
  const clearDisplayedFeatures = useCallback(() => {
    activeMarkersRef.current.forEach(marker => {
      if (marker && typeof marker.setMap === 'function') {
        marker.setMap(null);
      }
    });
    activeMarkersRef.current = [];
    
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
  const renderRoute = useCallback((nodeIds: string[], linkIds: string[], style: RouteStyle = {}): any[] => {
    if (!map) return [];
    
    clearDisplayedFeatures();
    
    const renderedFeatures: any[] = [];

    // 스타일 기본값 설정
    const effectiveStyle: Required<RouteStyle> = {
      strokeColor: style.strokeColor || '#90EE90', // 연두색 기본
      strokeWeight: style.strokeWeight || 5,
      strokeOpacity: style.strokeOpacity || 0.8,
      fillColor: style.fillColor || '#FF0000', // 빨간색 기본
      zIndex: style.zIndex || 100,
      // 다음 속성들은 RouteStyle에 없으므로 직접 사용하거나, RouteStyle에 추가 필요
      // icon: style.icon, 
      // title: style.title
    };
    
    linkIds.forEach(linkId => {
      const link = getLinkById(linkId);
      if (!link) {
        console.warn(`링크 ID ${linkId}를 찾을 수 없습니다.`);
        return;
      }
      
      if (window.naver && window.naver.maps) {
        try {
          const path = link.coordinates.map(coord => 
            new window.naver.maps.LatLng(coord[1], coord[0])
          );
          
          const polyline = new window.naver.maps.Polyline({
            map,
            path,
            strokeColor: effectiveStyle.strokeColor,
            strokeWeight: effectiveStyle.strokeWeight,
            strokeOpacity: effectiveStyle.strokeOpacity,
            zIndex: effectiveStyle.zIndex
          });
          
          renderedFeatures.push(polyline);
          activePolylinesRef.current.push(polyline);
          // link.naverPolyline = polyline; // GeoNode/GeoLink 타입에 naverPolyline 추가 필요
        } catch (e) {
          console.error(`링크 ${linkId} 렌더링 중 오류:`, e);
        }
      }
    });
    
    nodeIds.forEach(nodeId => {
      const node = getNodeById(nodeId);
      if (!node) {
        console.warn(`노드 ID ${nodeId}를 찾을 수 없습니다.`);
        return;
      }
      
      if (window.naver && window.naver.maps) {
        try {
          const position = new window.naver.maps.LatLng(
            node.coordinates[1],
            node.coordinates[0]
          );
          
          const marker = new window.naver.maps.Marker({
            map,
            position,
            icon: { // 아이콘 스타일 직접 지정
              content: `<div style="
                width: 10px; /* 크기 약간 증가 */
                height: 10px; /* 크기 약간 증가 */
                background-color: ${effectiveStyle.fillColor}; /* 빨간색 적용 */
                border-radius: 50%;
                border: 2px solid white; /* 흰색 테두리 추가 */
                box-shadow: 0 0 5px rgba(0,0,0,0.5); /* 그림자 효과 */
              "></div>`,
              anchor: new window.naver.maps.Point(5, 5) // 중앙 정렬
            },
            zIndex: effectiveStyle.zIndex + 1 // 마커가 폴리라인 위에 오도록
          });
          
          renderedFeatures.push(marker);
          activeMarkersRef.current.push(marker);
          // node.naverMarker = marker; // GeoNode/GeoLink 타입에 naverMarker 추가 필요
        } catch (e) {
          console.error(`노드 ${nodeId} 렌더링 중 오류:`, e);
        }
      }
    });
    
    return renderedFeatures;
  }, [map, clearDisplayedFeatures, getLinkById, getNodeById]);
  
  // 전역 인터페이스 등록
  const registerGlobalInterface = useCallback(() => {
    // 전역에 GeoJSON 레이어 인터페이스 제공
    const layerInterface: GeoJsonLayerRef = {
      renderRoute,
      clearDisplayedFeatures,
      getNodeById,
      getLinkById
    };
    
    window.geoJsonLayer = layerInterface;
    console.log("🌍 GeoJSON Layer Interface registered to window.geoJsonLayer (useGeoJsonState)");
    
    // 클리어 함수 반환 (컴포넌트 언마운트 시 호출됨)
    return () => {
      clearDisplayedFeatures();
      if (window.geoJsonLayer === layerInterface) {
        delete window.geoJsonLayer;
        console.log("🌍 GeoJSON Layer Interface unregistered from window.geoJsonLayer (useGeoJsonState)");
      }
    };
  }, [renderRoute, clearDisplayedFeatures, getNodeById, getLinkById]);
  
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
    registerGlobalInterface
  };
};

export default useGeoJsonState;
