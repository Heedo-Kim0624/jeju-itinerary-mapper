import { useState, useCallback, useRef, useEffect } from 'react';
import { GeoNode, GeoLink, RouteStyle, GeoJsonLayerRef } from './GeoJsonTypes';
import { toast } from 'sonner';

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
    
    loadedNodes.forEach(node => nodeMap.set(String(node.id), node)); // ID를 문자열로 통일
    loadedLinks.forEach(link => linkMap.set(String(link.id), link)); // ID를 문자열로 통일
    
    nodeMapRef.current = nodeMap;
    linkMapRef.current = linkMap;
    
    console.log('GeoJSON 상태 초기화 완료:', {
      노드: loadedNodes.length,
      링크: loadedLinks.length
    });
    // toast.success(`GeoJSON 데이터 로드: 노드 ${loadedNodes.length}개, 링크 ${loadedLinks.length}개`);
  }, []);
  
  // 데이터 로딩 오류 처리
  const handleLoadError = useCallback((loadError: Error) => {
    setIsLoading(false);
    setError(loadError);
    console.error('GeoJSON 데이터 로드 실패:', loadError);
    toast.error(`GeoJSON 데이터 로드 실패: ${loadError.message}`);
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
    
    // Naver 객체에 저장된 참조도 초기화 (선택적)
    nodeMapRef.current.forEach(node => {
        if(node.naverMarker) node.naverMarker = null;
    });
    linkMapRef.current.forEach(link => {
        if(link.naverPolyline) link.naverPolyline = null;
    });
  }, []);
  
  // 노드 ID로 노드 조회
  const getNodeById = useCallback((id: string): GeoNode | undefined => {
    return nodeMapRef.current.get(String(id)); // ID를 문자열로 통일
  }, []);
  
  // 링크 ID로 링크 조회
  const getLinkById = useCallback((id: string): GeoLink | undefined => {
    return linkMapRef.current.get(String(id)); // ID를 문자열로 통일
  }, []);
  
  // 경로 렌더링 함수
  const renderRoute = useCallback((nodeIds: string[], linkIds: string[], style: RouteStyle = {
    strokeColor: '#3366FF', // 경로 기본 색상 (파란색 계열)
    strokeWeight: 5,
    strokeOpacity: 0.8,
    fillColor: '#FF5722', // 노드 기본 색상 (주황색 계열)
    zIndex: 150 // 경로가 다른 요소들 위에 오도록 zIndex 설정
  }): any[] => {
    if (!map || !window.naver || !window.naver.maps) {
        console.warn("지도 객체 또는 Naver Maps API가 준비되지 않았습니다.");
        return [];
    }
    
    // 기존에 표시된 특정 경로 피처 제거 (전체 GeoJSON 데이터는 유지)
    // clearDisplayedFeatures(); // 이 함수는 모든 활성 피처를 지우므로, 선택적으로 사용해야 함
    // 특정 경로를 그릴 때는 이전에 그린 '특정 경로'만 지우는 메커니즘이 필요할 수 있음.
    // 여기서는 일단 모든 활성 피처를 지우고 새로 그림.

    const renderedFeatures: any[] = [];
    
    linkIds.forEach(linkId => {
      const link = getLinkById(String(linkId));
      if (!link) {
        console.warn(`[RenderRoute] 링크 ID ${linkId}를 찾을 수 없습니다.`);
        return;
      }
      if (link.naverPolyline && typeof link.naverPolyline.setMap === 'function') {
          link.naverPolyline.setMap(null); // 기존 폴리라인 제거
      }
      try {
        const path = link.coordinates.map(coord => new window.naver.maps.LatLng(coord[1], coord[0]));
        const polyline = new window.naver.maps.Polyline({
          map, path,
          strokeColor: style.strokeColor,
          strokeWeight: style.strokeWeight,
          strokeOpacity: style.strokeOpacity,
          zIndex: style.zIndex
        });
        renderedFeatures.push(polyline);
        activePolylinesRef.current.push(polyline); // 활성 피처 목록에 추가
        link.naverPolyline = polyline; // 참조 저장
      } catch (e) { console.error(`링크 ${linkId} 렌더링 중 오류:`, e); }
    });
    
    nodeIds.forEach(nodeId => {
      const node = getNodeById(String(nodeId));
      if (!node) {
        console.warn(`[RenderRoute] 노드 ID ${nodeId}를 찾을 수 없습니다.`);
        return;
      }
      if (node.naverMarker && typeof node.naverMarker.setMap === 'function') {
        node.naverMarker.setMap(null); // 기존 마커 제거
      }
      try {
        const position = new window.naver.maps.LatLng(node.coordinates[1], node.coordinates[0]);
        const marker = new window.naver.maps.Marker({
          map, position,
          icon: {
            content: `<div style="width: 8px; height: 8px; background-color: ${style.fillColor}; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
            anchor: new window.naver.maps.Point(4, 4)
          },
          zIndex: (style.zIndex || 100) + 1
        });
        renderedFeatures.push(marker);
        activeMarkersRef.current.push(marker); // 활성 피처 목록에 추가
        node.naverMarker = marker; // 참조 저장
      } catch (e) { console.error(`노드 ${nodeId} 렌더링 중 오류:`, e); }
    });
    
    // console.log(`[RenderRoute] ${nodeIds.length}개 노드, ${linkIds.length}개 링크 렌더링 완료.`);
    return renderedFeatures;
  }, [map, getLinkById, getNodeById]); // clearDisplayedFeatures는 의존성에서 제거하거나, 필요시 추가

  // 모든 노드와 링크를 기본 스타일로 렌더링하는 함수
  const renderAllFeatures = useCallback((style: RouteStyle = {}) => {
    if (!map || !isLoaded || !window.naver || !window.naver.maps) {
      // console.warn("renderAllFeatures: 지도 또는 GeoJSON 데이터가 준비되지 않았습니다.");
      return;
    }
    // console.log(`renderAllFeatures: ${nodes.length}개 노드, ${links.length}개 링크 렌더링 시도.`);
    // clearDisplayedFeatures(); // 기존 모든 활성 피처 제거

    const defaultNodeStyle = { fillColor: '#4CAF50', zIndex: 101, ...style };
    const defaultLinkStyle = { strokeColor: '#2196F3', strokeWeight: 3, strokeOpacity: 0.7, zIndex: 100, ...style };

    nodes.forEach(node => {
        if (node.naverMarker && typeof node.naverMarker.setMap === 'function') node.naverMarker.setMap(null);
        try {
            const position = new window.naver.maps.LatLng(node.coordinates[1], node.coordinates[0]);
            const marker = new window.naver.maps.Marker({
                map, position,
                icon: {
                    content: `<div style="width: 6px; height: 6px; background-color: ${defaultNodeStyle.fillColor}; border-radius: 50%; border: 1px solid white;"></div>`,
                    anchor: new window.naver.maps.Point(3,3)
                },
                zIndex: defaultNodeStyle.zIndex
            });
            activeMarkersRef.current.push(marker);
            node.naverMarker = marker;
        } catch (e) { console.error(`전체 노드 ${node.id} 렌더링 오류:`, e); }
    });

    links.forEach(link => {
        if (link.naverPolyline && typeof link.naverPolyline.setMap === 'function') link.naverPolyline.setMap(null);
        try {
            const path = link.coordinates.map(coord => new window.naver.maps.LatLng(coord[1], coord[0]));
            const polyline = new window.naver.maps.Polyline({
                map, path,
                strokeColor: defaultLinkStyle.strokeColor,
                strokeWeight: defaultLinkStyle.strokeWeight,
                strokeOpacity: defaultLinkStyle.strokeOpacity,
                zIndex: defaultLinkStyle.zIndex
            });
            activePolylinesRef.current.push(polyline);
            link.naverPolyline = polyline;
        } catch (e) { console.error(`전체 링크 ${link.id} 렌더링 오류:`, e); }
    });
    // console.log("renderAllFeatures: 완료");

  }, [map, isLoaded, nodes, links, clearDisplayedFeatures]); // clearDisplayedFeatures 의존성 추가

  // 전역 인터페이스 등록
  const registerGlobalInterface = useCallback(() => {
    // 전역에 GeoJSON 레이어 인터페이스 제공
    const layerInterface: GeoJsonLayerRef = {
      renderRoute,
      clearDisplayedFeatures,
      getNodeById,
      getLinkById,
      renderAllFeatures // 추가된 함수
    };
    
    window.geoJsonLayer = layerInterface;
    
    // 클리어 함수 반환 (컴포넌트 언마운트 시 호출됨)
    return () => {
      clearDisplayedFeatures();
      if (window.geoJsonLayer === layerInterface) {
        delete window.geoJsonLayer;
      }
    };
  }, [renderRoute, clearDisplayedFeatures, getNodeById, getLinkById, renderAllFeatures]);
  
  // isLoaded 상태가 true로 변경되면 모든 피처를 렌더링하도록 useEffect 추가
   useEffect(() => {
    if (isLoaded && map && window.geoJsonLayer && typeof window.geoJsonLayer.renderAllFeatures === 'function') {
        // console.log("GeoJSON 데이터 로드 완료, 모든 피처 렌더링 시도.");
        // window.geoJsonLayer.renderAllFeatures(); // GeoJsonRenderer가 이 역할을 하도록 변경됨
        // GeoJsonRenderer가 visible 상태에 따라 알아서 그리도록 함.
        // 여기서 직접 호출하면 GeoJsonRenderer와 충돌 가능성.
        // 대신, GeoJsonLayer 컴포넌트에서 visible이 true일 때 GeoJsonRenderer가 그리도록 유도.
    }
  }, [isLoaded, map]);

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
