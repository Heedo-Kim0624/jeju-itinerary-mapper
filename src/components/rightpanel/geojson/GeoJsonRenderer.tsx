
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
  
  // 피처 렌더링 인터페이스를 전역으로 등록
  useEffect(() => {
    if (!map || !window.geoJsonLayer) return;
    
    // 전역 인터페이스에서 참조할 함수 정의
    const originalRenderAllNetwork = window.geoJsonLayer.renderAllNetwork;
    
    // 이전 설정을 저장하고 컴포넌트가 언마운트될 때 복원
    return () => {
      if (window.geoJsonLayer && originalRenderAllNetwork) {
        window.geoJsonLayer.renderAllNetwork = originalRenderAllNetwork;
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
