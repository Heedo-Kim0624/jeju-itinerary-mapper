
import { useState, useEffect } from 'react';
import type { GeoLink } from '@/types/core/route-data';

export const useGeoJsonData = () => {
  const [geoJsonLinks, setGeoJsonLinks] = useState<GeoLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const loadGeoJsonData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('[useGeoJsonData] Attempting to load GeoJSON data from /data/LINK_JSON.geojson');
        const response = await fetch('/data/LINK_JSON.geojson');
        if (!response.ok) {
          throw new Error(`GeoJSON data load failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data && data.features && Array.isArray(data.features)) {
          const links: GeoLink[] = data.features
            .filter((feature: any) => feature.geometry && feature.geometry.type === "LineString") // Basic validation
            .map((feature: any) => ({
              type: "Feature",
              id: feature.id || feature.properties.LINK_ID,
              properties: feature.properties,
              geometry: feature.geometry
          }));
          
          setGeoJsonLinks(links);
          console.log(`[useGeoJsonData] GeoJSON data loaded successfully: ${links.length} links`);
        } else {
          console.warn('[useGeoJsonData] GeoJSON data format is not as expected.');
          setGeoJsonLinks([]);
        }
      } catch (err) {
        console.error('[useGeoJsonData] Error loading GeoJSON data:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setGeoJsonLinks([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGeoJsonData();
  }, []);
  
  return { geoJsonLinks, isLoading, error };
};
