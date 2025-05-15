
import React, { useEffect, useRef } from 'react';
import { GeoNode, RouteStyle, NodeRendererProps } from '../GeoJsonTypes';

/**
 * GeoJSON 노드 렌더링 컴포넌트
 */
const NodeRenderer: React.FC<NodeRendererProps> = ({ 
  map, 
  visible, 
  nodes, 
  style,
  onMarkersCreated
}) => {
  const markersRef = useRef<any[]>([]);

  // 노드 렌더링
  useEffect(() => {
    if (!map || !window.naver || !window.naver.maps) return;
    
    // 이전 마커 제거
    clearMarkers();
    
    if (!visible) return;
    
    // 노드 크기 조절 (노드 수에 따라)
    const nodeSize = calculateNodeSize(nodes.length);
    const borderWidth = nodeSize > 3 ? 1 : 0.5;
    
    // 노드 렌더링
    const markers = nodes.map(node => renderNode(node, {
      ...style,
      nodeSize,
      borderWidth
    })).filter(Boolean);
    
    markersRef.current = markers;
    
    // 마커 생성 알림
    if (onMarkersCreated) {
      onMarkersCreated(markers);
    }
    
    return () => {
      clearMarkers();
    };
  }, [map, visible, nodes, style, onMarkersCreated]);

  // 노드 크기 계산 (노드 수에 따라 조절)
  const calculateNodeSize = (totalNodes: number): number => {
    if (totalNodes > 5000) return 2;
    if (totalNodes > 2000) return 3;
    if (totalNodes > 1000) return 4;
    return 5;
  };
  
  // 노드를 지도에 렌더링하는 함수
  const renderNode = (node: GeoNode, nodeStyle: RouteStyle & { nodeSize: number, borderWidth: number }) => {
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
            width: ${nodeStyle.nodeSize}px;
            height: ${nodeStyle.nodeSize}px;
            background-color: ${nodeStyle.fillColor || '#4CAF50'};
            border-radius: 50%;
            border: ${nodeStyle.borderWidth}px solid white;
            box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
          "></div>`,
          anchor: new window.naver.maps.Point(nodeStyle.nodeSize / 2, nodeStyle.nodeSize / 2)
        },
        zIndex: nodeStyle.zIndex || 100
      });
      
      return marker;
    } catch (e) {
      console.error(`노드 ${node.id} 렌더링 중 오류:`, e);
      return null;
    }
  };

  // 모든 마커 제거
  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      if (marker && typeof marker.setMap === 'function') {
        marker.setMap(null);
      }
    });
    markersRef.current = [];
  };

  // 마커 가시성 변경
  const updateMarkerVisibility = (isVisible: boolean) => {
    markersRef.current.forEach(marker => {
      if (marker && typeof marker.setMap === 'function') {
        marker.setMap(isVisible ? map : null);
      }
    });
  };
  
  // 가시성 변경 시 마커 표시/숨김
  useEffect(() => {
    updateMarkerVisibility(visible);
  }, [visible, map]);

  return null;
};

export default NodeRenderer;
