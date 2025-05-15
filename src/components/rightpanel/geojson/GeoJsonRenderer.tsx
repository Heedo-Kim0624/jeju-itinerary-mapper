
import React, { useEffect, useRef, useState } from 'react';
import { GeoNode, GeoLink, RouteStyle } from './GeoJsonTypes';

interface GeoJsonRendererProps {
  map: any;
  visible: boolean;
  nodes: GeoNode[];
  links: GeoLink[];
  onDisplayedFeaturesChange?: (markers: any[], polylines: any[]) => void;
}

const DEFAULT_STYLE: RouteStyle = {
  strokeColor: '#2196F3',
  strokeWeight: 3,
  strokeOpacity: 0.6,
};

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
      
      markersRef.current.forEach(marker => {
        if (marker && typeof marker.setMap === 'function') {
          marker.setMap(visible ? map : null);
        }
      });
      
      polylinesRef.current.forEach(polyline => {
        if (polyline && typeof polyline.setMap === 'function') {
          polyline.setMap(visible ? map : null);
        }
      });
    }
  }, [visible, isVisible, map]);
  
  // 맵이 변경되면 모든 피처를 다시 렌더링
  useEffect(() => {
    if (!map || !window.naver || !window.naver.maps) return;
    
    // 이전 피처 제거
    clearAllFeatures();
    
    if (!visible) return;
    
    // 모든 노드와 링크 렌더링
    console.log('모든 GeoJSON 데이터 렌더링 시작:', {
      노드: nodes.length,
      링크: links.length
    });

    // 전체 네트워크를 렌더링하는 호출 추가
    renderAllNetwork();
    
    // 변경된 피처 알림
    if (onDisplayedFeaturesChange) {
      onDisplayedFeaturesChange(markersRef.current, polylinesRef.current);
    }
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      clearAllFeatures();
    };
  }, [map, visible, nodes, links, onDisplayedFeaturesChange]);
  
  // 전체 노드와 링크 네트워크 렌더링
  const renderAllNetwork = () => {
    // 링크 먼저 렌더링 (레이어 순서상 아래에 있어야 함)
    links.forEach(link => {
      renderLink(link, LINK_STYLE);
    });
    
    // 노드 렌더링
    nodes.forEach(node => {
      renderNode(node, NODE_STYLE);
    });
    
    console.log(`전체 네트워크 렌더링 완료: ${polylinesRef.current.length}개 링크, ${markersRef.current.length}개 노드`);
  };
  
  // 노드를 지도에 렌더링하는 함수
  const renderNode = (node: GeoNode, style: RouteStyle) => {
    if (!map || !window.naver || !window.naver.maps) return null;
    
    try {
      const position = new window.naver.maps.LatLng(
        node.coordinates[1], 
        node.coordinates[0]
      );
      
      const marker = new window.naver.maps.Marker({
        map: visible ? map : null,
        position,
        icon: {
          content: `<div style="
            width: 4px;
            height: 4px;
            background-color: ${style.fillColor || '#4CAF50'};
            border-radius: 50%;
            border: 1px solid white;
            box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
          "></div>`,
          anchor: new window.naver.maps.Point(2, 2)
        },
        zIndex: style.zIndex || 100
      });
      
      markersRef.current.push(marker);
      return marker;
    } catch (e) {
      console.error(`노드 ${node.id} 렌더링 중 오류:`, e);
      return null;
    }
  };
  
  // 링크를 지도에 렌더링하는 함수
  const renderLink = (link: GeoLink, style: RouteStyle) => {
    if (!map || !window.naver || !window.naver.maps) return null;
    
    try {
      const path = link.coordinates.map(coord => 
        new window.naver.maps.LatLng(coord[1], coord[0])
      );
      
      const polyline = new window.naver.maps.Polyline({
        map: visible ? map : null,
        path,
        strokeColor: style.strokeColor,
        strokeWeight: style.strokeWeight,
        strokeOpacity: style.strokeOpacity,
        zIndex: style.zIndex || 90
      });
      
      polylinesRef.current.push(polyline);
      return polyline;
    } catch (e) {
      console.error(`링크 ${link.id} 렌더링 중 오류:`, e);
      return null;
    }
  };
  
  // 경로 렌더링 함수
  const renderRoute = (nodeIds: string[], linkIds: string[], style: RouteStyle = DEFAULT_STYLE) => {
    // 기존에 표시된 피처 제거
    clearAllFeatures();
    
    const renderedFeatures: any[] = [];
    
    // 지정된 노드 및 링크 렌더링
    nodeIds.forEach(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        const marker = renderNode(node, style);
        if (marker) renderedFeatures.push(marker);
      }
    });
    
    linkIds.forEach(linkId => {
      const link = links.find(l => l.id === linkId);
      if (link) {
        const polyline = renderLink(link, style);
        if (polyline) renderedFeatures.push(polyline);
      }
    });
    
    // 변경된 피처 알림
    if (onDisplayedFeaturesChange) {
      onDisplayedFeaturesChange(markersRef.current, polylinesRef.current);
    }
    
    return renderedFeatures;
  };
  
  // 모든 피처 제거
  const clearAllFeatures = () => {
    markersRef.current.forEach(marker => {
      if (marker && typeof marker.setMap === 'function') {
        marker.setMap(null);
      }
    });
    markersRef.current = [];
    
    polylinesRef.current.forEach(polyline => {
      if (polyline && typeof polyline.setMap === 'function') {
        polyline.setMap(null);
      }
    });
    polylinesRef.current = [];
  };
  
  // 피처 렌더링 인터페이스를 전역으로 등록
  useEffect(() => {
    if (!map) return;
    
    // 전역 인터페이스에 렌더링 메서드 등록
    if (window.geoJsonLayer) {
      const originalRenderRoute = window.geoJsonLayer.renderRoute;
      window.geoJsonLayer.renderRoute = (nodeIds, linkIds, style) => {
        return renderRoute(nodeIds, linkIds, style);
      };
      
      const originalClear = window.geoJsonLayer.clearDisplayedFeatures;
      window.geoJsonLayer.clearDisplayedFeatures = clearAllFeatures;
      
      // 전체 네트워크 렌더링 함수 추가
      window.geoJsonLayer.renderAllNetwork = renderAllNetwork;
      
      return () => {
        if (window.geoJsonLayer) {
          window.geoJsonLayer.renderRoute = originalRenderRoute;
          window.geoJsonLayer.clearDisplayedFeatures = originalClear;
          delete window.geoJsonLayer.renderAllNetwork;
        }
      };
    }
  }, [map, nodes, links]);
  
  return null;
};

export default GeoJsonRenderer;
