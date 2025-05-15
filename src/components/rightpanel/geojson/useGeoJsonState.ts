
import { useState, useRef, useCallback } from 'react';
import { GeoNode, GeoLink, RouteStyle, GeoJsonLayerRef } from './GeoJsonTypes';
import { toast } from 'sonner';

export const useGeoJsonState = (map: any) => {
  // 상태 관리
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  
  // GeoJSON 데이터 참조 (메모리에 한 번만 로드)
  const nodesRef = useRef<GeoNode[]>([]);
  const linksRef = useRef<GeoLink[]>([]);
  
  // 현재 지도에 표시 중인 GeoJSON 요소들
  const displayedFeaturesRef = useRef<any[]>([]);
  
  // 데이터 로드 성공 핸들러
  const handleLoadSuccess = useCallback((nodes: GeoNode[], links: GeoLink[]) => {
    nodesRef.current = nodes;
    linksRef.current = links;
    setIsLoaded(true);
    setError(false);
  }, []);
  
  // 데이터 로드 실패 핸들러
  const handleLoadError = useCallback((error: Error) => {
    console.error('GeoJsonLayer: 데이터 로드 실패', error);
    setError(true);
    toast.error('경로 데이터를 불러오는데 실패했습니다.');
  }, []);

  // 표시된 기능 업데이트 핸들러
  const handleDisplayedFeaturesChange = useCallback((features: any[]) => {
    // 이전에 표시된 기능 제거
    if (displayedFeaturesRef.current.length > 0) {
      displayedFeaturesRef.current.forEach(feature => {
        if (feature && feature.setMap) {
          feature.setMap(null);
        }
      });
    }
    
    // 새 기능으로 업데이트
    displayedFeaturesRef.current = features;
  }, []);
  
  // 모든 표시된 기능 지우기
  const clearDisplayedFeatures = useCallback(() => {
    if (displayedFeaturesRef.current.length > 0) {
      displayedFeaturesRef.current.forEach(feature => {
        if (feature && feature.setMap) {
          feature.setMap(null);
        }
      });
      displayedFeaturesRef.current = [];
    }
  }, []);

  // 경로 렌더링 함수
  const renderRoute = useCallback((nodeIds: string[], linkIds: string[], style: RouteStyle = {}) => {
    if (!map) {
      return [];
    }
    
    if (!window.naver) {
      console.warn('GeoJsonRenderer: Naver Maps API가 로드되지 않았습니다.');
      return [];
    }
    
    const renderedFeatures: any[] = [];
    
    try {
      // 스타일 정의
      const routeStyle = {
        strokeColor: '#3366FF',
        strokeWeight: 4,
        strokeOpacity: 0.8,
        zIndex: 100,
        clickable: false,
        ...style
      };
      
      // 링크 렌더링
      linkIds.forEach(id => {
        const link = linksRef.current.find(l => l.getId() === id);
        if (link && link.coordinates) {
          const path = link.coordinates.map((coord: number[]) => 
            new window.naver.maps.LatLng(coord[1], coord[0])
          );
          
          const polyline = new window.naver.maps.Polyline({
            map: map,
            path: path,
            strokeColor: routeStyle.strokeColor,
            strokeWeight: routeStyle.strokeWeight,
            strokeOpacity: routeStyle.strokeOpacity,
            zIndex: routeStyle.zIndex,
            clickable: routeStyle.clickable
          });
          
          renderedFeatures.push(polyline);
          displayedFeaturesRef.current.push(polyline);
        }
      });
      
      // 노드 렌더링
      const nodeStyle = {
        fillColor: routeStyle.strokeColor,
        fillOpacity: 0.8,
        radius: 4,
        strokeWeight: 2,
        strokeColor: '#FFFFFF',
        clickable: false
      };
      
      nodeIds.forEach(id => {
        const node = nodesRef.current.find(n => n.getId() === id);
        if (node && node.coordinates) {
          const [lng, lat] = node.coordinates;
          
          const circle = new window.naver.maps.Circle({
            map: map,
            center: new window.naver.maps.LatLng(lat, lng),
            radius: nodeStyle.radius * 10,
            fillColor: nodeStyle.fillColor,
            fillOpacity: nodeStyle.fillOpacity,
            strokeWeight: nodeStyle.strokeWeight,
            strokeColor: nodeStyle.strokeColor,
            clickable: nodeStyle.clickable
          });
          
          renderedFeatures.push(circle);
          displayedFeaturesRef.current.push(circle);
        }
      });
      
      console.log(`GeoJsonLayer: ${renderedFeatures.length}개 경로 요소 렌더링됨`);
    } catch (error) {
      console.error('GeoJsonLayer: 경로 렌더링 오류', error);
    }
    
    return renderedFeatures;
  }, [map]);

  // 노드 ID로 노드 찾기
  const getNodeById = useCallback((id: string) => {
    return nodesRef.current.find(n => n.getId() === id);
  }, []);

  // 링크 ID로 링크 찾기
  const getLinkById = useCallback((id: string) => {
    return linksRef.current.find(l => l.getId() === id);
  }, []);

  // 외부 인터페이스 등록
  const registerGlobalInterface = useCallback(() => {
    window.geoJsonLayer = {
      renderRoute,
      clearDisplayedFeatures,
      getNodeById,
      getLinkById
    };
    
    return () => {
      window.geoJsonLayer = undefined;
    };
  }, [renderRoute, clearDisplayedFeatures, getNodeById, getLinkById]);

  return {
    isLoading,
    setIsLoading,
    error,
    setError,
    isLoaded,
    nodes: nodesRef.current,
    links: linksRef.current,
    displayedFeatures: displayedFeaturesRef.current,
    clearDisplayedFeatures,
    handleLoadSuccess,
    handleLoadError,
    handleDisplayedFeaturesChange,
    renderRoute,
    getNodeById,
    getLinkById,
    registerGlobalInterface
  };
};

export default useGeoJsonState;
