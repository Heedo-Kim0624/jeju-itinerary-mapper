
import { useCallback, useRef } from 'react';
import { GeoNode, GeoLink, RouteStyle } from '@/components/rightpanel/geojson/GeoJsonTypes';

/**
 * GeoJSON 노드 및 링크 시각화를 위한 기능 제공 훅
 */
export const useGeoJsonFeatures = (map: any) => {
  // 활성화된 마커와 폴리라인을 추적하는 refs
  const activeMarkersRef = useRef<any[]>([]);
  const activePolylinesRef = useRef<any[]>([]);
  
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
  
  // 경로 렌더링 함수
  const renderRoute = useCallback((nodeIds: string[], linkIds: string[], nodes: GeoNode[], links: GeoLink[], style: RouteStyle = {
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
      const link = links.find(l => l.id === linkId);
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
        } catch (e) {
          console.error(`링크 ${linkId} 렌더링 중 오류:`, e);
        }
      }
    });
    
    // 노드 렌더링
    nodeIds.forEach(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
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
        } catch (e) {
          console.error(`노드 ${nodeId} 렌더링 중 오류:`, e);
        }
      }
    });
    
    return renderedFeatures;
  }, [map, clearDisplayedFeatures]);

  // 전체 네트워크 렌더링 함수
  const renderAllNetwork = useCallback((nodes: GeoNode[], links: GeoLink[]) => {
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
    
    // 노드 수가 많아 일부만 렌더링
    const sampleFactor = Math.max(1, Math.floor(nodes.length / 1000));
    
    nodes.forEach((node, index) => {
      // 샘플링: 모든 노드를 표시하지 않고 일부만 표시
      if (index % sampleFactor !== 0) return;
      
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
  }, [map, clearDisplayedFeatures]);

  return {
    handleDisplayedFeaturesChange,
    clearDisplayedFeatures,
    renderRoute,
    renderAllNetwork
  };
};
