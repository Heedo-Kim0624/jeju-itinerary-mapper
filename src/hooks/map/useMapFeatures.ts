import { useCallback, useRef, useEffect, useState } from 'react';
import { Place, ItineraryDay } from '@/types/supabase';
import { GeoNode } from '../../components/rightpanel/geojson/GeoJsonTypes';
import { ServerRouteResponse, SegmentRoute } from '@/types/schedule';
import {
  createNaverPolyline,
  createNaverLatLng,
  fitBoundsToCoordinates
} from '@/utils/map/mapDrawing';
import { useGeoJsonState } from '@/hooks/map/useGeoJsonState';
import { getCategoryColor, mapCategoryNameToKey } from '@/utils/categoryColors';

const DEFAULT_ROUTE_COLOR = '#007bff';

export const useMapFeatures = (map: any, isNaverLoadedParam: boolean) => {
  const activePolylines = useRef<any[]>([]);
  const highlightedPathRef = useRef<any>(null);
  const geoJsonState = useGeoJsonState();

  const drawRoutePath = useCallback((
    currentMap: any,
    pathCoordinates: { lat: number; lng: number }[],
    color: string,
    weight: number = 5,
    opacity: number = 0.7,
    zIndex: number = 1
  ) => {
    if (!currentMap || !isNaverLoadedParam || pathCoordinates.length < 2) return null;

    const naverPath = pathCoordinates.map(coord => createNaverLatLng(coord.lat, coord.lng));
    if (naverPath.some(p => p === null)) {
      console.warn('[MapFeatures] drawRoutePath: Some LatLng conversions failed.');
      return null;
    }

    const polyline = createNaverPolyline(currentMap, naverPath, {
      strokeColor: color,
      strokeWeight: weight,
      strokeOpacity: opacity,
      zIndex: zIndex,
    });
    return polyline;
  }, [isNaverLoadedParam]);

  const clearAllRoutes = useCallback(() => {
    console.log('[MapFeatures] Clearing all routes and UI elements.');
    activePolylines.current.forEach(p => {
      if (p && typeof p.setMap === 'function') p.setMap(null);
    });
    activePolylines.current = [];

    if (highlightedPathRef.current && typeof highlightedPathRef.current.setMap === 'function') {
      highlightedPathRef.current.setMap(null);
    }
    highlightedPathRef.current = null;
  }, []);

  const mapPlacesWithGeoNodes = useCallback((places: Place[]): Place[] => {
    if (!geoJsonState.geoJsonNodes || geoJsonState.geoJsonNodes.length === 0) {
      console.warn("[MapFeatures] GeoJSON nodes not available for mapping places.");
      return places.map(p => ({ ...p, x: p.x || 0, y: p.y || 0 }));
    }

    return places.map(place => {
      if (place.geoNodeId) {
        const node = geoJsonState.geoJsonNodes.find(n => String(n.properties.NODE_ID) === String(place.geoNodeId));
        if (node && node.geometry.type === 'Point') {
          const [lng, lat] = (node.geometry.coordinates as [number, number]); // Type assertion
          return { ...place, x: lng, y: lat };
        }
      }
      return { ...place, x: place.x || 0, y: place.y || 0 };
    });
  }, [geoJsonState.geoJsonNodes]);

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
      clearAllRoutes();

      if (!itineraryDay || !itineraryDay.places || itineraryDay.places.length < 1) {
        console.log('[MapFeatures] No itinerary day or places to render route.');
        if (onComplete) onComplete();
        return;
      }
      
      if (!itineraryDay.routeData || !itineraryDay.interleaved_route || 
          !Array.isArray(itineraryDay.interleaved_route)) {
        console.warn('[MapFeatures] Invalid route data for itinerary day:', itineraryDay.day);
        if (onComplete) onComplete();
        return;
      }

      const { places, interleaved_route } = itineraryDay; 
      const mappedPlaces = mapPlacesWithGeoNodes(places); 

      if (interleaved_route.length === 0 && mappedPlaces.length > 1) {
        console.log("[MapFeatures] No interleaved_route, drawing direct lines between mapped places.");
        const pathCoordinates = mappedPlaces.filter(p => typeof p.x === 'number' && typeof p.y === 'number').map(p => ({ lat: p.y as number, lng: p.x as number }));
        if (pathCoordinates.length > 1) {
            const polyline = drawRoutePath(map, pathCoordinates, DEFAULT_ROUTE_COLOR, 3);
            if (polyline) activePolylines.current.push(polyline);
            const naverCoords = pathCoordinates.map(c => createNaverLatLng(c.lat, c.lng)).filter(p => p !== null) as any[];
            if (naverCoords.length > 0) fitBoundsToCoordinates(map, naverCoords);
        }
        if (onComplete) onComplete();
        return;
      }
      
      if (interleaved_route.length === 0) {
         console.log('[MapFeatures] No route to draw for day', itineraryDay.day);
         if (onComplete) onComplete();
         return;
      }

      const nodeCoordsMap = new Map<string, { lat: number; lng: number }>();
      geoJsonState.geoJsonNodes.forEach(node => {
        if (node.geometry.type === 'Point') {
          const [lng, lat] = (node.geometry.coordinates as [number, number]);
          nodeCoordsMap.set(String(node.properties.NODE_ID), {
            lng: lng,
            lat: lat,
          });
        }
      });
      
      mappedPlaces.forEach(place => { 
        const placeIdStr = String(place.geoNodeId || place.id);
        if (!nodeCoordsMap.has(placeIdStr) && typeof place.x === 'number' && typeof place.y === 'number') {
           nodeCoordsMap.set(placeIdStr, { lat: place.y as number, lng: place.x as number });
        }
      });

      let currentPathSegment: { lat: number; lng: number }[] = [];
      const allRouteCoordinatesForBounds: any[] = [];

      interleaved_route.forEach((id, index) => {
        const nodeIdStr = String(id);
        const coords = nodeCoordsMap.get(nodeIdStr);

        if (coords) {
          currentPathSegment.push(coords);
          const naverCoord = createNaverLatLng(coords.lat, coords.lng);
          if (naverCoord) allRouteCoordinatesForBounds.push(naverCoord);

          const nextIdStr = interleaved_route[index + 1] ? String(interleaved_route[index + 1]) : null;
          const isNextItemAPlaceNode = nextIdStr ? nodeCoordsMap.has(nextIdStr) : false;
          
          if (currentPathSegment.length >= 2 && (!isNextItemAPlaceNode || index === interleaved_route.length - 1)) {
            const polyline = drawRoutePath(map, currentPathSegment, DEFAULT_ROUTE_COLOR);
            if (polyline) activePolylines.current.push(polyline);
            currentPathSegment = isNextItemAPlaceNode && coords ? [coords] : []; 
          } else if (currentPathSegment.length === 1 && !isNextItemAPlaceNode && index === interleaved_route.length -1){
            currentPathSegment = [];
          }

        } else {
          if (currentPathSegment.length >= 2) {
            const polyline = drawRoutePath(map, currentPathSegment, DEFAULT_ROUTE_COLOR);
            if (polyline) activePolylines.current.push(polyline);
          }
          currentPathSegment = []; 
          console.warn(`[MapFeatures] Node ID ${nodeIdStr} from interleaved_route not found in geoJsonNodes or mappedPlaces.`);
        }
      });
      
      if (currentPathSegment.length >= 2) { 
        const polyline = drawRoutePath(map, currentPathSegment, DEFAULT_ROUTE_COLOR);
        if (polyline) activePolylines.current.push(polyline);
      }
      
      if (allRouteCoordinatesForBounds.length > 0) {
        fitBoundsToCoordinates(map, allRouteCoordinatesForBounds.filter(c => c !== null));
      } else if (mappedPlaces.length > 0) { 
        const fallbackCoords = mappedPlaces.map(p => createNaverLatLng(p.y as number, p.x as number)).filter(c => c !== null) as any[];
        if (fallbackCoords.length > 0) fitBoundsToCoordinates(map, fallbackCoords);
      }

      if (onComplete) onComplete();
    },
    [map, isNaverLoadedParam, geoJsonState.geoJsonNodes, drawRoutePath, clearAllRoutes, mapPlacesWithGeoNodes]
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
  
  const renderGeoJsonRoute = useCallback((route: SegmentRoute) => {
    if (!map || !isNaverLoadedParam || !route || !route.nodeIds || !route.linkIds) {
      console.warn('[MapFeatures] Cannot render GeoJSON route: invalid input or map not ready');
      return;
    }

    clearAllRoutes();

    const routeNodes = route.nodeIds.map(nodeId => {
      return geoJsonState.geoJsonNodes.find(node => String(node.properties.NODE_ID) === String(nodeId));
    }).filter(Boolean);

    if (routeNodes.length < 2) {
      console.warn('[MapFeatures] Not enough valid nodes to render GeoJSON route');
      return;
    }

    const coordinates = routeNodes.map(node => {
      if (node && node.geometry.type === 'Point') {
        const [lng, lat] = (node.geometry.coordinates as [number, number]); // Type assertion
        return { lat, lng };
      }
      return null;
    }).filter(Boolean) as { lat: number; lng: number }[];

    if (coordinates.length < 2) {
      console.warn('[MapFeatures] Not enough valid coordinates to render GeoJSON route');
      return;
    }

    const polyline = drawRoutePath(map, coordinates, DEFAULT_ROUTE_COLOR);
    if (polyline) {
      activePolylines.current.push(polyline);
    }

    const naverCoords = coordinates.map(c => createNaverLatLng(c.lat, c.lng)).filter(c => c !== null) as any[];
    if (naverCoords.length > 0) {
      fitBoundsToCoordinates(map, naverCoords);
    }
  }, [map, isNaverLoadedParam, geoJsonState.geoJsonNodes, drawRoutePath, clearAllRoutes]);

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
    const createdMarkers: any[] = [];

    placesToAdd.forEach((place, index) => {
      if (typeof place.x !== 'number' || typeof place.y !== 'number' || isNaN(place.x) || isNaN(place.y)) {
        console.warn(`[MapFeatures - addMarkers] Place '${place.name}' (ID: ${place.id}) has invalid or missing coordinates (x: ${place.x}, y: ${place.y}). Skipping marker.`);
        return; 
      }

      const position = createNaverLatLng(place.y, place.x);
      if (!position) { 
        console.warn(`[MapFeatures - addMarkers] Failed to create LatLng for '${place.name}'. Skipping marker.`);
        return;
      }

      const isHighlighted = place.id === highlightPlaceId;
      
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
          onMarkerClick(place, index);
        }
      });

      createdMarkers.push(marker);
    });
    
    return createdMarkers;
  }, [map, isNaverLoadedParam, getCategoryColor, mapCategoryNameToKey]);

  const calculateRoutes = useCallback((placesToRoute: Place[]) => { // This returns any[]
    if (!map || !isNaverLoadedParam || placesToRoute.length < 2) return [];

    const polylines: any[] = [];
    const pathCoordinates = placesToRoute
        .filter(p => typeof p.x === 'number' && typeof p.y === 'number') 
        .map(place => ({ lat: place.y as number, lng: place.x as number }));

    if (pathCoordinates.length < 2) return [];

    const polyline = drawRoutePath(map, pathCoordinates, '#22c55e', 4); 
    if (polyline) {
      polylines.push(polyline);
      activePolylines.current.push(polyline); 
    }
    
    return polylines; 
  }, [map, isNaverLoadedParam, drawRoutePath]);

  return {
    addMarkers,
    clearMarkersAndUiElements: clearAllRoutes, 
    calculateRoutes, // This is (placesToRoute: Place[]) => any[]
    renderItineraryRoute,
    clearAllRoutes,
    highlightSegment,
    clearPreviousHighlightedPath,
    showRouteForPlaceIndex,
    renderGeoJsonRoute,
    mapPlacesWithGeoNodes
  };
};
