
import { useCallback } from 'react';
import { Place, ItineraryPlace } from '@/types/supabase';
import { JEJU_LOCATIONS, resolveLocationToCoordinates } from '@/utils/map/mapNavigation';

// Default center of Jeju Island
export const JEJU_CENTER = { lat: 33.3846, lng: 126.5535 };

export const useMapNavigation = (map: any) => {
  const panTo = useCallback((locationOrCoords: string | Place | ItineraryPlace | { lat: number; lng: number }) => {
    if (!map || !window.naver) return;
    
    try {
      // Convert the input to coordinates
      const coords = resolveLocationToCoordinates(locationOrCoords);
      
      // If we couldn't resolve coordinates, use the Jeju center as fallback
      const finalCoords = coords || JEJU_CENTER;
      
      map.setCenter(new window.naver.maps.LatLng(finalCoords.lat, finalCoords.lng));
      
      // Adjust zoom based on the precision of the location
      // For region names, use a wider zoom level
      if (typeof locationOrCoords === 'string') {
        map.setZoom(11); // Wider view for regions
      } else {
        // For specific places, zoom in closer
        map.setZoom(14);
      }
    } catch (error) {
      console.error("Error panning map to location:", error);
    }
  }, [map]);

  return { panTo };
};
