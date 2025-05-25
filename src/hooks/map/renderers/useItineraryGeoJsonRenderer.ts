import { useCallback, useEffect } from 'react';
import type { Place, ItineraryDay } from '@/types/supabase';
import type { GeoCoordinates } from '@/components/rightpanel/geojson/GeoJsonTypes';
import type { ServerRouteDataForDay } from '@/hooks/map/useServerRoutes';
import { fitBoundsToCoordinates } from '@/utils/map/mapViewControls';
import { useGeoJsonContext } from '@/contexts/GeoJsonContext';
import { isValidCoordinate, coordsToNaverLatLngArray } from '@/utils/map/coordinateUtils';

const USER_ROUTE_COLOR = '#2563EB';
const USER_ROUTE_WEIGHT = 5;
const USER_ROUTE_OPACITY = 0.7;
const USER_ROUTE_ZINDEX = 100;

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
  updateDayPolylinePaths: (day: number, polylinePaths: { lat: number; lng: number }[][]) => void;
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
      const cachedPolylinePaths = currentDayServerData?.polylinePaths;

      try {
        let newCalculatedPolylinePaths: { lat: number; lng: number }[][] = [];
        let boundsFitCoords: { lat: number; lng: number }[] = [];

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
          const { linkIds } = itineraryDay.routeData;
          let missingLinkCount = 0;
          
          linkIds.forEach((linkIdInput) => {
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
            }
          });
          if (missingLinkCount > 0) console.warn(`[ItineraryGeoJsonRenderer] 누락된 Link ID 수: ${missingLinkCount}`);
          
          if (newCalculatedPolylinePaths.length > 0 && !cachedPolylinePaths) {
            console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: 계산된 폴리라인 경로 ${newCalculatedPolylinePaths.length}개 캐시 업데이트.`);
            updateDayPolylinePaths(itineraryDay.day, newCalculatedPolylinePaths);
          }
        } else {
          console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: Link ID 없거나 GeoJSON 미로드. 장소 간 직선 경로 시도.`);
          const mappedPlaces = mapPlacesWithGeoNodesFn(itineraryDay.places);
          const validPlaces = mappedPlaces.filter(p =>
              typeof p.x === 'number' && typeof p.y === 'number' &&
              !isNaN(p.x) && !isNaN(p.y) && isValidCoordinate(p.y, p.x)
          );
          if (validPlaces.length >= 2) {
            const directPathCoordinates = validPlaces.map(p => ({ lat: p.y as number, lng: p.x as number }));
            addPolyline(directPathCoordinates, USER_ROUTE_COLOR, 3, USER_ROUTE_OPACITY - 0.1, USER_ROUTE_ZINDEX - 10);
            newCalculatedPolylinePaths.push(directPathCoordinates); 
            boundsFitCoords.push(...directPathCoordinates);
            // 직선 경로도 필요시 캐시 업데이트
            // if (!cachedPolylinePaths) { // Only update if not already cached (though direct paths might not be cached often)
            //   updateDayPolylinePaths(itineraryDay.day, newCalculatedPolylinePaths);
            // }
            console.log(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: 직선 경로 ${newCalculatedPolylinePaths.length > 0 ? '생성됨' : '생성 실패'}`);
          } else {
            console.warn(`[ItineraryGeoJsonRenderer] Day ${itineraryDay.day}: 직선 경로를 그릴 유효한 장소가 2개 미만입니다.`);
          }
        }

        if (boundsFitCoords.length > 0) {
          const naverCoords = coordsToNaverLatLngArray(boundsFitCoords, window.naver.maps);
          if (naverCoords.length > 0) fitBoundsToCoordinates(map, naverCoords);
        } else if (itineraryDay.places && itineraryDay.places.length > 0) {
            const mappedPlaces = mapPlacesWithGeoNodesFn(itineraryDay.places);
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
        isContextGeoJsonLoaded,
        updateDayPolylinePaths,
    ]
  );

  return { renderItineraryRoute };
};
