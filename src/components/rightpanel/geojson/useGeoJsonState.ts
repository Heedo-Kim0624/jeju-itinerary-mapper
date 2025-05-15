
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
    if (!map) return [];
    
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

  // 전체 네트워크 렌더링 함수
  const renderAllNetwork = useCallback(() => {
    if (!map || !nodes.length || !links.length) return [];
    
    // 기존에 표시된 피처 제거
    clearDisplayedFeatures();
    
    const renderedFeatures: any[] = [];
    
    // 렌더링 시작 로그
    console.log(`전체 네트워크 렌더링 시작: ${nodes.length}개 노드, ${links.length}개 링크`);
    
    // 성능을 위한 작은 스타일
    const linkStyle: RouteStyle = {
      strokeColor: '#2196F3',
      strokeWeight: 1,
      strokeOpacity: 0.3,
      zIndex: 90
    };
    
    const nodeStyle: RouteStyle = {
      fillColor: '#4CAF50',
      strokeColor: '#FFFFFF',
      strokeWeight: 1,
      strokeOpacity: 0.5,
      zIndex: 100
    };
    
    // 링크를 먼저 렌더링
    links.forEach(link => {
      // naver.maps.Polyline을 사용하여 링크 렌더링
      if (window.naver && window.naver.maps) {
        try {
          const path = link.coordinates.map(coord => 
            new window.naver.maps.LatLng(coord[1], coord[0])
          );
          
          const polyline = new window.naver.maps.Polyline({
            map,
            path,
            strokeColor: linkStyle.strokeColor,
            strokeWeight: linkStyle.strokeWeight,
            strokeOpacity: linkStyle.strokeOpacity,
            zIndex: linkStyle.zIndex
          });
          
          renderedFeatures.push(polyline);
          activePolylinesRef.current.push(polyline);
        } catch (e) {
          // 오류는 무시하고 계속 진행
        }
      }
    });
    
    // 노드 렌더링 (선택적, 전체 노드를 표시하면 성능이 저하될 수 있음)
    // 노드 수가 많아 일부만 렌더링하거나 생략 가능
    const sampleFactor = Math.max(1, Math.floor(nodes.length / 1000)); // 최대 1000개 노드만 표시
    
    nodes.forEach((node, index) => {
      // 샘플링: 모든 노드를 표시하지 않고 일부만 표시
      if (index % sampleFactor !== 0) return;
      
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
                width: 3px;
                height: 3px;
                background-color: ${nodeStyle.fillColor};
                border-radius: 50%;
                border: 1px solid white;
              "></div>`,
              anchor: new window.naver.maps.Point(1.5, 1.5)
            },
            zIndex: nodeStyle.zIndex
          });
          
          renderedFeatures.push(marker);
          activeMarkersRef.current.push(marker);
        } catch (e) {
          // 오류는 무시하고 계속 진행
        }
      }
    });
    
    console.log(`전체 네트워크 렌더링 완료: ${activePolylinesRef.current.length}개 링크, ${activeMarkersRef.current.length}개 노드 표시됨`);
    return renderedFeatures;
  }, [map, nodes, links, clearDisplayedFeatures]);
  
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
