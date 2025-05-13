
import { useRef, useState, useCallback, useEffect } from 'react';
import { useMapResize } from '@/hooks/useMapResize';
import { useMapInitialization } from '@/hooks/map/useMapInitialization';
import { useMapMarkers } from '@/hooks/map/useMapMarkers';
import { useMapRouting } from '@/hooks/map/useMapRouting';
import { useMapNavigation } from '@/hooks/map/useMapNavigation';
import { useMapItineraryRouting } from '@/hooks/map/useMapItineraryRouting';
import { ItineraryDay } from '@/types/supabase';
import { toast } from 'sonner';
import { 
  mapPlacesToNodes, 
  findPathBetweenNodes, 
  getLinksForPath, 
  createPathStyle,
  buildItineraryPath
} from '@/utils/map/geoJsonMapper';

export const useMapCore = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [showGeoJson, setShowGeoJson] = useState<boolean>(false);
  const [isGeoJsonLoaded, setIsGeoJsonLoaded] = useState<boolean>(false);
  const geoJsonNodes = useRef<any[]>([]);
  const geoJsonLinks = useRef<any[]>([]);
  const geoJsonRetryCount = useRef<number>(0);
  const highlightedFeatures = useRef<any[]>([]);  // 하이라이트된 경로 추적용
  const routeFeatures = useRef<any[]>([]); // 일정 경로 추적용
  
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

  // GeoJSON 표시 토글
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

  // 경로 시각화에 사용된 모든 요소 제거
  const clearRouteFeatures = useCallback(() => {
    if (routeFeatures.current.length > 0) {
      routeFeatures.current.forEach(feature => {
        if (feature && typeof feature.setMap === 'function') {
          feature.setMap(null);
        }
      });
      routeFeatures.current = [];
    }
  }, []);

  // 일정 경로 렌더링을 위한 핵심 함수
  const renderItineraryRoute = useCallback((itineraryDay: ItineraryDay | null) => {
    if (!map || !isGeoJsonLoaded) {
      console.warn("지도나 GeoJSON 데이터가 로드되지 않았습니다.");
      return;
    }

    // 이전 경로 제거
    clearRouteFeatures();
    
    if (!itineraryDay || itineraryDay.places.length < 2) {
      console.log("렌더링할 경로가 없습니다.");
      return;
    }

    try {
      // 장소에 GeoJSON 노드 매핑
      const mappedPlaces = mapPlacesWithGeoNodes(itineraryDay.places);
      
      // 노드 ID 확인
      const nodeIds = mappedPlaces
        .map(place => place.geoNodeId)
        .filter(id => id !== null);
      
      if (nodeIds.length < 2) {
        console.warn("경로 구성에 필요한 매핑된 장소가 부족합니다.");
        toast.warning("경로를 표시할 수 있는 장소가 부족합니다.");
        return;
      }
      
      console.log(`일정 ${itineraryDay.day}일차 경로 렌더링: ${nodeIds.length}개 노드 매핑됨`);
      
      // 장소 간 최적 경로 구성
      const { paths, allLinks } = buildItineraryPath(
        mappedPlaces, 
        geoJsonNodes.current, 
        geoJsonLinks.current
      );
      
      if (paths.length === 0 || allLinks.length === 0) {
        console.warn("경로를 구성할 수 없습니다.");
        toast.warning("경로를 생성할 수 없습니다. 장소가 도로에서 너무 멀리 떨어져 있을 수 있습니다.");
        return;
      }
      
      // 경로 시각화: 모든 링크를 폴리라인으로 변환하여 지도에 표시
      if (window.naver && window.naver.maps && window.naver.maps.Polyline) {
        allLinks.forEach(link => {
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
                strokeColor: '#4CD964', // 기본 경로 색상
                strokeWeight: 3,
                strokeOpacity: 0.7,
                strokeLineCap: 'round',
                strokeLineJoin: 'round'
              });
              
              // 경로 참조 저장
              routeFeatures.current.push(polyline);
            }
          } catch (err) {
            console.error("링크 폴리라인 생성 오류:", err);
          }
        });
        
        console.log(`경로 시각화 완료: ${routeFeatures.current.length}개 폴리라인 생성`);
        toast.success(`${itineraryDay.day}일차 경로가 지도에 표시되었습니다`);
        
        // 모든 장소가 보이도록 지도 뷰 조정
        try {
          const bounds = new window.naver.maps.LatLngBounds();
          mappedPlaces.forEach(place => {
            if (place.x && place.y) {
              bounds.extend(new window.naver.maps.LatLng(place.y, place.x));
            }
          });
          map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
        } catch (e) {
          console.error("지도 뷰 조정 오류:", e);
        }
      }
    } catch (error) {
      console.error("경로 렌더링 오류:", error);
      toast.error("경로 표시 중 오류가 발생했습니다.");
    }
  }, [map, isGeoJsonLoaded, mapPlacesWithGeoNodes, clearRouteFeatures]);

  // 이전에 하이라이트된 경로 제거
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

  // 특정 장소 간 경로 강조 - 주요 기능
  const highlightSegment = useCallback((fromIndex: number, toIndex: number, itineraryDay?: ItineraryDay) => {
    if (!map || !isGeoJsonLoaded) {
      console.warn(`지도나 GeoJSON이 준비되지 않았습니다. 지도: ${!!map}, GeoJSON: ${isGeoJsonLoaded}`);
      return;
    }
    
    try {
      // 기존 하이라이트 경로 제거
      clearPreviousHighlightedPath();
      
      // 일정이 없으면 리턴
      if (!itineraryDay || !itineraryDay.places) {
        console.warn("강조할 경로가 없습니다: 일정이나 장소 정보가 없습니다.");
        return;
      }
      
      // 인덱스 검증
      if (fromIndex < 0 || toIndex < 0 || 
          fromIndex >= itineraryDay.places.length || 
          toIndex >= itineraryDay.places.length) {
        console.warn("유효하지 않은 장소 인덱스입니다.");
        return;
      }
      
      // GeoJSON 노드에 매핑된 장소 배열
      const mappedPlaces = mapPlacesToNodes(itineraryDay.places, geoJsonNodes.current);
      
      // 선택한 두 장소
      const fromPlace = mappedPlaces[fromIndex];
      const toPlace = mappedPlaces[toIndex];
      
      console.log(`${fromPlace.name}에서 ${toPlace.name}까지의 경로 하이라이트`);
      
      // 두 장소에 GeoJSON 노드 ID가 있는 경우 경로 강조
      if (fromPlace.geoNodeId && toPlace.geoNodeId) {
        // 두 장소 간 경로 찾기
        const path = findPathBetweenNodes(
          fromPlace.geoNodeId, 
          toPlace.geoNodeId, 
          geoJsonNodes.current, 
          geoJsonLinks.current
        );
        
        // 경로에 해당하는 링크 찾기
        const pathLinks = getLinksForPath(path, geoJsonLinks.current);
        
        // 링크가 있으면 강조 표시
        if (pathLinks.length > 0) {
          console.log(`${pathLinks.length}개 링크로 경로 강조 표시`);
          
          // 링크를 폴리라인으로 변환하여 강조 표시
          if (window.naver && window.naver.maps && window.naver.maps.Polyline) {
            pathLinks.forEach(link => {
              try {
                if (link.geometry && link.geometry.coordinates) {
                  // 링크 좌표를 LatLng 객체로 변환
                  const pathCoords = link.geometry.coordinates.map((coord: number[]) => 
                    new window.naver.maps.LatLng(coord[1], coord[0])
                  );
                  
                  // 강조 폴리라인 생성
                  const polyline = new window.naver.maps.Polyline({
                    map: map,
                    path: pathCoords,
                    strokeColor: '#FF3B30', // 빨간색으로 강조
                    strokeWeight: 5,        // 더 굵게
                    strokeOpacity: 0.9,     // 더 선명하게
                    strokeLineCap: 'round',
                    strokeLineJoin: 'round',
                    zIndex: 100            // 기존 경로보다 위에 표시
                  });
                  
                  // 강조된 경로 참조 저장
                  highlightedFeatures.current.push(polyline);
                }
              } catch (err) {
                console.error("강조 폴리라인 생성 오류:", err);
              }
            });
            
            // 성공 메시지
            toast.success(`${fromPlace.name}에서 ${toPlace.name}까지의 경로가 표시되었습니다`);
            
            // 강조된 경로가 보이도록 지도 뷰 조정
            try {
              const bounds = new window.naver.maps.LatLngBounds(
                new window.naver.maps.LatLng(fromPlace.y, fromPlace.x),
                new window.naver.maps.LatLng(toPlace.y, toPlace.x)
              );
              map.fitBounds(bounds, { top: 100, right: 100, bottom: 100, left: 100 });
            } catch (e) {
              console.error("지도 뷰 조정 오류:", e);
            }
          }
        } else {
          console.warn(`경로를 구성하는 링크를 찾을 수 없습니다.`);
          toast.warning("경로를 표시할 수 없습니다");
        }
      } else {
        console.log(`장소의 GeoJSON 노드 ID가 없습니다: ${fromPlace.name}(${fromPlace.geoNodeId}), ${toPlace.name}(${toPlace.geoNodeId})`);
        toast.warning("장소와 도로 네트워크의 매핑 정보가 없습니다");
      }
    } catch (error) {
      console.error("경로 하이라이트 오류:", error);
      toast.error("경로 표시 중 오류가 발생했습니다");
    }
  }, [map, isGeoJsonLoaded, mapPlacesToNodes, clearPreviousHighlightedPath]);
  
  // 특정 장소에서 시작하는 경로 시각화
  const showRouteForPlaceIndex = useCallback((placeIndex: number, itineraryDay: ItineraryDay) => {
    if (!map || !isGeoJsonLoaded || !itineraryDay) {
      console.warn("지도나 GeoJSON이 로드되지 않았거나 일정이 없습니다");
      return;
    }
    
    try {
      // 기존 하이라이트 제거
      clearPreviousHighlightedPath();
      
      const mappedPlaces = mapPlacesWithGeoNodes(itineraryDay.places);
      
      // 유효한 인덱스 확인
      if (placeIndex < 0 || placeIndex >= mappedPlaces.length) {
        console.warn("유효하지 않은 장소 인덱스:", placeIndex);
        return;
      }
      
      // 현재 장소와 다음 장소가 있으면 경로 하이라이트
      if (placeIndex + 1 < mappedPlaces.length) {
        // 현재 장소에서 다음 장소까지 경로 강조
        highlightSegment(placeIndex, placeIndex + 1, itineraryDay);
      } else {
        // 마지막 장소인 경우
        toast.info("마지막 장소입니다. 다음 장소가 없습니다.");
      }
      
      // 선택한 장소로 지도 중심 이동
      const selectedPlace = mappedPlaces[placeIndex];
      if (selectedPlace && selectedPlace.x && selectedPlace.y) {
        panTo({ lat: selectedPlace.y, lng: selectedPlace.x });
      }
    } catch (error) {
      console.error("경로 시각화 오류:", error);
      toast.error("경로 시각화 중 오류가 발생했습니다");
    }
  }, [map, isGeoJsonLoaded, mapPlacesWithGeoNodes, panTo, highlightSegment, clearPreviousHighlightedPath]);

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
