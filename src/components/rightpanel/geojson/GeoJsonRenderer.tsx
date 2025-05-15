
import React, { useEffect, useRef, useState } from 'react';
import { GeoJsonRendererProps, RouteStyle } from './GeoJsonTypes';
import NodeRenderer from './renderers/NodeRenderer';
import LinkRenderer from './renderers/LinkRenderer';

// 기본 스타일 정의
const NODE_STYLE: RouteStyle = {
  fillColor: '#4CAF50',
  strokeColor: '#FFFFFF',
  strokeWeight: 1,
  strokeOpacity: 0.8,
  zIndex: 100
};

const LINK_STYLE: RouteStyle = {
  strokeColor: '#2196F3',
  strokeWeight: 2,
  strokeOpacity: 0.4,
  zIndex: 90
};

/**
 * GeoJSON 렌더러 컴포넌트
 * 노드와 링크 렌더러를 통합하여 관리
 */
const GeoJsonRenderer: React.FC<GeoJsonRendererProps> = ({
  map,
  visible,
  nodes,
  links,
  onDisplayedFeaturesChange
}) => {
  // 렌더링된 피처 추적
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  
  // 피처 가시성 상태
  const [isVisible, setIsVisible] = useState(visible);
  
  // 가시성 변경 시 피처 표시/숨김
  useEffect(() => {
    if (visible !== isVisible) {
      setIsVisible(visible);
    }
  }, [visible, isVisible]);

  // 마커 생성 콜백
  const handleMarkersCreated = (markers: any[]) => {
    markersRef.current = markers;
    if (onDisplayedFeaturesChange) {
      onDisplayedFeaturesChange(markersRef.current, polylinesRef.current);
    }
  };
  
  // 폴리라인 생성 콜백
  const handlePolylinesCreated = (polylines: any[]) => {
    polylinesRef.current = polylines;
    if (onDisplayedFeaturesChange) {
      onDisplayedFeaturesChange(markersRef.current, polylinesRef.current);
    }
  };
  
  // 모든 피처 제거
  const clearAllFeatures = () => {
    // 마커 제거
    markersRef.current.forEach(marker => {
      if (marker && typeof marker.setMap === 'function') {
        marker.setMap(null);
      }
    });
    markersRef.current = [];
    
    // 폴리라인 제거
    polylinesRef.current.forEach(polyline => {
      if (polyline && typeof polyline.setMap === 'function') {
        polyline.setMap(null);
      }
    });
    polylinesRef.current = [];
  };
  
  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      clearAllFeatures();
    };
  }, []);
  
  // 전체 네트워크 렌더링 함수
  const renderAllNetwork = () => {
    if (!map || !nodes.length || !links.length) return [];
    
    // 기존에 표시된 피처 제거
    clearAllFeatures();
    
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
          polylinesRef.current.push(polyline);
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
          markersRef.current.push(marker);
        } catch (e) {
          // 오류는 무시하고 계속 진행
        }
      }
    });
    
    console.log(`전체 네트워크 렌더링 완료: ${polylinesRef.current.length}개 링크, ${markersRef.current.length}개 노드 표시됨`);
    return renderedFeatures;
  };
  
  // 글로벌 인터페이스 등록하여 외부에서 접근 가능하게
  useEffect(() => {
    if (map && window.geoJsonLayer) {
      window.geoJsonLayer.renderAllNetwork = renderAllNetwork;
    }
    
    return () => {
      if (window.geoJsonLayer) {
        // @ts-ignore - 타입 에러 무시
        window.geoJsonLayer.renderAllNetwork = undefined;
      }
    };
  }, [map, nodes, links]);
  
  return (
    <>
      {/* 노드 렌더링 컴포넌트 */}
      <NodeRenderer
        map={map}
        visible={visible}
        nodes={nodes}
        style={NODE_STYLE}
        onMarkersCreated={handleMarkersCreated}
      />
      
      {/* 링크 렌더링 컴포넌트 */}
      <LinkRenderer
        map={map}
        visible={visible}
        links={links}
        style={LINK_STYLE}
        onPolylinesCreated={handlePolylinesCreated}
      />
    </>
  );
};

export default GeoJsonRenderer;
