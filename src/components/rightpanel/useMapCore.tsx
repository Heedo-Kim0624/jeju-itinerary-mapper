import { useCallback, useEffect, useRef, useState } from 'react';
import { ItineraryDay, RouteData } from '@/types/itinerary';
import { Place } from '@/types/supabase';
import { getCategoryColor, routeStyles } from '@/utils/map/mapStyles';
import { ServerRouteResponse } from '@/types/schedule';

interface UseMapCoreProps {
  places?: Place[];
  selectedPlace?: Place | null;
  itinerary?: ItineraryDay[] | null;
  selectedDay?: number | null;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onMapLoad?: (map: any) => void;
  setSelectedPlace?: (place: Place | null) => void;
  serverRoutesData?: Record<number, ServerRouteResponse>;
  loadGeoJsonData?: boolean;
}

export const useMapCore = ({
  places = [],
  selectedPlace = null,
  itinerary = null,
  selectedDay = null,
  initialCenter = { lat: 33.3846, lng: 126.5535 }, // Default to Jeju Island center
  initialZoom = 10,
  onMapLoad,
  setSelectedPlace,
  serverRoutesData = {},
  loadGeoJsonData = false,
}: UseMapCoreProps) => {
  const [map, setMap] = useState<any>(null);
  const [mapScriptLoaded, setMapScriptLoaded] = useState<boolean>(false);
  const [mapError, setMapError] = useState<boolean>(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markers = useRef<any[]>([]);
  const highlightedMarker = useRef<any | null>(null);

  // Function to pan the map to a specific location
  const panTo = useCallback((place: Place) => {
    if (!map) return;
    
    const position = new window.naver.maps.LatLng(place.y, place.x);
    map.panTo(position);
  }, [map]);

  // Function to add markers for places
  const addMarkers = useCallback((placesToMark: Place[]) => {
    if (!map) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.setMap(null));
    markers.current = [];

    // Add new markers
    placesToMark.forEach(place => {
      if (place.x && place.y) {
        const position = new window.naver.maps.LatLng(place.y, place.x);
        const isHighlighted = selectedPlace && selectedPlace.id === place.id;
        const color = getCategoryColor(place.category || 'default');
        
        const marker = new window.naver.maps.Marker({
          position,
          map,
          icon: {
            content: `<div class="marker ${isHighlighted ? 'highlighted' : ''}" style="background-color: ${color}; width: ${isHighlighted ? 36 : 24}px; height: ${isHighlighted ? 36 : 24}px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white; font-weight: bold;">${place.name?.charAt(0) || '?'}</div>`,
            anchor: new window.naver.maps.Point(isHighlighted ? 18 : 12, isHighlighted ? 18 : 12),
          },
          title: place.name || 'Unknown Place',
          zIndex: isHighlighted ? 100 : 10,
        });

        // Add click event to marker
        window.naver.maps.Event.addListener(marker, 'click', () => {
          if (setSelectedPlace) {
            setSelectedPlace(place);
          }
          panTo(place);
        });

        markers.current.push(marker);
        
        if (isHighlighted) {
          highlightedMarker.current = marker;
        }
      }
    });
  }, [map, selectedPlace, setSelectedPlace, panTo]);

  // Function to add markers for places in the itinerary for a selected day
  const addItineraryDayMarkers = useCallback((daySchedule: ItineraryDay | null) => {
    if (!map) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.setMap(null));
    markers.current = [];

    if (daySchedule && daySchedule.places) {
      daySchedule.places.forEach(place => {
        if (place.x && place.y) {
          const position = new window.naver.maps.LatLng(place.y, place.x);
          const isHighlighted = selectedPlace && selectedPlace.id === place.id;
          const color = getCategoryColor(place.category || 'default');
          
          const marker = new window.naver.maps.Marker({
            position,
            map,
            icon: {
              content: `<div class="marker ${isHighlighted ? 'highlighted' : ''}" style="background-color: ${color}; width: ${isHighlighted ? 36 : 24}px; height: ${isHighlighted ? 36 : 24}px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white; font-weight: bold;">${place.name?.charAt(0) || '?'}</div>`,
              anchor: new window.naver.maps.Point(isHighlighted ? 18 : 12, isHighlighted ? 18 : 12),
            },
            title: place.name || 'Unknown Place',
            zIndex: isHighlighted ? 100 : 10,
          });

          // Add click event to marker
          window.naver.maps.Event.addListener(marker, 'click', () => {
            if (setSelectedPlace) {
              setSelectedPlace(place);
            }
            panTo(place);
          });

          markers.current.push(marker);
          
          if (isHighlighted) {
            highlightedMarker.current = marker;
          }
        }
      });
    }
  }, [map, markers, highlightedMarker, selectedPlace, setSelectedPlace, panTo]);

  // Function to draw route for the selected itinerary day
  const drawItineraryRoute = useCallback((daySchedule: ItineraryDay | null) => {
    if (!map || !window.geoJsonLayer?.renderRoute) {
      console.warn('Map or GeoJSON layer not ready for drawing route.');
      return;
    }
    
    // Clear existing route if any (assuming geoJsonLayer.clearDisplayedFeatures clears routes too)
    // window.geoJsonLayer.clearDisplayedFeatures(); // Or a more specific route clearing function

    if (daySchedule && daySchedule.route && daySchedule.route.nodeIds && daySchedule.route.linkIds) {
      console.log(`[MapCore] Drawing route for Day ${daySchedule.day} with ${daySchedule.route.nodeIds.length} nodes.`);
      try {
        // Assuming renderRoute expects nodeIds and linkIds directly.
        // The style argument is optional as per vite-env.d.ts
        window.geoJsonLayer.renderRoute(daySchedule.route.nodeIds, daySchedule.route.linkIds, routeStyles.default);
      } catch (error) {
        console.error('[MapCore] Error rendering route:', error);
      }
    } else {
      console.log('[MapCore] No route data to draw for selected day or route data incomplete.');
      // If there was a previously drawn route, ensure it's cleared
      // This might need a specific function if clearDisplayedFeatures is too broad
       if (window.geoJsonLayer?.clearDisplayedFeatures) { // Check if function exists
         // console.log('[MapCore] Clearing displayed GeoJSON features as no new route is drawn.');
         // window.geoJsonLayer.clearDisplayedFeatures(); // Consider implications if this clears markers too
       }
    }
  }, [map]);


  // Effect to draw route when selectedDay or itinerary changes
  useEffect(() => {
    if (itinerary && selectedDay !== null) {
      const dayData = itinerary.find(d => d.day === selectedDay);
      if (dayData) {
        // Draw route using the new 'route' object which contains nodeIds and linkIds
        if (dayData.route && dayData.route.nodeIds && dayData.route.linkIds) {
          console.log(`[useMapCore] Drawing route for day ${selectedDay}. Nodes: ${dayData.route.nodeIds.length}`);
           if (window.geoJsonLayer?.renderRoute) {
            window.geoJsonLayer.renderRoute(dayData.route.nodeIds, dayData.route.linkIds, routeStyles.default);
           } else {
            console.warn('geoJsonLayer.renderRoute is not available.');
           }
        } else {
          console.log(`[useMapCore] No route data for day ${selectedDay}. Clearing old route.`);
          if (window.geoJsonLayer?.clearDisplayedFeatures) {
            window.geoJsonLayer.clearDisplayedFeatures(); // Clear previous routes if no new one
          }
        }
      } else {
         if (window.geoJsonLayer?.clearDisplayedFeatures) {
            window.geoJsonLayer.clearDisplayedFeatures(); // Clear route if dayData not found
         }
      }
    } else {
       if (window.geoJsonLayer?.clearDisplayedFeatures) {
        window.geoJsonLayer.clearDisplayedFeatures(); // Clear route if no itinerary or selectedDay
       }
    }
  }, [selectedDay, itinerary, map, serverRoutesData]); // Added map and serverRoutesData to dependencies if they influence routing


  // Effect for handling server-provided routes
  useEffect(() => {
    if (map && serverRoutesData && selectedDay !== null && window.geoJsonLayer?.renderRoute) {
      const dayRouteData = serverRoutesData[selectedDay];
      if (dayRouteData && dayRouteData.nodeIds && dayRouteData.linkIds) {
        console.log(`[useMapCore] Drawing server route for Day ${selectedDay}. Nodes: ${dayRouteData.nodeIds.length}`);
        // Make sure to clear any existing client-side route before drawing server route
        // if (window.geoJsonLayer.clearDisplayedFeatures) window.geoJsonLayer.clearDisplayedFeatures();
        window.geoJsonLayer.renderRoute(dayRouteData.nodeIds, dayRouteData.linkIds, routeStyles.highlight); // Example: use highlight style
      } else if (itinerary) {
        // Fallback to client itinerary route if server route for the day is not available
        const clientDayData = itinerary.find(d => d.day === selectedDay);
        if (clientDayData?.route?.nodeIds && clientDayData.route.linkIds) {
          console.log(`[useMapCore] Server route not found for Day ${selectedDay}, drawing client route. Nodes: ${clientDayData.route.nodeIds.length}`);
          // if (window.geoJsonLayer.clearDisplayedFeatures) window.geoJsonLayer.clearDisplayedFeatures();
          window.geoJsonLayer.renderRoute(clientDayData.route.nodeIds, clientDayData.route.linkIds, routeStyles.default);
        } else {
          // console.log(`[useMapCore] No server or client route data for Day ${selectedDay}. Clearing old route.`);
          // if (window.geoJsonLayer.clearDisplayedFeatures) window.geoJsonLayer.clearDisplayedFeatures();
        }
      }
    } else if (!serverRoutesData || Object.keys(serverRoutesData).length === 0) {
      // This case ensures that if server routes are cleared, we might fall back to client itinerary routes or clear existing ones.
      // console.log('[useMapCore] Server routes data is empty. Ensuring map reflects this.');
      // Consider redrawing client itinerary route or clearing, based on desired logic.
      // For now, if serverRoutesData is empty, it doesn't actively clear; existing client routes might persist from other effects.
      // This logic might need refinement based on how serverRoutesData interacts with client-side itinerary display.
    }
  }, [map, selectedDay, itinerary, serverRoutesData]); // Ensure all dependencies are covered

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
    if (!mapScriptLoaded || !mapContainerRef.current) return;

    try {
      // Initialize the map
      const mapInstance = new window.naver.maps.Map(mapContainerRef.current, {
        center: new window.naver.maps.LatLng(initialCenter.lat, initialCenter.lng),
        zoom: initialZoom,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.naver.maps.MapTypeControlStyle.DROPDOWN
        }
      });

      setMap(mapInstance);
      
      // Call onMapLoad callback if provided
      if (onMapLoad) {
        onMapLoad(mapInstance);
      }

      // Load GeoJSON data if needed
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
  }, [mapScriptLoaded, initialCenter, initialZoom, onMapLoad, loadGeoJsonData]);

  // Effect to update markers when places, selectedPlace, itinerary, or selectedDay change
  useEffect(() => {
    if (!map) return;

    // If we have an itinerary and a selected day, show markers for that day's places
    if (itinerary && selectedDay !== null) {
      const daySchedule = itinerary.find(day => day.day === selectedDay);
      if (daySchedule) {
        addItineraryDayMarkers(daySchedule);
        return;
      }
    }

    // Otherwise, show markers for all places
    addMarkers(places);
  }, [map, places, selectedPlace, itinerary, selectedDay, addMarkers, addItineraryDayMarkers]);

  return {
    map,
    mapContainerRef,
    isNaverLoaded: mapScriptLoaded,
    isMapError: mapError,
    setMapScriptLoaded,
    panTo,
    addMarkers,
    addItineraryDayMarkers,
    drawItineraryRoute
  };
};
