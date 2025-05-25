import { useCallback, useEffect } from 'react';
import type { Place, ItineraryDay } from '@/types/supabase';
import type { GeoCoordinates, GeoNode } from '@/components/rightpanel/geojson/GeoJsonTypes';
import type { ServerRouteDataForDay } from '@/hooks/map/useServerRoutes';
import { fitBoundsToCoordinates } from '@/utils/map/mapViewControls';
import { useGeoJsonContext } from '@/contexts/GeoJsonContext';
import { isValidCoordinate, coordsToNaverLatLngArray } from '@/utils/map/coordinateUtils';

const USER_ROUTE_COLOR = '#2563EB';
const USER_ROUTE_WEIGHT = 5;
const USER_ROUTE_OPACITY = 0.7;
const USER_ROUTE_ZINDEX = 100;
const FALLBACK_ROUTE_COLOR = '#FF8C00';

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
  updateDayPolylinePaths: (
    day: number, 
    polylinePaths: { lat: number; lng: number }[][],
    currentItineraryDayData: ItineraryDay
  ) => void;
}

export const useItineraryGeoJsonRenderer = ({
  map,
  isNaverLoadedParam,
  mapPlacesWithGeoNodesFn,
  addPolyline,
  clearAllMapPolylines,
  updateDayPolylinePaths,
}: UseItineraryGeoJsonRendererProps) => {
  const {
    isGeoJsonLoaded: isContextGeoJsonLoaded,
    getLinkByLinkIdFromContext,
    getNodeByIdFromContext, // 추가
  } = useGeoJsonContext();

  useEffect(() => {
    console.log('[ItineraryGeoJsonRenderer] Context GeoJSON Loaded:', isContextGeoJsonLoaded);
  }, [isContextGeoJsonLoaded]);

  const renderItineraryRoute = useCallback(
    (
      itineraryDay: ItineraryDay | null,
      allServerRoutes?: Record<number, ServerRouteDataForDay>,
      onComplete?: () => void
    ) => {
      if (!map || !isNaverLoadedParam || !window.naver || !window.naver.maps) {
        console.log('[ItineraryGeoJsonRenderer] Map not ready.');
        if (onComplete) onComplete();
        return;
      }

      clearAllMapPolylines();

      if (!itineraryDay) {
        console.log('[ItineraryGeoJsonRenderer] No itineraryDay, clearing map.');
        if (onComplete) onComplete();
        return;
      }
      
      console.log(`[ItineraryGeoJsonRenderer] 일차 ${itineraryDay.day} 경로 렌더링 시작.`);
      const currentDayServerData = allServerRoutes ? allServerRoutes[itineraryDay.day] : null;
      
      if (currentDayServerData && !currentDayServerData.itineraryDayData) {
          console.warn(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: server data exists but itineraryDayData is missing.`);
      }
      
      const cachedPolylinePaths = currentDayServerData?.polylinePaths;

      try {
        let newCalculatedPolylinePaths: { lat: number; lng: number; }[][] = [];
        let boundsFitCoords: { lat: number; lng: number; }[] = [];

        if (cachedPolylinePaths && cachedPolylinePaths.length > 0) {
          console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: 캐시된 폴리라인 경로 ${cachedPolylinePaths.length}개 사용.`);
          cachedPolylinePaths.forEach(path => {
            if (path.length >=2) {
              addPolyline(path, USER_ROUTE_COLOR, USER_ROUTE_WEIGHT, USER_ROUTE_OPACITY, USER_ROUTE_ZINDEX);
              boundsFitCoords.push(...path);
            }
          });
          newCalculatedPolylinePaths = cachedPolylinePaths;
        } else if (itineraryDay.routeData?.linkIds && itineraryDay.routeData.linkIds.length > 0 && isContextGeoJsonLoaded) {
          console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: Link ID 기반 경로 계산. 링크 수: ${itineraryDay.routeData.linkIds.length}`);
          // const { linkIds, nodeIds } = itineraryDay.routeData; // nodeIds 사용하던 부분 -> getNodeByIdFromContext로 대체
          const linkIds = itineraryDay.routeData.linkIds;
          const interleavedRoute = itineraryDay.interleaved_route || [];
          let missingLinkCount = 0;
          
          linkIds.forEach((linkIdInput, index) => {
            const stringLinkIdToFind = String(linkIdInput).trim();
            const linkFeature = getLinkByLinkIdFromContext(stringLinkIdToFind);

            if (linkFeature?.geometry?.type === 'LineString' && Array.isArray(linkFeature.geometry.coordinates)) {
              const coords = linkFeature.geometry.coordinates as GeoCoordinates[];
              const pathCoordsForPolyline = coords.map((coordPair: GeoCoordinates) => {
                const lng = coordPair[0];
                const lat = coordPair[1];
                return isValidCoordinate(lat, lng) ? { lat, lng } : null;
              }).filter(c => c !== null) as { lat: number; lng: number }[];

              if (pathCoordsForPolyline.length >= 2) {
                addPolyline(pathCoordsForPolyline, USER_ROUTE_COLOR, USER_ROUTE_WEIGHT, USER_ROUTE_OPACITY, USER_ROUTE_ZINDEX);
                newCalculatedPolylinePaths.push(pathCoordsForPolyline);
                boundsFitCoords.push(...pathCoordsForPolyline);
              }
            } else {
              missingLinkCount++;
              console.warn(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: GeoJSON Link ID '${stringLinkIdToFind}' 없음. Fallback 시도.`);

              const prevNodeIdInInterleaved = interleavedRoute[2 * index];
              const nextNodeIdInInterleaved = interleavedRoute[2 * index + 2];

              if (prevNodeIdInInterleaved && nextNodeIdInInterleaved && getNodeByIdFromContext) { 
                const prevNode = getNodeByIdFromContext(String(prevNodeIdInInterleaved));
                const nextNode = getNodeByIdFromContext(String(nextNodeIdInInterleaved));

                if (prevNode?.geometry?.coordinates && nextNode?.geometry?.coordinates) {
                  // GeoNode.geometry.coordinates는 [lng, lat] 순서
                  const p1 = { lat: prevNode.geometry.coordinates[1] as number, lng: prevNode.geometry.coordinates[0] as number };
                  const p2 = { lat: nextNode.geometry.coordinates[1] as number, lng: nextNode.geometry.coordinates[0] as number };
                  
                  if (isValidCoordinate(p1.lat, p1.lng) && isValidCoordinate(p2.lat, p2.lng)) {
                    const fallbackPath = [p1, p2];
                    addPolyline(fallbackPath, FALLBACK_ROUTE_COLOR, USER_ROUTE_WEIGHT - 1, USER_ROUTE_OPACITY, USER_ROUTE_ZINDEX -1);
                    newCalculatedPolylinePaths.push(fallbackPath);
                    boundsFitCoords.push(...fallbackPath);
                    console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: Fallback 경로 (직선) ${prevNode.id} -> ${nextNode.id} 생성됨.`);
                  } else {
                     console.warn(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: Fallback 위한 노드 좌표 유효하지 않음: ${prevNode.id}, ${nextNode.id}`);
                  }
                } else {
                  console.warn(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: Fallback 위한 노드 ID ${prevNodeIdInInterleaved} 또는 ${nextNodeIdInInterleaved} 찾을 수 없음.`);
                }
              } else {
                  console.warn(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: Fallback 위한 노드 ID를 interleaved_route에서 추출 불가 또는 getNodeByIdFromContext 사용 불가. Index: ${index}`);
              }
            }
          });
          
          if (missingLinkCount > 0) console.warn(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: 누락/Fallback 처리된 Link ID 총 ${missingLinkCount}개 (전체: ${linkIds.length}개)`);
          
          if (newCalculatedPolylinePaths.length > 0) {
            console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: Link ID/Fallback 기반 계산된 폴리라인 경로 ${newCalculatedPolylinePaths.length}개 캐시 업데이트 시도.`);
            updateDayPolylinePaths(itineraryDay.day, newCalculatedPolylinePaths, itineraryDay);
          }
        } else {
          console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: Link ID 없거나 GeoJSON 미로드. 장소 간 직선 경로 시도.`);
          const placesToDraw = itineraryDay.places;
          const mappedPlaces = mapPlacesWithGeoNodesFn(placesToDraw);
          const validPlaces = mappedPlaces.filter(p =>
              typeof p.x === 'number' && typeof p.y === 'number' &&
              !isNaN(p.x) && !isNaN(p.y) && isValidCoordinate(p.y, p.x)
          );

          if (validPlaces.length >= 2) {
            const directPathCoordinates = validPlaces.map(p => ({ lat: p.y as number, lng: p.x as number }));
            addPolyline(directPathCoordinates, USER_ROUTE_COLOR, 3, USER_ROUTE_OPACITY - 0.1, USER_ROUTE_ZINDEX - 10);
            newCalculatedPolylinePaths.push(directPathCoordinates); 
            boundsFitCoords.push(...directPathCoordinates);
            
            console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: 직선 경로 생성됨. 캐시 업데이트 시도.`);
            updateDayPolylinePaths(itineraryDay.day, newCalculatedPolylinePaths, itineraryDay);
          } else {
            console.warn(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: 직선 경로를 그릴 유효한 장소가 2개 미만입니다. (유효 장소 ${validPlaces.length}개)`);
          }
        }

        if (boundsFitCoords.length > 0) {
          const naverCoords = coordsToNaverLatLngArray(boundsFitCoords, window.naver.maps);
          if (naverCoords.length > 0) fitBoundsToCoordinates(map, naverCoords);
        } else if (itineraryDay.places && itineraryDay.places.length > 0) {
            const placesToBound = itineraryDay.places;
            const mappedPlaces = mapPlacesWithGeoNodesFn(placesToBound);
            const validPlacesCoords = mappedPlaces
                .filter(p => typeof p.y === 'number' && typeof p.x === 'number' && isValidCoordinate(p.y,p.x))
                .map(p => ({ lat: p.y as number, lng: p.x as number }));
            if (validPlacesCoords.length > 0) {
                const naverCoords = coordsToNaverLatLngArray(validPlacesCoords, window.naver.maps);
                 if (naverCoords.length > 0) {
                   fitBoundsToCoordinates(map, naverCoords);
                 }
            }
        }
      } catch (error) {
        console.error(`[ItineraryGeoJsonRenderer] 일차 ${itineraryDay.day} 경로 렌더링 중 오류:`, error);
      } finally {
        if (onComplete) onComplete();
        console.log(`[ItineraryGeoJsonRenderer] 일차 ${itineraryDay.day} 경로 렌더링 종료.`);
      }
    },
    [
        map,
        isNaverLoadedParam,
        addPolyline,
        clearAllMapPolylines,
        mapPlacesWithGeoNodesFn,
        getLinkByLinkIdFromContext,
        getNodeByIdFromContext, // 의존성 배열에 추가
        isContextGeoJsonLoaded,
        updateDayPolylinePaths,
    ]
  );

  return { renderItineraryRoute };
};
