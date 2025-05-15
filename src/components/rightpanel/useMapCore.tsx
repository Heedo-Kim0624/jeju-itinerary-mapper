
import { useCallback, useState, useRef, MutableRefObject } from 'react';
import { Place } from '@/types/supabase';
import { useGeoJsonState } from '@/hooks/map/useGeoJsonState';
import { useMapFeatures } from '@/hooks/map/useMapFeatures';
import { GeoJsonLayerRef } from './geojson/GeoJsonTypes';
import { ItineraryDay } from '@/hooks/use-itinerary-creator';

export function useMapCore() {
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const markers = useRef<mapboxgl.Marker[]>([]);
  
  // Layer references
  const geojsonLayerRef = useRef<GeoJsonLayerRef>({} as GeoJsonLayerRef);
  
  // GeoJSON state management
  const geoJsonState = useGeoJsonState({
    url: '',
    onDataLoaded: () => console.log("GeoJSON data loaded")
  });
  
  // Map features
  const mapFeatures = useMapFeatures();
  
  // Remove all markers from the map
  const removeAllMarkers = useCallback(() => {
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
  }, []);

  // Add markers for places
  const addMarkers = useCallback((places: Place[], options = { highlight: false, useRecommendedStyle: false }) => {
    if (!map.current || !places) return;
    
    mapFeatures.addMarkersToMap(places, options);
  }, [mapFeatures]);

  // Pan to a specific location
  const panTo = useCallback((location: { lat: number, lng: number }) => {
    if (map.current) {
      map.current.flyTo({
        center: [location.lng, location.lat],
        essential: true,
        zoom: 14
      });
    }
  }, []);

  // Clear all markers and UI elements
  const clearMarkersAndUiElements = useCallback(() => {
    removeAllMarkers();
    if (geojsonLayerRef.current && geojsonLayerRef.current.clearDisplayedFeatures) {
      geojsonLayerRef.current.clearDisplayedFeatures();
    }
  }, [removeAllMarkers]);

  // Render the route for a specific itinerary day
  const renderItineraryDay = useCallback((day: ItineraryDay) => {
    mapFeatures.renderItineraryDay(day);
  }, [mapFeatures]);

  // Render the entire network
  const renderEntireNetwork = useCallback(() => {
    mapFeatures.renderEntireNetwork();
  }, [mapFeatures]);

  // Debug function to show all paths
  const debugShowAllPaths = useCallback(() => {
    mapFeatures.debugShowAllPaths();
  }, [mapFeatures]);

  return {
    map,
    mapLoaded,
    setMapLoaded,
    markers,
    geojsonLayerRef,
    
    // Map actions
    panTo,
    addMarkers,
    removeAllMarkers,
    clearMarkersAndUiElements,
    
    // GeoJSON state
    geoJsonState,
    
    // Map features
    mapFeatures: {
      addMarkersToMap: mapFeatures.addMarkersToMap,
      renderItineraryDay: mapFeatures.renderItineraryDay,
      renderEntireNetwork: mapFeatures.renderEntireNetwork,
      debugShowAllPaths: mapFeatures.debugShowAllPaths
    }
  };
}
