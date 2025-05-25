
import { useCallback, useState } from 'react';
import type { GeoJsonFeature, GeoLink } from '@/components/rightpanel/geojson/GeoJsonTypes';

/**
 * GeoJSON 애플리케이션 상태를 관리하는 훅
 * @returns {Object} GeoJSON 노드, 링크, 로드 상태, 가시성 상태 및 관련 함수들
 */
export const useGeoJsonState = () => {
  const [isGeoJsonLoaded, setIsGeoJsonLoaded] = useState(false);
  const [geoJsonNodes, setGeoJsonNodes] = useState<GeoJsonFeature[]>([]);
  const [geoJsonLinks, setGeoJsonLinks] = useState<GeoLink[]>([]);
  const [showGeoJson, setShowGeoJson] = useState(true); // 초기값은 true로 설정 (또는 필요에 따라 false)

  // GeoJSON 데이터 로드 완료 처리 함수
  const handleGeoJsonLoaded = useCallback((nodes: GeoJsonFeature[], links: GeoLink[]) => {
    console.log(`[useGeoJsonState] 앱 레벨 GeoJSON 데이터 로드됨: 노드 ${nodes.length}개, 링크 ${links.length}개`);
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
    
    const mappedCount = places.filter(place => {
      return geoJsonNodes.some(node => node.properties && String(node.properties.NODE_ID) === String(place.id));
    }).length;
    
    console.log(`[useGeoJsonState] 장소 ${places.length}개 중 ${mappedCount}개가 GeoJSON 노드에 매핑됨`);
    return mappedCount > 0;
  }, [geoJsonNodes]);

  // GeoJSON 레이어 가시성 토글 함수
  const toggleGeoJsonVisibility = useCallback(() => {
    setShowGeoJson(prevShow => !prevShow);
  }, []);

  return {
    isGeoJsonLoaded,
    geoJsonNodes,
    geoJsonLinks,
    showGeoJson, // 가시성 상태 반환
    handleGeoJsonLoaded,
    checkGeoJsonMapping,
    toggleGeoJsonVisibility // 가시성 토글 함수 반환
  };
};
