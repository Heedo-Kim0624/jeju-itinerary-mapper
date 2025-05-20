
import { useCallback } from 'react';
import type { Place } from '@/types/supabase';
// Import GeoJsonFeature and GeoJsonNodeProperties
import type { GeoJsonFeature, GeoJsonNodeProperties } from '@/components/rightpanel/geojson/GeoJsonTypes';

interface UsePlaceGeoJsonMapperProps {
  geoJsonNodes: GeoJsonFeature[]; // Changed from GeoNodeFeature[]
}

export const usePlaceGeoJsonMapper = ({ geoJsonNodes }: UsePlaceGeoJsonMapperProps) => {
  const mapPlacesWithGeoNodes = useCallback((places: Place[]): Place[] => {
    if (!geoJsonNodes || geoJsonNodes.length === 0) {
      console.warn("[PlaceGeoJsonMapper] GeoJSON nodes not available for mapping places.");
      return places.map(place => ({
        ...place,
        x: (typeof place.x === 'number' && !isNaN(place.x)) ? place.x : 0,
        y: (typeof place.y === 'number' && !isNaN(place.y)) ? place.y : 0
      }));
    }

    return places.map(place => {
      if (place.geoNodeId) {
        // Use type assertion for properties
        const node = geoJsonNodes.find(n => String((n.properties as GeoJsonNodeProperties).NODE_ID) === String(place.geoNodeId));
        if (node && node.geometry.type === 'Point') {
          const [lng, lat] = (node.geometry.coordinates as [number, number]);
          return { ...place, x: lng, y: lat };
        } else {
          console.warn(`[PlaceGeoJsonMapper] geoNodeId ${place.geoNodeId} for place ${place.name} not found in geoJsonNodes. Keeping original/default coords.`);
        }
      }
      return {
        ...place,
        x: (typeof place.x === 'number' && !isNaN(place.x)) ? place.x : 0,
        y: (typeof place.y === 'number' && !isNaN(place.y)) ? place.y : 0
      };
    });
  }, [geoJsonNodes]);

  return { mapPlacesWithGeoNodes };
};
