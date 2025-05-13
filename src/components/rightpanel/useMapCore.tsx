import { useRef, useState, useCallback, useEffect } from 'react';
import { useMapResize } from '@/hooks/useMapResize';
import { useMapInitialization } from '@/hooks/map/useMapInitialization';
import { useMapMarkers } from '@/hooks/map/useMapMarkers';
import { useMapRouting } from '@/hooks/map/useMapRouting';
import { useMapNavigation } from '@/hooks/map/useMapNavigation';
import { useMapItineraryRouting } from '@/hooks/map/useMapItineraryRouting';
import { ItineraryDay } from '@/types/supabase';
import { toast } from 'sonner';
import { mapPlacesToNodes, findPathBetweenNodes, getLinksForPath, createPathStyle } from '@/utils/map/geoJsonMapper';

export const useMapCore = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [showGeoJson, setShowGeoJson] = useState<boolean>(false);
  const [isGeoJsonLoaded, setIsGeoJsonLoaded] = useState<boolean>(false);
  const geoJsonNodes = useRef<any[]>([]);
  const geoJsonLinks = useRef<any[]>([]);
  const geoJsonRetryCount = useRef<number>(0);
  const highlightedFeatures = useRef<any[]>([]);  // 하이라이트된 경로 추적용
  
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
      
      // GeoJSON 데이터가 로드되면 자동으로 표시
      setShowGeoJson(true);
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

  // 기존 하이라이트 경로 제거
  const clearPreviousHighlightedPath = useCallback(() => {
    if (highlightedFeatures.current.length > 0) {
      console.log(`${highlightedFeatures.current.length}개의 하이라이트된 경로 제거`);
      highlightedFeatures.current.forEach(feature => {
        if (feature && typeof feature.setMap === 'function') {
          feature.setMap(null);
        }
      });
      highlightedFeatures.current = [];
    }
  }, []);

  // 특정 장소 간의 경로만 하이라이트하는 기능 개선
  const highlightSegment = useCallback((fromIndex: number, toIndex: number, itineraryDay?: ItineraryDay) => {
    if (!map || !isGeoJsonLoaded) {
      console.warn(`지도나 GeoJSON이 준비되지 않았습니다. 지도: ${!!map}, GeoJSON: ${isGeoJsonLoaded}`);
      return;
    }
    
    try {
      // 기존 하이라이트 경로 제거
      clearPreviousHighlightedPath();
      
      // 현재 일정이 있으면 해당 장소들 사이의 경로만 하이라이트
      if (itineraryDay && itineraryDay.places) {
        const places = mapPlacesToNodes(itineraryDay.places);
        
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
              
              // 경로를 지도에 시각화 - 네이버 지도 API 활용
              if (window.naver && window.naver.maps && window.naver.maps.Polyline) {
                pathLinks.forEach(link => {
                  try {
                    if (link.geometry && link.geometry.coordinates) {
                      // 링크의 좌표를 네이버 지도 LatLng 객체로 변환
                      const pathCoords = link.geometry.coordinates.map((coord: number[]) => 
                        new window.naver.maps.LatLng(coord[1], coord[0])
                      );
                      
                      // 폴리라인 생성 및 지도에 표시
                      const polyline = new window.naver.maps.Polyline({
                        map: map,
                        path: pathCoords,
                        strokeColor: '#FF3B30', // 붉은색 강조
                        strokeWeight: 5,
                        strokeOpacity: 0.8,
                        strokeLineCap: 'round',
                        strokeLineJoin: 'round',
                        zIndex: 100 // 기존 경로보다 상위에 표시
                      });
                      
                      highlightedFeatures.current.push(polyline);
                    }
                  } catch (err) {
                    console.error("링크 폴리라인 생성 오류:", err);
                  }
                });
                
                // 성공 메시지
                toast.success(`경로가 지도에 표시되었습니다`);
                
                // 경로를 포함하도록 지도 뷰 조정
                try {
                  const bounds = new window.naver.maps.LatLngBounds(
                    new window.naver.maps.LatLng(fromPlace.y, fromPlace.x),
                    new window.naver.maps.LatLng(toPlace.y, toPlace.x)
                  );
                  map.fitBounds(bounds, { top: 100, right: 100, bottom: 100, left: 100 });
                } catch (e) {
                  console.error("지도 뷰 조정 오류:", e);
                }
              } else {
                console.error("네이버 지도 폴리라인 API를 사용할 수 없습니다.");
              }
            } else {
              console.warn(`경로를 구성하는 링크를 찾을 수 없습니다.`);
              toast.warning("경로를 표시할 수 없습니다");
            }
          } else {
            console.log(`장소의 GeoJSON 노드 ID가 없습니다: ${fromPlace.name}(${fromPlace.geoNodeId}), ${toPlace.name}(${toPlace.geoNodeId})`);
            toast.warning("장소와 도로 네트워크의 매핑 정보가 없습니다");
          }
        }
      }
    } catch (error) {
      console.error("경로 하이라이트 오류:", error);
      toast.error("경로 표시 중 오류가 발생했습니다");
    }
  }, [map, isGeoJsonLoaded, mapPlacesToNodes, clearPreviousHighlightedPath]);
  
  // Special route visualization for a specific place (fixed toast.warn issue)
  const showRouteForPlaceIndex = useCallback((placeIndex: number, itineraryDay: ItineraryDay) => {
    if (!map || !isGeoJsonLoaded || !itineraryDay) {
      console.warn("지도나 GeoJSON이 로드되지 않았거나 일정이 없습니다");
      return;
    }
    
    try {
      // 기존 하이라이트 경로 제거
      clearPreviousHighlightedPath();
      
      const places = mapPlacesWithGeoNodes(itineraryDay.places);
      
      // 유효한 인덱스인지 확인
      if (placeIndex < 0 || placeIndex >= places.length) {
        console.warn("유효하지 않은 장소 인덱스:", placeIndex);
        return;
      }
      
      // 숙소가 첫 번째 장소라고 가정 (인덱스 0)
      const accommodation = places[0]; 
      const selectedPlace = places[placeIndex];
      
      console.log(`숙소 ${accommodation.name}에서 ${selectedPlace.name}까지의 경로 시각화`);
      
      // 숙소부터 선택한 장소까지 경로 하이라이트
      highlightSegment(0, placeIndex, itineraryDay);
      
      // 선택한 장소로 지도 중심 이동
      panTo({ lat: selectedPlace.y, lng: selectedPlace.x });
      
    } catch (error) {
      console.error("경로 시각화 오류:", error);
      toast.error("경로 시각화 중 오류가 발생했습니다");
    }
  }, [map, isGeoJsonLoaded, mapPlacesWithGeoNodes, panTo, highlightSegment, clearPreviousHighlightedPath]);

  // 경로를 시각화하는 내부 함수 (구현해야 함)
  const visualizePathLinks = (pathLinks: any[]) => {
    // 구현 필요: GeoJSON 링크를 지도에 시각적으로 강조
    console.log(`${pathLinks.length}개 링크를 시각화해야 합니다`);
    
    // 현재는 GeoJSON 전체를 보여주는 것으로 대체
    setShowGeoJson(true);
  };

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
    clearPreviousHighlightedPath,
    handleGeoJsonLoaded,
    isGeoJsonLoaded,
    checkGeoJsonMapping,
    mapPlacesWithGeoNodes,
    showRouteForPlaceIndex
  };
};

export default useMapCore;
