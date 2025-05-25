
import { useCallback, useEffect } from 'react';
import type { Place, ItineraryDay } from '@/types/supabase';
import type { GeoCoordinates } from '@/components/rightpanel/geojson/GeoJsonTypes'; // GeoLink 제거, GeoCoordinates만 사용
import type { ServerRouteResponse } from '@/types/schedule';
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
}

export const useItineraryGeoJsonRenderer = ({
  map,
  isNaverLoadedParam,
  mapPlacesWithGeoNodesFn,
  addPolyline,
  clearAllMapPolylines,
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
      _allServerRoutesInput?: Record<number, ServerRouteResponse>,
      onComplete?: () => void
    ) => {
      if (!map || !isNaverLoadedParam || !window.naver || !window.naver.maps) {
        console.log('[ItineraryGeoJsonRenderer] Map not ready for rendering itinerary route.');
        if (onComplete) onComplete();
        return;
      }

      clearAllMapPolylines();

      if (!itineraryDay || !itineraryDay.routeData || !itineraryDay.routeData.linkIds || itineraryDay.routeData.linkIds.length === 0) {
        console.warn('[ItineraryGeoJsonRenderer] No itinerary day or linkIds to render route.');
        if (itineraryDay && itineraryDay.places && itineraryDay.places.length > 1) {
            const mappedPlaces = mapPlacesWithGeoNodesFn(itineraryDay.places);
            const validPlaces = mappedPlaces.filter(p =>
                typeof p.x === 'number' && typeof p.y === 'number' &&
                !isNaN(p.x) && !isNaN(p.y) &&
                isValidCoordinate(p.y, p.x)
            );
            if (validPlaces.length > 1) {
                console.log("[ItineraryGeoJsonRenderer] No linkIds, drawing direct lines between mapped places.");
                const pathCoordinates = validPlaces.map(p => ({ lat: p.y as number, lng: p.x as number }));
                addPolyline(pathCoordinates, USER_ROUTE_COLOR, 3, USER_ROUTE_OPACITY, USER_ROUTE_ZINDEX -10);

                const naverCoords = coordsToNaverLatLngArray(pathCoordinates, window.naver.maps);
                if (naverCoords.length > 0) fitBoundsToCoordinates(map, naverCoords);
            }
        }
        if (onComplete) onComplete();
        return;
      }

      try {
        const { linkIds } = itineraryDay.routeData;
        console.log(`[ItineraryGeoJsonRenderer] 경로 렌더링 시작: ${linkIds.length}개의 링크 ID 처리.`);

        if (!isContextGeoJsonLoaded) {
            console.warn('[ItineraryGeoJsonRenderer] GeoJSON context not loaded. Cannot reliably find links.');
        }
        if (typeof getLinkByLinkIdFromContext !== 'function') {
            console.warn('[ItineraryGeoJsonRenderer] getLinkByLinkIdFromContext is not available. Context might not be fully initialized.');
            if (onComplete) onComplete();
            return;
        }

        const allRouteCoordinatesForBounds: { lat: number; lng: number }[][] = [];
        let missingLinkCount = 0;
        let drawnPolylinesCount = 0;

        linkIds.forEach((linkIdInput, linkProcessingIndex) => { // Renamed 'index' to 'linkProcessingIndex' to avoid conflict
          const stringLinkIdToFind = String(linkIdInput).trim();
          const linkFeature = getLinkByLinkIdFromContext(stringLinkIdToFind);

          if (linkProcessingIndex < 5) { // Log first few link lookups
            console.log(`[ItineraryGeoJsonRenderer] Attempting to find Link ID: "${stringLinkIdToFind}"`, {
                found: !!linkFeature,
            });
            if (linkFeature) {
                console.log(`[ItineraryGeoJsonRenderer] Found feature for "${stringLinkIdToFind}":`, { id: linkFeature.id, props: linkFeature.properties });
            }
          }

          if (linkFeature && linkFeature.geometry && linkFeature.geometry.type === 'LineString' && Array.isArray(linkFeature.geometry.coordinates)) {
            const coords = linkFeature.geometry.coordinates as GeoCoordinates[];
            
            // Enhanced coordinate processing and logging as per user's guide
            const pathCoordsForPolyline = coords.map((coordPair: GeoCoordinates, coordPairIndex: number) => {
              if (!coordPair || !Array.isArray(coordPair) || coordPair.length < 2) {
                console.warn(`[ItineraryGeoJsonRenderer] 유효하지 않은 좌표 쌍 형식 (Link ID: ${stringLinkIdToFind}, Pair Index: ${coordPairIndex}): ${JSON.stringify(coordPair)}`);
                return null;
              }
              
              const [lng, lat] = coordPair;
              
              // Using existing isValidCoordinate, but with enhanced logging around it
              if (!isValidCoordinate(lat, lng)) {
                console.warn(`[ItineraryGeoJsonRenderer] 유효하지 않거나 범위를 벗어난 좌표 값 (Link ID: ${stringLinkIdToFind}, Pair Index: ${coordPairIndex}): lng=${lng}, lat=${lat}`);
                return null;
              }
              
              // Log first few coordinates of each link for debugging, as per user's guide
              if (coordPairIndex < 3) {
                console.log(`[ItineraryGeoJsonRenderer] Link ID ${stringLinkIdToFind} 좌표 변환 (${coordPairIndex}): [${lng}, ${lat}] -> {lat: ${lat}, lng: ${lng}}`);
              }
              
              return { lat, lng };
            }).filter(c => c !== null) as { lat: number; lng: number }[];


            if (pathCoordsForPolyline.length >= 2) {
              // Log polyline creation coordinates sample, as per user's guide
              console.log(`[ItineraryGeoJsonRenderer] 폴리라인 생성 좌표 샘플 (Link ID: ${stringLinkIdToFind}):`, 
                pathCoordsForPolyline.slice(0, 2).map(c => `{lat: ${c.lat}, lng: ${c.lng}}`));
              
              const polyline = addPolyline(pathCoordsForPolyline, USER_ROUTE_COLOR, USER_ROUTE_WEIGHT, USER_ROUTE_OPACITY, USER_ROUTE_ZINDEX);
              if (polyline) {
                drawnPolylinesCount++;
                allRouteCoordinatesForBounds.push(pathCoordsForPolyline);
              } else {
                console.warn(`[ItineraryGeoJsonRenderer] addPolyline 반환값이 null 입니다 (Link ID: ${stringLinkIdToFind}). 폴리라인이 생성되지 않았습니다.`);
              }
            } else {
                console.warn(`[ItineraryGeoJsonRenderer] Link ID "${stringLinkIdToFind}" has insufficient valid coordinates after processing. Original coords count: ${coords.length}, Validated: ${pathCoordsForPolyline.length}`);
            }
          } else {
            missingLinkCount++;
            if (missingLinkCount <= 5 || linkProcessingIndex < 5) {
              console.warn(`[ItineraryGeoJsonRenderer] Link ID "${stringLinkIdToFind}" not found in context or invalid geometry.`);
            }
          }
        });

        console.log(`[ItineraryGeoJsonRenderer] 경로 좌표 추출 및 폴리라인 생성 결과: ${drawnPolylinesCount}개 폴리라인 (누락된 LINK_ID: ${missingLinkCount}개)`);

        if (allRouteCoordinatesForBounds.length > 0) {
          const flatCoordsForBounds = allRouteCoordinatesForBounds.flat();
           if (flatCoordsForBounds.length > 0) {
            console.log(`[ItineraryGeoJsonRenderer] 지도 범위 조정을 위한 평탄화된 좌표 ${flatCoordsForBounds.length}개 (샘플: ${JSON.stringify(flatCoordsForBounds.slice(0,2))})`);
            const naverCoords = coordsToNaverLatLngArray(flatCoordsForBounds, window.naver.maps);
            if (naverCoords.length > 0) {
              console.log(`[ItineraryGeoJsonRenderer] 지도 범위 조정을 위한 Naver LatLng 좌표 ${naverCoords.length}개 (샘플: ${naverCoords.slice(0,2).map(c => c.toString())})`);
              fitBoundsToCoordinates(map, naverCoords);
            } else {
              console.warn("[ItineraryGeoJsonRenderer] 지도 범위 조정을 위한 유효한 Naver LatLng 좌표가 없습니다.");
            }
          }
        } else if (itineraryDay.places && itineraryDay.places.length > 0) {
            const mappedPlaces = mapPlacesWithGeoNodesFn(itineraryDay.places);
            const validPlacesCoords = mappedPlaces
                .filter(p => typeof p.y === 'number' && typeof p.x === 'number' && !isNaN(p.y) && !isNaN(p.x) && isValidCoordinate(p.y,p.x))
                .map(p => ({ lat: p.y as number, lng: p.x as number }));
            if (validPlacesCoords.length > 0) {
                const naverCoords = coordsToNaverLatLngArray(validPlacesCoords, window.naver.maps);
                 if (naverCoords.length > 0) {
                   console.log("[ItineraryGeoJsonRenderer] 링크 경로 데이터가 없지만, 장소 데이터를 기반으로 지도 범위를 조정합니다.");
                   fitBoundsToCoordinates(map, naverCoords);
                 }
            }
        }
      } catch (error) {
        console.error("[ItineraryGeoJsonRenderer] Error rendering itinerary route from links:", error);
      }
      if (onComplete) onComplete();
    },
    [
        map,
        isNaverLoadedParam,
        addPolyline,
        mapPlacesWithGeoNodesFn,
        clearAllMapPolylines,
        getLinkByLinkIdFromContext,
        isContextGeoJsonLoaded,
        // fitBoundsToCoordinates is imported, not a prop, so not in deps array
    ]
  );

  return { renderItineraryRoute };
};

