import { useCallback } from 'react';
import type { ItineraryDay, Place } from '@/types/core';
import { GeoJsonNodeFeature } from '@/components/rightpanel/geojson/GeoJsonTypes';
import { ServerRouteDataForDay } from '@/hooks/map/useServerRoutes';
import { buildSegmentPath } from '@/utils/map/routeDrawingUtils';

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
      
      // 전체 노드 목록 (노드 ID는 컨텍스트를 통해 접근)
      const getNodeById = (nodeId: string | number): GeoJsonNodeFeature | undefined => {
        // 컨텍스트에서 노드 ID를 사용하여 노드 찾기
        return window.geoJsonLayer?.getNodeById?.(nodeId);
      };

      // 모든 polyline 경로를 저장 (서버 경로 데이터 캐시 갱신용)
      const allPolylinePaths: { lat: number; lng: number }[][] = [];
      
      let missingLinkCount = 0;
      let segments: { start: number; end: number; coords: any[] }[] = [];
      let currentSegment: { start: number; end: number; coords: any[] } | undefined;
      
      // 링크 ID로부터 경로 구성
      for (let i = 0; i < linkIds.length; i++) {
        const linkId = linkIds[i];
        
        // GeoJSON 컨텍스트에서 링크 ID로 경로 좌표 구하기
        const linkCoords = window.geoJsonLayer?.getLinkCoordinatesById?.(linkId);
        
        if (!linkCoords || linkCoords.length < 2) {
          missingLinkCount++;
          console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: GeoJSON Link ID '${linkId}' 없음. Fallback 시도.`);
          
          // 인접 노드 ID를 이용해 fallback 경로 찾기
          if (i < linkIds.length - 1) {
            const nextValidLinkIndex = linkIds.findIndex((_, idx) => idx > i && window.geoJsonLayer?.getLinkCoordinatesById?.(linkIds[idx])?.length > 0);
            
            if (nextValidLinkIndex > -1) {
              const startNodeId = itineraryDay.routeData?.nodeIds?.[i]; 
              const endNodeId = itineraryDay.routeData?.nodeIds?.[nextValidLinkIndex];
              
              if (startNodeId && endNodeId) {
                const startNode = getNodeById(startNodeId);
                const endNode = getNodeById(endNodeId);
                
                if (startNode && endNode && startNode.properties?.nodeid && endNode.properties?.nodeid) {
                  try {
                    // 직선 경로 생성 (노드 간 fallback)
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
                    
                    // 폴리라인 추가
                    addPolyline(directPath, '#FF9500', 4, 0.7, 10);
                    allPolylinePaths.push(directPath);
                    
                    // fallback 경로 추가 완료 후 인덱스 업데이트
                    i = nextValidLinkIndex - 1;
                    continue;
                  } catch (e) {
                    console.error(`[ItineraryGeoJsonRenderer] Error creating fallback path:`, e);
                  }
                } else {
                  console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: Fallback 위한 노드 ID ${startNodeId} 또는 ${endNodeId} 찾을 수 없음.`);
                }
              }
            }
          }
          
          // 새 세그먼트 필요
          currentSegment = undefined;
          continue;
        }
        
        // 링크 좌표를 lat/lng 객체로 변환
        const pathCoords = linkCoords.map(coord => ({
          lat: coord[1],
          lng: coord[0]
        }));
        
        // 연속된 세그먼트 처리
        if (!currentSegment) {
          // 새 세그먼트 시작
          currentSegment = {
            start: i,
            end: i,
            coords: [...pathCoords]
          };
          segments.push(currentSegment);
        } else {
          // 기존 세그먼트에 추가 (마지막 좌표는 다음 링크의 첫 좌표와 동일하므로 제외)
          currentSegment.coords.push(...pathCoords.slice(1));
          currentSegment.end = i;
        }
        
        // 일정 길이 이상이면 또는 마지막 링크면 경로 렌더링
        if (currentSegment.coords.length > 100 || i === linkIds.length - 1) {
          const polylinePath = currentSegment.coords;
          
          // 경로 폴리라인 추가
          addPolyline(polylinePath, '#4285F4', 5, 0.8, 10);
          allPolylinePaths.push(polylinePath);
          
          // 새 세그먼트 시작
          currentSegment = undefined;
        }
      }
      
      // 누락된 링크 ID 보고
      if (missingLinkCount > 0) {
        console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: 누락/Fallback 처리된 Link ID 총 ${missingLinkCount}개 (전체: ${linkIds.length}개)`);
      }
      
      // 경로 캐시 업데이트
      console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: Link ID/Fallback 기반 계산된 폴리라인 경로 ${allPolylinePaths.length}개 캐시 업데이트 시도.`);
      updateDayPolylinePaths(itineraryDay.day, allPolylinePaths, itineraryDay);
      
    } 
    // 2. 서버에서 제공된 폴리라인 경로 데이터 사용 
    else if (allServerRoutesInput && allServerRoutesInput[itineraryDay.day] && 
             allServerRoutesInput[itineraryDay.day].polylinePaths && 
             allServerRoutesInput[itineraryDay.day].polylinePaths.length > 0) {
      
      const serverData = allServerRoutesInput[itineraryDay.day];
      console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: 서버 캐시된 경로 데이터 사용. ${serverData.polylinePaths.length}개 세그먼트`);
      
      // 저장된 폴리라인 경로 렌더링
      serverData.polylinePaths.forEach(path => {
        addPolyline(path, '#4285F4', 5, 0.8, 10);
      });
      
    } 
    // 3. 폴백: 장소들 사이에 직선 연결
    else if (itineraryDay.places && itineraryDay.places.length > 0) {
      console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: Link ID/서버 경로 없음. Fallback: 직선 연결 (${itineraryDay.places.length}개 장소).`);
      
      // 장소들을 연결하는 직선 경로 생성 (각 장소의 좌표 사이를 직선으로)
      const places = itineraryDay.places;
      
      // 모든 경로 세그먼트를 저장할 배열
      const allPolylinePaths: { lat: number; lng: number }[][] = [];
      
      // 장소 간 직선 경로 생성
      for (let i = 0; i < places.length - 1; i++) {
        const source = places[i];
        const target = places[i + 1];
        
        // 좌표 확인
        if (!source.x || !source.y || !target.x || !target.y) {
          console.warn(`[ItineraryGeoJsonRenderer] Invalid coordinates in Day ${itineraryDay.day} for places:`, 
                      source.name, target.name);
          continue;
        }
        
        // 직선 경로 생성
        const directPath = [
          { lat: source.y, lng: source.x },
          { lat: target.y, lng: target.x }
        ];
        
        // 경로 폴리라인 추가
        addPolyline(directPath, '#FF9500', 4, 0.7, 5);
        allPolylinePaths.push(directPath);
      }
      
      // 경로 캐시 업데이트
      console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: 직선 경로 ${allPolylinePaths.length}개 캐시 업데이트.`);
      updateDayPolylinePaths(itineraryDay.day, allPolylinePaths, itineraryDay);
    }
    
    console.log(`[ItineraryGeoJsonRenderer] 일차 ${itineraryDay.day} 경로 렌더링 종료.`);
    if (onComplete) onComplete();
  }, [map, addPolyline, clearAllMapPolylines, updateDayPolylinePaths]);

  return {
    renderItineraryRoute,
  };
};
