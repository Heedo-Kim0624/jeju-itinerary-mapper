import { useState, useEffect, useCallback } from 'react';
import type { Place } from '@/types/core';

interface UseGeoJsonStateProps {
  map: any; // Pass map instance directly
  isMapInitialized: boolean; // Pass status directly
  isNaverLoaded: boolean; // Pass status directly
  geoJsonUrl: string;
  places?: Place[]; // Make places optional, as it might not always be available or needed initially
}

export const useGeoJsonState = ({ map, isMapInitialized, isNaverLoaded, geoJsonUrl, places = [] }: UseGeoJsonStateProps) => {
  const [geoJsonLayer, setGeoJsonLayer] = useState<any | null>(null); // Use 'any' for naver.maps.Data due to typing issue
  const [nearestNodeCache, setNearestNodeCache] = useState<Map<string, { nodeId: string; distance: number }>>(new Map());
  const [loadedNodes, setLoadedNodes] = useState<any[]>([]);
  const [loadedLinks, setLoadedLinks] = useState<any[]>([]);
  const [isLayerLoaded, setIsLayerLoaded] = useState<boolean>(false);

  const loadGeoJson = useCallback(async (url: string) => {
    try {
      const response = await fetch(url);
      const geoJsonData = await response.json();
      
      // Extract nodes and links (assuming a specific GeoJSON structure)
      const nodes: any[] = [];
      const links: any[] = [];
      if (geoJsonData && geoJsonData.features) {
        geoJsonData.features.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.type === 'Point' && feature.properties && feature.properties.NODE_ID) {
            nodes.push(feature);
          } else if (feature.geometry && feature.geometry.type === 'LineString' && feature.properties && feature.properties.LINK_ID) {
            links.push(feature);
          }
        });
      }
      setLoadedNodes(nodes);
      setLoadedLinks(links);
      setIsLayerLoaded(true);
      return geoJsonData;
    } catch (error) {
      console.error("Error fetching GeoJSON:", error);
      setLoadedNodes([]);
      setLoadedLinks([]);
      setIsLayerLoaded(false);
      return null;
    }
  }, []);

  const addGeoJsonLayer = useCallback(async () => {
    if (!map || !isMapInitialized || !isNaverLoaded || !window.naver || !window.naver.maps) {
      console.log("[useGeoJsonState] Map or Naver Maps API not ready, skipping GeoJSON layer addition.");
      return;
    }

    const geoJsonData = await loadGeoJson(geoJsonUrl);
    if (!geoJsonData) {
      console.warn("[useGeoJsonState] No GeoJSON data to add.");
      return;
    }

    if (geoJsonLayer) {
      geoJsonLayer.setMap(null);
    }

    // Use 'any' for naver.maps.Data due to potential typing issues with 'Data' member
    const newLayer = new (window.naver.maps as any).Data();
    newLayer.addGeoJson(geoJsonData); // Use addGeoJson for features
    newLayer.setMap(map);
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
    if (!geoJsonLayer && loadedNodes.length === 0) { // Check loadedNodes as well
      console.warn("[useGeoJsonState] GeoJSON layer/data not loaded, cannot find nearest node.");
      return null;
    }

    const cacheKey = `${place.id}-${place.x}-${place.y}`;
    if (nearestNodeCache.has(cacheKey)) {
      return nearestNodeCache.get(cacheKey) || null;
    }

    let minDistance = Infinity;
    let nearestNodeId: string | null = null;

    // Iterate over pre-extracted nodes if layer direct iteration is problematic
    loadedNodes.forEach(feature => {
      const geometry = feature.geometry; // Assuming GeoJSON structure
      if (geometry && geometry.type === 'Point' && geometry.coordinates) {
        const nodeLng = geometry.coordinates[0]; // longitude
        const nodeLat = geometry.coordinates[1]; // latitude

        if (place.y != null && place.x != null) {
          const distance = calculateDistance(place.y, place.x, nodeLat, nodeLng);

          if (distance < minDistance) {
            minDistance = distance;
            nearestNodeId = feature.properties.NODE_ID ? String(feature.properties.NODE_ID) : null;
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
  }, [geoJsonLayer, loadedNodes, calculateDistance, nearestNodeCache]);

  useEffect(() => {
    addGeoJsonLayer();
  }, [addGeoJsonLayer]);

  useEffect(() => {
    if (places && places.length > 0 && (geoJsonLayer || loadedNodes.length > 0)) {
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
      const event = new CustomEvent('placesWithGeoNodesUpdated', { detail: updatedPlaces });
      window.dispatchEvent(event);
    }
  }, [places, findNearestNode, geoJsonLayer, loadedNodes]);

  return { 
    geoJsonLayer, 
    findNearestNode,
    // These are needed by the component version of useGeoJsonState, 
    // but this hook is simpler. Consumers of this hook will need to manage these themselves or use the component hook.
    // For now, returning what this hook can provide.
    isGeoJsonLoaded: isLayerLoaded, 
    geoJsonNodes: loadedNodes,
    geoJsonLinks: loadedLinks,
    // toggleGeoJsonVisibility, checkGeoJsonMapping, handleGeoJsonLoaded are not part of this simpler hook.
   };
};
