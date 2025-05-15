import { useCallback, useEffect, useRef, useState, Dispatch, SetStateAction } from 'react';
import { ItineraryDay, RouteData, ItineraryPlace } from '@/types/itinerary'; // ItineraryDay uses ItineraryPlace
import { Place } from '@/types/supabase'; // Place now has optional fields
import { getCategoryColor, routeStyles } from '@/utils/map/mapStyles';
import { ServerRouteResponse } from '@/types/schedule';
import { resolveLocationToCoordinates } from '@/utils/map/mapNavigation';

interface UseMapCoreProps {
  places?: Place[]; 
  selectedPlace?: Place | null; 
  itinerary?: ItineraryDay[] | null;
  selectedDay?: number | null;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onMapLoad?: (map: any) => void;
  setSelectedPlace?: (place: Place | ItineraryPlace | null) => void; 
  serverRoutesDataInput?: Record<number, ServerRouteResponse>; // Renamed to avoid conflict with state
  loadGeoJsonData?: boolean;
}

export const useMapCore = ({
  places = [],
  selectedPlace = null,
  itinerary = null,
  selectedDay = null,
  initialCenter = { lat: 33.3846, lng: 126.5535 }, 
  initialZoom = 10,
  onMapLoad,
  setSelectedPlace,
  serverRoutesDataInput = {}, // Use the renamed prop
  loadGeoJsonData = false,
}: UseMapCoreProps) => {
  const [map, setMap] = useState<any>(null);
  const [mapScriptLoaded, setMapScriptLoaded] = useState<boolean>(false);
  const [mapError, setMapError] = useState<boolean>(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markers = useRef<any[]>([]);
  const highlightedMarker = useRef<any | null>(null);
  const polylines = useRef<any[]>([]);
  
  // State for serverRoutesData and its setter
  const [serverRoutesData, setServerRoutesDataState] = useState<Record<number, ServerRouteResponse>>(serverRoutesDataInput);

  const setServerRoutes = useCallback((dayRoutes: Record<number, ServerRouteResponse>) => {
    setServerRoutesDataState(dayRoutes);
  }, []);

  // Placeholder for calculateRoutes
  const calculateRoutes = useCallback((routePlaces: Place[]) => {
    console.log("Calculating routes for:", routePlaces);
    // Actual route calculation logic would go here
  }, [map]);

  // Now panTo accepts string locations as well
  const panTo = useCallback((placeOrCoords: Place | ItineraryPlace | { lat: number; lng: number } | string) => {
    if (!map) return;

    let position;
    
    // Handle string location names
    if (typeof placeOrCoords === 'string') {
      const coords = resolveLocationToCoordinates(placeOrCoords);
      if (coords) {
        position = new window.naver.maps.LatLng(coords.lat, coords.lng);
      } else {
        console.warn("Could not resolve location name:", placeOrCoords);
        return;
      }
    }
    // Handle Place or ItineraryPlace objects
    else if ('x' in placeOrCoords && 'y' in placeOrCoords) {
      if (typeof placeOrCoords.y !== 'number' || typeof placeOrCoords.x !== 'number') return;
      position = new window.naver.maps.LatLng(placeOrCoords.y, placeOrCoords.x);
    }
    // Handle {lat, lng} objects
    else if ('lat' in placeOrCoords && 'lng' in placeOrCoords) {
      position = new window.naver.maps.LatLng(placeOrCoords.lat, placeOrCoords.lng);
    }
    else {
      console.warn("panTo called with invalid arguments:", placeOrCoords);
      return;
    }
    
    map.panTo(position);
  }, [map]);

  // Function to add markers for places
  const addMarkersInternal = useCallback((placesToMark: (Place | ItineraryPlace)[], isItineraryContext: boolean) => { // Allow ItineraryPlace array
    if (!map) return [];

    markers.current.forEach(marker => marker.setMap(null));
    markers.current = [];

    const createdMarkers: any[] = [];

    placesToMark.forEach(place => {
      if (typeof place.x === 'number' && typeof place.y === 'number') {
        const position = new window.naver.maps.LatLng(place.y, place.x);
        const isHighlighted = selectedPlace && selectedPlace.id === place.id;
        // Use category property from place, fallback to a default
        const category = place.category || 'default';
        const color = getCategoryColor(category);
        
        const marker = new window.naver.maps.Marker({
          position,
          map,
          icon: {
            content: `<div class="marker ${isHighlighted ? 'highlighted' : ''}" style="background-color: ${color}; width: ${isHighlighted ? 36 : 24}px; height: ${isHighlighted ? 36 : 24}px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white; font-weight: bold;">${place.name?.charAt(0) || '?'}</div>`,
            anchor: new window.naver.maps.Point(isHighlighted ? 18 : 12, isHighlighted ? 18 : 12),
          },
          title: place.name || 'Unknown Place',
          zIndex: isHighlighted ? 100 : (isItineraryContext ? 20 : 10), // Itinerary markers slightly higher zIndex
        });

        window.naver.maps.Event.addListener(marker, 'click', () => {
          if (setSelectedPlace) {
            setSelectedPlace(place);
          }
          panTo(place); // panTo now accepts Place | ItineraryPlace
        });

        markers.current.push(marker);
        createdMarkers.push(marker);
        
        if (isHighlighted) {
          highlightedMarker.current = marker;
        }
      }
    });

    return createdMarkers;
  }, [map, selectedPlace, setSelectedPlace, panTo]);
  
  const addMarkers = useCallback((placesToMark: Place[]) => {
      return addMarkersInternal(placesToMark, false);
  }, [addMarkersInternal]);

  const addItineraryDayMarkers = useCallback((daySchedule: ItineraryDay | null) => {
      if (daySchedule && daySchedule.places) { // daySchedule.places is ItineraryPlace[]
          addMarkersInternal(daySchedule.places, true);
      } else {
          // Clear markers if no day schedule or no places
          markers.current.forEach(marker => marker.setMap(null));
          markers.current = [];
      }
  }, [addMarkersInternal]);

  const clearRoutes = useCallback(() => {
    polylines.current.forEach(polyline => polyline.setMap(null));
    polylines.current = [];
    if (window.geoJsonLayer?.clearDisplayedFeatures) {
      window.geoJsonLayer.clearDisplayedFeatures();
    }
  }, []);

  // Function to draw route for the selected itinerary day
  const drawItineraryRoute = useCallback((daySchedule: ItineraryDay | null) => {
    clearRoutes(); // Clear previous routes first

    if (!map || !window.geoJsonLayer?.renderRoute) {
      console.warn('Map or GeoJSON layer not ready for drawing route.');
      return;
    }

    if (daySchedule && daySchedule.route && daySchedule.route.nodeIds && daySchedule.route.linkIds) {
      console.log(`[MapCore] Drawing route for Day ${daySchedule.day} with ${daySchedule.route.nodeIds.length} nodes.`);
      try {
        const renderedFeatures = window.geoJsonLayer.renderRoute(
          daySchedule.route.nodeIds.map(String), 
          daySchedule.route.linkIds.map(String), 
          routeStyles.default
        );
        if (Array.isArray(renderedFeatures)) {
            polylines.current.push(...renderedFeatures.filter(f => f && typeof f.setMap === 'function'));
        }
      } catch (error) {
        console.error('[MapCore] Error rendering route:', error);
      }
    } else {
      console.log('[MapCore] No route data to draw for selected day or route data incomplete.');
    }
  }, [map, clearRoutes]);

  // Effect to draw route when selectedDay or itinerary changes
  useEffect(() => {
    clearRoutes(); // Clear existing routes first
    if (itinerary && selectedDay !== null) {
      const dayData = itinerary.find(d => d.day === selectedDay);
      if (dayData) {
        // Prefer server route data if available for this day
        const serverDayRoute = serverRoutesData?.[selectedDay]; // Use state serverRoutesData
        if (serverDayRoute?.nodeIds && serverDayRoute?.linkIds && window.geoJsonLayer?.renderRoute) {
          console.log(`[useMapCore] Drawing SERVER route for day ${selectedDay}. Nodes: ${serverDayRoute.nodeIds.length}`);
          try {
            const features = window.geoJsonLayer.renderRoute(
              serverDayRoute.nodeIds.map(String), 
              serverDayRoute.linkIds.map(String), 
              routeStyles.highlight 
            );
            if (Array.isArray(features)) {
                polylines.current.push(...features.filter(f => f && typeof f.setMap === 'function'));
            }
          } catch (error) {
            console.error('[useMapCore] Error rendering server route:', error);
          }
        } else if (dayData.route?.nodeIds && dayData.route?.linkIds && window.geoJsonLayer?.renderRoute) {
          // Fallback to client itinerary route
          console.log(`[useMapCore] Drawing CLIENT route for day ${selectedDay}. Nodes: ${dayData.route.nodeIds.length}`);
          try {
            const features = window.geoJsonLayer.renderRoute(
              dayData.route.nodeIds.map(String),
              dayData.route.linkIds.map(String),
              routeStyles.default
            );
            if (Array.isArray(features)) {
                polylines.current.push(...features.filter(f => f && typeof f.setMap === 'function'));
            }
          } catch (error) {
            console.error('[useMapCore] Error rendering client route:', error);
          }
        } else {
          console.log(`[useMapCore] No route data (server or client) for day ${selectedDay}.`);
        }
      }
    }
  }, [selectedDay, itinerary, map, serverRoutesData, clearRoutes]); // Use state serverRoutesData


  // Effect for handling server-provided routes (This might be redundant if combined above, review)
  // This useEffect seems to duplicate logic from the one above. 
  // Let's simplify by ensuring the above effect correctly handles serverRoutesData priority.
  // Commenting out the dedicated serverRoutesData effect for now.
  /*
  useEffect(() => {
    // Logic here might be covered by the combined effect above.
    // If specific server-only route drawing logic is needed (e.g., different clearing behavior),
    // it could be reinstated or merged more carefully.
    // For now, assuming the combined effect handles server routes first, then client routes.
  }, [map, selectedDay, itinerary, serverRoutesData, clearRoutes]);
  */

  // Function to handle clicks on the map (e.g., deselect place, or other interactions)
  const handleMapClick = useCallback(() => {
    if (setSelectedPlace) {
      // setSelectedPlace(null); // Example: deselect place on map click
    }
    // Add other map click logic if needed
  }, [setSelectedPlace]);

  // Effect for initializing map click listener
  useEffect(() => {
    if (!map) return;

    const listener = window.naver.maps.Event.addListener(map, 'click', handleMapClick);

    return () => {
      window.naver.maps.Event.removeListener(listener);
    };
  }, [map, handleMapClick]);

  // Initial map setup effect
  useEffect(() => {
    if (!mapScriptLoaded || !mapContainerRef.current || map) return; // Added map check to prevent re-init

    try {
      const mapOptions = {
        center: new window.naver.maps.LatLng(initialCenter.lat, initialCenter.lng),
        zoom: initialZoom,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.naver.maps.MapTypeControlStyle.DROPDOWN
        }
      };
      
      console.log('[MapCore] Initializing Naver Map with options:', mapOptions, 'Container:', mapContainerRef.current);
      const mapInstance = new window.naver.maps.Map(mapContainerRef.current, mapOptions);
      
      setMap(mapInstance);
      
      if (onMapLoad) {
        onMapLoad(mapInstance);
      }

      if (loadGeoJsonData && window.geoJsonLayer?.renderAllNetwork) {
        console.log('[MapCore] Loading GeoJSON network data...');
        try {
          window.geoJsonLayer.renderAllNetwork({
            strokeColor: '#AAAAAA',
            strokeWeight: 1,
            strokeOpacity: 0.5
          });
        } catch (error) {
          console.error('[MapCore] Error loading GeoJSON network:', error);
        }
      }
    } catch (error) {
      console.error('[MapCore] Error initializing map:', error);
      setMapError(true);
    }
  }, [mapScriptLoaded, initialCenter, initialZoom, onMapLoad, loadGeoJsonData, map]); // Added map to dependency

  // Effect to update markers when places, selectedPlace, itinerary, or selectedDay change
  useEffect(() => {
    if (!map) return;

    if (itinerary && selectedDay !== null) {
      const daySchedule = itinerary.find(day => day.day === selectedDay);
      addItineraryDayMarkers(daySchedule || null); // Pass null if daySchedule is undefined
    } else {
      addMarkers(places);
    }
  }, [map, places, selectedPlace, itinerary, selectedDay, addMarkers, addItineraryDayMarkers]);


  return {
    map,
    mapContainerRef,
    isNaverLoaded: mapScriptLoaded,
    isMapError: mapError,
    setMapScriptLoaded,
    panTo,
    addMarkers, // general place markers
    addItineraryDayMarkers, // itinerary day specific markers
    drawItineraryRoute, // to draw route for a specific day
    calculateRoutes,    // Added to return
    setServerRoutes,    // Added to return
    serverRoutesData,   // Added to return
  };
};
