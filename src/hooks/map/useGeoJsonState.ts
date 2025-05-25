
import { useCallback, useState } from 'react';
import type { GeoJsonFeature, GeoLink } from '@/components/rightpanel/geojson/GeoJsonTypes';

/**
 * GeoJSON 상태를 관리하는 훅
 * @returns {Object} GeoJSON 노드 및 링크와 관련 함수들
 */
export const useGeoJsonState = () => {
  const [isGeoJsonLoaded, setIsGeoJsonLoaded] = useState(false);
  const [geoJsonNodes, setGeoJsonNodes] = useState<GeoJsonFeature[]>([]);
  const [geoJsonLinks, setGeoJsonLinks] = useState<GeoLink[]>([]);
  
  // GeoJSON 데이터 로드 완료 처리 함수
  const handleGeoJsonLoaded = useCallback((nodes: GeoJsonFeature[], links: GeoLink[]) => {
    console.log(`[useGeoJsonState] GeoJSON 데이터 로드됨: 노드 ${nodes.length}개, 링크 ${links.length}개`);
    setGeoJsonNodes(nodes);
    setGeoJsonLinks(links);
    setIsGeoJsonLoaded(true);
  }, []);

  // GeoJSON 매핑 확인 함수
  const checkGeoJsonMapping = useCallback((places: any[]) => {
    if (geoJsonNodes.length === 0) {
      console.warn('[useGeoJsonState] GeoJSON 노드가 로드되지 않음');
      return false;
    }
    
    // 매핑 확인 로직 구현
    const mappedCount = places.filter(place => {
      return geoJsonNodes.some(node => node.properties && String(node.properties.NODE_ID) === String(place.id));
    }).length;
    
    console.log(`[useGeoJsonState] 장소 ${places.length}개 중 ${mappedCount}개가 GeoJSON 노드에 매핑됨`);
    return mappedCount > 0;
  }, [geoJsonNodes]);

  return {
    isGeoJsonLoaded,
    geoJsonNodes,
    geoJsonLinks,
    handleGeoJsonLoaded,
    checkGeoJsonMapping
  };
};
