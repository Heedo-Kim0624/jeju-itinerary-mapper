
import { useCallback } from 'react';
import type { Place, ItineraryDay } from '@/types/supabase';
import type { GeoJsonFeature, GeoJsonLinkProperties, GeoCoordinates } from '@/components/rightpanel/geojson/GeoJsonTypes';
import type { ServerRouteResponse } from '@/types/schedule';
import { createNaverLatLng } from '@/utils/map/mapSetup';
import { fitBoundsToCoordinates } from '@/utils/map/mapViewControls';

const USER_ROUTE_COLOR = '#2563EB';
const USER_ROUTE_WEIGHT = 5;
const USER_ROUTE_OPACITY = 0.7;
const USER_ROUTE_ZINDEX = 100;

interface UseItineraryGeoJsonRendererProps {
  map: any;
  isNaverLoadedParam: boolean;
  geoJsonLinks: GeoJsonFeature[];
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
  geoJsonLinks,
  mapPlacesWithGeoNodesFn,
  addPolyline,
  clearAllMapPolylines,
}: UseItineraryGeoJsonRendererProps) => {
  const renderItineraryRoute = useCallback(
    (
      itineraryDay: ItineraryDay | null,
      _allServerRoutesInput?: Record<number, ServerRouteResponse>, // Kept for signature consistency
      onComplete?: () => void
    ) => {
      if (!map || !isNaverLoadedParam) {
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
                !isNaN(p.x) && !isNaN(p.y)
            );
            if (validPlaces.length > 1) {
                console.log("[ItineraryGeoJsonRenderer] No linkIds, drawing direct lines between mapped places.");
                const pathCoordinates = validPlaces.map(p => ({ lat: p.y as number, lng: p.x as number }));
                addPolyline(pathCoordinates, USER_ROUTE_COLOR, 3, USER_ROUTE_OPACITY, USER_ROUTE_ZINDEX -10);

                const naverCoords = pathCoordinates.map(c => createNaverLatLng(c.lat, c.lng)).filter(p => p !== null) as any[];
                if (naverCoords.length > 0) fitBoundsToCoordinates(map, naverCoords);
            }
        }
        if (onComplete) onComplete();
        return;
      }

      try {
        const { linkIds } = itineraryDay.routeData;
        console.log(`[ItineraryGeoJsonRenderer] 경로 렌더링: ${linkIds.length}개의 링크 ID 처리 시작. Using geoJsonLinks count: ${geoJsonLinks.length}`);

        const allRouteCoordinatesForBounds: { lat: number; lng: number }[][] = [];
        let missingLinkCount = 0;
        let drawnPolylinesCount = 0;

        // 개선된 링크 탐색 로직
        linkIds.forEach(linkId => {
          const stringLinkId = String(linkId);
          
          // LINK_ID 필드를 properties 객체에서 정확하게 확인
          const linkFeature = geoJsonLinks.find(feature => {
            if (feature && feature.properties) {
              // 대소문자와 공백을 무시하고 LINK_ID 필드명 검색
              const props = feature.properties as GeoJsonLinkProperties;
              
              // 다양한 필드명 형식 지원 (LINK_ID, link_id, Link_Id 등)
              const linkIdProperties = [
                props.LINK_ID, 
                props.link_id, 
                props.Link_Id,
                props.linkId,
                props.LinkId
              ];
              
              // 숫자나 문자열 타입 모두 지원
              return linkIdProperties.some(
                prop => prop !== undefined && String(prop) === stringLinkId
              );
            }
            return false;
          });

          if (linkFeature && linkFeature.geometry && linkFeature.geometry.type === 'LineString' && Array.isArray(linkFeature.geometry.coordinates)) {
            const coords = linkFeature.geometry.coordinates as GeoCoordinates[];
            const pathCoordsForPolyline = coords.map((coordPair: GeoCoordinates) => {
              if (coordPair && typeof coordPair[0] === 'number' && typeof coordPair[1] === 'number') {
                return { lat: coordPair[1], lng: coordPair[0] };
              }
              console.warn('[ItineraryGeoJsonRenderer] Invalid coordinate pair encountered in linkFeature geometry:', coordPair);
              return null;
            }).filter(c => c !== null) as { lat: number; lng: number }[];

            if (pathCoordsForPolyline.length >= 2) {
              const polyline = addPolyline(pathCoordsForPolyline, USER_ROUTE_COLOR, USER_ROUTE_WEIGHT, USER_ROUTE_OPACITY, USER_ROUTE_ZINDEX);
              if (polyline) {
                drawnPolylinesCount++;
                allRouteCoordinatesForBounds.push(pathCoordsForPolyline);
              }
            } else {
                console.warn(`[ItineraryGeoJsonRenderer] LINK_ID ${linkId} has insufficient valid coordinates after processing.`);
            }
          } else {
            missingLinkCount++;
            // 추가적인 디버그 정보 기록
            if (missingLinkCount <= 5) { // 처음 5개만 상세 로깅하여 로그 폭발 방지
              console.warn(`[ItineraryGeoJsonRenderer] LINK_ID ${linkId}에 해당하는 데이터를 geoJsonLinks에서 찾지 못했거나 형식이 올바르지 않습니다. Feature:`, linkFeature);
              
              // 디버그용: 첫 몇개 geoJsonLinks 항목 구조 확인
              if (missingLinkCount === 1 && geoJsonLinks.length > 0) {
                const sampleLink = geoJsonLinks[0];
                console.log(`[ItineraryGeoJsonRenderer] 샘플 geoJsonLinks 항목 구조:`, 
                  sampleLink ? {
                    type: sampleLink.type,
                    properties_keys: sampleLink.properties ? Object.keys(sampleLink.properties) : 'No properties',
                    geometry_type: sampleLink.geometry ? sampleLink.geometry.type : 'No geometry'
                  } : 'No sample link'
                );
              }
            }
          }
        });

        console.log(`[ItineraryGeoJsonRenderer] 경로 좌표 추출 및 폴리라인 생성 결과: ${drawnPolylinesCount}개 폴리라인 (누락된 LINK_ID: ${missingLinkCount}개)`);

        if (allRouteCoordinatesForBounds.length > 0) {
          const flatCoordsForBounds = allRouteCoordinatesForBounds.flat();
           if (flatCoordsForBounds.length > 0) {
            const naverCoords = flatCoordsForBounds.map(c => createNaverLatLng(c.lat, c.lng)).filter(p => p !== null) as any[];
            if (naverCoords.length > 0) fitBoundsToCoordinates(map, naverCoords);
          }
        } else if (itineraryDay.places && itineraryDay.places.length > 0) {
            const mappedPlaces = mapPlacesWithGeoNodesFn(itineraryDay.places);
            const validPlacesCoords = mappedPlaces
                .filter(p => typeof p.y === 'number' && typeof p.x === 'number' && !isNaN(p.y) && !isNaN(p.x))
                .map(p => ({ lat: p.y as number, lng: p.x as number }));
            if (validPlacesCoords.length > 0) {
                const naverCoords = validPlacesCoords.map(c => createNaverLatLng(c.lat, c.lng)).filter(p => p !== null) as any[];
                 if (naverCoords.length > 0) fitBoundsToCoordinates(map, naverCoords);
            }
        }
      } catch (error) {
        console.error("[ItineraryGeoJsonRenderer] Error rendering itinerary route from links:", error);
      }
      if (onComplete) onComplete();
    },
    [map, isNaverLoadedParam, geoJsonLinks, addPolyline, mapPlacesWithGeoNodesFn, clearAllMapPolylines]
  );

  return { renderItineraryRoute };
};
