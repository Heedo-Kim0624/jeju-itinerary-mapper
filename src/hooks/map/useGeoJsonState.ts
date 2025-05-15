
import { useState, useCallback } from 'react';
import { Place } from '@/types/supabase';
import { toast } from 'sonner';
import { useGeoJsonManager } from './useGeoJsonManager';
import { useGeoJsonFeatures } from './useGeoJsonFeatures';
import { useGeoJsonInterface } from './useGeoJsonInterface';

/**
 * GeoJson 상태 관리 통합 훅
 */
export const useGeoJsonState = () => {
  // GeoJSON 가시성 상태
  const [showGeoJson, setShowGeoJson] = useState(false);
  
  // GeoJSON 데이터 관리
  const {
    isLoading,
    isLoaded: isGeoJsonLoaded,
    error,
    nodes: geoJsonNodes,
    links: geoJsonLinks,
    handleLoadSuccess,
    handleLoadError,
    getNodeById,
    getLinkById
  } = useGeoJsonManager();
  
  // GeoJSON 가시성 토글
  const toggleGeoJsonVisibility = useCallback(() => {
    setShowGeoJson(prev => !prev);
  }, []);

  // GeoJSON 데이터 로드 완료 핸들러
  const handleGeoJsonLoaded = useCallback((nodes: any[], links: any[]) => {
    console.log('GeoJSON 데이터 로드 완료:', { 
      노드수: nodes.length,
      링크수: links.length
    });
    
    handleLoadSuccess(nodes, links);
  }, [handleLoadSuccess]);

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
    checkGeoJsonMapping,
    getNodeById,
    getLinkById,
    isLoading,
    error,
    handleLoadError
  };
};
