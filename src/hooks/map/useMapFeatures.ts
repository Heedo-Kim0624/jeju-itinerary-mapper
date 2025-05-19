import { useCallback, useRef, useEffect, useState } from 'react';
import { Place, ItineraryDay, GeoNode } from '@/types/supabase';
import { ServerRouteResponse, SegmentRoute } from '@/types/schedule';
import {
  createNaverPolyline,
  createNaverLatLng,
  fitBoundsToCoordinates
} from '@/utils/map/mapDrawing';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useGeoJsonState } from '@/hooks/map/useGeoJsonState';
import { getCategoryColor, mapCategoryNameToKey } from '@/utils/categoryColors'; // Import category utils

// Define a default color for routes if not specified
const DEFAULT_ROUTE_COLOR = '#007bff'; // Blue

export const useMapFeatures = (map: any) => {
  const activePolylines = useRef<any[]>([]);
  const highlightedPathRef = useRef<any>(null);
  const { geoJsonNodes } = useGeoJsonState();
  const { isNaverLoaded } = useMapContext();

  const drawRoutePath = useCallback((
    currentMap: any,
    pathCoordinates: { lat: number; lng: number }[],
    color: string,
    weight: number = 5,
    opacity: number = 0.7,
    zIndex: number = 1
  ) => {
    if (!currentMap || !isNaverLoaded || pathCoordinates.length < 2) return null;

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
  }, [isNaverLoaded]);

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
    if (!geoJsonNodes || geoJsonNodes.length === 0) {
      console.warn("[MapFeatures] GeoJSON nodes not available for mapping places.");
      return places.map(p => ({ ...p, x: p.x || 0, y: p.y || 0 }));
    }

    return places.map(place => {
      if (place.geoNodeId) {
        const node = geoJsonNodes.find(n => String(n.properties.NODE_ID) === String(place.geoNodeId));
        if (node && node.geometry.type === 'Point') {
          const [lng, lat] = node.geometry.coordinates;
          return { ...place, x: lng, y: lat };
        }
      }
      return { ...place, x: place.x || 0, y: place.y || 0 };
    });
  }, [geoJsonNodes]);


  const renderItineraryRoute = useCallback(
    (
      itineraryDay: ItineraryDay | null,
      _allServerRoutesInput?: Record<number, ServerRouteResponse>, // Mark as unused if not directly used here
      onComplete?: () => void
    ) => {
      if (!map || !isNaverLoaded) {
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

      const { places, interleaved_route } = itineraryDay; // routeData is part of itineraryDay
      const mappedPlaces = mapPlacesWithGeoNodes(places); 

      if (interleaved_route.length === 0 && mappedPlaces.length > 1) {
        console.log("[MapFeatures] No interleaved_route, drawing direct lines between mapped places.");
        const pathCoordinates = mappedPlaces.filter(p => typeof p.x === 'number' && typeof p.y === 'number').map(p => ({ lat: p.y, lng: p.x }));
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
      geoJsonNodes.forEach(node => {
        if (node.geometry.type === 'Point') {
          nodeCoordsMap.set(String(node.properties.NODE_ID), {
            lng: node.geometry.coordinates[0],
            lat: node.geometry.coordinates[1],
          });
        }
      });
      
      mappedPlaces.forEach(place => { // Ensure mapped places (which might have x/y from DB) are in nodeCoordsMap
        const placeIdStr = String(place.geoNodeId || place.id);
        if (!nodeCoordsMap.has(placeIdStr) && typeof place.x === 'number' && typeof place.y === 'number') {
           nodeCoordsMap.set(placeIdStr, { lat: place.y, lng: place.x });
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
          // A LINK_ID would not be in nodeCoordsMap (unless links are also points, which is unlikely for routes)
          // So, if nextId is not in nodeCoordsMap, or it's the end, we might have a segment.
          const isNextItemAPlaceNode = nextIdStr ? nodeCoordsMap.has(nextIdStr) : false;
          
          if (currentPathSegment.length >= 2 && (!isNextItemAPlaceNode || index === interleaved_route.length - 1)) {
            const polyline = drawRoutePath(map, currentPathSegment, DEFAULT_ROUTE_COLOR);
            if (polyline) activePolylines.current.push(polyline);
            currentPathSegment = isNextItemAPlaceNode && coords ? [coords] : []; // Start new segment if next is a place
          } else if (currentPathSegment.length === 1 && !isNextItemAPlaceNode && index === interleaved_route.length -1){
            // одиночная точка в конце, нечего рисовать
            currentPathSegment = [];
          }

        } else {
          // This ID is not a known place/node (likely a LINK_ID or error).
          // If we have a segment pending, draw it.
          if (currentPathSegment.length >= 2) {
            const polyline = drawRoutePath(map, currentPathSegment, DEFAULT_ROUTE_COLOR);
            if (polyline) activePolylines.current.push(polyline);
          }
          currentPathSegment = []; // Reset segment
          console.warn(`[MapFeatures] Node ID ${nodeIdStr} from interleaved_route not found in geoJsonNodes or mappedPlaces.`);
        }
      });
      
      if (currentPathSegment.length >= 2) { // Draw any final segment
        const polyline = drawRoutePath(map, currentPathSegment, DEFAULT_ROUTE_COLOR);
        if (polyline) activePolylines.current.push(polyline);
      }
      
      if (allRouteCoordinatesForBounds.length > 0) {
        fitBoundsToCoordinates(map, allRouteCoordinatesForBounds.filter(c => c !== null));
      } else if (mappedPlaces.length > 0) { // Fallback to mapped places if route itself had no coords
        const fallbackCoords = mappedPlaces.map(p => createNaverLatLng(p.y, p.x)).filter(c => c !== null) as any[];
        if (fallbackCoords.length > 0) fitBoundsToCoordinates(map, fallbackCoords);
      }


      if (onComplete) onComplete();
    },
    [map, isNaverLoaded, geoJsonNodes, drawRoutePath, clearAllRoutes, mapPlacesWithGeoNodes]
  );

  const showRouteForPlaceIndex = useCallback(
    (placeIndex: number, itineraryDay: ItineraryDay, onComplete?: () => void) => {
      if (!map || !isNaverLoaded || !itineraryDay || !itineraryDay.places) {
        if (onComplete) onComplete();
        return;
      }
      
      const place = itineraryDay.places[placeIndex];
      if (place && typeof place.y === 'number' && typeof place.x === 'number') { // Check types
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
    [map, isNaverLoaded] // drawRoutePath and clearAllRoutes were removed as it's simplified
  );
  
  const renderGeoJsonRoute = useCallback((route: SegmentRoute) => {
    if (!map || !isNaverLoaded || !route || !route.nodeIds || !route.linkIds) {
      console.warn('[MapFeatures] Cannot render GeoJSON route: invalid input or map not ready');
      return;
    }

    clearAllRoutes();

    // Find all nodes in the route
    const routeNodes = route.nodeIds.map(nodeId => {
      return geoJsonNodes.find(node => String(node.properties.NODE_ID) === String(nodeId));
    }).filter(Boolean);

    if (routeNodes.length < 2) {
      console.warn('[MapFeatures] Not enough valid nodes to render GeoJSON route');
      return;
    }

    // Extract coordinates from nodes
    const coordinates = routeNodes.map(node => {
      if (node && node.geometry.type === 'Point') {
        const [lng, lat] = node.geometry.coordinates;
        return { lat, lng };
      }
      return null;
    }).filter(Boolean) as { lat: number; lng: number }[];

    if (coordinates.length < 2) {
      console.warn('[MapFeatures] Not enough valid coordinates to render GeoJSON route');
      return;
    }

    // Draw the route
    const polyline = drawRoutePath(map, coordinates, DEFAULT_ROUTE_COLOR);
    if (polyline) {
      activePolylines.current.push(polyline);
    }

    // Fit map to route bounds
    const naverCoords = coordinates.map(c => createNaverLatLng(c.lat, c.lng)).filter(c => c !== null) as any[];
    if (naverCoords.length > 0) {
      fitBoundsToCoordinates(map, naverCoords);
    }
  }, [map, isNaverLoaded, geoJsonNodes, drawRoutePath, clearAllRoutes]);

  const highlightSegment = useCallback((segment: SegmentRoute | null) => {
    // Clear previous highlight
    if (highlightedPathRef.current) {
      highlightedPathRef.current.setMap(null);
      highlightedPathRef.current = null;
    }

    if (!map || !isNaverLoaded || !segment || !segment.nodeIds || segment.nodeIds.length < 2) {
      return;
    }

    // Find nodes for this segment
    const segmentNodes = segment.nodeIds.map(nodeId => {
      return geoJsonNodes.find(node => String(node.properties.NODE_ID) === String(nodeId));
    }).filter(Boolean);

    if (segmentNodes.length < 2) {
      console.warn('[MapFeatures] Not enough valid nodes to highlight segment');
      return;
    }

    // Extract coordinates
    const coordinates = segmentNodes.map(node => {
      if (node && node.geometry.type === 'Point') {
        const [lng, lat] = node.geometry.coordinates;
        return { lat, lng };
      }
      return null;
    }).filter(Boolean) as { lat: number; lng: number }[];

    if (coordinates.length < 2) {
      console.warn('[MapFeatures] Not enough valid coordinates to highlight segment');
      return;
    }

    // Draw highlighted path
    const highlightColor = '#ffc107'; // Yellow highlight
    const polyline = drawRoutePath(map, coordinates, highlightColor, 6, 0.8, 200);
    if (polyline) {
      highlightedPathRef.current = polyline;
    }

    // Optionally zoom to this segment
    const naverCoords = coordinates.map(c => createNaverLatLng(c.lat, c.lng)).filter(c => c !== null) as any[];
    if (naverCoords.length > 0) {
      fitBoundsToCoordinates(map, naverCoords);
    }
  }, [map, isNaverLoaded, geoJsonNodes, drawRoutePath]);
  
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
      useRecommendedStyle?: boolean; // This option seems less used now
      useColorByCategory?: boolean;
      onMarkerClick?: (place: Place, index: number) => void;
      itineraryOrder?: boolean; 
    } = {}
  ): any[] => {
    if (!map || !isNaverLoaded || !placesToAdd || placesToAdd.length === 0) return [];

    const { 
      highlightPlaceId, 
      isItinerary = false,
      useColorByCategory = false, 
      onMarkerClick,
      itineraryOrder = false 
    } = options;
    const createdMarkers: any[] = [];

    placesToAdd.forEach((place, index) => {
      // Defensive coordinate check
      if (typeof place.x !== 'number' || typeof place.y !== 'number' || isNaN(place.x) || isNaN(place.y)) {
        console.warn(`[MapFeatures - addMarkers] Place '${place.name}' (ID: ${place.id}) has invalid or missing coordinates (x: ${place.x}, y: ${place.y}). Skipping marker.`);
        return; 
      }

      const position = createNaverLatLng(place.y, place.x);
      if (!position) { // Should not happen if x, y are valid numbers
        console.warn(`[MapFeatures - addMarkers] Failed to create LatLng for '${place.name}'. Skipping marker.`);
        return;
      }

      const isHighlighted = place.id === highlightPlaceId;
      
      const categoryKey = mapCategoryNameToKey(place.category); // from @/utils/categoryColors
      const resolvedCategoryColor = getCategoryColor(categoryKey); // from @/utils/categoryColors
      const markerBaseColor = useColorByCategory ? resolvedCategoryColor : (isHighlighted ? '#FF3B30' : '#4CD964'); // Default green if not by category and not highlighted

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
          anchor: new window.naver.maps.Point(14, 14) // Center anchor
        };
      } else if (isHighlighted) {
         markerIcon = { // Specific style for highlighted marker
          content: `
            <div style="
              width: 30px; height: 30px; border-radius: 50%; 
              background-color: #FF3B30; /* Explicit highlight color */
              color: white; display: flex;
              align-items: center; justify-content: center;
              box-shadow: 0 2px 6px rgba(0,0,0,0.5); border: 2px solid white;
              font-size: 16px; /* Slightly larger icon for highlight */
            ">⭐</div>
          `, // Using a star for highlighted, for example
          anchor: new window.naver.maps.Point(15, 15) // Center anchor
        };
      }
       else { // Default non-itinerary, non-highlighted marker
        markerIcon = {
          content: `
            <div style="
              width: 12px; height: 12px; border-radius: 50%;
              background-color: ${markerBaseColor};
              border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            "></div>
          `,
          anchor: new window.naver.maps.Point(6, 6) // Center anchor
        };
      }

      const marker = new window.naver.maps.Marker({
        position: position,
        map: map,
        title: place.name,
        icon: markerIcon,
        zIndex: isHighlighted ? 200 : (isItinerary && itineraryOrder ? 100 - index : 50)
      });

      // InfoWindow content (simplified)
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
        pixelOffset: new window.naver.maps.Point(0, -15) // Adjust offset based on marker icon
      });

      window.naver.maps.Event.addListener(marker, 'click', () => {
        // Consider managing infoWindows globally if only one should be open.
        infoWindow.open(map, marker); 
        if (onMarkerClick) {
          onMarkerClick(place, index);
        }
      });

      createdMarkers.push(marker);
    });
    
    return createdMarkers;
  }, [map, isNaverLoaded]);

  const calculateRoutes = useCallback((placesToRoute: Place[]) => {
    if (!map || !isNaverLoaded || placesToRoute.length < 2) return [];

    const polylines: any[] = [];
    const pathCoordinates = placesToRoute
        .filter(p => typeof p.x === 'number' && typeof p.y === 'number') // Ensure valid coords
        .map(place => ({ lat: place.y, lng: place.x }));

    if (pathCoordinates.length < 2) return [];

    const polyline = drawRoutePath(map, pathCoordinates, '#22c55e', 4); // Green color, weight 4
    if (polyline) {
      polylines.push(polyline);
      activePolylines.current.push(polyline); 
    }
    
    return polylines; 
  }, [map, isNaverLoaded, drawRoutePath]);


  return {
    addMarkers,
    clearMarkersAndUiElements: clearAllRoutes, 
    calculateRoutes,
    renderItineraryRoute,
    clearAllRoutes,
    highlightSegment,
    clearPreviousHighlightedPath,
    showRouteForPlaceIndex,
    renderGeoJsonRoute,
    mapPlacesWithGeoNodes
  };
};
