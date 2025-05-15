import { useCallback } from 'react';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { Place } from '@/types/supabase';
import { EnrichedItineraryDay, ExtractedRouteData } from '@/types/schedule';
import * as mapboxgl from 'mapbox-gl';

export function useMapFeatures() {
  const { map, removeAllMarkers, geojsonLayerRef } = useMapContext();

  /**
   * Add markers to map for the given places
   */
  const addMarkersToMap = useCallback((places: Place[], options = { highlight: false, useRecommendedStyle: false }) => {
    if (!map.current || !places || places.length === 0) return;

    const markerColor = options.highlight ? '#FF4500' : (options.useRecommendedStyle ? '#1E88E5' : '#FF0000');
    const markerSize = options.highlight ? 40 : 30;

    places.forEach(place => {
      if (!place || typeof place.x !== 'number' || typeof place.y !== 'number') {
        console.warn('Invalid place data:', place);
        return;
      }
      
      const markerElement = document.createElement('div');
      markerElement.style.width = `${markerSize}px`;
      markerElement.style.height = `${markerSize}px`;
      markerElement.style.borderRadius = '50%';
      markerElement.style.background = markerColor;
      markerElement.style.opacity = '0.8';
      markerElement.style.border = '2px solid white';
      markerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      markerElement.style.cursor = 'pointer';
      markerElement.style.zIndex = options.highlight ? '10' : '5';

      const marker = new mapboxgl.Marker({ 
        element: markerElement 
      })
        .setLngLat([place.x, place.y])
        .addTo(map.current);

      markerElement.onclick = () => {
        const popup = new mapboxgl.Popup({ 
          closeButton: true,
          closeOnClick: true,
          maxWidth: '300px'
        })
          .setLngLat([place.x, place.y])
          .setHTML(`
            <div style="padding: 10px;">
              <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: bold;">${place.name}</h3>
              <p style="margin: 0 0 5px; font-size: 14px;">${place.address || place.road_address || '주소 정보 없음'}</p>
              <p style="margin: 0; font-size: 13px; color: #666;">${place.category || '카테고리 정보 없음'}</p>
            </div>
          `)
          .addTo(map.current);
      };
    });
  }, [map]);

  /**
   * Render a specific day's itinerary on the map
   */
  const renderItineraryDay = useCallback((day: EnrichedItineraryDay) => {
    if (!map.current || !day || !day.places || !geojsonLayerRef.current) {
      console.warn('Cannot render itinerary day, missing data or map reference');
      return;
    }
    
    removeAllMarkers();
    geojsonLayerRef.current.clearDisplayedFeatures();
    
    addMarkersToMap(day.places, { highlight: true, useRecommendedStyle: true });
    
    if (day.routeData && day.routeData.nodeIds && day.routeData.linkIds) {
      const routeStyle = {
        color: '#4CAF50',
        width: 4,
        opacity: 0.8
      };
      
      try {
        console.log(`Rendering route for day ${day.day} with ${day.routeData.nodeIds.length} nodes and ${day.routeData.linkIds.length} links`);
        geojsonLayerRef.current.renderRoute(
          day.routeData.nodeIds,
          day.routeData.linkIds,
          routeStyle
        );
      } catch (error) {
        console.error('Error rendering route:', error);
      }
    } else {
      console.log(`No route data available for day ${day.day}`);
    }
  }, [map, addMarkersToMap, removeAllMarkers, geojsonLayerRef]);

  /**
   * Debug function to render the entire network
   */
  const renderEntireNetwork = useCallback(() => {
    if (!geojsonLayerRef.current) return;
    
    try {
      console.log('Rendering entire network');
      geojsonLayerRef.current.renderAllNetwork();
    } catch (error) {
      console.error('Error rendering entire network:', error);
    }
  }, [geojsonLayerRef]);

  /**
   * Debug function to show all paths
   */
  const debugShowAllPaths = useCallback(() => {
    console.log('Debug: Showing all paths');
    renderEntireNetwork();
  }, [renderEntireNetwork]);

  return {
    addMarkersToMap,
    renderItineraryDay,
    renderEntireNetwork,
    debugShowAllPaths
  };
}
