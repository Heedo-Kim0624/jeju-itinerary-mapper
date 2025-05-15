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
  if (!window.geoJsonLayer || !itineraryDay || !itineraryDay.route) {
    if (window.geoJsonLayer?.clearDisplayedFeatures) {
        window.geoJsonLayer.clearDisplayedFeatures();
    }
    console.warn("No route data available for this day or GeoJSON layer not ready.");
    return;
  }

  // Clear previous routes
  window.geoJsonLayer.clearDisplayedFeatures();

  const { nodeIds, linkIds } = itineraryDay.route;

  if (!nodeIds || nodeIds.length === 0 || !linkIds) {
    console.warn("Incomplete route data (nodeIds or linkIds missing).");
    return;
  }

  // Render the route
  window.geoJsonLayer.renderRoute(nodeIds.map(String), linkIds.map(String), { // Ensure string arrays
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
  if (!window.geoJsonLayer || !itineraryDay || !itineraryDay.route) {
    console.warn("GeoJSON layer, itinerary day, or route data not available for highlighting.");
    return;
  }

  // Clear previous highlighted path
  clearPreviousHighlightedPath();

  const { nodeIds, linkIds } = itineraryDay.route;

  if (!nodeIds || nodeIds.length === 0 || !linkIds || linkIds.length === 0) {
    console.warn("No route data available for highlighting segment (nodes or links missing).");
    return;
  }
  
  // This logic for segmenting based on place indices (fromIndex, toIndex) vs. raw node/link IDs
  // might need adjustment if route.nodeIds doesn't directly correspond to place-to-place segments.
  // Assuming a simplified model where direct slicing of nodeIds/linkIds based on place indices is not straightforward.
  // For now, this function might need more context on how nodeIds/linkIds relate to 'fromIndex' and 'toIndex' of places.
  // The original logic was:
  // const startIdx = fromIndex * 2;
  // const endIdx = toIndex * 2;
  // if (startIdx >= nodeIds.length || endIdx >= nodeIds.length) { ... }
  // const segmentNodeIds = nodeIds.slice(startIdx, endIdx + 1).filter((_, i) => i % 2 === 0);
  // const segmentLinkIds = nodeIds.slice(startIdx, endIdx + 1).filter((_, i) => i % 2 === 1);
  // This assumed nodeIds contained alternating node and link info, which is not what RouteData provides.
  // RouteData provides separate nodeIds and linkIds.
  // A proper implementation needs to map place indices to segments of nodeIds and linkIds.
  // This is a complex task without knowing the exact structure of the graph and how places map to nodes.
  // For now, logging a warning as this part needs robust logic.
  console.warn("highlightSegment logic needs to be properly implemented based on how places map to route nodes/links.");

  // Example: Render the entire day's route with highlight (simplistic, needs refinement)
  window.geoJsonLayer.renderRoute(nodeIds.map(String), linkIds.map(String), {
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

export { clearPreviousHighlightedPath, showRouteForPlaceIndex, renderAllNetwork };
