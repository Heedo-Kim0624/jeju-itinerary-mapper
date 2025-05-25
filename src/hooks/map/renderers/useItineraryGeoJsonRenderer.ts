
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

    if (itineraryDay.routeData?.linkIds && itineraryDay.routeData.linkIds.length > 0) {
      const linkIds = itineraryDay.routeData.linkIds;
      console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: Link ID 기반 경로 계산. 링크 수: ${linkIds.length}`);
      
      const getNodeById = (nodeId: string | number): GeoJsonNodeFeature | undefined => {
        return window.geoJsonLayer?.getNodeById?.(String(nodeId));
      };

      const allPolylinePaths: { lat: number; lng: number }[][] = [];
      
      let missingLinkCount = 0;
      let segments: { start: number; end: number; coords: { lat: number; lng: number }[] }[] = [];
      let currentSegment: { start: number; end: number; coords: { lat: number; lng: number }[] } | undefined;
      
      for (let i = 0; i < linkIds.length; i++) {
        const linkId = linkIds[i];
        
        const linkFeature = window.geoJsonLayer?.getLinkById?.(String(linkId));
        const linkCoordsRaw = linkFeature?.geometry?.coordinates;

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
                const startNode = getNodeById(startNodeId);
                const endNode = getNodeById(endNodeId);
                
                const startNodeCoords = startNode?.geometry?.coordinates;
                const endNodeCoords = endNode?.geometry?.coordinates;

                if (startNodeCoords && typeof startNodeCoords[0] === 'number' && typeof startNodeCoords[1] === 'number' &&
                    endNodeCoords && typeof endNodeCoords[0] === 'number' && typeof endNodeCoords[1] === 'number') {
                  try {
                    const directPath = [
                      { lat: startNodeCoords[1], lng: startNodeCoords[0] },
                      { lat: endNodeCoords[1], lng: endNodeCoords[0] }
                    ];
                    
                    addPolyline(directPath, '#FF9500', 4, 0.7, 10);
                    allPolylinePaths.push(directPath);
                    
                    i = nextValidLinkIndex - 1;
                    currentSegment = undefined;
                    continue; 
                  } catch (e) {
                    console.error(`[ItineraryGeoJsonRenderer] Error creating fallback path:`, e);
                  }
                } else {
                  console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: Fallback 위한 노드 ID ${startNodeId} 또는 ${endNodeId}의 좌표 찾을 수 없거나 유효하지 않음.`);
                }
              }
            }
          }
          currentSegment = undefined;
          continue;
        }
        
        const pathCoords: {lat: number; lng: number}[] = linkCoordsRaw
          .map((coordPair: any) => {
            const lng = coordPair?.[0];
            const lat = coordPair?.[1];
            if (typeof lat === 'number' && typeof lng === 'number') {
              return { lat, lng };
            }
            console.warn(`[ItineraryGeoJsonRenderer] Malformed coordinate pair in link ${linkId}: ${JSON.stringify(coordPair)}`);
            return null;
          })
          .filter(Boolean) as {lat: number; lng: number}[];

        if (pathCoords.length === 0) { // All coordinate pairs in this link were malformed
            console.warn(`[ItineraryGeoJsonRenderer] Link ${linkId} resulted in no valid coordinates after filtering.`);
            currentSegment = undefined; // Reset segment
            continue;
        }
        
        if (!currentSegment) {
          currentSegment = {
            start: i,
            end: i,
            coords: [...pathCoords]
          };
          segments.push(currentSegment);
        } else {
          // Ensure currentSegment.coords and pathCoords are not empty before slice
          if (pathCoords.length > 0) {
             // If pathCoords starts with the same point as currentSegment.coords ends, skip the first point of pathCoords
            const lastCurrentCoord = currentSegment.coords[currentSegment.coords.length -1];
            const firstPathCoord = pathCoords[0];
            if (lastCurrentCoord && firstPathCoord && lastCurrentCoord.lat === firstPathCoord.lat && lastCurrentCoord.lng === firstPathCoord.lng) {
                 currentSegment.coords.push(...pathCoords.slice(1));
            } else {
                 currentSegment.coords.push(...pathCoords);
            }
          }
          currentSegment.end = i;
        }
        
        if (currentSegment.coords.length > 100 || i === linkIds.length - 1) {
           if (currentSegment.coords.length > 1) { // Need at least 2 points for a polyline
            const polylinePath = currentSegment.coords;
            addPolyline(polylinePath, '#4285F4', 5, 0.8, 10);
            allPolylinePaths.push(polylinePath);
          }
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
        // Ensure path itself is an array of valid {lat, lng} objects
        if (Array.isArray(path) && path.every(p => typeof p.lat === 'number' && typeof p.lng === 'number')) {
          addPolyline(path, '#4285F4', 5, 0.8, 10);
        } else {
          console.warn(`[ItineraryGeoJsonRenderer] Invalid path format in serverData for day ${itineraryDay.day}`);
        }
      });
      
    } 
    else if (itineraryDay.places && itineraryDay.places.length > 0) {
      console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: Link ID/서버 경로 없음. Fallback: 직선 연결 (${itineraryDay.places.length}개 장소).`);
      
      const places = itineraryDay.places;
      const allPolylinePathsFallback: { lat: number; lng: number }[][] = [];
      
      for (let i = 0; i < places.length - 1; i++) {
        const source = places[i];
        const target = places[i + 1];
        
        if (typeof source.x !== 'number' || typeof source.y !== 'number' || 
            typeof target.x !== 'number' || typeof target.y !== 'number') {
          console.warn(`[ItineraryGeoJsonRenderer] Invalid coordinates in Day ${itineraryDay.day} for places:`, 
                      source.name, target.name);
          continue;
        }
        
        const directPath = [
          { lat: source.y, lng: source.x },
          { lat: target.y, lng: target.x }
        ];
        
        addPolyline(directPath, '#FF9500', 4, 0.7, 5);
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
