
import { ItineraryDay } from '@/types/itinerary';
import { toast } from 'sonner';

/**
 * Renders a GeoJSON route on the map
 * @param nodeIds Node IDs to render
 * @param linkIds Link IDs to render
 * @param style Style options for the route
 */
export const renderGeoJsonRoute = (nodeIds: string[], linkIds: string[], style?: any) => {
  if (!window.geoJsonLayer) {
    console.warn("GeoJSON layer is not available");
    return [];
  }
  return window.geoJsonLayer.renderRoute(nodeIds, linkIds, style);
};

/**
 * Renders an itinerary route on the map
 * @param itineraryDay Itinerary day containing route data
 */
export const renderItineraryRoute = (itineraryDay: ItineraryDay | null) => {
  if (!window.geoJsonLayer || !itineraryDay) {
    return;
  }

  // Clear previous routes
  window.geoJsonLayer.clearDisplayedFeatures();

  // Check if we have route data
  const routeNodeIds = itineraryDay.routeNodeIds || itineraryDay.routeData;
  if (!routeNodeIds || routeNodeIds.length === 0) {
    console.warn("No route data available for this day");
    return;
  }

  // Extract node and link IDs
  const nodeIds = routeNodeIds.filter((_, i) => i % 2 === 0);
  const linkIds = routeNodeIds.filter((_, i) => i % 2 === 1);

  // Render the route
  window.geoJsonLayer.renderRoute(nodeIds, linkIds, {
    strokeColor: '#228B22',
    strokeWeight: 5,
    strokeOpacity: 0.7,
    zIndex: 100
  });
};

/**
 * Clears any previously highlighted path on the map
 */
export const clearPreviousHighlightedPath = () => {
  if (!window.geoJsonLayer) return;

  // This function should ideally be implemented with access to the highlightedPath ref
  // For now, we'll clear all displayed features as a fallback
  window.geoJsonLayer.clearDisplayedFeatures();
};

/**
 * Highlights a specific segment of the route between two places
 * @param fromIndex Starting place index
 * @param toIndex Ending place index
 * @param itineraryDay Itinerary day containing the places and route data
 */
export const highlightSegment = (fromIndex: number, toIndex: number, itineraryDay?: ItineraryDay) => {
  if (!window.geoJsonLayer || !itineraryDay) {
    return;
  }

  // Clear previous highlighted path
  clearPreviousHighlightedPath();

  // Get route data
  const routeNodeIds = itineraryDay.routeNodeIds || itineraryDay.routeData;
  if (!routeNodeIds || routeNodeIds.length === 0) {
    console.warn("No route data available for highlighting");
    return;
  }

  // Calculate segment indices
  const startIdx = fromIndex * 2;
  const endIdx = toIndex * 2;
  
  if (startIdx >= routeNodeIds.length || endIdx >= routeNodeIds.length) {
    console.warn("Invalid segment indices");
    return;
  }

  // Extract segment node and link IDs
  const segmentNodeIds = routeNodeIds.slice(startIdx, endIdx + 1).filter((_, i) => i % 2 === 0);
  const segmentLinkIds = routeNodeIds.slice(startIdx, endIdx + 1).filter((_, i) => i % 2 === 1);

  // Render the highlighted segment
  window.geoJsonLayer.renderRoute(segmentNodeIds, segmentLinkIds, {
    strokeColor: '#FF4500',
    strokeWeight: 7,
    strokeOpacity: 0.9,
    zIndex: 200
  });
};

/**
 * Shows the route from a specific place to the next place
 * @param placeIndex Index of the place in the itinerary day
 * @param itineraryDay Itinerary day containing the places and route data
 */
export const showRouteForPlaceIndex = (placeIndex: number, itineraryDay: ItineraryDay) => {
  if (!window.geoJsonLayer || !itineraryDay) {
    return;
  }

  const places = itineraryDay.places;
  if (!places || places.length <= placeIndex) {
    console.warn("Invalid place index");
    return;
  }

  // If this is the last place, there's no next segment
  if (placeIndex >= places.length - 1) {
    toast.info("마지막 장소입니다");
    return;
  }

  // Highlight the segment from this place to the next
  highlightSegment(placeIndex, placeIndex + 1, itineraryDay);
  
  toast.info(`${places[placeIndex].name}에서 ${places[placeIndex + 1].name}까지의 경로`);
};

/**
 * Renders all network nodes and links on the map
 * @param style Style options for rendering
 */
export const renderAllNetwork = (style?: any) => {
  if (!window.geoJsonLayer) {
    console.warn("GeoJSON layer is not available");
    return [];
  }
  
  return window.geoJsonLayer.renderAllNetwork(style);
};
