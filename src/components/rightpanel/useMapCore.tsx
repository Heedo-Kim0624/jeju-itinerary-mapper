import { useRef, useState, useCallback, useEffect } from 'react';
import { useMapResize } from '@/hooks/useMapResize';
import { useMapInitialization } from '@/hooks/map/useMapInitialization';
import { useMapMarkers } from '@/hooks/map/useMapMarkers';
import { useMapRouting } from '@/hooks/map/useMapRouting';
import { useMapNavigation } from '@/hooks/map/useMapNavigation';
import { useMapItineraryRouting } from '@/hooks/map/useMapItineraryRouting';
import { ItineraryDay } from '@/types/supabase';
import { toast } from 'sonner';
import { mapPlacesToNodes, findPathBetweenNodes, getLinksForPath } from '@/utils/map/geoJsonMapper';

export const useMapCore = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [showGeoJson, setShowGeoJson] = useState<boolean>(false);
  const [isGeoJsonLoaded, setIsGeoJsonLoaded] = useState<boolean>(false);
  const geoJsonNodes = useRef<any[]>([]);
  const geoJsonLinks = useRef<any[]>([]);
  const geoJsonRetryCount = useRef<number>(0);
  
  const {
    map,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
    isGeoJsonInitialized
  } = useMapInitialization(mapContainer);

  const { addMarkers, clearMarkersAndUiElements } = useMapMarkers(map);
  const { calculateRoutes } = useMapRouting(map);
  const { panTo } = useMapNavigation(map);
  const { renderDayRoute, clearAllRoutes } = useMapItineraryRouting(map);

  useMapResize(map);
  
  // GeoJSON 초기화 상태 모니터링
  useEffect(() => {
    if (isGeoJsonInitialized) {
      console.log("✅ GeoJSON API가 초기화되었습니다.");
    }
  }, [isGeoJsonInitialized]);

  const toggleGeoJsonVisibility = useCallback(() => {
    // GeoJSON이 로드되지 않았다면 메시지 표시
    if (!isGeoJsonLoaded && !showGeoJson) {
      toast.info("경로 데이터를 로드하고 있습니다. 잠시 기다려주세요.");
    }
    setShowGeoJson(prev => !prev);
  }, [isGeoJsonLoaded, showGeoJson]);

  // GeoJSON 데이터가 로드되면 호출되는 콜백 함수
  const handleGeoJsonLoaded = useCallback((nodes: any[], links: any[]) => {
    if (nodes.length > 0 || links.length > 0) {
      geoJsonNodes.current = nodes;
      geoJsonLinks.current = links;
      setIsGeoJsonLoaded(true);
      console.log("GeoJSON 데이터가 메모리에 로드되었습니다.", {
        노드수: nodes.length,
        링크수: links.length,
        첫번째노드: nodes.length > 0 ? nodes[0].properties : '없음',
        첫번째링크: links.length > 0 ? links[0].properties : '없음'
      });
      toast.success("경로 데이터가 로드되었습니다");
    } else {
      console.warn("빈 GeoJSON 데이터가 로드되었습니다");
      // 최대 3번까지 재시도
      if (geoJsonRetryCount.current < 3) {
        geoJsonRetryCount.current += 1;
        console.log(`GeoJSON 데이터 로드 재시도 (${geoJsonRetryCount.current}/3)...`);
      } else {
        toast.error("경로 데이터 로드에 실패했습니다");
      }
    }
  }, []);

  // 장소와 GeoJSON 노드 매핑
  const mapPlacesWithGeoNodes = useCallback((places) => {
    if (!isGeoJsonLoaded || !geoJsonNodes.current.length) {
      console.log("GeoJSON이 로드되지 않아 매핑을 진행할 수 없습니다");
      return places;
    }
    
    return mapPlacesToNodes(places, geoJsonNodes.current);
  }, [isGeoJsonLoaded]);

  // 일정 경로 렌더링을 위한 함수
  const renderItineraryRoute = useCallback((itineraryDay: ItineraryDay | null) => {
    if (itineraryDay) {
      // GeoJSON 노드로 매핑된 장소로 경로 렌더링
      const mappedPlaces = mapPlacesWithGeoNodes(itineraryDay.places);
      renderDayRoute(itineraryDay, mappedPlaces);
      
      // 노드 ID 로그 (디버깅용)
      const nodeIds = mappedPlaces
        .map(place => place.geoNodeId)
        .filter(id => id !== null);
      
      console.log(`일정 ${itineraryDay.day}일차 경로에 매핑된 노드 ID:`, nodeIds);
    } else {
      clearAllRoutes();
    }
  }, [renderDayRoute, clearAllRoutes, mapPlacesWithGeoNodes]);

  // 특정 장소 간의 경로만 하이라이트하는 기능
  const highlightSegment = useCallback((fromIndex: number, toIndex: number, itineraryDay?: ItineraryDay) => {
    if (!map || !isGeoJsonLoaded) {
      console.warn(`지도나 GeoJSON이 준비되지 않았습니다. 지도: ${!!map}, GeoJSON: ${isGeoJsonLoaded}`);
      return;
    }
    
    try {
      // 현재 일정이 있으면 해당 장소들 사이의 경로만 하이라이트
      if (itineraryDay && itineraryDay.places) {
        const places = mapPlacesWithGeoNodes(itineraryDay.places);
        
        if (fromIndex >= 0 && fromIndex < places.length && 
            toIndex >= 0 && toIndex < places.length) {
          
          const fromPlace = places[fromIndex];
          const toPlace = places[toIndex];
          
          console.log(`${fromPlace.name}에서 ${toPlace.name}까지의 경로 하이라이트`);
          
          // GeoJSON 노드를 통한 경로 강조
          if (fromPlace.geoNodeId && toPlace.geoNodeId) {
            // 경로 찾기
            const path = findPathBetweenNodes(
              fromPlace.geoNodeId, 
              toPlace.geoNodeId, 
              geoJsonNodes.current, 
              geoJsonLinks.current
            );
            
            // 경로 시각화 (실제 구현은 더 복잡할 수 있음)
            console.log(`경로 시각화: ${path.join(' -> ')}`);
            
            // 경로상의 링크 찾기
            const pathLinks = getLinksForPath(path, geoJsonLinks.current);
            
            // 하이라이트할 링크가 있으면 시각화
            if (pathLinks.length > 0) {
              console.log(`${pathLinks.length}개 링크로 경로 시각화`);
            } else {
              console.warn(`경로를 구성하는 링크를 찾을 수 없습니다.`);
            }
          } else {
            console.log(`장소의 GeoJSON 노드 ID가 없습니다: ${fromPlace.name}(${fromPlace.geoNodeId}), ${toPlace.name}(${toPlace.geoNodeId})`);
          }
        }
      }
    } catch (error) {
      console.error("경로 하이라이트 오류:", error);
    }
  }, [map, isGeoJsonLoaded, mapPlacesWithGeoNodes]);

  // 디버그용: GeoJSON 매칭 상태 검사
  const checkGeoJsonMapping = useCallback((places) => {
    if (!isGeoJsonLoaded) {
      return {
        totalPlaces: places.length,
        mappedPlaces: 0,
        mappingRate: '0%',
        averageDistance: 0,
        success: false,
        message: 'GeoJSON 데이터가 로드되지 않았습니다.'
      };
    }
    
    const mappedPlaces = mapPlacesWithGeoNodes(places);
    const placesWithNodes = mappedPlaces.filter(p => p.geoNodeId);
    const mappingRate = (placesWithNodes.length / places.length) * 100;
    
    // 평균 거리 계산 (노드가 있는 장소만)
    let totalDistance = 0;
    placesWithNodes.forEach(place => {
      if (place.geoNodeDistance) totalDistance += place.geoNodeDistance;
    });
    
    const averageDistance = placesWithNodes.length > 0 
      ? totalDistance / placesWithNodes.length 
      : 0;
    
    return {
      totalPlaces: places.length,
      mappedPlaces: placesWithNodes.length,
      mappingRate: `${mappingRate.toFixed(1)}%`,
      averageDistance: averageDistance.toFixed(2),
      success: mappingRate > 80,
      message: mappingRate > 80 
        ? '장소와 GeoJSON 노드가 성공적으로 매핑되었습니다.' 
        : '장소와 GeoJSON 노드 매핑이 부분적으로만 성공했습니다.'
    };
  }, [isGeoJsonLoaded, mapPlacesWithGeoNodes]);

  return {
    mapContainer,
    map,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
    addMarkers,
    calculateRoutes,
    clearMarkersAndUiElements,
    showGeoJson,
    toggleGeoJsonVisibility,
    panTo,
    renderItineraryRoute,
    clearAllRoutes,
    highlightSegment,
    handleGeoJsonLoaded,
    isGeoJsonLoaded,
    checkGeoJsonMapping,
    mapPlacesWithGeoNodes
  };
};

export default useMapCore;
