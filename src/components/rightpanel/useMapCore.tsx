
import { useEffect, useRef, useState, useCallback } from 'react';
import { Place, ItineraryDay } from '@/types/supabase';
import { useMapInitialization } from '@/hooks/map/useMapInitialization';
import { useMapNavigation } from '@/hooks/map/useMapNavigation';
import { useMapMarkers } from '@/hooks/map/useMapMarkers';
import { useMapItineraryRouting } from '@/hooks/map/useMapItineraryRouting';
import { toast } from 'sonner';

// Custom hook that provides core map functionality and state
const useMapCore = () => {
  // 지도 초기화 및 상태 관리
  const { 
    map, 
    mapContainer, 
    isMapInitialized, 
    isNaverLoaded,
    isMapError,
    isGeoJsonInitialized
  } = useMapInitialization();
  
  // 지도 마커 관리
  const { 
    addMarkers, 
    clearMarkersAndUiElements,
    calculateRoutes
  } = useMapMarkers(map);
  
  // 지도 네비게이션 기능
  const { 
    panTo 
  } = useMapNavigation(map);
  
  // 일정 경로 라우팅 기능
  const {
    renderDayRoute,
    renderMultiDayRoutes, 
    clearAllRoutes,
    highlightSegment,
    lastRenderedDay
  } = useMapItineraryRouting(map);

  // GeoJSON 관련 상태
  const [showGeoJson, setShowGeoJson] = useState(false);
  const [isGeoJsonLoaded, setIsGeoJsonLoaded] = useState(false);
  const [geoJsonNodes, setGeoJsonNodes] = useState<any[]>([]);
  const [geoJsonLinks, setGeoJsonLinks] = useState<any[]>([]);
  const highlightedPathRef = useRef<any[]>([]);
  const geoJsonLayerRef = useRef<any>(null);

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
    
    setGeoJsonNodes(nodes);
    setGeoJsonLinks(links);
    setIsGeoJsonLoaded(true);
    
    // GeoJSON Layer에 접근할 수 있는 ref 저장
    if (window.geoJsonLayer && typeof window.geoJsonLayer.renderRoute === 'function') {
      geoJsonLayerRef.current = window.geoJsonLayer;
    }
  }, []);

  // 일정 경로 렌더링 함수
  const renderItineraryRoute = useCallback((itineraryDay: ItineraryDay | null) => {
    if (!map || !itineraryDay || itineraryDay.places.length < 2) {
      return;
    }
    
    // 기존 경로 삭제
    clearAllRoutes();
    
    // GeoJSON 기반 라우팅인지 확인
    if (isGeoJsonLoaded && itineraryDay.routeData && 
        (itineraryDay.routeData.nodeIds?.length > 0 || itineraryDay.routeData.linkIds?.length > 0)) {
      console.log('GeoJSON 기반 경로 렌더링:', {
        일자: itineraryDay.day,
        노드수: itineraryDay.routeData.nodeIds?.length || 0,
        링크수: itineraryDay.routeData.linkIds?.length || 0
      });
      
      // GeoJSON 기반 경로 렌더링
      renderGeoJsonRoute(
        itineraryDay.routeData.nodeIds || [], 
        itineraryDay.routeData.linkIds || [],
        {
          strokeColor: '#3366FF',
          strokeWeight: 5,
          strokeOpacity: 0.8
        }
      );
      
      return;
    }
    
    // 기존 방식으로 경로 렌더링 (폴백)
    renderDayRoute(itineraryDay);
  }, [map, isGeoJsonLoaded, renderDayRoute, clearAllRoutes]);

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
    const mappingRate = ((mappedPlaces / totalPlaces) * 100).toFixed(1);
    
    // 평균 거리 계산
    const distanceSum = placesWithGeoNodeId.reduce((sum, place) => {
      return sum + (place.geoNodeDistance || 0);
    }, 0);
    
    const averageDistance = mappedPlaces > 0 ? 
      (distanceSum / mappedPlaces).toFixed(1) : 
      'N/A';
    
    // 매핑 성공 여부 판단 (50% 이상이고 평균 거리 100m 이내)
    const success = 
      mappedPlaces / totalPlaces >= 0.5 && 
      (averageDistance === 'N/A' || parseFloat(averageDistance) < 100);
    
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

  // 장소에 가장 가까운 GeoJSON 노드 찾기
  const mapPlacesWithGeoNodes = useCallback((places: Place[]): Place[] => {
    if (!isGeoJsonLoaded || places.length === 0 || geoJsonNodes.length === 0) {
      return places;
    }
    
    // 각 장소에 geoNodeId와 geoNodeDistance 속성 추가
    return places.map(place => {
      // 이미 매핑된 장소는 그대로 반환
      if (place.geoNodeId) {
        return place;
      }
      
      // 근접 노드 찾기
      const closestNode = findClosestNode(place);
      
      if (closestNode) {
        return {
          ...place,
          geoNodeId: closestNode.nodeId,
          geoNodeDistance: closestNode.distance
        };
      }
      
      return place;
    });
  }, [isGeoJsonLoaded, geoJsonNodes]);

  // 장소와 가장 가까운 노드 찾기 (내부 함수)
  const findClosestNode = (place: Place) => {
    if (!place.x || !place.y) return null;
    
    let closestNode = null;
    let minDistance = Infinity;
    
    // 모든 노드를 순회하며 가장 가까운 노드 찾기
    for (let i = 0; i < Math.min(geoJsonNodes.length, 1000); i++) {
      const node = geoJsonNodes[i];
      if (!node) continue;
      
      try {
        // 노드의 위치 정보 추출
        const geometry = node.getGeometryAt(0);
        if (!geometry) continue;
        
        const coordinates = geometry.getCoordinates();
        if (!coordinates) continue;
        
        // 거리 계산
        const distance = calculateDistance(
          place.y, place.x,
          coordinates.y, coordinates.x
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestNode = {
            nodeId: node.getId(),
            distance: distance
          };
        }
      } catch (error) {
        continue;
      }
    }
    
    return closestNode;
  };

  // 두 지점 사이의 거리 계산 (미터 단위)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // 지구 반경 (미터)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // 이전 하이라이트된 경로 제거
  const clearPreviousHighlightedPath = () => {
    if (highlightedPathRef.current && highlightedPathRef.current.length > 0) {
      highlightedPathRef.current.forEach(feature => {
        if (feature && typeof feature.setMap === 'function') {
          feature.setMap(null);
        }
      });
      highlightedPathRef.current = [];
    }
  };

  // 특정 장소 인덱스의 경로 하이라이트
  const showRouteForPlaceIndex = (placeIndex: number, itineraryDay: ItineraryDay) => {
    if (!map || !itineraryDay || !itineraryDay.places) return;
    
    // 인덱스 유효성 검사
    if (placeIndex <= 0 || placeIndex >= itineraryDay.places.length) {
      console.log('유효하지 않은 장소 인덱스:', placeIndex);
      return;
    }
    
    const fromIndex = placeIndex - 1;
    const toIndex = placeIndex;
    
    // GeoJSON 기반 경로 하이라이트
    if (isGeoJsonLoaded && itineraryDay.routeData && 
        itineraryDay.routeData.segmentRoutes && 
        itineraryDay.routeData.segmentRoutes[fromIndex]) {
          
      const segment = itineraryDay.routeData.segmentRoutes[fromIndex];
      if (segment.nodeIds && segment.linkIds) {
        clearPreviousHighlightedPath();
        
        console.log(`${fromIndex + 1}에서 ${toIndex + 1}까지의 경로 하이라이트:`, {
          노드수: segment.nodeIds.length,
          링크수: segment.linkIds.length
        });
        
        const renderedFeatures = renderGeoJsonRoute(
          segment.nodeIds,
          segment.linkIds,
          {
            strokeColor: '#FF3B30',
            strokeWeight: 6,
            strokeOpacity: 0.9,
            zIndex: 200
          }
        );
        
        highlightedPathRef.current = renderedFeatures;
        
        // 3초 후 하이라이트 제거
        setTimeout(() => {
          clearPreviousHighlightedPath();
        }, 3000);
        
        return;
      }
    }
    
    // 기존 방식으로 경로 하이라이트 (폴백)
    highlightSegment(fromIndex, toIndex, itineraryDay);
  };

  // GeoJSON 노드와 링크를 사용하여 경로 렌더링
  const renderGeoJsonRoute = (nodeIds: string[], linkIds: string[], style: any = {}): any[] => {
    if (!map || !isGeoJsonLoaded || (!nodeIds.length && !linkIds.length)) {
      return [];
    }

    if (typeof window !== 'undefined' && window.geoJsonLayer && typeof window.geoJsonLayer.renderRoute === 'function') {
      // 외부 GeoJsonLayer 컴포넌트의 렌더 함수 사용
      return window.geoJsonLayer.renderRoute(nodeIds, linkIds, style);
    }
    
    // geoJsonLayerRef를 통한 렌더링 시도
    if (geoJsonLayerRef.current && typeof geoJsonLayerRef.current.renderRoute === 'function') {
      return geoJsonLayerRef.current.renderRoute(nodeIds, linkIds, style);
    }
    
    console.warn('GeoJSON 렌더링 레이어를 찾을 수 없습니다.');
    return [];
  };

  return {
    map,
    mapContainer,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
    addMarkers,
    calculateRoutes,
    clearMarkersAndUiElements,
    panTo,
    showGeoJson,
    toggleGeoJsonVisibility,
    renderItineraryRoute,
    clearAllRoutes,
    handleGeoJsonLoaded,
    highlightSegment,
    clearPreviousHighlightedPath,
    isGeoJsonLoaded,
    checkGeoJsonMapping,
    mapPlacesWithGeoNodes,
    showRouteForPlaceIndex,
    renderGeoJsonRoute,
    geoJsonNodes,
    geoJsonLinks
  };
};

export default useMapCore;
