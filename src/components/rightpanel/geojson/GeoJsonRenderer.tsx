import React, { useEffect, useRef } from 'react';
import { GeoNode, GeoLink, RouteStyle } from './GeoJsonTypes';
import { useMapContext } from '../MapContext'; // Import useMapContext

interface GeoJsonRendererProps {
  map: any;
  visible: boolean;
  nodes: GeoNode[];
  links: GeoLink[];
  onDisplayedFeaturesChange: (markers: any[], polylines: any[]) => void;
}

const GeoJsonRenderer: React.FC<GeoJsonRendererProps> = ({
  map,
  visible,
  nodes: initialNodes, // Renamed to avoid conflict with state
  links: initialLinks,   // Renamed to avoid conflict with state
  onDisplayedFeaturesChange,
}) => {
  const { geojsonLayerRef } = useMapContext(); // Get geojsonLayerRef from context
  const activeMarkersRef = useRef<any[]>([]);
  const activePolylinesRef = useRef<any[]>([]);

  // Function to clear currently displayed features from the map
  const clearMap = () => {
    activeMarkersRef.current.forEach(marker => marker.setMap(null));
    activePolylinesRef.current.forEach(polyline => polyline.setMap(null));
    activeMarkersRef.current = [];
    activePolylinesRef.current = [];
    onDisplayedFeaturesChange([], []);
  };

  // Effect to handle visibility changes
  useEffect(() => {
    if (!map || !geojsonLayerRef.current) return;

    if (visible) {
      // If becoming visible, you might want to re-render the last drawn route or all network
      // For now, let's assume renderAllNetwork is the default when visible is toggled on
      // This behavior might need adjustment based on specific requirements
      console.log("GeoJsonRenderer: Becoming visible, rendering all network (default).");
      geojsonLayerRef.current.renderAllNetwork(); 
    } else {
      geojsonLayerRef.current.clearDisplayedFeatures();
    }

    // Cleanup on unmount or when map/visibility changes
    return () => {
      if (geojsonLayerRef.current) {
        geojsonLayerRef.current.clearDisplayedFeatures();
      }
    };
  }, [visible, map, geojsonLayerRef]);


  // Note: The actual rendering logic (renderRoute, renderAllNetwork) is now part
  // of useGeoJsonState and exposed via geojsonLayerRef. This component's role
  // is mostly to manage visibility and potentially trigger initial renders
  // or respond to specific events if needed. The original code had rendering logic here,
  // which is now centralized in useGeoJsonState.

  return null; // This component does not render any direct DOM elements
};


export default GeoJsonRenderer;
