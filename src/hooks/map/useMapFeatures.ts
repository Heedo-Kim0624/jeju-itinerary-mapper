import { useCallback, useEffect, useState } from 'react';
import { ExtractedRouteData } from '@/types/schedule';
import { Place, ItineraryDay } from '@/types/supabase';
import { useToast } from '@/components/ui/use-toast';

export const useMapFeatures = (
  map: mapboxgl.Map | null,
  geoJsonLayer: any,
  markers: mapboxgl.Marker[]
) => {
  const { toast } = useToast();
  const [isNetworkRendered, setIsNetworkRendered] = useState(false);

  const addMarkersToMap = useCallback((places: Place[], options: { highlight?: boolean; useRecommendedStyle?: boolean } = {}) => {
    if (!map) {
      console.warn('Cannot add markers: map is null');
      return;
    }

    // Clear existing markers
    markers.forEach(marker => marker.remove());

    // Add new markers
    places.forEach(place => {
      if (place.x && place.y) {
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundImage = `url(/images/marker-${options.useRecommendedStyle ? 'recommended' : 'normal'}.png)`;
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.backgroundSize = '100%';

        if (options.highlight) {
          el.style.border = '2px solid blue';
        }

        el.addEventListener('click', () => {
          toast({
            title: place.name,
            description: place.address,
          });
        });

        const marker = new mapboxgl.Marker(el)
          .setLngLat([place.x, place.y])
          .addTo(map);

        markers.push(marker);
      }
    });
  }, [map, markers, toast]);

  // Handle rendering an itinerary day's route
  const renderItineraryDay = useCallback((day: ItineraryDay | null) => {
    if (!map || !geoJsonLayer || !day) {
      console.warn('Cannot render itinerary: map, geoJsonLayer, or day is null');
      return;
    }

    console.log(`[MapFeatures] Rendering itinerary for day ${day.day}`, day);

    // Clear previous features
    geoJsonLayer.clearDisplayedFeatures();

    // Ensure day has routeData
    if (!day.routeData) {
      console.log('[MapFeatures] No route data available for this day');
      
      // Add markers for places anyway
      if (day.places && day.places.length > 0) {
        addMarkersToMap(day.places, { highlight: true });
        
        // Center map on first place
        if (day.places[0] && day.places[0].x && day.places[0].y) {
          map.flyTo({
            center: [day.places[0].x, day.places[0].y],
            zoom: 12
          });
        }
      }
      return;
    }

    // Extract nodeIds and linkIds
    const { nodeIds = [], linkIds = [] } = day.routeData;
    
    console.log(`[MapFeatures] Rendering route with ${nodeIds.length} nodes and ${linkIds.length} links`);
    
    // If we have valid node and link IDs, render the route
    if (nodeIds.length > 0) {
      const renderedFeatures = geoJsonLayer.renderRoute(nodeIds, linkIds, {
        lineColor: '#00ff00',  // Green for route
        lineWidth: 4,
        lineOpacity: 0.8,
        nodeColor: '#ff0000',  // Red for route nodes
        nodeScale: 0.8
      });
      
      console.log(`[MapFeatures] Rendered ${renderedFeatures.length} route features`);
      
      // Add all route nodes to fit bounds calculation
      if (renderedFeatures.length > 0 && nodeIds.length > 0) {
        try {
          // Get all node coordinates to fit map bounds
          const bounds = new mapboxgl.LngLatBounds();
          
          // Collect coordinates from nodes
          nodeIds.forEach(nodeId => {
            const node = geoJsonLayer.getNodeById(nodeId);
            if (node && node.geometry && node.geometry.coordinates) {
              bounds.extend(node.geometry.coordinates);
            }
          });
          
          // Ensure bounds are valid before fitting
          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { 
              padding: 100,
              maxZoom: 14
            });
          }
        } catch (error) {
          console.error('[MapFeatures] Error fitting bounds:', error);
        }
      }
    } else {
      console.warn('[MapFeatures] No nodeIds to render for this day');
      
      // Fallback: If we have places but no route, just show place markers
      if (day.places && day.places.length > 0) {
        addMarkersToMap(day.places, { highlight: true });
        
        // Center on first place
        if (day.places[0] && day.places[0].x && day.places[0].y) {
          map.flyTo({
            center: [day.places[0].x, day.places[0].y],
            zoom: 12
          });
        }
      }
    }
  }, [map, geoJsonLayer, addMarkersToMap]);

  // Render the entire network (all nodes and links)
  const renderEntireNetwork = useCallback(() => {
    if (!map || !geoJsonLayer) {
      console.warn('[MapFeatures] Cannot render network: map or geoJsonLayer is null');
      return;
    }

    console.log('[MapFeatures] Rendering entire network');
    geoJsonLayer.clearDisplayedFeatures();
    
    // Call the renderAllNetwork method we added
    const features = geoJsonLayer.renderAllNetwork();
    console.log(`[MapFeatures] Rendered ${features.length} network features`);
  }, [map, geoJsonLayer]);

  // Debug function to show all paths
  const debugShowAllPaths = useCallback(() => {
    if (!map || !geoJsonLayer) {
      console.warn('Cannot render network: map or geoJsonLayer is null');
      return;
    }

    console.log('[MapFeatures] DEBUG: Showing all paths');
    geoJsonLayer.clearDisplayedFeatures();
    
    // Call the renderAllNetwork method we added
    geoJsonLayer.renderAllNetwork();
  }, [map, geoJsonLayer]);

  return {
    addMarkersToMap,
    renderItineraryDay,
    renderEntireNetwork,
    debugShowAllPaths,
  };
};
