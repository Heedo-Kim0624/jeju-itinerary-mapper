import { useState, useEffect, useCallback } from 'react';
import { useMapContext } from '@/components/rightpanel/MapContext';
import type { Place } from '@/types/core';

interface UseGeoJsonStateProps {
  geoJsonUrl: string;
  places: Place[];
}

export const useGeoJsonState = ({ geoJsonUrl, places }: UseGeoJsonStateProps) => {
  const { map, isMapInitialized, isNaverLoaded } = useMapContext();
  const [geoJsonLayer, setGeoJsonLayer] = useState<naver.maps.Data | null>(null);
  const [nearestNodeCache, setNearestNodeCache] = useState<Map<string, { nodeId: string; distance: number }>>(new Map());

  const loadGeoJson = useCallback(async (url: string) => {
    try {
      const response = await fetch(url);
      const geoJsonData = await response.json();
      return geoJsonData;
    } catch (error) {
      console.error("Error fetching GeoJSON:", error);
      return null;
    }
  }, []);

  const addGeoJsonLayer = useCallback(async () => {
    if (!map || !isMapInitialized || !isNaverLoaded) {
      console.log("[useGeoJsonState] Map not ready, skipping GeoJSON layer addition.");
      return;
    }

    const geoJsonData = await loadGeoJson(geoJsonUrl);
    if (!geoJsonData) {
      console.warn("[useGeoJsonState] No GeoJSON data to add.");
      return;
    }

    // Remove existing layer if it exists
    if (geoJsonLayer) {
      geoJsonLayer.setMap(null);
      setGeoJsonLayer(null);
    }

    const newLayer = new naver.maps.Data({ map: map });
    newLayer.loadGeoJson(geoJsonData);
    setGeoJsonLayer(newLayer);

    console.log("[useGeoJsonState] GeoJSON layer added successfully.");
  }, [map, isMapInitialized, isNaverLoaded, geoJsonUrl, loadGeoJson, geoJsonLayer]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  };

  const findNearestNode = useCallback((place: Place): { nodeId: string; distance: number } | null => {
    if (!geoJsonLayer) {
      console.warn("[useGeoJsonState] GeoJSON layer not loaded, cannot find nearest node.");
      return null;
    }

    const cacheKey = `${place.id}-${place.x}-${place.y}`;
    if (nearestNodeCache.has(cacheKey)) {
      return nearestNodeCache.get(cacheKey) || null;
    }

    let minDistance = Infinity;
    let nearestNodeId = null;

    geoJsonLayer.forEach(feature => {
      const geometry = feature.getGeometry();
      if (geometry.getType() === 'Point') {
        const coordinates = geometry.get(); // Returns naver.maps.LatLng
        const nodeLat = coordinates.lat();
        const nodeLng = coordinates.lng();

        if (place.y != null && place.x != null) {
          const distance = calculateDistance(place.y, place.x, nodeLat, nodeLng);

          if (distance < minDistance) {
            minDistance = distance;
            nearestNodeId = feature.getProperty('id');
          }
        }
      }
    });

    if (nearestNodeId !== null) {
      const result = { nodeId: nearestNodeId, distance: minDistance };
      setNearestNodeCache(prevCache => new Map(prevCache).set(cacheKey, result));
      return result;
    }

    return null;
  }, [geoJsonLayer, calculateDistance, nearestNodeCache]);

  useEffect(() => {
    addGeoJsonLayer();
  }, [addGeoJsonLayer]);

  useEffect(() => {
    if (places && places.length > 0) {
      const updatedPlaces = places.map(place => {
        const nearestNode = findNearestNode(place);
        if (nearestNode) {
          return {
            ...place,
            geoNodeId: nearestNode.nodeId,
            geoNodeDistance: nearestNode.distance
          };
        }
        return place;
      });
      // Dispatch an event or use a callback to notify the parent component about the updated places
      const event = new CustomEvent('placesWithGeoNodesUpdated', { detail: updatedPlaces });
      window.dispatchEvent(event);
    }
  }, [places, findNearestNode]);

  return { geoJsonLayer, findNearestNode };
};
