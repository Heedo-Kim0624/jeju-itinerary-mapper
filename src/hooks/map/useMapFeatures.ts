
import { useEffect, useState, useCallback } from 'react';
import { RouteStyle } from '@/components/rightpanel/geojson/GeoJsonTypes';
import { ItineraryDay } from '@/types/itinerary';

// Route styles
const DEFAULT_STYLE: RouteStyle = {
  strokeColor: '#5347AA',
  strokeWeight: 5,
  strokeOpacity: 0.7,
  zIndex: 100
};

const HIGHLIGHTED_STYLE: RouteStyle = {
  strokeColor: '#FF6B6B',
  strokeWeight: 6,
  strokeOpacity: 0.9,
  zIndex: 200
};

interface UseMapFeaturesProps {
  /**
   * Whether the GeoJSON is available and loaded
   */
  isGeoJsonAvailable: boolean;
  
  /**
   * Itinerary schedule if available
   */
  schedule?: ItineraryDay[];
  
  /**
   * Currently selected day in the itinerary
   */
  selectedDay?: number | null;
}

/**
 * Hook to manage map features like routes, markers, etc.
 */
export const useMapFeatures = ({
  isGeoJsonAvailable,
  schedule,
  selectedDay
}: UseMapFeaturesProps) => {

  const [isRouteDisplayed, setIsRouteDisplayed] = useState(false);
  const [displayedFeatures, setDisplayedFeatures] = useState<any[]>([]);
  const [networkDisplayed, setNetworkDisplayed] = useState(false);

  /**
   * Render route for a specific day
   */
  const renderDayRoute = useCallback(
    (day: number, style: RouteStyle = DEFAULT_STYLE) => {
      if (!isGeoJsonAvailable || !window.geoJsonLayer || !schedule) return;

      const daySchedule = schedule.find((d) => d.day === day);
      
      if (!daySchedule) {
        console.warn(`[useMapFeatures] Day ${day} not found in schedule`);
        return;
      }
      
      // Check for route data - first try routeNodeIds (new property) then fallback to routeData (legacy)
      const routeNodeIds = daySchedule.routeNodeIds || daySchedule.routeData;
      
      if (!routeNodeIds || routeNodeIds.length === 0) {
        console.warn(`[useMapFeatures] No route data for day ${day}`);
        return;
      }
      
      try {
        // Clear any previously displayed features
        window.geoJsonLayer.clearDisplayedFeatures();
        
        // Extract place node IDs and link IDs from the route data
        const allNodeIdsFromServer: string[] = routeNodeIds.map(String);
        
        // The route data follows a pattern: node, link, node, link, ...
        // So we extract nodes at even positions (0, 2, 4, ...)
        // And links at odd positions (1, 3, 5, ...)
        const placeNodeIds = allNodeIdsFromServer.filter((_, i) => i % 2 === 0);
        const linkIds = allNodeIdsFromServer.filter((_, i) => i % 2 === 1);
        
        // Render the route using the GeoJSON layer
        const features = window.geoJsonLayer.renderRoute(
          placeNodeIds,
          linkIds,
          style
        );
        
        setDisplayedFeatures(features);
        setIsRouteDisplayed(true);
      } catch (error) {
        console.error(`[useMapFeatures] Error rendering route for day ${day}:`, error);
      }
    },
    [isGeoJsonAvailable, schedule]
  );

  /**
   * Display route for currently selected day
   */
  const displaySelectedDayRoute = useCallback(() => {
    if (!selectedDay || !schedule || !isGeoJsonAvailable) {
      return;
    }

    const daySchedule = schedule.find((d) => d.day === selectedDay);
    
    if (!daySchedule) {
      console.warn(`[useMapFeatures] Selected day ${selectedDay} not found in schedule`);
      return;
    }

    // Check if we have route data available
    const routeNodeIds = daySchedule.routeNodeIds || daySchedule.routeData;
    
    if (!routeNodeIds || routeNodeIds.length === 0) {
      // If no route data is available, we can't render a route
      console.warn(`[useMapFeatures] No route data available for day ${selectedDay}`);
      
      // Alternative: render places only or calculate a route
      return;
    }

    // Render the route for the selected day
    renderDayRoute(selectedDay, HIGHLIGHTED_STYLE);
  }, [isGeoJsonAvailable, renderDayRoute, schedule, selectedDay]);

  /**
   * Toggle display of the full transportation network
   */
  const toggleNetworkDisplay = useCallback(() => {
    if (!isGeoJsonAvailable || !window.geoJsonLayer) return;
    
    try {
      if (networkDisplayed) {
        // Hide the network
        window.geoJsonLayer.clearDisplayedFeatures();
        setNetworkDisplayed(false);
        
        // If a day was selected, re-render that day's route
        if (selectedDay && schedule) {
          displaySelectedDayRoute();
        }
      } else {
        // Show the full network with a different style
        const networkStyle: RouteStyle = {
          strokeColor: '#AAAAAA',
          strokeWeight: 2,
          strokeOpacity: 0.4,
          zIndex: 50
        };
        
        // Render all network links and nodes
        const features = window.geoJsonLayer.renderAllNetwork(networkStyle);
        setDisplayedFeatures(features);
        setNetworkDisplayed(true);
      }
    } catch (error) {
      console.error('[useMapFeatures] Error toggling network display:', error);
    }
  }, [
    displaySelectedDayRoute, 
    isGeoJsonAvailable, 
    networkDisplayed, 
    schedule, 
    selectedDay
  ]);

  // Update route display whenever selected day changes
  useEffect(() => {
    if (isGeoJsonAvailable && selectedDay && schedule) {
      displaySelectedDayRoute();
    }
  }, [displaySelectedDayRoute, isGeoJsonAvailable, schedule, selectedDay]);

  // Clear displayed features on unmount
  useEffect(() => {
    return () => {
      if (window.geoJsonLayer) {
        window.geoJsonLayer.clearDisplayedFeatures();
      }
    };
  }, []);

  return {
    isRouteDisplayed,
    renderDayRoute,
    displaySelectedDayRoute,
    toggleNetworkDisplay,
    networkDisplayed
  };
};
