
import { useCallback, useEffect } from 'react';
import type { Place, ItineraryDay } from '@/types/supabase';
import type { GeoJsonFeature, GeoJsonLinkProperties, GeoCoordinates, GeoLink } from '@/components/rightpanel/geojson/GeoJsonTypes'; // Added GeoLink
import type { ServerRouteResponse } from '@/types/schedule';
import { createNaverLatLng } from '@/utils/map/mapSetup';
import { fitBoundsToCoordinates } from '@/utils/map/mapViewControls';
import { useGeoJsonContext } from '@/contexts/GeoJsonContext'; // Import useGeoJsonContext

const USER_ROUTE_COLOR = '#2563EB';
const USER_ROUTE_WEIGHT = 5;
const USER_ROUTE_OPACITY = 0.7;
const USER_ROUTE_ZINDEX = 100;

interface UseItineraryGeoJsonRendererProps {
  map: any;
  isNaverLoadedParam: boolean;
  // geoJsonLinks prop is no longer primary; context will be used. Kept for potential fallback or transition.
  geoJsonLinks: GeoLink[]; // Type updated to GeoLink[]
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
  geoJsonLinks: propsGeoJsonLinks, // Renamed to distinguish from context
  mapPlacesWithGeoNodesFn,
  addPolyline,
  clearAllMapPolylines,
}: UseItineraryGeoJsonRendererProps) => {
  const { 
    geoJsonLinks: contextGeoJsonLinks, 
    isGeoJsonLoaded: isContextGeoJsonLoaded,
    getLinkByLinkIdFromContext 
  } = useGeoJsonContext();

  // Determine which geoJsonLinks to use (Context first, then props as fallback)
  const effectiveGeoJsonLinks = isContextGeoJsonLoaded && contextGeoJsonLinks.length > 0 
    ? contextGeoJsonLinks 
    : propsGeoJsonLinks;

  useEffect(() => {
    console.log('[ItineraryGeoJsonRenderer] Effective GeoJSON Links Updated:', {
      count: effectiveGeoJsonLinks.length,
      fromContext: isContextGeoJsonLoaded && contextGeoJsonLinks.length > 0,
      contextCount: contextGeoJsonLinks.length,
      propsCount: propsGeoJsonLinks.length,
      firstLinkContextId: contextGeoJsonLinks.length > 0 ? contextGeoJsonLinks[0].id : 'N/A',
      firstLinkPropsId: propsGeoJsonLinks.length > 0 ? propsGeoJsonLinks[0].id : 'N/A',
    });
  }, [effectiveGeoJsonLinks, contextGeoJsonLinks, propsGeoJsonLinks, isContextGeoJsonLoaded]);
  
  const renderItineraryRoute = useCallback(
    (
      itineraryDay: ItineraryDay | null,
      _allServerRoutesInput?: Record<number, ServerRouteResponse>,
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
        // ... (fallback to direct lines if no linkIds, existing logic can be kept)
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
        console.log(`[ItineraryGeoJsonRenderer] 경로 렌더링 시작: ${linkIds.length}개의 링크 ID 처리. Using effectiveGeoJsonLinks count: ${effectiveGeoJsonLinks.length}`);

        if (effectiveGeoJsonLinks.length === 0 && linkIds.length > 0) {
            console.warn('[ItineraryGeoJsonRenderer] effectiveGeoJsonLinks가 비어있지만 linkIds는 존재합니다. 데이터 소스 확인 필요.');
        }
        
        if (effectiveGeoJsonLinks.length > 0 && getLinkByLinkIdFromContext === undefined) {
            console.warn('[ItineraryGeoJsonRenderer] getLinkByLinkIdFromContext is undefined. Context might not be fully initialized.');
        }


        const allRouteCoordinatesForBounds: { lat: number; lng: number }[][] = [];
        let missingLinkCount = 0;
        let drawnPolylinesCount = 0;

        linkIds.forEach((linkIdInput, index) => {
          // linkIdInput can be number or string from routeData
          const stringLinkIdToFind = String(linkIdInput).trim();
          
          // Use getLinkByLinkIdFromContext for efficient lookup
          const linkFeature = getLinkByLinkIdFromContext(stringLinkIdToFind);

          if (index < 5) { // Log first few attempts
            console.log(`[ItineraryGeoJsonRenderer] Attempting to find Link ID: "${stringLinkIdToFind}"`, {
                found: !!linkFeature,
                contextMapSize: contextGeoJsonLinks.length // Reflects context map size indirectly
            });
            if (linkFeature) {
                console.log(`[ItineraryGeoJsonRenderer] Found feature for "${stringLinkIdToFind}":`, { id: linkFeature.id, props: linkFeature.properties });
            }
          }

          if (linkFeature && linkFeature.geometry && linkFeature.geometry.type === 'LineString' && Array.isArray(linkFeature.geometry.coordinates)) {
            const coords = linkFeature.geometry.coordinates as GeoCoordinates[];
            const pathCoordsForPolyline = coords.map((coordPair: GeoCoordinates) => {
              if (coordPair && typeof coordPair[0] === 'number' && typeof coordPair[1] === 'number') {
                return { lat: coordPair[1], lng: coordPair[0] };
              }
              console.warn('[ItineraryGeoJsonRenderer] Invalid coordinate pair in linkFeature geometry:', coordPair, 'for LinkID:', stringLinkIdToFind);
              return null;
            }).filter(c => c !== null) as { lat: number; lng: number }[];

            if (pathCoordsForPolyline.length >= 2) {
              const polyline = addPolyline(pathCoordsForPolyline, USER_ROUTE_COLOR, USER_ROUTE_WEIGHT, USER_ROUTE_OPACITY, USER_ROUTE_ZINDEX);
              if (polyline) {
                drawnPolylinesCount++;
                allRouteCoordinatesForBounds.push(pathCoordsForPolyline);
              }
            } else {
                console.warn(`[ItineraryGeoJsonRenderer] Link ID "${stringLinkIdToFind}" has insufficient valid coordinates after processing. Original coords count: ${coords.length}`);
            }
          } else {
            missingLinkCount++;
            if (missingLinkCount <= 5) {
              console.warn(`[ItineraryGeoJsonRenderer] Link ID "${stringLinkIdToFind}"에 해당하는 GeoLink 데이터를 찾지 못했거나 형식이 올바르지 않습니다. Looked up in context map.`);
            }
          }
        });

        console.log(`[ItineraryGeoJsonRenderer] 경로 좌표 추출 및 폴리라인 생성 결과: ${drawnPolylinesCount}개 폴리라인 (누락된 LINK_ID: ${missingLinkCount}개)`);

        // ... (fitBounds logic, existing code can be kept)
        if (allRouteCoordinatesForBounds.length > 0) {
          const flatCoordsForBounds = allRouteCoordinatesForBounds.flat();
           if (flatCoordsForBounds.length > 0) {
            const naverCoords = flatCoordsForBounds.map(c => createNaverLatLng(c.lat, c.lng)).filter(p => p !== null) as any[];
            if (naverCoords.length > 0) fitBoundsToCoordinates(map, naverCoords);
          }
        } else if (itineraryDay.places && itineraryDay.places.length > 0) {
            // ... (fallback to fit bounds to places, existing code can be kept)
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
    // Dependencies updated to use context-derived values
    [
        map, 
        isNaverLoadedParam, 
        addPolyline, 
        mapPlacesWithGeoNodesFn, 
        clearAllMapPolylines,
        getLinkByLinkIdFromContext, // Added
        // effectiveGeoJsonLinks is derived, contextGeoJsonLinks / isContextGeoJsonLoaded should be enough
        // or getLinkByLinkIdFromContext which depends on the internal map.
        contextGeoJsonLinks, 
        isContextGeoJsonLoaded
    ]
  );

  return { renderItineraryRoute };
};
