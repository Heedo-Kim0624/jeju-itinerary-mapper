import { useCallback, useRef } from 'react';
import type { Place, ItineraryDay } from '@/types/supabase';
import type { GeoJsonFeature, GeoJsonNodeProperties, GeoJsonLinkProperties } from '@/components/rightpanel/geojson/GeoJsonTypes';
import type { ServerRouteResponse, SegmentRoute } from '@/types/schedule';
import {
  createNaverPolyline,
  createNaverLatLng,
  fitBoundsToCoordinates
} from '@/utils/map/mapDrawing';

const DEFAULT_ROUTE_COLOR = '#007bff';
const USER_ROUTE_COLOR = '#2563EB';
const USER_ROUTE_WEIGHT = 5;
const USER_ROUTE_OPACITY = 0.7;
const USER_ROUTE_ZINDEX = 100;

interface UseRouteManagerProps {
  map: any;
  isNaverLoadedParam: boolean;
  geoJsonLinks: GeoJsonFeature[];
  geoJsonNodes: GeoJsonFeature[];
  mapPlacesWithGeoNodesFn: (places: Place[]) => Place[];
}

export const useRouteManager = ({
  map,
  isNaverLoadedParam,
  geoJsonLinks,
  geoJsonNodes,
  mapPlacesWithGeoNodesFn,
}: UseRouteManagerProps) => {
  const activePolylines = useRef<any[]>([]);
  const highlightedPathRef = useRef<any>(null);

  const drawRoutePathInternal = useCallback((
    currentMap: any,
    pathCoordinates: { lat: number; lng: number }[],
    color: string,
    weight: number = 5,
    opacity: number = 0.7,
    zIndex: number = 1
  ) => {
    if (!currentMap || !isNaverLoadedParam || pathCoordinates.length < 2) return null;

    const validCoords = pathCoordinates.filter(coord =>
      coord && typeof coord.lat === 'number' && typeof coord.lng === 'number' &&
      !isNaN(coord.lat) && !isNaN(coord.lng)
    );

    if (validCoords.length < 2) {
      console.warn('[RouteManager] drawRoutePathInternal: Not enough valid coordinates for path.');
      return null;
    }
    
    const naverPath = validCoords.map(coord => createNaverLatLng(coord.lat, coord.lng)).filter(p => p !== null);
     if (naverPath.length < 2) { // Check after filtering nulls from createNaverLatLng
      console.warn('[RouteManager] drawRoutePathInternal: Not enough valid Naver LatLng objects for path.');
      return null;
    }


    try {
      const polyline = createNaverPolyline(currentMap, naverPath as any[], { // Cast as any[] because filter(p => p !== null) ensures non-null
        strokeColor: color,
        strokeWeight: weight,
        strokeOpacity: opacity,
        zIndex: zIndex,
      });
      return polyline;
    } catch (error) {
      console.error('[RouteManager] Error creating polyline:', error);
      return null;
    }
  }, [isNaverLoadedParam]);

  const clearAllDrawnRoutes = useCallback(() => {
    console.log('[RouteManager] Clearing all routes and UI elements.');
    activePolylines.current.forEach(p => {
      if (p && typeof p.setMap === 'function') p.setMap(null);
    });
    activePolylines.current = [];

    if (highlightedPathRef.current && typeof highlightedPathRef.current.setMap === 'function') {
      highlightedPathRef.current.setMap(null);
    }
    highlightedPathRef.current = null;
  }, []);

  const renderItineraryRoute = useCallback(
    (
      itineraryDay: ItineraryDay | null,
      _allServerRoutesInput?: Record<number, ServerRouteResponse>,
      onComplete?: () => void
    ) => {
      if (!map || !isNaverLoadedParam) {
        console.log('[RouteManager] Map not ready for rendering itinerary route.');
        if (onComplete) onComplete();
        return;
      }

      clearAllDrawnRoutes();

      if (!itineraryDay || !itineraryDay.routeData || !itineraryDay.routeData.linkIds || itineraryDay.routeData.linkIds.length === 0) {
        console.warn('[RouteManager] No itinerary day or linkIds to render route.');
        if (itineraryDay && itineraryDay.places && itineraryDay.places.length > 1) {
            const mappedPlaces = mapPlacesWithGeoNodesFn(itineraryDay.places);
            const validPlaces = mappedPlaces.filter(p =>
                typeof p.x === 'number' && typeof p.y === 'number' &&
                !isNaN(p.x) && !isNaN(p.y)
            );
            if (validPlaces.length > 1) {
                console.log("[RouteManager] No linkIds, drawing direct lines between mapped places.");
                const pathCoordinates = validPlaces.map(p => ({ lat: p.y as number, lng: p.x as number }));
                const polyline = drawRoutePathInternal(map, pathCoordinates, USER_ROUTE_COLOR, 3, USER_ROUTE_OPACITY, USER_ROUTE_ZINDEX -10);
                if (polyline) activePolylines.current.push(polyline);

                const naverCoords = pathCoordinates.map(c => createNaverLatLng(c.lat, c.lng)).filter(p => p !== null) as any[];
                if (naverCoords.length > 0) fitBoundsToCoordinates(map, naverCoords);
            }
        }
        if (onComplete) onComplete();
        return;
      }

      try {
        const { linkIds } = itineraryDay.routeData;
        console.log(`[RouteManager] 경로 렌더링: ${linkIds.length}개의 링크 ID 처리 시작. Using geoJsonLinks count: ${geoJsonLinks.length}`);

        const allRouteCoordinatesForBounds: { lat: number; lng: number }[][] = [];
        let missingLinkCount = 0;

        linkIds.forEach(linkId => {
          // Use type assertion for properties
          const linkFeature = geoJsonLinks.find(
            (feature: GeoJsonFeature) => String((feature.properties as GeoJsonLinkProperties).LINK_ID) === String(linkId)
          );

          if (linkFeature && linkFeature.geometry && linkFeature.geometry.type === 'LineString' && Array.isArray(linkFeature.geometry.coordinates)) {
            const coords = linkFeature.geometry.coordinates;
            const pathCoordsForPolyline = coords.map((coordPair: number[]) => {
              if (Array.isArray(coordPair) && coordPair.length >= 2 && typeof coordPair[0] === 'number' && typeof coordPair[1] === 'number') {
                return { lat: coordPair[1], lng: coordPair[0] };
              }
              return null;
            }).filter(c => c !== null) as { lat: number; lng: number }[];

            if (pathCoordsForPolyline.length >= 2) {
              const polyline = drawRoutePathInternal(map, pathCoordsForPolyline, USER_ROUTE_COLOR, USER_ROUTE_WEIGHT, USER_ROUTE_OPACITY, USER_ROUTE_ZINDEX);
              if (polyline) {
                activePolylines.current.push(polyline);
                allRouteCoordinatesForBounds.push(pathCoordsForPolyline);
              }
            } else {
                 console.warn(`[RouteManager] LINK_ID ${linkId} has insufficient valid coordinates after processing.`);
            }
          } else {
            console.warn(`[RouteManager] LINK_ID ${linkId}에 해당하는 데이터를 geoJsonLinks에서 찾지 못했거나 형식이 올바르지 않습니다. Feature:`, linkFeature);
            missingLinkCount++;
          }
        });

        console.log(`[RouteManager] 경로 좌표 추출 및 폴리라인 생성 결과: ${activePolylines.current.length}개 폴리라인 (누락된 LINK_ID: ${missingLinkCount}개)`);

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
        console.error("[RouteManager] Error rendering itinerary route from links:", error);
      }
      if (onComplete) onComplete();
    },
    [map, isNaverLoadedParam, geoJsonLinks, drawRoutePathInternal, mapPlacesWithGeoNodesFn, clearAllDrawnRoutes]
  );

  const renderGeoJsonRoute = useCallback((route: SegmentRoute) => {
    if (!map || !isNaverLoadedParam || !route || !route.nodeIds || !route.linkIds) {
      console.warn('[RouteManager] Cannot render GeoJSON route: invalid input or map not ready');
      return;
    }

    clearAllDrawnRoutes();

    // Use type assertion for properties
    const routeNodes = route.nodeIds.map(nodeId => {
      return geoJsonNodes.find(node => String((node.properties as GeoJsonNodeProperties).NODE_ID) === String(nodeId));
    }).filter(Boolean); // filter(Boolean) is a good way to remove null/undefined

    if (routeNodes.length < 2) {
      console.warn('[RouteManager] Not enough valid nodes to render GeoJSON route');
      return;
    }

    const coordinates = routeNodes.map(node => {
      // node here is GeoJsonFeature, so node.geometry is fine
      if (node && node.geometry.type === 'Point') { 
        const [lng, lat] = (node.geometry.coordinates as [number, number]);
        return { lat, lng };
      }
      return null;
    }).filter(Boolean) as { lat: number; lng: number }[];

    if (coordinates.length < 2) {
      console.warn('[RouteManager] Not enough valid coordinates to render GeoJSON route');
      return;
    }

    const polyline = drawRoutePathInternal(map, coordinates, DEFAULT_ROUTE_COLOR);
    if (polyline) {
      activePolylines.current.push(polyline);
    }

    const naverCoords = coordinates.map(c => createNaverLatLng(c.lat, c.lng)).filter(c => c !== null) as any[];
    if (naverCoords.length > 0) {
      fitBoundsToCoordinates(map, naverCoords);
    }
  }, [map, isNaverLoadedParam, geoJsonNodes, drawRoutePathInternal, clearAllDrawnRoutes]);

  const highlightSegment = useCallback((segment: SegmentRoute | null) => {
    if (highlightedPathRef.current) {
      highlightedPathRef.current.setMap(null);
      highlightedPathRef.current = null;
    }

    if (!map || !isNaverLoadedParam || !segment || !segment.nodeIds || segment.nodeIds.length < 2) {
      return;
    }

    // Use type assertion for properties
    const segmentNodes = segment.nodeIds.map(nodeId => {
      return geoJsonNodes.find(node => String((node.properties as GeoJsonNodeProperties).NODE_ID) === String(nodeId));
    }).filter(Boolean); // filter(Boolean) is a good way to remove null/undefined

    if (segmentNodes.length < 2) {
      console.warn('[RouteManager] Not enough valid nodes to highlight segment');
      return;
    }
    
    const coordinates = segmentNodes.map(node => {
      // node here is GeoJsonFeature
      if (node && node.geometry.type === 'Point') {
        const [lng, lat] = (node.geometry.coordinates as [number, number]);
        return { lat, lng };
      }
      return null;
    }).filter(Boolean) as { lat: number; lng: number }[];

    if (coordinates.length < 2) {
      console.warn('[RouteManager] Not enough valid coordinates to highlight segment');
      return;
    }

    const highlightColor = '#ffc107';
    const polyline = drawRoutePathInternal(map, coordinates, highlightColor, 6, 0.8, 200);
    if (polyline) {
      highlightedPathRef.current = polyline;
    }

    const naverCoords = coordinates.map(c => createNaverLatLng(c.lat, c.lng)).filter(c => c !== null) as any[];
    if (naverCoords.length > 0) {
      fitBoundsToCoordinates(map, naverCoords);
    }
  }, [map, isNaverLoadedParam, geoJsonNodes, drawRoutePathInternal]);

  const clearPreviousHighlightedPath = useCallback(() => {
    if (highlightedPathRef.current) {
      highlightedPathRef.current.setMap(null);
      highlightedPathRef.current = null;
    }
  }, []);
  
  const calculateAndDrawDirectRoutes = useCallback((placesToRoute: Place[]) => {
    if (!map || !isNaverLoadedParam || placesToRoute.length < 2) return; // Return void as per context

    const pathCoordinates = placesToRoute
        .filter(p => typeof p.x === 'number' && typeof p.y === 'number' && !isNaN(p.x) && !isNaN(p.y))
        .map(place => ({ lat: place.y as number, lng: place.x as number }));

    if (pathCoordinates.length < 2) return;

    const polyline = drawRoutePathInternal(map, pathCoordinates, '#22c55e', 4);
    if (polyline) {
      activePolylines.current.push(polyline);
    }
    // No return value, polylines managed internally
  }, [map, isNaverLoadedParam, drawRoutePathInternal]);

  return {
    renderItineraryRoute,
    renderGeoJsonRoute,
    highlightSegment,
    clearPreviousHighlightedPath,
    clearAllDrawnRoutes,
    calculateAndDrawDirectRoutes,
  };
};
