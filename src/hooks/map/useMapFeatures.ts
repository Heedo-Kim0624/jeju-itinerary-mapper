import {
  createNaverLatLng, // Corrected typo
  createNaverMarker,
  createNaverPolyline,
  getMarkerIconOptions,
  panToPosition,
  fitBoundsToPlaces, // Assuming this is used, if not, can be removed from imports
  fitBoundsToCoordinates, // Added import
  clearMarkers as clearDrawnMarkers,
  clearPolylines as clearDrawnPolylines,
  clearInfoWindows, // Added import
  clearOverlayByCondition, // Added import
} from '@/utils/map/mapDrawing';
import { Place, ItineraryDay } from '@/types/supabase';
import { ParsedRoute, ServerRouteResponse } from '@/types/schedule';
import { parseInterleavedRoute, extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';
import { useRef, useState, useEffect } from 'react';
import { calculateDistance } from '@/utils/distance'; // Import from new location

/**
 * 지도 기능 관련 훅
 * 마커, 경로, GeoJSON 등 지도 위에 표시되는 요소들을 관리
 */
export const useMapFeatures = (map: any) => {
  // 지도 초기화 상태
  const [isMapInitialized, setIsMapInitialized] = useState<boolean>(false);
  const [isNaverLoaded, setIsNaverLoaded] = useState<boolean>(false);
  const [isMapError, setIsMapError] = useState<boolean>(false);
  const [showGeoJson, setShowGeoJson] = useState<boolean>(false);
  
  // GeoJSON 데이터 상태
  const isGeoJsonLoadedRef = useRef<boolean>(false);
  const geoJsonNodesRef = useRef<any[]>([]);
  const geoJsonLinksRef = useRef<any[]>([]);
  
  // 서버 경로 데이터
  const [serverRoutesData, setServerRoutesData] = useState<Record<number, ServerRouteResponse>>({});
  
  // 지도 오버레이 (마커, 폴리라인 등) 관리
  const mapOverlaysRef = useRef<Array<{overlay: any; type: string; segmentId?: string}>>([]);
  const mapContainer = useRef<HTMLDivElement>(null);
  
  // 지도 초기화 감지
  useEffect(() => {
    if (map) {
      setIsMapInitialized(true);
      setIsNaverLoaded(!!window.naver);
      console.log('[useMapFeatures] 지도 초기화 감지됨');
    }
  }, [map]);
  
  // 마커 추가 함수
  const addMarkers = (places: Place[], opts?: { 
    highlight?: boolean; 
    isItinerary?: boolean; 
    useRecommendedStyle?: boolean; // This was mapped to isCandidate
    useColorByCategory?: boolean; // New option
    onClick?: (place: Place, index: number) => void;
  }) => {
    if (!map || !window.naver) {
      console.warn('[useMapFeatures] 지도가 초기화되지 않았습니다. 마커를 추가할 수 없습니다.');
      return [];
    }
    
    const markers: any[] = [];
    places.forEach((place, index) => {
      if (!place.y || !place.x) {
        console.warn(`[useMapFeatures] 장소 '${place.name}'의 좌표가 없습니다. 마커를 생성하지 않습니다.`);
        return;
      }
      
      const position = createNaverLatLng(place.y, place.x);
      if (!position) {
        console.warn(`[useMapFeatures] 장소 '${place.name}'의 위치 객체를 생성할 수 없습니다.`);
        return;
      }
      
      // Correctly map opts to getMarkerIconOptions parameters
      // opts.highlight -> isSelected
      // opts.useRecommendedStyle -> isCandidate
      // opts.isItinerary -> isItineraryPlace
      // opts.useColorByCategory -> useColorByCategory
      const iconOptions = getMarkerIconOptions(
        place, 
        opts?.highlight || false, 
        opts?.useRecommendedStyle || false, 
        opts?.isItinerary || false,
        opts?.useColorByCategory // Pass the 5th argument
      );
      
      const marker = createNaverMarker(map, position, iconOptions, place.name);
      
      if (opts?.onClick) {
        window.naver.maps.Event.addListener(marker, 'click', () => {
          opts.onClick!(place, index);
        });
      }
      
      markers.push(marker);
      mapOverlaysRef.current.push({ overlay: marker, type: 'marker' });
    });
    
    return markers;
  };
  
  // 모든 마커 및 UI 요소 제거
  const clearMarkersAndUiElements = () => {
    mapOverlaysRef.current.forEach(overlayObj => {
      if (overlayObj.overlay && typeof overlayObj.overlay.setMap === 'function') {
        overlayObj.overlay.setMap(null);
      }
    });
    mapOverlaysRef.current = [];
  };
  
  // 지도 이동 함수
  const panTo = (locationOrCoords: string | {lat: number, lng: number}) => {
    if (!map) return;
    
    if (typeof locationOrCoords === 'string') {
      // 주소 기반 이동 (geocoding 필요)
      console.log(`[useMapFeatures] 주소 기반 이동은 아직 구현되지 않았습니다: ${locationOrCoords}`);
    } else {
      // 좌표 기반 이동
      panToPosition(map, locationOrCoords.lat, locationOrCoords.lng);
    }
  };
  
  // GeoJSON 가시성 토글
  const toggleGeoJsonVisibility = () => {
    setShowGeoJson(prev => !prev);
  };
  
  // 경로 세그먼트 그리기 함수
  const drawRouteSegment = (
    segment: { from: string; to: string; links: string[] },
    style?: any,
    type: string = 'route' // 오버레이 타입을 위한 파라미터 추가
  ): any | null => {
    if (!map || !geoJsonNodesRef.current || !geoJsonLinksRef.current) {
      console.warn('[drawRouteSegment] 지도 또는 GeoJSON 데이터가 준비되지 않았습니다.');
      return null;
    }
  
    const fromNodeGeo = geoJsonNodesRef.current.find(n => String(n.id) === String(segment.from));
    const toNodeGeo = geoJsonNodesRef.current.find(n => String(n.id) === String(segment.to));
  
    if (!fromNodeGeo || !toNodeGeo) {
      console.warn(`[drawRouteSegment] 세그먼트 노드를 찾을 수 없습니다: From ${segment.from}, To ${segment.to}`);
      return null;
    }
  
    const pathCoordinates = [createNaverLatLng(fromNodeGeo.coordinates[1], fromNodeGeo.coordinates[0])];
  
    segment.links.forEach(linkId => {
      const linkGeo = geoJsonLinksRef.current.find(l => String(l.id) === String(linkId));
      if (linkGeo && linkGeo.coordinates) {
        linkGeo.coordinates.forEach((coordPair: [number, number]) => {
          // 첫번째 좌표는 fromNodeGeo와 겹치므로 건너뛰고, 마지막 좌표는 toNodeGeo와 겹치므로 나중에 추가
          // 여기서는 링크의 모든 중간 좌표를 추가한다고 가정
          pathCoordinates.push(createNaverLatLng(coordPair[1], coordPair[0]));
        });
      } else {
        console.warn(`[drawRouteSegment] 링크 ID ${linkId}에 대한 GeoJSON 데이터를 찾을 수 없습니다.`);
      }
    });
  
    // Ensure the last coordinate of the TO_NODE is included if not already by links
    const lastLinkCoord = pathCoordinates[pathCoordinates.length -1];
    const toNodeCoord = createNaverLatLng(toNodeGeo.coordinates[1], toNodeGeo.coordinates[0]);
    if (!lastLinkCoord || !lastLinkCoord.equals(toNodeCoord)) {
       pathCoordinates.push(toNodeCoord);
    }

    if (pathCoordinates.length < 2) {
      console.warn(`[drawRouteSegment] 경로를 그리기에 좌표가 부족합니다 (${pathCoordinates.length}개). From: ${segment.from}, To: ${segment.to}`);
      return null;
    }
  
    const polyline = createNaverPolyline({
      path: pathCoordinates,
      strokeColor: style?.strokeColor || '#007EEF',
      strokeWeight: style?.strokeWeight || 3,
      strokeOpacity: style?.strokeOpacity || 0.8,
      map: map,
    });
  
    mapOverlaysRef.current.push({ overlay: polyline, type: type, segmentId: `${segment.from}-${segment.to}-${Date.now()}` });
    return polyline;
  };
  
  // interleaved_route 배열을 사용하여 경로 세그먼트 하이라이트
  const highlightSegmentByInterleavedRoute = (
    interleaved_route: (string | number)[],
    highlightStyle?: any,
    mapInstance?: any,
  ) => {
    const currentMap = mapInstance || map;
    if (!currentMap || !isGeoJsonLoadedRef.current) {
      console.warn('[highlightSegmentByInterleavedRoute] Map or GeoJSON not ready.');
      return [];
    }

    const parsedSegments: ParsedRoute[] = parseInterleavedRoute(interleaved_route);
    if (!parsedSegments || parsedSegments.length === 0) {
      console.warn('[highlightSegmentByInterleavedRoute] No segments to highlight.');
      return [];
    }

    // 이전 하이라이트 경로 지우기
    // clearOverlayByCondition now returns the updated list
    mapOverlaysRef.current = clearOverlayByCondition(
      mapOverlaysRef.current, 
      (overlay) => overlay.type === 'highlight'
    );
    
    console.log(`[highlightSegmentByInterleavedRoute] Highlighting ${parsedSegments.length} segments.`);

    const highlightedPaths: any[] = [];
    parsedSegments.forEach((segment, index) => {
      const segmentWithStringIds: { from: string; to: string; links: string[] } = {
        from: String(segment.from),
        to: String(segment.to),
        links: segment.links.map(String),
      };

      console.log(`[highlightSegmentByInterleavedRoute] Drawing segment ${index + 1}: From ${segmentWithStringIds.from} To ${segmentWithStringIds.to} via ${segmentWithStringIds.links.length} links`);
      const path = drawRouteSegment(
        segmentWithStringIds,
        highlightStyle || { strokeColor: '#FF0000', strokeWeight: 5, strokeOpacity: 0.8 },
        'highlight'
      );
      if (path) {
        highlightedPaths.push(path);
      }
    });
    return highlightedPaths;
  };
  
  // 이전에 하이라이트된 경로 제거
  const clearPreviousHighlightedPath = () => {
    // clearOverlayByCondition now returns the updated list
    mapOverlaysRef.current = clearOverlayByCondition(
      mapOverlaysRef.current, 
      (overlay) => overlay.type === 'highlight'
    );
  };
  
  // 일정 경로 렌더링
  const renderItineraryRoute = (
    itineraryDay: ItineraryDay | null,
    allServerRoutes?: Record<number, ServerRouteResponse>, // This param is available but might not be directly used if interleaved_route is primary
    onComplete?: () => void,
    onClear?: () => void
  ): void => {
    console.log('[useMapFeatures] renderItineraryRoute 호출됨:', { itineraryDay, serverRoutesData: allServerRoutes });
    if (onClear) onClear();
    else clearAllRoutes(); // 기본적으로 모든 경로 클리어

    if (!itineraryDay || !itineraryDay.interleaved_route || itineraryDay.interleaved_route.length === 0) {
      console.log('[useMapFeatures] 표시할 일정이 없거나 경로 데이터가 없습니다.');
      if (onComplete) onComplete();
      return;
    }

    console.log(`[useMapFeatures] ${itineraryDay.day}일차 경로 렌더링 시작. Interleaved route 길이: ${itineraryDay.interleaved_route.length}`);
    
    const routeStyle = {
      strokeColor: '#1E90FF', // 파란색 계열
      strokeWeight: 4,
      strokeOpacity: 0.9,
      strokeStyle: 'solid',
      startIcon: window.naver?.maps.PointableIcon?.CIRCLE,
      startIconSize: 8,
      endIcon: window.naver?.maps.PointableIcon?.CIRCLE,
      endIconSize: 8,
    };

    // highlightSegmentByInterleavedRoute를 사용하여 경로를 그림
    // 이 함수는 내부적으로 clearOverlayByCondition을 호출하여 이전 'highlight' 타입 경로를 지움
    // 만약 일반 경로 타입이 다르다면, 해당 타입으로 지우도록 수정 필요
    // 여기서는 기존 clearAllRoutes가 이미 호출되었으므로, 중복 클리어를 피하거나 조정 필요.
    // clearAllRoutes가 mapOverlaysRef.current를 비우므로, highlightSegmentByInterleavedRoute 내부의 clearOverlayByCondition은 아무것도 안할 수 있음.
    
    const drawnPath = highlightSegmentByInterleavedRoute(itineraryDay.interleaved_route, routeStyle);
    
    if (drawnPath && drawnPath.length > 0) {
       console.log(`[useMapFeatures] ${itineraryDay.day}일차 경로 ${drawnPath.length}개 세그먼트 렌더링 완료.`);
       const nodeIds = extractAllNodesFromRoute(itineraryDay.interleaved_route);
       if (nodeIds.length > 0 && geoJsonNodesRef.current.length > 0) {
           const routeNodeCoordinates = nodeIds.map(nodeId => {
               const node = geoJsonNodesRef.current.find(n => String(n.id) === String(nodeId));
               // Ensure createNaverLatLng is called correctly
               return node ? createNaverLatLng(node.coordinates[1], node.coordinates[0]) : null;
           }).filter(coord => coord !== null) as any[]; // Filter out nulls if createNaverLatLng can return null
           
           if (routeNodeCoordinates.length > 0) {
               fitBoundsToCoordinates(map, routeNodeCoordinates); // Corrected call
           }
       }
    } else {
      console.warn(`[useMapFeatures] ${itineraryDay.day}일차 경로 렌더링에 실패했거나 그려진 경로가 없습니다.`);
    }

    if (onComplete) onComplete();
  };
  
  // 모든 경로 제거
  const clearAllRoutes = () => {
    console.log('[useMapFeatures] 모든 경로 및 관련 UI 요소 제거 중');
    mapOverlaysRef.current.forEach(overlayObj => {
      if (overlayObj.overlay && typeof overlayObj.overlay.setMap === 'function') {
        overlayObj.overlay.setMap(null);
      }
    });
    mapOverlaysRef.current = []; // 모든 오버레이 참조 제거
    console.log('[useMapFeatures] 모든 경로 제거 완료');
  };
  
  // GeoJSON 노드와 링크를 사용하여 경로 렌더링
  const renderGeoJsonRoute = (nodeIds: string[], linkIds: string[], style?: any) => {
    if (!map || !isGeoJsonLoadedRef.current) {
      console.warn('[renderGeoJsonRoute] 지도 또는 GeoJSON이 준비되지 않았습니다.');
      return [];
    }
    
    console.log(`[renderGeoJsonRoute] 경로 렌더링: ${nodeIds.length}개 노드, ${linkIds.length}개 링크`);
    
    // 이전 경로 제거
    clearAllRoutes();
    
    if (nodeIds.length < 2) {
      console.warn('[renderGeoJsonRoute] 노드가 2개 미만입니다. 경로를 그릴 수 없습니다.');
      return [];
    }
    
    const polylines = [];
    
    // 각 노드 쌍 사이의 링크를 찾아 경로 생성
    for (let i = 0; i < nodeIds.length - 1; i++) {
      const fromNodeId = nodeIds[i];
      const toNodeId = nodeIds[i + 1];
      
      // 해당 구간의 링크 찾기
      const segmentLinks = linkIds.filter((_, idx) => idx >= i && idx < nodeIds.length - 1);
      
      if (segmentLinks.length > 0) {
        const segment = {
          from: fromNodeId,
          to: toNodeId,
          links: segmentLinks
        };
        
        const polyline = drawRouteSegment(segment, style);
        if (polyline) {
          polylines.push(polyline);
        }
      }
    }
    
    return polylines;
  };
  
  // GeoJSON 데이터 로드 처리
  const handleGeoJsonLoaded = (nodes: any[], links: any[]) => {
    console.log(`[handleGeoJsonLoaded] GeoJSON 데이터 로드됨: ${nodes.length}개 노드, ${links.length}개 링크`);
    geoJsonNodesRef.current = nodes;
    geoJsonLinksRef.current = links;
    isGeoJsonLoadedRef.current = true;
  };
  
  // 특정 구간 하이라이트
  const highlightSegment = (fromIndex: number, toIndex: number, itineraryDay?: ItineraryDay) => {
    if (!map || !isGeoJsonLoadedRef.current || !itineraryDay) {
      console.warn('[highlightSegment] 지도, GeoJSON 또는 일정 데이터가 준비되지 않았습니다.');
      return;
    }
    
    // 이전 하이라이트 제거
    clearPreviousHighlightedPath();
    
    if (fromIndex < 0 || toIndex >= itineraryDay.places.length || fromIndex >= toIndex) {
      console.warn(`[highlightSegment] 유효하지 않은 인덱스: ${fromIndex} -> ${toIndex}`);
      return;
    }
    
    console.log(`[highlightSegment] 구간 하이라이트: ${fromIndex} -> ${toIndex}`);
    
    // 해당 구간의 경로 데이터 추출
    // 이 부분은 itineraryDay의 구조에 따라 다를 수 있음
    // 예: itineraryDay.routeData.segmentRoutes에서 해당 구간 찾기
    
    // 임시 구현: 전체 경로에서 해당 구간만 하이라이트
    if (itineraryDay.interleaved_route && itineraryDay.interleaved_route.length > 0) {
      // interleaved_route에서 해당 구간 추출 로직 필요
      // 현재는 전체 경로를 하이라��트
      highlightSegmentByInterleavedRoute(
        itineraryDay.interleaved_route,
        { strokeColor: '#FF5722', strokeWeight: 5, strokeOpacity: 0.8 }
      );
    }
  };
  
  // 장소와 GeoJSON 노드 매핑 검사
  const checkGeoJsonMapping = (places: Place[]) => {
    if (!isGeoJsonLoadedRef.current || geoJsonNodesRef.current.length === 0) {
      return {
        totalPlaces: places.length,
        mappedPlaces: 0,
        mappingRate: '0%',
        averageDistance: 'N/A',
        success: false,
        message: 'GeoJSON 데이터가 로드되지 않았습니다.'
      };
    }
    
    let mappedCount = 0;
    let totalDistance = 0;
    
    places.forEach(place => {
      if (!place.x || !place.y) return;
      
      // 가장 가까운 노드 찾기
      let closestNode = null;
      let minDistance = Infinity;
      
      geoJsonNodesRef.current.forEach(node => {
        const distance = calculateDistance(
          place.y, place.x,
          node.coordinates[1], node.coordinates[0]
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestNode = node;
        }
      });
      
      if (closestNode && minDistance < 1000) { // 1km 이내
        mappedCount++;
        totalDistance += minDistance;
      }
    });
    
    const mappingRate = places.length > 0 ? (mappedCount / places.length) * 100 : 0;
    const averageDistance = mappedCount > 0 ? totalDistance / mappedCount : 0;
    
    return {
      totalPlaces: places.length,
      mappedPlaces: mappedCount,
      mappingRate: `${mappingRate.toFixed(1)}%`,
      averageDistance: averageDistance.toFixed(1),
      success: mappingRate >= 80, // 80% 이상이면 성공으로 간주
      message: mappingRate >= 80 
        ? '매핑 성공' 
        : `매핑 부족 (${mappingRate.toFixed(1)}%)`
    };
  };
  
  // 장소에 GeoJSON 노드 ID 매핑
  const mapPlacesWithGeoNodes = (places: Place[]) => {
    if (!isGeoJsonLoadedRef.current || geoJsonNodesRef.current.length === 0) {
      return places;
    }
    
    return places.map(place => {
      if (!place.x || !place.y) return place;
      
      // 가장 가까운 노드 찾기
      let closestNode = null;
      let minDistance = Infinity;
      
      geoJsonNodesRef.current.forEach(node => {
        const distance = calculateDistance(
          place.y, place.x,
          node.coordinates[1], node.coordinates[0]
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestNode = node;
        }
      });
      
      if (closestNode && minDistance < 1000) { // 1km 이내
        return {
          ...place,
          geoNodeId: closestNode.id
        };
      }
      
      return place;
    });
  };
  
  // 특정 장소 인덱스의 경로 표시
  const showRouteForPlaceIndex = (placeIndex: number, itineraryDay: ItineraryDay, onComplete?: () => void) => {
    if (!map || !isGeoJsonLoadedRef.current || !itineraryDay) {
      console.warn('[showRouteForPlaceIndex] 지도, GeoJSON 또는 일정 데이터가 준비되지 않았습니다.');
      return;
    }
    
    if (placeIndex < 0 || placeIndex >= itineraryDay.places.length) {
      console.warn(`[showRouteForPlaceIndex] 유효하지 않은 인덱스: ${placeIndex}`);
      return;
    }
    
    // 이전 경로 제거
    clearAllRoutes();
    
    // 해당 장소로 지도 이동
    const place = itineraryDay.places[placeIndex];
    if (place.y && place.x) {
      panToPosition(map, place.y, place.x);
    }
    
    // 해당 장소의 경로 표시
    // 이 부분은 itineraryDay의 구조에 따라 다를 수 있음
    
    // 임시 구현: 전체 경로 표시
    if (itineraryDay.interleaved_route && itineraryDay.interleaved_route.length > 0) {
      renderItineraryRoute(itineraryDay, undefined, onComplete);
    }
  };
  
  // 서버 경로 데이터 설정
  const setServerRoutes = (
    dayRoutes: Record<number, ServerRouteResponse> | ((prev: Record<number, ServerRouteResponse>) => Record<number, ServerRouteResponse>)
  ) => {
    if (typeof dayRoutes === 'function') {
      setServerRoutesData(prev => {
        const newRoutes = dayRoutes(prev);
        console.log('[setServerRoutes] 서버 경로 데이터 업데이트 (함수):', Object.keys(newRoutes).length);
        return newRoutes;
      });
    } else {
      setServerRoutesData(dayRoutes);
      console.log('[setServerRoutes] 서버 경로 데이터 업데이트 (객체):', Object.keys(dayRoutes).length);
    }
  };
  
  return {
    map,
    mapContainer,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
    addMarkers,
    calculateRoutes: () => console.warn("calculateRoutes is deprecated and not implemented in useMapFeatures"),
    clearMarkersAndUiElements,
    panTo,
    showGeoJson,
    toggleGeoJsonVisibility,
    renderItineraryRoute, // This has 4 params now
    clearAllRoutes,
    handleGeoJsonLoaded,
    geoJsonNodes: geoJsonNodesRef.current, // Expose the ref's current value
    geoJsonLinks: geoJsonLinksRef.current, // Expose the ref's current value
    highlightSegment,
    clearPreviousHighlightedPath,
    isGeoJsonLoaded: isGeoJsonLoadedRef.current, // Expose the ref's current value
    checkGeoJsonMapping,
    mapPlacesWithGeoNodes,
    showRouteForPlaceIndex, // This has 2 params
    renderGeoJsonRoute,
    setServerRoutes,
    serverRoutesData
  };
}

export default useMapFeatures;
