
import { useState, useEffect, useRef, useCallback } from 'react';
import { UseGeoJsonStateProps, GeoJsonFeatureCollection, GeoJsonLayerRef, GeoJsonFeature } from '@/components/rightpanel/geojson/GeoJsonTypes';

export function useGeoJsonState({ url, onDataLoaded }: UseGeoJsonStateProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(url || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const nodeData = useRef<GeoJsonFeatureCollection | null>(null);
  const linkData = useRef<GeoJsonFeatureCollection | null>(null);
  
  const displayedFeatures = useRef<any[]>([]);
  
  const geoJsonLayer = useRef<GeoJsonLayerRef>({} as GeoJsonLayerRef);
  
  // Clear displayed features
  const clearDisplayedFeatures = useCallback(() => {
    // Remove all features that were added
    displayedFeatures.current.forEach(feature => {
      if (feature && typeof feature.remove === 'function') {
        feature.remove();
      }
    });
    displayedFeatures.current = [];
  }, []);

  // Get a node by ID
  const getNodeById = useCallback((id: string) => {
    if (!nodeData.current || !nodeData.current.features) return null;
    
    return nodeData.current.features.find(feature => {
      if (!feature.properties) return false;
      return feature.properties.NODE_ID === id;
    });
  }, []);

  // Get a link by ID
  const getLinkById = useCallback((id: string) => {
    if (!linkData.current || !linkData.current.features) return null;
    
    return linkData.current.features.find(feature => {
      if (!feature.properties) return false;
      return feature.properties.LINK_ID === id;
    });
  }, []);

  // Render a route with node and link IDs
  const renderRoute = useCallback((nodeIds: string[], linkIds: string[], style: any = {}) => {
    if (!nodeData.current || !linkData.current) {
      console.error('GeoJSON data not loaded');
      return [];
    }

    const features: any[] = [];

    // Default style if not provided
    const defaultStyle = {
      color: '#4CAF50',
      width: 4,
      opacity: 0.8,
      ...style
    };

    // Add nodes as markers
    nodeIds.forEach(nodeId => {
      const node = getNodeById(nodeId);
      if (node && node.geometry && node.geometry.coordinates) {
        // TODO: Add your visualization logic here
        // For example, add a marker at the node location
        console.log(`Would render node ${nodeId} at ${node.geometry.coordinates}`);
        // features.push(marker);
      }
    });

    // Add links as lines
    linkIds.forEach(linkId => {
      const link = getLinkById(linkId);
      if (link && link.geometry && link.geometry.coordinates) {
        // TODO: Add your visualization logic here
        // For example, add a polyline for the link
        console.log(`Would render link ${linkId} with coordinates`, link.geometry.coordinates);
        // features.push(polyline);
      }
    });

    displayedFeatures.current.push(...features);
    return features;
  }, [getNodeById, getLinkById]);

  // Render all network data
  const renderAllNetwork = useCallback(() => {
    if (!nodeData.current || !linkData.current) {
      console.error('GeoJSON data not loaded');
      return;
    }

    clearDisplayedFeatures();
    
    try {
      // Render all nodes
      nodeData.current.features.forEach(node => {
        if (node && node.geometry && node.geometry.coordinates) {
          // TODO: Add your visualization logic here
          console.log(`Would render node at ${node.geometry.coordinates}`);
        }
      });

      // Render all links
      linkData.current.features.forEach(link => {
        if (link && link.geometry && link.geometry.coordinates) {
          // TODO: Add your visualization logic here
          console.log(`Would render link with coordinates`, link.geometry.coordinates);
        }
      });

      console.log(`Rendered ${nodeData.current.features.length} nodes and ${linkData.current.features.length} links`);
    } catch (error) {
      console.error('Error rendering network:', error);
    }
  }, [clearDisplayedFeatures]);

  // Load GeoJSON data
  const loadGeoJson = useCallback(async (url: string) => {
    if (!url) {
      setError('No URL provided');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch GeoJSON data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Determine if this is node or link data based on the first feature
      if (data.features && data.features.length > 0) {
        const firstFeature = data.features[0];
        if (firstFeature.properties && 'NODE_ID' in firstFeature.properties) {
          nodeData.current = data;
          console.log(`Loaded ${data.features.length} nodes`);
        } else if (firstFeature.properties && 'LINK_ID' in firstFeature.properties) {
          linkData.current = data;
          console.log(`Loaded ${data.features.length} links`);
        }
      }
      
      if (onDataLoaded) {
        onDataLoaded(data);
      }
    } catch (err) {
      console.error('Error loading GeoJSON:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [onDataLoaded]);

  // Initialize the layer reference
  useEffect(() => {
    geoJsonLayer.current = {
      renderRoute,
      renderAllNetwork,
      clearDisplayedFeatures,
      getNodeById,
      getLinkById
    };
  }, [renderRoute, renderAllNetwork, clearDisplayedFeatures, getNodeById, getLinkById]);

  // Load data when URL changes
  useEffect(() => {
    if (dataUrl) {
      loadGeoJson(dataUrl);
    }
  }, [dataUrl, loadGeoJson]);

  return {
    geoJsonLayer,
    loadGeoJson,
    isLoading,
    error,
    setDataUrl
  };
}
