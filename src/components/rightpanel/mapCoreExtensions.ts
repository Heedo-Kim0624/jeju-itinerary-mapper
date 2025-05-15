
import { ItineraryDay } from '@/types/itinerary';
import { Place } from '@/types/supabase';
import { RouteStyle } from './geojson/GeoJsonTypes';

// This file adds extensions to useMapCore functionality

/**
 * Renders a GeoJSON route using node and link IDs
 */
export const renderGeoJsonRoute = (nodeIds: string[], linkIds: string[], style?: any) => {
  if (!window.geoJsonLayer) {
    console.warn("GeoJSON layer is not available");
    return [];
  }
  return window.geoJsonLayer.renderRoute(nodeIds, linkIds, style);
};

/**
 * Renders an itinerary route for a specific day
 */
export const renderItineraryRoute = (itineraryDay: ItineraryDay | null) => {
  if (!window.geoJsonLayer) {
    console.warn("GeoJSON layer is not available");
    return;
  }
  
  if (!itineraryDay || !itineraryDay.routeNodeIds) {
    console.warn("No route data available for this day");
    return;
  }
  
  // For compatibility with both routeNodeIds and routeData
  const nodeIds = itineraryDay.routeNodeIds || itineraryDay.routeData;
  
  if (!nodeIds || nodeIds.length === 0) {
    console.warn("Empty route data for this day");
    return;
  }
  
  // Assuming routeNodeIds contains alternating node and link IDs
  const placeNodeIds = nodeIds.filter((_, i) => i % 2 === 0);
  const linkIds = nodeIds.filter((_, i) => i % 2 === 1);
  
  renderGeoJsonRoute(placeNodeIds, linkIds, {
    strokeColor: '#228B22',
    strokeWeight: 5,
    strokeOpacity: 0.7,
    zIndex: 100
  });
};

/**
 * Clears any previously highlighted paths
 */
export const clearPreviousHighlightedPath = () => {
  if (!window.geoJsonLayer) {
    console.warn("GeoJSON layer is not available");
    return;
  }
  window.geoJsonLayer.clearDisplayedFeatures();
};

/**
 * Shows a route for a specific place index in an itinerary day
 */
export const showRouteForPlaceIndex = (placeIndex: number, itineraryDay: ItineraryDay) => {
  console.log(`Showing route for place index ${placeIndex} in day ${itineraryDay.day}`);
  // Implementation would depend on the specific requirements
  // This is a placeholder
};

/**
 * Highlights a segment of a route between two indexes
 */
export const highlightSegment = (fromIndex: number, toIndex: number, itineraryDay?: ItineraryDay) => {
  console.log(`Highlighting segment from index ${fromIndex} to ${toIndex}`);
  // Implementation would depend on the specific requirements
  // This is a placeholder
};

/**
 * Renders the entire network on the map
 */
export const renderAllNetwork = (style?: RouteStyle) => {
  if (!window.geoJsonLayer) {
    console.warn("GeoJSON layer is not available");
    return [];
  }
  
  return window.geoJsonLayer.renderAllNetwork(style);
};
