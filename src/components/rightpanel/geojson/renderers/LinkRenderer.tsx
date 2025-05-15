
import React, { useEffect, useRef } from 'react';
import { GeoLink, RouteStyle, LinkRendererProps } from '../GeoJsonTypes';

/**
 * GeoJSON 링크 렌더링 컴포넌트
 */
const LinkRenderer: React.FC<LinkRendererProps> = ({ 
  map, 
  visible, 
  links, 
  style,
  onPolylinesCreated
}) => {
  const polylinesRef = useRef<any[]>([]);

  // 링크 렌더링
  useEffect(() => {
    if (!map || !window.naver || !window.naver.maps) return;
    
    // 이전 폴리라인 제거
    clearPolylines();
    
    if (!visible) return;

    // 링크 렌더링
    const polylines = links.map(link => renderLink(link, style)).filter(Boolean);
    
    polylinesRef.current = polylines;
    
    // 폴리라인 생성 알림
    if (onPolylinesCreated) {
      onPolylinesCreated(polylines);
    }
    
    return () => {
      clearPolylines();
    };
  }, [map, visible, links, style, onPolylinesCreated]);
  
  // 링크를 지도에 렌더링하는 함수
  const renderLink = (link: GeoLink, linkStyle: RouteStyle) => {
    if (!map || !window.naver || !window.naver.maps) return null;
    
    try {
      const path = link.coordinates.map(coord => 
        new window.naver.maps.LatLng(coord[1], coord[0])
      );
      
      const polyline = new window.naver.maps.Polyline({
        map: visible ? map : null,
        path,
        strokeColor: linkStyle.strokeColor,
        strokeWeight: linkStyle.strokeWeight,
        strokeOpacity: linkStyle.strokeOpacity,
        zIndex: linkStyle.zIndex || 90
      });
      
      return polyline;
    } catch (e) {
      console.error(`링크 ${link.id} 렌더링 중 오류:`, e);
      return null;
    }
  };

  // 모든 폴리라인 제거
  const clearPolylines = () => {
    polylinesRef.current.forEach(polyline => {
      if (polyline && typeof polyline.setMap === 'function') {
        polyline.setMap(null);
      }
    });
    polylinesRef.current = [];
  };

  // 폴리라인 가시성 변경
  const updatePolylineVisibility = (isVisible: boolean) => {
    polylinesRef.current.forEach(polyline => {
      if (polyline && typeof polyline.setMap === 'function') {
        polyline.setMap(isVisible ? map : null);
      }
    });
  };
  
  // 가시성 변경 시 폴리라인 표시/숨김
  useEffect(() => {
    updatePolylineVisibility(visible);
  }, [visible, map]);

  return null;
};

export default LinkRenderer;
