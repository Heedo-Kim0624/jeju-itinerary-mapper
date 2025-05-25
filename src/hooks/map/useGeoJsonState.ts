
import { useCallback, useState } from 'react';
import type { GeoJsonFeature, GeoLink } from '@/components/rightpanel/geojson/GeoJsonTypes';
import type { Place } from '@/types/supabase'; // Place 타입을 임포트합니다.

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
  const checkGeoJsonMapping = useCallback((places: Place[]) => {
    const totalPlaces = places.length;
    let mappedPlaces = 0;
    let message = '';
    let success = false;

    if (geoJsonNodes.length === 0) {
      message = '[useGeoJsonState] GeoJSON 노드가 로드되지 않았습니다.';
      console.warn(message);
      success = false;
    } else {
      mappedPlaces = places.filter(place => 
        geoJsonNodes.some(node => node.properties && String(node.properties.NODE_ID) === String(place.id))
      ).length;
      
      success = mappedPlaces > 0;
      if (success) {
        message = `[useGeoJsonState] 장소 ${totalPlaces}개 중 ${mappedPlaces}개가 GeoJSON 노드에 매핑됨`;
      } else {
        message = `[useGeoJsonState] 장소 ${totalPlaces}개 중 GeoJSON 노드에 매핑된 장소가 없습니다.`;
      }
      console.log(message);
    }
    
    const mappingRate = totalPlaces > 0 ? ((mappedPlaces / totalPlaces) * 100).toFixed(2) + '%' : '0%';
    
    // TODO: 평균 거리 계산 로직은 필요시 추가 구현
    const averageDistance = 'N/A'; 

    return {
      totalPlaces,
      mappedPlaces,
      mappingRate,
      averageDistance,
      success,
      message
    };
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
