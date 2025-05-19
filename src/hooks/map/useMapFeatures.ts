import { useCallback, useRef, useEffect, useState } from 'react';
import { Place, ItineraryDay } from '@/types/supabase';
import type { GeoNode } from '@/components/rightpanel/geojson/GeoJsonTypes';
import { ServerRouteResponse, SegmentRoute } from '@/types/schedule';
import {
  createNaverPolyline,
  createNaverLatLng,
  fitBoundsToCoordinates
} from '@/utils/map/mapDrawing';
import { useGeoJsonState } from '@/hooks/map/useGeoJsonState';
import { getCategoryColor, mapCategoryNameToKey } from '@/utils/categoryColors';

const DEFAULT_ROUTE_COLOR = '#007bff';
const ITINERARY_ROUTE_COLOR = '#2563EB';
const ITINERARY_ROUTE_WEIGHT = 5;
const ITINERARY_ROUTE_OPACITY = 0.7;
const ITINERARY_ROUTE_ZINDEX = 100;

export const useMapFeatures = (map: any, isNaverLoadedParam: boolean) => {
  const activePolylinesRef = useRef<any[]>([]);
  const activeMarkersRef = useRef<any[]>([]);
  const highlightedPathRef = useRef<any>(null);
  const { geoJsonNodes, geoJsonLinks, isGeoJsonLoaded } = useGeoJsonState();

  const drawRoutePath = useCallback((
    currentMap: any,
    pathCoordinates: { lat: number; lng: number }[],
    color: string,
    weight: number = 5,
    opacity: number = 0.7,
    zIndex: number = 1
  ) => {
    if (!currentMap || !isNaverLoadedParam || pathCoordinates.length < 2) return null;

    // Filter out invalid coordinates
    const validCoords = pathCoordinates.filter(coord => 
      coord && typeof coord.lat === 'number' && typeof coord.lng === 'number' &&
      !isNaN(coord.lat) && !isNaN(coord.lng)
    );

    if (validCoords.length < 2) {
      console.warn('[MapFeatures] drawRoutePath: Not enough valid coordinates for path.');
      return null;
    }

    const naverPath = validCoords.map(coord => createNaverLatLng(coord.lat, coord.lng));
    if (naverPath.some(p => p === null)) {
      console.warn('[MapFeatures] drawRoutePath: Some LatLng conversions failed.');
      return null;
    }

    try {
      const polyline = createNaverPolyline(currentMap, naverPath, {
        strokeColor: color,
        strokeWeight: weight,
        strokeOpacity: opacity,
        zIndex: zIndex,
      });
      return polyline;
    } catch (error) {
      console.error('[MapFeatures] Error creating polyline:', error);
      return null;
    }
  }, [isNaverLoadedParam]);

  const clearAllMapElements = useCallback(() => {
    console.log('[MapFeatures] Clearing all map elements (routes and markers).');
    activePolylinesRef.current.forEach(p => {
      if (p && typeof p.setMap === 'function') p.setMap(null);
    });
    activePolylinesRef.current = [];

    activeMarkersRef.current.forEach(m => {
      if (m && typeof m.setMap === 'function') m.setMap(null);
    });
    activeMarkersRef.current = [];

    if (highlightedPathRef.current && typeof highlightedPathRef.current.setMap === 'function') {
      highlightedPathRef.current.setMap(null);
    }
    highlightedPathRef.current = null;
  }, []);

  const clearAllRoutes = useCallback(() => {
    console.log('[MapFeatures] Clearing all routes.');
    activePolylinesRef.current.forEach(p => {
      if (p && typeof p.setMap === 'function') p.setMap(null);
    });
    activePolylinesRef.current = [];

    if (highlightedPathRef.current && typeof highlightedPathRef.current.setMap === 'function') {
      highlightedPathRef.current.setMap(null);
    }
    highlightedPathRef.current = null;
  }, []);

  const clearAllMarkers = useCallback(() => {
    console.log('[MapFeatures] Clearing all markers.');
    activeMarkersRef.current.forEach(m => {
      if (m && typeof m.setMap === 'function') m.setMap(null);
    });
    activeMarkersRef.current = [];
  }, []);

  const mapPlacesWithGeoNodes = useCallback((places: Place[]): Place[] => {
    if (!geoJsonNodes || geoJsonNodes.length === 0) {
      console.warn("[MapFeatures] GeoJSON nodes not available for mapping places.");
      return places.map(p => ({ ...p, x: p.x || 0, y: p.y || 0 }));
    }

    return places.map(place => {
      if (place.geoNodeId) {
        const node = geoJsonNodes.find(n => String(n.properties.NODE_ID) === String(place.geoNodeId));
        if (node && node.geometry.type === 'Point') {
          const [lng, lat] = (node.geometry.coordinates as [number, number]); // Type assertion
          return { ...place, x: lng, y: lat };
        }
      }
      return { ...place, x: place.x || 0, y: place.y || 0 };
    });
  }, [geoJsonNodes]);

  const renderItineraryRoute = useCallback(
    (
      itineraryDay: ItineraryDay | null,
      _allServerRoutesInput?: Record<number, ServerRouteResponse>, 
      onComplete?: () => void
    ) => {
      if (!map || !isNaverLoadedParam) {
        console.log('[MapFeatures] Map not ready for rendering itinerary route.');
        if (onComplete) onComplete();
        return;
      }

      // clearAllRoutes(); // 경로는 외부에서 관리 (예: Map.tsx에서 날짜 변경 시)

      if (!itineraryDay || !itineraryDay.routeData) {
        console.log('[MapFeatures] No itinerary day or routeData to render route.');
        if (onComplete) onComplete();
        return;
      }
      
      const { linkIds } = itineraryDay.routeData;

      if (!linkIds || linkIds.length === 0) {
        console.warn('[MapFeatures] No linkIds found in itineraryDay.routeData. Cannot draw routes.');
        if (onComplete) onComplete();
        return;
      }

      if (!isGeoJsonLoaded || !geoJsonLinks || geoJsonLinks.length === 0) {
        console.warn('[MapFeatures] LINK_JSON (geoJsonLinks) not loaded. Cannot draw routes.');
        // 여기서 geoJsonLinks 로딩을 트리거하거나, 로드될 때까지 대기하는 로직이 필요할 수 있음.
        // 또는, geoJsonLinks가 로드된 후에 이 함수가 다시 호출되도록 해야 함.
        if (onComplete) onComplete();
        return;
      }
      
      console.log(`[MapFeatures] Rendering itinerary route for day ${itineraryDay.day} with ${linkIds.length} link(s).`);

      try {
        const drawnPolylines: any[] = [];
        const allRouteCoordinatesForBounds: { lat: number; lng: number }[] = [];
        let missingLinkDataCount = 0;

        linkIds.forEach(linkId => {
          const linkFeature = geoJsonLinks.find(
            (feature: any) => feature.properties.LINK_ID?.toString() === linkId.toString()
          );

          if (linkFeature && linkFeature.geometry && linkFeature.geometry.type === 'LineString') {
            const pathCoords = linkFeature.geometry.coordinates.map((coord: [number, number]) => ({
              lat: coord[1], // latitude
              lng: coord[0]  // longitude
            }));
            
            if (pathCoords.length >= 2) {
              const polyline = drawRoutePath(
                map,
                pathCoords,
                ITINERARY_ROUTE_COLOR,
                ITINERARY_ROUTE_WEIGHT,
                ITINERARY_ROUTE_OPACITY,
                ITINERARY_ROUTE_ZINDEX
              );
              if (polyline) {
                drawnPolylines.push(polyline);
                allRouteCoordinatesForBounds.push(...pathCoords);
              }
            } else {
              console.warn(`[MapFeatures] Link ID ${linkId} has insufficient coordinates.`);
            }
          } else {
            console.warn(`[MapFeatures] Link ID ${linkId} not found in geoJsonLinks or geometry is invalid.`);
            missingLinkDataCount++;
          }
        });
        
        activePolylinesRef.current.push(...drawnPolylines); // 새로 그린 폴리라인들을 active 목록에 추가

        if (missingLinkDataCount > 0) {
          console.warn(`[MapFeatures] Could not find data for ${missingLinkDataCount} link(s).`);
        }
        
        if (allRouteCoordinatesForBounds.length > 0) {
          const naverCoords = allRouteCoordinatesForBounds
            .map(c => createNaverLatLng(c.lat, c.lng))
            .filter(p => p !== null) as any[];
          if (naverCoords.length > 0) {
            fitBoundsToCoordinates(map, naverCoords);
          }
        } else {
           console.warn("[MapFeatures] No valid coordinates to fit bounds for the route.");
        }

      } catch (error) {
        console.error("[MapFeatures] Error rendering itinerary route:", error);
      }

      if (onComplete) onComplete();
    },
    [map, isNaverLoadedParam, geoJsonLinks, isGeoJsonLoaded, drawRoutePath]
  );

  const showRouteForPlaceIndex = useCallback(
    (placeIndex: number, itineraryDay: ItineraryDay, onComplete?: () => void) => {
      if (!map || !isNaverLoadedParam || !itineraryDay || !itineraryDay.places) {
        if (onComplete) onComplete();
        return;
      }
      
      const place = itineraryDay.places[placeIndex];
      if (place && typeof place.y === 'number' && typeof place.x === 'number') { 
          const position = createNaverLatLng(place.y, place.x);
          if (position) {
              map.panTo(position);
              if (map.getZoom() < 14) map.setZoom(14);
          }
      } else {
        console.warn(`[MapFeatures] showRouteForPlaceIndex: Place ${placeIndex} has invalid coordinates.`);
      }

      if (onComplete) onComplete();
    },
    [map, isNaverLoadedParam] 
  );
  
  const renderGeoJsonRoute = useCallback((
    itineraryDay: ItineraryDay | null,
    _allServerRoutes?: Record<number, ServerRouteResponse>, // 사용 안 함
    onComplete?: () => void
  ) => {
    console.warn("[MapFeatures] renderGeoJsonRoute is called. Consider using renderItineraryRoute instead for day-specific routes.");
    renderItineraryRoute(itineraryDay, _allServerRoutes, onComplete);
  }, [renderItineraryRoute]);

  const highlightSegment = useCallback((segment: SegmentRoute | null) => {
    if (highlightedPathRef.current) {
      highlightedPathRef.current.setMap(null);
      highlightedPathRef.current = null;
    }

    if (!map || !isNaverLoadedParam || !segment || !segment.nodeIds || segment.nodeIds.length < 2) {
      return;
    }

    const segmentNodes = segment.nodeIds.map(nodeId => {
      return geoJsonState.geoJsonNodes.find(node => String(node.properties.NODE_ID) === String(nodeId));
    }).filter(Boolean);

    if (segmentNodes.length < 2) {
      console.warn('[MapFeatures] Not enough valid nodes to highlight segment');
      return;
    }

    const coordinates = segmentNodes.map(node => {
      if (node && node.geometry.type === 'Point') {
        const [lng, lat] = (node.geometry.coordinates as [number, number]); // Type assertion
        return { lat, lng };
      }
      return null;
    }).filter(Boolean) as { lat: number; lng: number }[];

    if (coordinates.length < 2) {
      console.warn('[MapFeatures] Not enough valid coordinates to highlight segment');
      return;
    }

    const highlightColor = '#ffc107'; 
    const polyline = drawRoutePath(map, coordinates, highlightColor, 6, 0.8, 200);
    if (polyline) {
      highlightedPathRef.current = polyline;
    }

    const naverCoords = coordinates.map(c => createNaverLatLng(c.lat, c.lng)).filter(c => c !== null) as any[];
    if (naverCoords.length > 0) {
      fitBoundsToCoordinates(map, naverCoords);
    }
  }, [map, isNaverLoadedParam, geoJsonState.geoJsonNodes, drawRoutePath]);
  
  const clearPreviousHighlightedPath = useCallback(() => {
    if (highlightedPathRef.current) {
      highlightedPathRef.current.setMap(null);
      highlightedPathRef.current = null;
    }
  }, []);

  const addMarkers = useCallback((
    placesToAdd: Place[], 
    options: {
      highlightPlaceId?: string;
      isItinerary?: boolean;
      useRecommendedStyle?: boolean; 
      useColorByCategory?: boolean;
      onMarkerClick?: (place: Place, index: number) => void;
      itineraryOrder?: boolean; 
    } = {}
  ): any[] => {
    if (!map || !isNaverLoadedParam || !placesToAdd || placesToAdd.length === 0) return [];

    const { 
      highlightPlaceId, 
      isItinerary = false,
      useColorByCategory = false, 
      onMarkerClick,
      itineraryOrder = false 
    } = options;
    
    // Filter out places with invalid coordinates
    const validPlaces = placesToAdd.filter(place => 
      place && typeof place.x === 'number' && typeof place.y === 'number' && 
      !isNaN(place.x) && !isNaN(place.y) &&
      // 추가: place.id가 유효한지 확인 (문자열 또는 숫자)
      (typeof place.id === 'string' || typeof place.id === 'number')
    );
    
    if (validPlaces.length === 0) {
      console.warn('[MapFeatures - addMarkers] No valid coordinates or IDs in places array');
      return [];
    }

    console.log(`[MapFeatures - addMarkers] Adding ${validPlaces.length} markers. Options:`, options);
    const createdMarkers: any[] = [];

    validPlaces.forEach((place, index) => {
      const position = createNaverLatLng(place.y, place.x);
      if (!position) { 
        console.warn(`[MapFeatures - addMarkers] Failed to create LatLng for '${place.name}'. Skipping marker.`);
        return;
      }

      const isHighlighted = place.id?.toString() === highlightPlaceId?.toString(); // ID 비교 시 문자열로 통일
      
      const categoryKey = mapCategoryNameToKey(place.category); 
      const resolvedCategoryColor = getCategoryColor(categoryKey); 
      const markerBaseColor = useColorByCategory ? resolvedCategoryColor : (isHighlighted ? '#FF3B30' : '#4CD964');

      let markerIcon;
      if (isItinerary && itineraryOrder) {
        markerIcon = {
          content: `
            <div style="
              width: 28px; height: 28px; border-radius: 50%; 
              background-color: ${markerBaseColor};
              color: white; font-weight: bold; display: flex;
              align-items: center; justify-content: center;
              box-shadow: 0 1px 3px rgba(0,0,0,0.3); border: 1.5px solid white;
              font-size: 13px;
            ">${index + 1}</div>
          `,
          anchor: new window.naver.maps.Point(14, 14)
        };
      } else if (isHighlighted) {
         markerIcon = { 
          content: `
            <div style="
              width: 30px; height: 30px; border-radius: 50%; 
              background-color: #FF3B30; 
              color: white; display: flex;
              align-items: center; justify-content: center;
              box-shadow: 0 2px 6px rgba(0,0,0,0.5); border: 2px solid white;
              font-size: 16px; 
            ">⭐</div>
          `, 
          anchor: new window.naver.maps.Point(15, 15)
        };
      }
       else { 
        markerIcon = {
          content: `
            <div style="
              width: 12px; height: 12px; border-radius: 50%;
              background-color: ${markerBaseColor};
              border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            "></div>
          `,
          anchor: new window.naver.maps.Point(6, 6)
        };
      }

      try {
        const marker = new window.naver.maps.Marker({
          position: position,
          map: map,
          title: place.name,
          icon: markerIcon,
          zIndex: isHighlighted ? 200 : (isItinerary && itineraryOrder ? 100 - index : 50)
        });

        const contentString = `
          <div style="padding: 8px; max-width: 180px; font-size: 12px;">
            <h3 style="font-weight: bold; margin-bottom: 4px; font-size: 13px;">${place.name}</h3>
            ${place.category ? `<p style="color: ${resolvedCategoryColor}; margin: 2px 0; font-size: 11px;">${place.category}</p>` : ''}
            ${isItinerary && itineraryOrder ? `<strong style="color: ${markerBaseColor}; font-size: 13px;">Visit order: ${index + 1}</strong>` : ''}
          </div>
        `;

        const infoWindow = new window.naver.maps.InfoWindow({
          content: contentString,
          maxWidth: 200,
          backgroundColor: "white",
          borderColor: "#ccc",
          borderWidth: 1,
          anchorSize: new window.naver.maps.Size(8, 8),
          pixelOffset: new window.naver.maps.Point(0, -15) 
        });

        window.naver.maps.Event.addListener(marker, 'click', () => {
          infoWindow.open(map, marker); 
          if (onMarkerClick) {
            onMarkerClick(place, index); // place와 index 전달
          }
        });

        createdMarkers.push(marker);
      } catch (error) {
        console.error(`[MapFeatures - addMarkers] Error creating marker for ${place.name}:`, error);
      }
    });
    
    activeMarkersRef.current.push(...createdMarkers);
    return createdMarkers;
  }, [map, isNaverLoadedParam]);

  const calculateRoutes = useCallback((placesToRoute: Place[]) => {
    console.warn("[MapFeatures] calculateRoutes is likely deprecated or needs redesign for LINK_JSON based routing.");
    if (!map || !isNaverLoadedParam || placesToRoute.length < 2) return [];
    // ... (rest of the old logic, but it's not aligned with LINK_JSON)
    return [];
  }, [map, isNaverLoadedParam, drawRoutePath]);

  return {
    addMarkers,
    clearAllMapElements,
    clearAllRoutes,
    clearAllMarkers,
    calculateRoutes,
    renderItineraryRoute,
    highlightSegment,
    clearPreviousHighlightedPath,
    showRouteForPlaceIndex,
    renderGeoJsonRoute,
    mapPlacesWithGeoNodes
  };
};
