
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
  ): any[] => { // Return type changed to any[]
    if (!currentMap || !window.naver || !geoJsonNodes || !geoJsonLinks) {
      console.warn('[useMapFeatures] 지도 또는 GeoJSON 데이터가 준비되지 않아 경로를 렌더링할 수 없습니다.');
      return []; // Return empty array
    }
    clearDrawnPolylines(); // This clears drawnPolylinesRef.current

    const currentPolylines: any[] = []; // Local array for this render pass

    const defaultOptions = { strokeColor: '#22c55e', strokeWeight: 5, strokeOpacity: 0.8 }; // 연두색으로 변경
    const mergedOptions = { ...defaultOptions, ...options };

    // 링크 ID를 기반으로 Polyline 생성
    linkIds.forEach(linkId => {
      // geoJsonLinks is expected to be LinkFeature[]
      const linkFeature = geoJsonLinks.find(
        (f: LinkFeature) => String(f.properties.LINK_ID) === String(linkId)
      );
      if (linkFeature) {
        const pathCoords = linkFeature.geometry.coordinates.map(
          (coord: [number, number]) => new window.naver.maps.LatLng(coord[1], coord[0])
        );
        if (pathCoords.length > 1) {
          const polyline = createNaverPolyline(currentMap, pathCoords, mergedOptions);
          currentPolylines.push(polyline); // Add to local array
        }
      } else {
        console.warn(`[useMapFeatures] LINK_ID '${linkId}'에 해당하는 GeoJSON 링크를 찾을 수 없습니다.`);
      }
    });
    
    drawnPolylinesRef.current = currentPolylines; // Update ref with newly created polylines

    // (선택적) 노드 ID를 기반으로 마커 생성 - 현재는 MapMarkers.tsx에서 처리. 필요시 여기에 추가.
    // nodeIds.forEach(nodeId => { ... });

    console.log(`[useMapFeatures] ${linkIds.length}개의 링크로 경로를 렌더링했습니다.`);
    return currentPolylines; // Return the created polylines
  }, [currentMap, geoJsonNodes, geoJsonLinks, clearDrawnPolylines]);
  
  // 일정 경로 렌더링 함수 - 서버 데이터 활용 (interleaved_route 우선)
  const renderItineraryRoute = useCallback((
    itineraryDay: ItineraryDay,
    serverRoutesData: Record<number, ServerRouteResponse>, // 추가: 서버 경로 데이터
    renderDayRouteFallback: (dayData: ItineraryDay) => void, // 추가: 폴백 렌더링 함수
    clearAllRoutesFunction: () => void // 추가: 모든 경로 제거 함수
  ) => {
    if (!currentMap || !window.naver) return;
    clearAllRoutesFunction(); // 기존 경로들 모두 제거

    console.log("[useMapFeatures] renderItineraryRoute 호출됨, 일자:", itineraryDay.day, "interleaved_route:", itineraryDay.interleaved_route);

    if (itineraryDay.interleaved_route && itineraryDay.interleaved_route.length > 0) {
      const nodeIds = extractAllNodesFromRoute(itineraryDay.interleaved_route).map(String);
      const linkIds = extractAllLinksFromRoute(itineraryDay.interleaved_route).map(String);
      
      console.log("[useMapFeatures] GeoJSON 기반 경로 렌더링 시도. 노드:", nodeIds.length, "링크:", linkIds.length);
      renderGeoJsonRoute(nodeIds, linkIds, { strokeColor: '#22c55e', strokeWeight: 6, strokeOpacity: 0.9 }); // 연두색, 약간 더 두껍게

      // 마커는 MapMarkers.tsx에서 처리하도록 여기서 직접 그리지 않음.
      // 만약 여기서 그려야 한다면, 아래 로직 활성화
      /*
      if (geoJsonNodes) { // geoJsonNodes is NodeFeature[]
        nodeIds.forEach(nodeId => {
          const nodeFeature = geoJsonNodes.find( // Changed from geoJsonNodes.features.find
            (f: NodeFeature) => String(f.properties.NODE_ID) === String(nodeId)
          );
          if (nodeFeature) {
            const position = new window.naver.maps.LatLng(
              nodeFeature.geometry.coordinates[1], // lat
              nodeFeature.geometry.coordinates[0]  // lng
            );
            // 빨간색 점 마커 생성 (예시)
            const marker = new window.naver.maps.Marker({
              position: position,
              map: currentMap,
              icon: {
                content: '<div style="width:8px;height:8px;background-color:red;border-radius:50%;border:1px solid darkred;"></div>',
                anchor: new window.naver.maps.Point(4, 4)
              }
            });
            // drawnPolylinesRef.current.push(marker); // 마커도 정리 대상에 포함하려면
          }
        });
      }
      */

    } else if (itineraryDay.routeData && itineraryDay.routeData.nodeIds && itineraryDay.routeData.nodeIds.length > 0) {
      console.warn(`[useMapFeatures] 일자 ${itineraryDay.day}: interleaved_route는 없지만 routeData.nodeIds는 존재. 폴백 렌더링 시도.`);
      // 이 경우는 보통 서버에서 interleaved_route를 제공하지 못했을 때의 클라이언트 측 폴백
      // renderDayRouteFallback(itineraryDay); // 기존 폴백 로직 (Naver Polyline 직접 그리기)
      // 또는 여기서도 geoJsonNodes/Links 사용 가능
      const nodeIds = itineraryDay.routeData.nodeIds.map(String);
      const linkIds = itineraryDay.routeData.linkIds.map(String);
      if (nodeIds.length > 0 || linkIds.length > 0) {
        renderGeoJsonRoute(nodeIds, linkIds, { strokeColor: '#FFA500', strokeWeight: 4, strokeOpacity: 0.7 }); // 폴백은 주황색으로
      }

    } else {
      console.warn(`[useMapFeatures] 일자 ${itineraryDay.day}에 대한 경로 데이터(interleaved_route 또는 routeData)가 없습니다.`);
    }
  }, [currentMap, geoJsonNodes, geoJsonLinks, renderGeoJsonRoute]); // Removed clearDrawnPolylines as renderGeoJsonRoute handles it

  // 특정 장소 인덱스의 경로 하이라이트
  const showRouteForPlaceIndex = useCallback((
    placeIndex: number,
    itineraryDay: ItineraryDay,
    serverRoutesData?: Record<number, ServerRouteResponse> // Optional로 변경
  ) => {
    if (!currentMap || !window.naver || !itineraryDay || !itineraryDay.interleaved_route) return;
    
    clearPreviousHighlightedPath();

    const parsedSegments = parseInterleavedRoute(itineraryDay.interleaved_route);
    if (placeIndex < 0 || placeIndex >= parsedSegments.length) return;

    const segment = parsedSegments[placeIndex];
    const segmentNodeIds = [String(segment.from), String(segment.to)]; // 시작과 끝 노드
    const segmentLinkIds = segment.links.map(String);

    if (!geoJsonNodes || !geoJsonLinks) { // geoJsonNodes is NodeFeature[], geoJsonLinks is LinkFeature[]
        console.warn('[useMapFeatures showRouteForPlaceIndex] GeoJSON 데이터 미로드');
        return;
    }

    const allCoords: any[] = [];

    // 시작 노드 좌표 추가
    const fromNodeFeature = geoJsonNodes.find( // Changed from geoJsonNodes.features.find
        (f: NodeFeature) => String(f.properties.NODE_ID) === segmentNodeIds[0]
    );
    if (fromNodeFeature) {
        allCoords.push(new window.naver.maps.LatLng(
            fromNodeFeature.geometry.coordinates[1], fromNodeFeature.geometry.coordinates[0]
        ));
    }

    // 링크들의 좌표 추가
    segmentLinkIds.forEach(linkId => {
        const linkFeature = geoJsonLinks.find( // Changed from geoJsonLinks.features.find
            (f: LinkFeature) => String(f.properties.LINK_ID) === linkId
        );
        if (linkFeature) {
            linkFeature.geometry.coordinates.forEach((coord: [number, number]) => {
                allCoords.push(new window.naver.maps.LatLng(coord[1], coord[0]));
            });
        }
    });
    
    // 도착 노드 좌표 추가 (중복될 수 있으나, 링크의 마지막 점과 도착 노드가 다를 경우 대비)
    // 일반적으로 링크의 마지막 점이 도착 노드임.
    // const toNodeFeature = geoJsonNodes.features.find(
    //     (f: NodeFeature) => String(f.properties.NODE_ID) === segmentNodeIds[1]
    // );
    // if (toNodeFeature && (allCoords.length === 0 || 
    //     !allCoords[allCoords.length-1].equals(new window.naver.maps.LatLng(toNodeFeature.geometry.coordinates[1], toNodeFeature.geometry.coordinates[0])))) {
    //     allCoords.push(new window.naver.maps.LatLng(
    //         toNodeFeature.geometry.coordinates[1], toNodeFeature.geometry.coordinates[0]
    //     ));
    // }
    
    if (allCoords.length > 1) {
        highlightedPathRef.current = createNaverPolyline(currentMap, allCoords, {
            strokeColor: '#FF0000', // 하이라이트는 빨간색
            strokeWeight: 8,
            strokeOpacity: 0.9,
            zIndex: 10 
        });
    }

  }, [currentMap, geoJsonNodes, geoJsonLinks, clearPreviousHighlightedPath]);

  return {
    renderGeoJsonRoute,
    renderItineraryRoute,
    clearDrawnPolylines,
    showRouteForPlaceIndex,
    clearPreviousHighlightedPath,
  };
};

