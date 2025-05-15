import { useEffect, useRef, useState, useCallback } from 'react';
import { Place, ItineraryDay } from '@/types/supabase';
import { useMapInitialization } from '@/hooks/map/useMapInitialization';
import { useMapNavigation } from '@/hooks/map/useMapNavigation';
import { useMapMarkers } from '@/hooks/map/useMapMarkers';
import { useMapItineraryRouting } from '@/hooks/map/useMapItineraryRouting';
import { toast } from 'sonner';
import { ServerRouteResponse, ExtractedRouteData } from '@/types/schedule';

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
  
  // 서버 응답 경로 데이터 저장
  const [serverRoutesData, setServerRoutesData] = useState<Record<number, ServerRouteResponse>>({});

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
    if (typeof window !== 'undefined' && window.geoJsonLayer && typeof window.geoJsonLayer.renderRoute === 'function') {
      geoJsonLayerRef.current = window.geoJsonLayer;
    }
  }, []);

  // 서버에서 받은 경로 데이터 저장
  const setServerRoutes = useCallback((dayRoutes: Record<number, ServerRouteResponse>) => {
    setServerRoutesData(dayRoutes);
    console.log('서버 경로 데이터 설정:', dayRoutes);
    
    // 경로 데이터를 받으면 GeoJSON 표시 활성화
    if (!showGeoJson && Object.keys(dayRoutes).length > 0) {
      setShowGeoJson(true);
    }
  }, [showGeoJson]);

  // 노드 ID로부터 링크 ID 추출 (서버 응답 형식에 따라 조정 필요)
  const extractNodeAndLinkIds = useCallback((response: ServerRouteResponse): ExtractedRouteData => {
    // 서버가 이미 linkIds를 제공하는 경우
    if (response.linkIds && response.linkIds.length > 0) {
      return {
        nodeIds: response.nodeIds.map(id => id.toString()),
        linkIds: response.linkIds.map(id => id.toString())
      };
    }
    
    // linkIds가 없는 경우, nodeIds에서 추출 시도
    // 여기서는 임의로 처리하지만, 실제로는 서버 응답 형식에 맞게 조정해야 함
    const nodeIds = response.nodeIds.map(id => id.toString());
    return {
      nodeIds,
      linkIds: [] // 서버 응답 형식에 따라 구현 필요
    };
  }, []);

  // 일정 경로 렌더링 함수 - 서버 데이터 활용
  const renderItineraryRoute = useCallback((itineraryDay: ItineraryDay | null) => {
    if (!map || !itineraryDay) {
      return;
    }
    
    // 기존 경로 삭제
    clearAllRoutes();
    
    // 서버 경로 데이터 확인
    const serverRouteData = serverRoutesData[itineraryDay.day];
    
    // GeoJSON 기반 라우팅인지 확인
    if (isGeoJsonLoaded && serverRouteData) {
      console.log('서버 기반 GeoJSON 경로 렌더링 시도:', {
        일자: itineraryDay.day,
        데이터: serverRouteData
      });
      
      // 노드 ID와 링크 ID 추출
      const { nodeIds, linkIds } = extractNodeAndLinkIds(serverRouteData);
      
      // Log nodeIds/linkIds passed to visualization
      console.log("🗺️ 시각화 대상 노드/링크 ID (useMapCore):", { nodeIds, linkIds });

      // GeoJSON 기반 경로 렌더링
      renderGeoJsonRoute(
        nodeIds, 
        linkIds,
        {
          strokeColor: '#3366FF',
          strokeWeight: 5,
          strokeOpacity: 0.8
        }
      );
      
      return;
    }
    
    // 기존 방식으로 경로 렌더링 (폴백)
    // GeoJSON이 로드되지 않았거나 서버 데이터가 없는 경우
    renderDayRoute(itineraryDay);
  }, [map, isGeoJsonLoaded, renderDayRoute, clearAllRoutes, serverRoutesData, extractNodeAndLinkIds]);

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
    
    // 서버 경로 데이터 확인
    const serverRouteData = serverRoutesData[itineraryDay.day];
    
    // GeoJSON 기반 경로 하이라이트
    if (isGeoJsonLoaded && serverRouteData) {
      // 구현 필요: 서버 데이터에서 특정 구간에 해당하는 노드/링크 추출
      
      // 임시 구현: 전체 경로를 하이라이트
      const { nodeIds, linkIds } = extractNodeAndLinkIds(serverRouteData);
      
      // 기존 하이라이트 제거
      clearPreviousHighlightedPath();
      
      console.log(`${fromIndex + 1}에서 ${toIndex + 1}까지의 경로 하이라이트`);
      
      // 전체 경로 하이라이트
      const renderedFeatures = renderGeoJsonRoute(
        nodeIds,
        linkIds,
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
    
    // 기존 방식으로 경로 하이라이트 (폴백)
    highlightSegment(fromIndex, toIndex, itineraryDay);
  };

  // GeoJSON 노드와 링크를 사용하여 경로 렌더링
  const renderGeoJsonRoute = (nodeIds: string[], linkIds: string[], style: any = {}): any[] => {
    if (!map || !isGeoJsonLoaded || (!nodeIds.length && !linkIds.length)) {
      return [];
    }

    if (typeof window !== 'undefined' && window.geoJsonLayer && typeof window.geoJsonLayer.renderRoute === 'function') {
      return window.geoJsonLayer.renderRoute(nodeIds, linkIds, style);
    }
    
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
    checkGeoJsonMapping, // Updated to return correct structure
    mapPlacesWithGeoNodes: (places: Place[]) => places, // Kept as is
    showRouteForPlaceIndex,
    renderGeoJsonRoute,
    geoJsonNodes,
    geoJsonLinks,
    setServerRoutes, // 서버 경로 데이터 설정 함수 추가
    serverRoutesData  // 서버 경로 데이터 상태 노출
  };
};

export default useMapCore;
