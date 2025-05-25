import { useState, useCallback } from 'react';
import { Place } from '@/types/supabase';
import { toast } from 'sonner';

/**
 * GeoJson 상태 관리 훅 (애플리케이션 레벨)
 */
export const useGeoJsonState = () => {
  // GeoJSON 관련 상태
  const [showGeoJson, setShowGeoJson] = useState(false);
  const [isGeoJsonLoaded, setIsGeoJsonLoaded] = useState(false);
  const [geoJsonNodes, setGeoJsonNodes] = useState<any[]>([]); // Consider using GeoNode[] type
  const [geoJsonLinks, setGeoJsonLinks] = useState<any[]>([]); // Consider using GeoLink[] type
  
  // GeoJSON 가시성 토글
  const toggleGeoJsonVisibility = useCallback(() => {
    setShowGeoJson(prev => !prev);
  }, []);

  // GeoJSON 데이터 로드 완료 핸들러 (GeoJsonLoader의 onLoadSuccess 통해 호출됨)
  const handleGeoJsonLoaded = useCallback((nodes: any[], links: any[]) => {
    console.log('[App/useGeoJsonState] handleGeoJsonLoaded 호출됨:', { 
      노드수: nodes.length,
      링크수: links.length
    });
    
    if (links.length > 0) {
      console.log('[App/useGeoJsonState] 첫 번째 링크 샘플 (수신 데이터):', {
        id: links[0].id, // GeoJsonLoader에서 정규화된 ID
        id_type: typeof links[0].id,
        properties_LINK_ID: links[0].properties?.LINK_ID,
        properties_LINK_ID_type: typeof links[0].properties?.LINK_ID
      });
    } else {
      console.warn('[App/useGeoJsonState] handleGeoJsonLoaded: 링크 배열이 비어있습니다!');
    }
    
    setGeoJsonNodes(nodes);
    setGeoJsonLinks(links);
    setIsGeoJsonLoaded(true);
    
    setTimeout(() => {
      console.log('[App/useGeoJsonState] 상태 업데이트 후 geoJsonLinks 길이:', links.length);
    }, 0);
  }, []);

  // 장소-GeoJSON 노드 매핑 품질 검사
  const checkGeoJsonMapping = useCallback((places: Place[]) => {
    if (!isGeoJsonLoaded || places.length === 0) {
      return {
        totalPlaces: places.length,
        mappedPlaces: 0,
        mappingRate: '0%',
        averageDistance: 'N/A',
        success: false,
        message: 'GeoJSON 데이터가 로드되지 않았거나 장소가 없습니다.'
      };
    }
    
    const totalPlaces = places.length;
    const placesWithGeoNodeId = places.filter(p => p.geoNodeId);
    const mappedPlaces = placesWithGeoNodeId.length;
    const mappingRate = totalPlaces > 0 ? ((mappedPlaces / totalPlaces) * 100).toFixed(1) : '0.0';
    
    // 평균 거리 계산
    const distanceSum = placesWithGeoNodeId.reduce((sum, place) => {
      return sum + (place.geoNodeDistance || 0);
    }, 0);
    
    const averageDistanceFloat = mappedPlaces > 0 ? (distanceSum / mappedPlaces) : 0;
    const averageDistance = mappedPlaces > 0 ? averageDistanceFloat.toFixed(1) : 'N/A';
    
    // 매핑 성공 여부 판단 (50% 이상이고 평균 거리 100m 이내)
    const success = 
      (mappedPlaces / totalPlaces >= 0.5 || totalPlaces === 0) && 
      (averageDistance === 'N/A' || averageDistanceFloat < 100);
    
    return {
      totalPlaces,
      mappedPlaces,
      mappingRate: `${mappingRate}%`,
      averageDistance: averageDistance === 'N/A' ? averageDistance : parseFloat(averageDistance),
      success,
      message: success ? 
        `매핑 성공: ${mappedPlaces}/${totalPlaces} 장소 매핑됨 (${mappingRate}%), 평균 거리: ${averageDistance}m` :
        `매핑 부족: ${mappedPlaces}/${totalPlaces} 장소만 매핑됨 (${mappingRate}%), 평균 거리: ${averageDistance}m`
    };
  }, [isGeoJsonLoaded]);

  return {
    showGeoJson,
    isGeoJsonLoaded,
    geoJsonNodes,
    geoJsonLinks,
    toggleGeoJsonVisibility,
    handleGeoJsonLoaded,
    checkGeoJsonMapping
  };
};
