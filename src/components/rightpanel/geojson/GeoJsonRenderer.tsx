import React, { useEffect, useRef, useState } from 'react';
import { GeoNode, GeoLink, RouteStyle, GeoJsonRendererProps } from './GeoJsonTypes'; // Ensure these are exported

const DEFAULT_NODE_STYLE: RouteStyle = {
  fillColor: '#4CAF50', // 기본 노드 색상
  zIndex: 101
};

const DEFAULT_LINK_STYLE: RouteStyle = {
  strokeColor: '#2196F3', // 기본 링크 색상
  strokeWeight: 3,
  strokeOpacity: 0.7,
  zIndex: 100
};

const GeoJsonRenderer: React.FC<GeoJsonRendererProps> = ({
  map,
  visible,
  nodes,
  links,
  onDisplayedFeaturesChange
}) => {
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const [isFeaturesRendered, setIsFeaturesRendered] = useState(false);

  // 모든 피처 제거 함수
  const clearAllFeatures = () => {
    markersRef.current.forEach(marker => {
      if (marker && typeof marker.setMap === 'function') marker.setMap(null);
    });
    markersRef.current = [];
    
    polylinesRef.current.forEach(polyline => {
      if (polyline && typeof polyline.setMap === 'function') polyline.setMap(null);
    });
    polylinesRef.current = [];
    setIsFeaturesRendered(false);
    if (onDisplayedFeaturesChange) {
      onDisplayedFeaturesChange([], []);
    }
  };
  
  // 노드를 지도에 렌더링하는 함수
  const renderNode = (node: GeoNode, style: RouteStyle) => {
    if (!map || !window.naver || !window.naver.maps) return null;
    try {
      const position = new window.naver.maps.LatLng(node.coordinates[1], node.coordinates[0]);
      const marker = new window.naver.maps.Marker({
        map: map, // 초기에 map에 추가
        position,
        icon: {
          content: `<div style="width: 7px; height: 7px; background-color: ${style.fillColor || DEFAULT_NODE_STYLE.fillColor}; border-radius: 50%; border: 1px solid white; box-shadow: 0 0 3px rgba(0,0,0,0.3);"></div>`,
          anchor: new window.naver.maps.Point(3.5, 3.5)
        },
        zIndex: style.zIndex || DEFAULT_NODE_STYLE.zIndex
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
      const path = link.coordinates.map(coord => new window.naver.maps.LatLng(coord[1], coord[0]));
      const polyline = new window.naver.maps.Polyline({
        map: map, // 초기에 map에 추가
        path,
        strokeColor: style.strokeColor || DEFAULT_LINK_STYLE.strokeColor,
        strokeWeight: style.strokeWeight || DEFAULT_LINK_STYLE.strokeWeight,
        strokeOpacity: style.strokeOpacity || DEFAULT_LINK_STYLE.strokeOpacity,
        zIndex: style.zIndex || DEFAULT_LINK_STYLE.zIndex
      });
      polylinesRef.current.push(polyline);
      return polyline;
    } catch (e) {
      console.error(`링크 ${link.id} 렌더링 중 오류:`, e);
      return null;
    }
  };

  // map, nodes, links가 변경되면 모든 피처를 다시 렌더링 (visible 상태는 아래 useEffect에서 처리)
  useEffect(() => {
    if (!map || !window.naver || !window.naver.maps || !nodes || !links) {
      clearAllFeatures(); // 맵이 없거나 데이터가 없으면 기존 피처 제거
      return;
    }

    // 기존 피처들 제거 후 새로 렌더링
    clearAllFeatures();

    if (visible) { // visible 상태일 때만 렌더링
      console.log(`GeoJsonRenderer: Rendering ${nodes.length} nodes and ${links.length} links.`);
      nodes.forEach(node => renderNode(node, DEFAULT_NODE_STYLE));
      links.forEach(link => renderLink(link, DEFAULT_LINK_STYLE));
      setIsFeaturesRendered(true);
      if (onDisplayedFeaturesChange) {
        onDisplayedFeaturesChange(markersRef.current, polylinesRef.current);
      }
    }
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      clearAllFeatures();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, nodes, links]); // visible은 별도 useEffect에서 처리


  // visible 상태 변경 시 피처 표시/숨김 처리
  useEffect(() => {
    if (!map || !isFeaturesRendered) { 
        return;
    }

    console.log(`GeoJsonRenderer: Visibility changed to ${visible}. Updating ${markersRef.current.length} markers and ${polylinesRef.current.length} polylines.`);
    
    markersRef.current.forEach(marker => {
      if (marker && typeof marker.setMap === 'function') marker.setMap(visible ? map : null);
    });
    
    polylinesRef.current.forEach(polyline => {
      if (polyline && typeof polyline.setMap === 'function') polyline.setMap(visible ? map : null);
    });

  }, [map, visible, isFeaturesRendered]); 

  return null;
};

export default GeoJsonRenderer;
