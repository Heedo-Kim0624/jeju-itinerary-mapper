
import { useCallback, useRef, useEffect, useState } from 'react';
import { Place, ItineraryDay, ServerRouteResponse } from '@/types/supabase'; // core.ts의 타입 사용
import { useMapContext } from '@/components/rightpanel/MapContext';
import { clearPolylines, createNaverPolyline, createNaverMarker } from '@/utils/map/mapDrawing'; // 경로 및 마커 유틸리티 - drawPolylineFromCoords removed
import { parseInterleavedRoute, extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';

interface NodeFeature {
  type: 'Feature';
  properties: { NODE_ID: string; [key: string]: any };
  geometry: { type: 'Point'; coordinates: [number, number] };
}

interface LinkFeature {
  type: 'Feature';
  properties: { LINK_ID: string; [key: string]: any };
  geometry: { type: 'LineString'; coordinates: [number, number][] };
}

export const useMapFeatures = (mapInstance: any) => {
  const { geoJsonNodes, geoJsonLinks } = useMapContext(); // GeoJSON 데이터 접근
  const drawnPolylinesRef = useRef<any[]>([]);
  const highlightedPathRef = useRef<any>(null);
  const [currentMap, setCurrentMap] = useState<any>(null);

  useEffect(() => {
    if (mapInstance) {
      setCurrentMap(mapInstance);
    }
  }, [mapInstance]);

  const clearDrawnPolylines = useCallback(() => {
    clearPolylines(drawnPolylinesRef.current);
    drawnPolylinesRef.current = [];
  }, []);

  const clearPreviousHighlightedPath = useCallback(() => {
    if (highlightedPathRef.current) {
      highlightedPathRef.current.setMap(null);
      highlightedPathRef.current = null;
    }
  }, []);

  // GeoJSON 노드와 링크 ID를 기반으로 경로를 지도에 렌더링
  const renderGeoJsonRoute = useCallback((
    nodeIds: string[], // 경로를 구성하는 NODE_ID 배열
    linkIds: string[], // 경로를 구성하는 LINK_ID 배열
    options?: { strokeColor?: string; strokeWeight?: number; strokeOpacity?: number }
  ): any[] => { // 명시적으로 any[] 반환 타입 지정
    if (!currentMap || !window.naver || !geoJsonNodes || !geoJsonLinks) {
      console.warn('[useMapFeatures] 지도 또는 GeoJSON 데이터가 준비되지 않아 경로를 렌더링할 수 없습니다.', {
        mapExists: !!currentMap,
        naverExists: !!window.naver,
        geoJsonNodesExists: !!geoJsonNodes,
        geoJsonLinksExists: !!geoJsonLinks
      });
      return []; // 빈 배열 반환
    }
    clearDrawnPolylines(); // 기존 polyline 제거

    const currentPolylines: any[] = []; // 이번 렌더링에서 생성된 polyline을 저장할 배열

    const defaultOptions = { strokeColor: '#22c55e', strokeWeight: 5, strokeOpacity: 0.8 }; // 연두색으로 변경
    const mergedOptions = { ...defaultOptions, ...options };

    console.log(`[useMapFeatures] 경로 렌더링 시작: ${linkIds.length}개의 링크로 경로를 그립니다.`, {
      노드수: nodeIds.length,
      링크수: linkIds.length,
      스타일: mergedOptions,
      geoJsonNodes길이: geoJsonNodes?.length || 0,
      geoJsonLinks길이: geoJsonLinks?.length || 0
    });

    // 링크 ID를 기반으로 Polyline 생성
    linkIds.forEach(linkId => {
      // geoJsonLinks는 LinkFeature[] 배열임
      const linkFeature = geoJsonLinks.find(
        (f: LinkFeature) => String(f.properties.LINK_ID) === String(linkId)
      );
      
      if (linkFeature) {
        const pathCoords = linkFeature.geometry.coordinates.map(
          (coord: [number, number]) => new window.naver.maps.LatLng(coord[1], coord[0])
        );
        
        if (pathCoords.length > 1) {
          const polyline = createNaverPolyline(currentMap, pathCoords, mergedOptions);
          currentPolylines.push(polyline); // 현재 생성된 polyline 추가
        }
      } else {
        console.warn(`[useMapFeatures] LINK_ID '${linkId}'에 해당하는 GeoJSON 링크를 찾을 수 없습니다.`);
      }
    });
    
    // 참조 업데이트 (이번에 생성된 polyline들)
    drawnPolylinesRef.current = currentPolylines;

    console.log(`[useMapFeatures] ${currentPolylines.length}개의 polyline으로 경로를 렌더링했습니다.`);
    return currentPolylines; // 생성된 polyline 배열 반환
  }, [currentMap, geoJsonNodes, geoJsonLinks, clearDrawnPolylines]);
  
  // 일정 경로 렌더링 함수 - 서버 데이터 활용 (interleaved_route 우선)
  const renderItineraryRoute = useCallback((
    itineraryDay: ItineraryDay,
    serverRoutesData: Record<number, ServerRouteResponse>, // 추가: 서버 경로 데이터
    renderDayRouteFallback: (dayData: ItineraryDay) => void, // 추가: 폴백 렌더링 함수
    clearAllRoutesFunction: () => void // 추가: 모든 경로 제거 함수
  ) => {
    if (!currentMap || !window.naver) {
      console.warn('[useMapFeatures] 지도 또는 Naver API가 초기화되지 않아 경로 렌더링을 건너뜁니다.');
      return;
    }
    
    clearAllRoutesFunction(); // 기존 경로들 모두 제거

    console.log("[useMapFeatures] renderItineraryRoute 호출됨, 일자:", itineraryDay.day, "interleaved_route:", {
      경로존재: !!itineraryDay.interleaved_route,
      경로길이: itineraryDay.interleaved_route?.length || 0
    });

    if (itineraryDay.interleaved_route && itineraryDay.interleaved_route.length > 0) {
      // 서버에서 받은 interleaved_route 배열에서 노드 ID와 링크 ID 추출
      const nodeIds = extractAllNodesFromRoute(itineraryDay.interleaved_route).map(String);
      const linkIds = extractAllLinksFromRoute(itineraryDay.interleaved_route).map(String);
      
      console.log("[useMapFeatures] GeoJSON 기반 경로 렌더링 시도. 노드:", nodeIds.length, "링크:", linkIds.length);
      
      // GeoJSON 데이터로 경로 렌더링 (연두색, 약간 더 두껍게)
      const createdPolylines = renderGeoJsonRoute(nodeIds, linkIds, { 
        strokeColor: '#22c55e', 
        strokeWeight: 6, 
        strokeOpacity: 0.9 
      });
      
      console.log(`[useMapFeatures] 경로 렌더링 완료: ${createdPolylines.length}개의 polyline 생성됨`);
    } else if (itineraryDay.routeData && itineraryDay.routeData.nodeIds && itineraryDay.routeData.nodeIds.length > 0) {
      console.warn(`[useMapFeatures] 일자 ${itineraryDay.day}: interleaved_route는 없지만 routeData.nodeIds는 존재. 폴백 렌더링 시도.`);
      
      const nodeIds = itineraryDay.routeData.nodeIds.map(String);
      const linkIds = itineraryDay.routeData.linkIds?.map(String) || [];
      
      if (nodeIds.length > 0 || linkIds.length > 0) {
        const createdPolylines = renderGeoJsonRoute(nodeIds, linkIds, { 
          strokeColor: '#FFA500', 
          strokeWeight: 4, 
          strokeOpacity: 0.7 
        });
        
        console.log(`[useMapFeatures] 폴백 경로 렌더링 완료: ${createdPolylines.length}개의 polyline 생성됨`);
      }
    } else if (serverRoutesData && serverRoutesData[itineraryDay.day]) {
      console.warn(`[useMapFeatures] 일자 ${itineraryDay.day}: 일정에 경로 데이터가 없지만 서버 경로 데이터 발견. 서버 데이터로 렌더링 시도.`);
      
      const dayServerRoute = serverRoutesData[itineraryDay.day];
      
      if (dayServerRoute.interleaved_route && dayServerRoute.interleaved_route.length > 0) {
        const nodeIds = extractAllNodesFromRoute(dayServerRoute.interleaved_route).map(String);
        const linkIds = extractAllLinksFromRoute(dayServerRoute.interleaved_route).map(String);
        
        console.log(`[useMapFeatures] 서버 경로 데이터로 렌더링 시도. 노드: ${nodeIds.length}, 링크: ${linkIds.length}`);
        
        const createdPolylines = renderGeoJsonRoute(nodeIds, linkIds, { 
          strokeColor: '#4B9CD3', 
          strokeWeight: 5, 
          strokeOpacity: 0.8 
        });
        
        console.log(`[useMapFeatures] 서버 경로 데이터 렌더링 완료: ${createdPolylines.length}개의 polyline 생성됨`);
      } else if (dayServerRoute.nodeIds && dayServerRoute.nodeIds.length > 0) {
        const nodeIds = dayServerRoute.nodeIds.map(String);
        const linkIds = dayServerRoute.linkIds?.map(String) || [];
        
        console.log(`[useMapFeatures] 서버 경로 노드/링크 데이터로 렌더링 시도. 노드: ${nodeIds.length}, 링크: ${linkIds.length}`);
        
        const createdPolylines = renderGeoJsonRoute(nodeIds, linkIds, { 
          strokeColor: '#4B9CD3', 
          strokeWeight: 5, 
          strokeOpacity: 0.8 
        });
        
        console.log(`[useMapFeatures] 서버 경로 노드/링크 데이터 렌더링 완료: ${createdPolylines.length}개의 polyline 생성됨`);
      } else {
        console.warn(`[useMapFeatures] 일자 ${itineraryDay.day}: 서버 경로 데이터도 유효하지 않습니다.`);
      }
    } else {
      console.warn(`[useMapFeatures] 일자 ${itineraryDay.day}에 대한 경로 데이터(interleaved_route, routeData, 서버 데이터)가 모두 없습니다.`);
    }
  }, [currentMap, geoJsonNodes, geoJsonLinks, renderGeoJsonRoute, clearDrawnPolylines]); 

  // 특정 장소 인덱스의 경로 하이라이트
  const showRouteForPlaceIndex = useCallback((
    placeIndex: number,
    itineraryDay: ItineraryDay,
    serverRoutesData?: Record<number, ServerRouteResponse> // Optional로 변경
  ) => {
    if (!currentMap || !window.naver || !itineraryDay) {
      console.warn('[useMapFeatures] 지도, Naver API 또는 일정 데이터가 없어 경로 하이라이트를 건너뜁니다.');
      return;
    }
    
    clearPreviousHighlightedPath();
    
    console.log(`[useMapFeatures] 장소 인덱스 ${placeIndex}에 대한 경로 하이라이트 시도`);
    
    // interleaved_route가 있는지 확인
    if (!itineraryDay.interleaved_route || itineraryDay.interleaved_route.length === 0) {
      console.warn('[useMapFeatures] interleaved_route 데이터가 없어 경로 세그먼트를 분석할 수 없습니다.');
      
      // 서버 경로 데이터가 있는지 확인
      if (serverRoutesData && serverRoutesData[itineraryDay.day] && 
          serverRoutesData[itineraryDay.day].interleaved_route && 
          serverRoutesData[itineraryDay.day].interleaved_route!.length > 0) {
        
        console.log('[useMapFeatures] 서버 경로 데이터로 경로 하이라이트 시도');
        const serverDay = serverRoutesData[itineraryDay.day];
        
        const parsedSegments = parseInterleavedRoute(serverDay.interleaved_route!);
        if (placeIndex < 0 || placeIndex >= parsedSegments.length) {
          console.warn(`[useMapFeatures] 인덱스 ${placeIndex}는 세그먼트 범위를 벗어납니다 (0-${parsedSegments.length-1})`);
          return;
        }
        
        highlightSegment(parsedSegments[placeIndex], serverDay.interleaved_route!);
        return;
      }
      
      console.warn('[useMapFeatures] 서버 경로 데이터도 없어 경로 하이라이트를 할 수 없습니다.');
      return;
    }
    
    const parsedSegments = parseInterleavedRoute(itineraryDay.interleaved_route);
    if (placeIndex < 0 || placeIndex >= parsedSegments.length) {
      console.warn(`[useMapFeatures] 인덱스 ${placeIndex}는 세그먼트 범위를 벗어납니다 (0-${parsedSegments.length-1})`);
      return;
    }
    
    highlightSegment(parsedSegments[placeIndex], itineraryDay.interleaved_route);
  }, [currentMap, geoJsonNodes, geoJsonLinks, clearPreviousHighlightedPath]);
  
  // 세그먼트 하이라이트 헬퍼 함수
  const highlightSegment = useCallback((
    segment: { from: string; to: string; links: string[] },
    interleavedRoute: (string | number)[]
  ) => {
    if (!currentMap || !window.naver || !geoJsonNodes || !geoJsonLinks) {
      console.warn('[useMapFeatures] 지도 또는 GeoJSON 데이터가 없어 세그먼트 하이라이트를 건너뜁니다.');
      return;
    }
    
    const segmentNodeIds = [String(segment.from), String(segment.to)]; // 시작과 끝 노드
    const segmentLinkIds = segment.links.map(String);
    
    console.log(`[useMapFeatures] 세그먼트 하이라이트: 노드 ${segmentNodeIds.join('-')}, 링크 ${segmentLinkIds.length}개`);

    const allCoords: any[] = [];

    // 시작 노드 좌표 추가
    const fromNodeFeature = geoJsonNodes.find(
        (f: NodeFeature) => String(f.properties.NODE_ID) === segmentNodeIds[0]
    );
    
    if (fromNodeFeature) {
        allCoords.push(new window.naver.maps.LatLng(
            fromNodeFeature.geometry.coordinates[1], fromNodeFeature.geometry.coordinates[0]
        ));
    }

    // 링크들의 좌표 추가
    segmentLinkIds.forEach(linkId => {
        const linkFeature = geoJsonLinks.find(
            (f: LinkFeature) => String(f.properties.LINK_ID) === linkId
        );
        
        if (linkFeature) {
            linkFeature.geometry.coordinates.forEach((coord: [number, number]) => {
                allCoords.push(new window.naver.maps.LatLng(coord[1], coord[0]));
            });
        }
    });
    
    if (allCoords.length > 1) {
        highlightedPathRef.current = createNaverPolyline(currentMap, allCoords, {
            strokeColor: '#FF0000', // 하이라이트는 빨간색
            strokeWeight: 8,
            strokeOpacity: 0.9,
            zIndex: 10 
        });
        
        console.log(`[useMapFeatures] 경로 하이라이트 완료: ${allCoords.length}개 좌표점으로 polyline 생성됨`);
    } else {
        console.warn('[useMapFeatures] 경로 하이라이트 실패: 좌표점이 부족합니다.');
    }
  }, [currentMap, geoJsonNodes, geoJsonLinks]);

  return {
    renderGeoJsonRoute,
    renderItineraryRoute,
    clearDrawnPolylines,
    showRouteForPlaceIndex,
    clearPreviousHighlightedPath,
  };
};
