import { useCallback } from 'react';
import type { ItineraryDay, Place } from '@/types/core';
import { GeoJsonNodeFeature } from '@/components/rightpanel/geojson/GeoJsonTypes';
import { ServerRouteDataForDay } from '@/hooks/map/useServerRoutes';

interface UseItineraryGeoJsonRendererProps {
  map: any;
  isNaverLoadedParam: boolean;
  mapPlacesWithGeoNodesFn: (places: Place[]) => Place[];
  addPolyline: (
    pathCoordinates: { lat: number; lng: number }[],
    color: string,
    weight?: number,
    opacity?: number,
    zIndex?: number
  ) => any | null;
  clearAllMapPolylines: () => void;
  updateDayPolylinePaths: (day: number, polylinePaths: { lat: number; lng: number }[][], currentItineraryDayData: ItineraryDay) => void;
}

export const useItineraryGeoJsonRenderer = ({
  map,
  isNaverLoadedParam,
  mapPlacesWithGeoNodesFn,
  addPolyline,
  clearAllMapPolylines,
  updateDayPolylinePaths,
}: UseItineraryGeoJsonRendererProps) => {

  // 일정 경로 렌더링 함수 (특정 일차의 장소들을 연결하는 경로)
  const renderItineraryRoute = useCallback((
    itineraryDay: ItineraryDay | null,
    allServerRoutesInput?: Record<number, ServerRouteDataForDay>,
    onComplete?: () => void
  ) => {
    if (!map || !itineraryDay) {
      if (onComplete) onComplete();
      return;
    }
    
    console.log(`[ItineraryGeoJsonRenderer] 일차 ${itineraryDay.day} 경로 렌더링 시작.`);
    clearAllMapPolylines();

    // 1. Link ID 기반 경로
    if (itineraryDay.routeData?.linkIds && itineraryDay.routeData.linkIds.length > 0) {
      const linkIds = itineraryDay.routeData.linkIds;
      console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: Link ID 기반 경로 계산. 링크 수: ${linkIds.length}`);
      
      const getNodeById = (nodeId: string | number): GeoJsonNodeFeature | undefined => {
        return window.geoJsonLayer?.getNodeById?.(String(nodeId)); // String(nodeId)로 수정
      };

      const allPolylinePaths: { lat: number; lng: number }[][] = [];
      
      let missingLinkCount = 0;
      let segments: { start: number; end: number; coords: any[] }[] = [];
      let currentSegment: { start: number; end: number; coords: any[] } | undefined;
      
      // 링크 ID로부터 경로 구성
      for (let i = 0; i < linkIds.length; i++) {
        const linkId = linkIds[i];
        
        const linkFeature = window.geoJsonLayer?.getLinkById?.(String(linkId)); // String(linkId) 및 getLinkById 사용
        const linkCoordsRaw = linkFeature?.geometry?.coordinates; // geometry.coordinates에서 직접 가져오기

        if (!linkCoordsRaw || !Array.isArray(linkCoordsRaw) || linkCoordsRaw.length < 2 || !linkCoordsRaw.every(c => Array.isArray(c) && c.length === 2)) {
          missingLinkCount++;
          console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: GeoJSON Link ID '${linkId}' 없음 또는 좌표 형식이 잘못됨. Fallback 시도.`);
          
          if (i < linkIds.length - 1) {
            const nextValidLinkIndex = linkIds.findIndex((_, idx) => {
              if (idx <= i) return false;
              const nextLinkFeat = window.geoJsonLayer?.getLinkById?.(String(linkIds[idx]));
              const nextCoords = nextLinkFeat?.geometry?.coordinates;
              return nextCoords && Array.isArray(nextCoords) && nextCoords.length > 0;
            });
            
            if (nextValidLinkIndex > -1) {
              const startNodeId = itineraryDay.routeData?.nodeIds?.[i]; 
              const endNodeId = itineraryDay.routeData?.nodeIds?.[nextValidLinkIndex];
              
              if (startNodeId && endNodeId) {
                const startNode = getNodeById(startNodeId); // getNodeById는 이미 String 처리됨
                const endNode = getNodeById(endNodeId); // getNodeById는 이미 String 처리됨
                
                if (startNode?.geometry?.coordinates && endNode?.geometry?.coordinates) {
                  try {
                    const directPath = [
                      {
                        lat: startNode.geometry.coordinates[1],
                        lng: startNode.geometry.coordinates[0]
                      },
                      {
                        lat: endNode.geometry.coordinates[1],
                        lng: endNode.geometry.coordinates[0]
                      }
                    ];
                    
                    addPolyline(directPath, '#FF9500', 4, 0.7, 10); // 주황색 fallback
                    allPolylinePaths.push(directPath);
                    
                    i = nextValidLinkIndex - 1;
                    currentSegment = undefined; // 새 세그먼트 시작 강제
                    continue;
                  } catch (e) {
                    console.error(`[ItineraryGeoJsonRenderer] Error creating fallback path:`, e);
                  }
                } else {
                  console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: Fallback 위한 노드 ID ${startNodeId} 또는 ${endNodeId}의 좌표 찾을 수 없음.`);
                }
              }
            }
          }
          currentSegment = undefined;
          continue;
        }
        
        // linkCoordsRaw는 [[lng, lat], [lng, lat], ...] 형태여야 함
        const pathCoords: {lat: number; lng: number}[] = linkCoordsRaw.map((coord: number[]) => ({
          lat: coord[1],
          lng: coord[0]
        }));
        
        if (!currentSegment) {
          currentSegment = {
            start: i,
            end: i,
            coords: [...pathCoords]
          };
          segments.push(currentSegment);
        } else {
          currentSegment.coords.push(...pathCoords.slice(1));
          currentSegment.end = i;
        }
        
        if (currentSegment.coords.length > 100 || i === linkIds.length - 1) {
          const polylinePath = currentSegment.coords;
          
          addPolyline(polylinePath, '#4285F4', 5, 0.8, 10); // 파란색 주 경로
          allPolylinePaths.push(polylinePath);
          
          currentSegment = undefined;
        }
      }
      
      if (missingLinkCount > 0) {
        console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: 누락/Fallback 처리된 Link ID 총 ${missingLinkCount}개 (전체: ${linkIds.length}개)`);
      }
      
      console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: Link ID/Fallback 기반 계산된 폴리라인 경로 ${allPolylinePaths.length}개 캐시 업데이트 시도.`);
      updateDayPolylinePaths(itineraryDay.day, allPolylinePaths, itineraryDay);
      
    } 
    // 2. 서버에서 제공된 폴리라인 경로 데이터 사용 
    else if (allServerRoutesInput && allServerRoutesInput[itineraryDay.day] && 
             allServerRoutesInput[itineraryDay.day].polylinePaths && 
             allServerRoutesInput[itineraryDay.day].polylinePaths.length > 0) {
      
      const serverData = allServerRoutesInput[itineraryDay.day];
      console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: 서버 캐시된 경로 데이터 사용. ${serverData.polylinePaths.length}개 세그먼트`);
      
      serverData.polylinePaths.forEach(path => {
        addPolyline(path, '#4285F4', 5, 0.8, 10);
      });
      
    } 
    // 3. 폴백: 장소들 사이에 직선 연결
    else if (itineraryDay.places && itineraryDay.places.length > 0) {
      console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: Link ID/서버 경로 없음. Fallback: 직선 연결 (${itineraryDay.places.length}개 장소).`);
      
      const places = itineraryDay.places;
      const allPolylinePathsFallback: { lat: number; lng: number }[][] = [];
      
      for (let i = 0; i < places.length - 1; i++) {
        const source = places[i];
        const target = places[i + 1];
        
        if (!source.x || !source.y || !target.x || !target.y) {
          console.warn(`[ItineraryGeoJsonRenderer] Invalid coordinates in Day ${itineraryDay.day} for places:`, 
                      source.name, target.name);
          continue;
        }
        
        const directPath = [
          { lat: source.y, lng: source.x },
          { lat: target.y, lng: target.x }
        ];
        
        addPolyline(directPath, '#FF9500', 4, 0.7, 5); // 주황색 fallback
        allPolylinePathsFallback.push(directPath);
      }
      
      console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: 직선 경로 ${allPolylinePathsFallback.length}개 캐시 업데이트.`);
      updateDayPolylinePaths(itineraryDay.day, allPolylinePathsFallback, itineraryDay);
    }
    
    console.log(`[ItineraryGeoJsonRenderer] 일차 ${itineraryDay.day} 경로 렌더링 종료.`);
    if (onComplete) onComplete();
  }, [map, addPolyline, clearAllMapPolylines, updateDayPolylinePaths]);

  return {
    renderItineraryRoute,
  };
};
