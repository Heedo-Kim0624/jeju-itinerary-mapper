
import { useEffect } from 'react';
import { GeoNode, GeoLink, RouteStyle } from './GeoJsonTypes';

interface GeoJsonRendererProps {
  map: any;
  visible: boolean;
  nodes: GeoNode[];
  links: GeoLink[];
  onDisplayedFeaturesChange: (features: any[]) => void;
}

const GeoJsonRenderer: React.FC<GeoJsonRendererProps> = ({
  map,
  visible,
  nodes,
  links,
  onDisplayedFeaturesChange
}) => {
  // 가시성 변경 시 호출되는 effect
  useEffect(() => {
    if (!map) return;
    
    if (visible) {
      renderCustomElements();
    } else {
      clearDisplayedFeatures();
    }
    
    return () => {
      clearDisplayedFeatures();
    };
  }, [visible, map, nodes, links]);

  // 표시 중인 GeoJSON 요소들 제거
  const clearDisplayedFeatures = () => {
    onDisplayedFeaturesChange([]);
  };

  // 커스텀 요소 렌더링 (네이버 맵 의존성 제거 버전)
  const renderCustomElements = () => {
    if (!map || !window.naver) return;
    
    const newDisplayedFeatures: any[] = [];
    
    try {
      // 링크 렌더링 (성능을 위해 일부만)
      const sampleLinks = links.slice(0, 100);
      sampleLinks.forEach(link => {
        if (!link.geometry || !link.coordinates) return;
        
        const path = link.coordinates.map((coord: number[]) => 
          new window.naver.maps.LatLng(coord[1], coord[0])
        );
        
        const polyline = new window.naver.maps.Polyline({
          map: map,
          path: path,
          strokeColor: '#777',
          strokeWeight: 1,
          strokeOpacity: 0.5,
          clickable: false
        });
        
        link.naverElement = polyline;
        newDisplayedFeatures.push(polyline);
      });
      
      // 노드 렌더링 (성능을 위해 일부만)
      const sampleNodes = nodes.slice(0, 100);
      sampleNodes.forEach(node => {
        if (!node.geometry || !node.coordinates) return;
        
        const [lng, lat] = node.coordinates;
        
        const circle = new window.naver.maps.Circle({
          map: map,
          center: new window.naver.maps.LatLng(lat, lng),
          radius: 50,
          fillColor: '#ff0000',
          fillOpacity: 0.1,
          strokeWeight: 0,
          clickable: false
        });
        
        node.naverElement = circle;
        newDisplayedFeatures.push(circle);
      });
      
      console.log(`GeoJsonRenderer: ${newDisplayedFeatures.length}개 요소 표시됨`);
      onDisplayedFeaturesChange(newDisplayedFeatures);
    } catch (error) {
      console.error('GeoJsonRenderer: 커스텀 렌더링 오류', error);
      onDisplayedFeaturesChange([]);
    }
  };

  // 특정 노드/링크 ID 배열을 사용하여 경로 렌더링
  const renderRoute = (nodeIds: string[], linkIds: string[], style: RouteStyle = {}) => {
    if (!map || nodeIds.length === 0 || linkIds.length === 0) {
      return [];
    }
    
    const renderedFeatures: any[] = [];
    
    try {
      // 스타일 정의 (기본값 + 전달받은 스타일)
      const routeStyle = {
        strokeColor: '#3366FF',
        strokeWeight: 4,
        strokeOpacity: 0.8,
        zIndex: 100,
        clickable: false,
        ...style
      };
      
      // 링크 추가
      linkIds.forEach(id => {
        const link = links.find(l => l.getId() === id);
        if (link && link.geometry && link.coordinates) {
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
        }
      });
      
      // 노드 추가 (장소 표시용)
      const nodeStyle = {
        fillColor: routeStyle.strokeColor,
        fillOpacity: 0.8,
        radius: 4,
        strokeWeight: 2,
        strokeColor: '#FFFFFF',
        clickable: false
      };
      
      nodeIds.forEach(id => {
        const node = nodes.find(n => n.getId() === id);
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
        }
      });
      
      console.log(`GeoJsonRenderer: ${renderedFeatures.length}개 경로 요소 렌더링됨`);
    } catch (error) {
      console.error('GeoJsonRenderer: 경로 렌더링 오류', error);
    }
    
    return renderedFeatures;
  };

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
};

export default GeoJsonRenderer;
