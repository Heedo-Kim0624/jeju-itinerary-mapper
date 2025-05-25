
import { useCallback } from 'react';
import type { Place } from '@/types/supabase';
// GeoJsonNodeFeature, GeoCoordinates를 가져옵니다. GeoJsonNodeProperties는 GeoJsonNodeFeature 내에 포함.
import type { GeoJsonNodeFeature, GeoCoordinates } from '@/components/rightpanel/geojson/GeoJsonTypes';

interface UsePlaceGeoJsonMapperProps {
  geoJsonNodes: GeoJsonNodeFeature[]; // GeoJsonNodeFeature[] 사용
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
        // geoJsonNodes는 이미 GeoJsonNodeFeature[] 타입이므로, properties는 GeoJsonNodeProperties 타입입니다.
        const node = geoJsonNodes.find(n => String(n.properties.NODE_ID) === String(place.geoNodeId));
        
        if (node && node.geometry.type === 'Point') {
          // node.geometry.coordinates를 GeoCoordinates로 타입 변환하고, 객체 속성으로 접근합니다.
          // GeoJsonNodeFeature의 geometry.coordinates는 GeoCoordinates | GeoCoordinates[] | GeoCoordinates[][] 타입.
          // Point의 경우 GeoCoordinates.
          const geoCoords = node.geometry.coordinates as GeoCoordinates;
          if (geoCoords && typeof geoCoords[0] === 'number' && typeof geoCoords[1] === 'number') {
            return { ...place, x: geoCoords[0], y: geoCoords[1] }; // lng: geoCoords[0], lat: geoCoords[1]
          } else {
            console.warn(`[PlaceGeoJsonMapper] Invalid coordinates for geoNodeId ${place.geoNodeId} in place ${place.name}. Keeping original/default coords.`);
          }
        } else {
          console.warn(`[PlaceGeoJsonMapper] geoNodeId ${place.geoNodeId} for place ${place.name} not found or not a Point in geoJsonNodes. Keeping original/default coords.`);
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
