
import { useCallback } from 'react';
import type { Place, ItineraryDay } from '@/types/supabase';
import type { GeoJsonFeature, GeoJsonLinkProperties, GeoJsonNodeProperties, GeoCoordinates } from '@/components/rightpanel/geojson/GeoJsonTypes';
import type { ServerRouteResponse, SegmentRoute } from '@/types/schedule';
import { createNaverLatLng } from '@/utils/map/mapSetup';
import { fitBoundsToCoordinates } from '@/utils/map/mapViewControls';
import { useRoutePolylines } from './useRoutePolylines'; // New hook

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
  const {
    addPolyline,
    setHighlightedPolyline,
    clearAllMapPolylines,
    clearHighlightedPolyline: clearPreviousHighlight, // Alias for clarity
  } = useRoutePolylines({ map, isNaverLoadedParam });

  const clearAllDrawnRoutes = useCallback(() => {
    console.log('[RouteManager] Clearing all routes via useRoutePolylines.');
    clearAllMapPolylines();
  }, [clearAllMapPolylines]);

  const renderItineraryRoute = useCallback(
    (
      itineraryDay: ItineraryDay | null,
      _allServerRoutesInput?: Record<number, ServerRouteResponse>, // Kept for signature consistency, though unused locally
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
        console.log(`[RouteManager] 경로 렌더링: ${linkIds.length}개의 링크 ID 처리 시작. Using geoJsonLinks count: ${geoJsonLinks.length}`);

        const allRouteCoordinatesForBounds: { lat: number; lng: number }[][] = [];
        let missingLinkCount = 0;
        let drawnPolylinesCount = 0;

        linkIds.forEach(linkId => {
          const linkFeature = geoJsonLinks.find(
            (feature: GeoJsonFeature) => {
              const props = feature.properties as GeoJsonLinkProperties;
              return String(props.LINK_ID) === String(linkId);
            }
          );

          if (linkFeature && linkFeature.geometry && linkFeature.geometry.type === 'LineString' && Array.isArray(linkFeature.geometry.coordinates)) {
            const coords = linkFeature.geometry.coordinates as GeoCoordinates[];
            const pathCoordsForPolyline = coords.map((coordPair: GeoCoordinates) => {
              if (coordPair && typeof coordPair[0] === 'number' && typeof coordPair[1] === 'number') {
                return { lat: coordPair[1], lng: coordPair[0] };
              }
              console.warn('[RouteManager] Invalid coordinate pair encountered in linkFeature geometry:', coordPair);
              return null;
            }).filter(c => c !== null) as { lat: number; lng: number }[];

            if (pathCoordsForPolyline.length >= 2) {
              const polyline = addPolyline(pathCoordsForPolyline, USER_ROUTE_COLOR, USER_ROUTE_WEIGHT, USER_ROUTE_OPACITY, USER_ROUTE_ZINDEX);
              if (polyline) {
                drawnPolylinesCount++;
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

        console.log(`[RouteManager] 경로 좌표 추출 및 폴리라인 생성 결과: ${drawnPolylinesCount}개 폴리라인 (누락된 LINK_ID: ${missingLinkCount}개)`);

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
    [map, isNaverLoadedParam, geoJsonLinks, addPolyline, mapPlacesWithGeoNodesFn, clearAllDrawnRoutes]
  );

  const renderGeoJsonRoute = useCallback((route: SegmentRoute) => {
    if (!map || !isNaverLoadedParam || !route || !route.nodeIds || !route.linkIds) {
      console.warn('[RouteManager] Cannot render GeoJSON route: invalid input or map not ready');
      return;
    }

    clearAllDrawnRoutes();

    const routeNodes = route.nodeIds.map(nodeId => {
      return geoJsonNodes.find(node => {
        const props = node.properties as GeoJsonNodeProperties;
        return String(props.NODE_ID) === String(nodeId);
      });
    }).filter(Boolean) as GeoJsonFeature[];

    if (routeNodes.length < 2) {
      console.warn('[RouteManager] Not enough valid nodes to render GeoJSON route');
      return;
    }

    const coordinates = routeNodes.map(node => {
      if (node && node.geometry.type === 'Point') {
        const geoCoords = node.geometry.coordinates as GeoCoordinates;
        if (geoCoords && typeof geoCoords[0] === 'number' && typeof geoCoords[1] === 'number') {
          return { lat: geoCoords[1], lng: geoCoords[0] };
        }
      }
      return null;
    }).filter(Boolean) as { lat: number; lng: number }[];

    if (coordinates.length < 2) {
      console.warn('[RouteManager] Not enough valid coordinates to render GeoJSON route');
      return;
    }

    addPolyline(coordinates, DEFAULT_ROUTE_COLOR);

    const naverCoords = coordinates.map(c => createNaverLatLng(c.lat, c.lng)).filter(c => c !== null) as any[];
    if (naverCoords.length > 0) {
      fitBoundsToCoordinates(map, naverCoords);
    }
  }, [map, isNaverLoadedParam, geoJsonNodes, addPolyline, clearAllDrawnRoutes]);

  const highlightSegment = useCallback((segment: SegmentRoute | null) => {
    clearPreviousHighlight();

    if (!map || !isNaverLoadedParam || !segment || !segment.nodeIds || segment.nodeIds.length < 2) {
      return;
    }

    const segmentNodes = segment.nodeIds.map(nodeId => {
      return geoJsonNodes.find(node => {
        const props = node.properties as GeoJsonNodeProperties;
        return String(props.NODE_ID) === String(nodeId);
      });
    }).filter(Boolean) as GeoJsonFeature[];

    if (segmentNodes.length < 2) {
      console.warn('[RouteManager] Not enough valid nodes to highlight segment');
      return;
    }

    const coordinates = segmentNodes.map(node => {
      if (node && node.geometry.type === 'Point') {
        const geoCoords = node.geometry.coordinates as GeoCoordinates;
        if (geoCoords && typeof geoCoords[0] === 'number' && typeof geoCoords[1] === 'number') {
          return { lat: geoCoords[1], lng: geoCoords[0] };
        }
      }
      return null;
    }).filter(Boolean) as { lat: number; lng: number }[];

    if (coordinates.length < 2) {
      console.warn('[RouteManager] Not enough valid coordinates to highlight segment');
      return;
    }

    const highlightColor = '#ffc107'; // Standard highlight color
    setHighlightedPolyline(coordinates, highlightColor, 6, 0.8, 200);

    const naverCoords = coordinates.map(c => createNaverLatLng(c.lat, c.lng)).filter(c => c !== null) as any[];
    if (naverCoords.length > 0) {
      fitBoundsToCoordinates(map, naverCoords);
    }
  }, [map, isNaverLoadedParam, geoJsonNodes, setHighlightedPolyline, clearPreviousHighlight]);

  const clearPreviousHighlightedPath = useCallback(() => {
    clearPreviousHighlight();
  }, [clearPreviousHighlight]);
  
  const calculateAndDrawDirectRoutes = useCallback((placesToRoute: Place[]) => {
    if (!map || !isNaverLoadedParam || placesToRoute.length < 2) return;

    const pathCoordinates = placesToRoute
        .filter(p => typeof p.x === 'number' && typeof p.y === 'number' && !isNaN(p.x) && !isNaN(p.y))
        .map(place => ({ lat: place.y as number, lng: place.x as number }));

    if (pathCoordinates.length < 2) return;

    addPolyline(pathCoordinates, '#22c55e', 4); // Green color for direct routes, weight 4
  }, [map, isNaverLoadedParam, addPolyline]);


  return {
    renderItineraryRoute,
    renderGeoJsonRoute,
    highlightSegment,
    clearPreviousHighlightedPath,
    clearAllDrawnRoutes,
    calculateAndDrawDirectRoutes,
  };
};
