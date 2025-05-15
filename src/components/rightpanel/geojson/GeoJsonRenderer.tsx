
import React, { useEffect, useRef, useState } from 'react';
import { GeoJsonProps, GeoJsonLayerRef } from './GeoJsonTypes';
import { useMapContext } from '../MapContext';
import { toast } from 'sonner';

/**
 * GeoJsonRenderer component for rendering GeoJSON data on a map
 */
const GeoJsonRenderer: React.FC<GeoJsonProps> = ({ 
  dataUrl,
  center,
  zoom,
  style 
}) => {
  const { map, geojsonLayerRef } = useMapContext();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  const nodeData = useRef<any>(null);
  const linkData = useRef<any>(null);
  const displayedFeatures = useRef<any[]>([]);

  /**
   * Load GeoJSON data from URL
   */
  const loadGeoJsonData = async (url: string) => {
    if (!url) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch GeoJSON: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check if this is node or link data
      if (data.features && data.features.length > 0) {
        const firstFeature = data.features[0];
        if (firstFeature.properties && firstFeature.properties.NODE_ID) {
          nodeData.current = data;
          console.log(`Loaded ${data.features.length} nodes`);
        } else if (firstFeature.properties && firstFeature.properties.LINK_ID) {
          linkData.current = data;
          console.log(`Loaded ${data.features.length} links`);
        }
      }
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load GeoJSON data';
      console.error('GeoJSON loading error:', errorMessage);
      setError(errorMessage);
      toast.error(`GeoJSON 데이터 로드 실패: ${errorMessage}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load both node and link GeoJSON data
   */
  const loadAllGeoJsonData = async () => {
    if (!dataUrl) return;
    
    // For this example, we'll assume there are separate URLs for nodes and links
    // In a real implementation, you might need to adjust this logic
    const nodeUrl = '/data/NODE_JSON.geojson';
    const linkUrl = '/data/LINK_JSON.geojson';
    
    // Load node data
    const nodeDataResult = await loadGeoJsonData(nodeUrl);
    if (nodeDataResult) {
      nodeData.current = nodeDataResult;
    }
    
    // Load link data
    const linkDataResult = await loadGeoJsonData(linkUrl);
    if (linkDataResult) {
      linkData.current = linkDataResult;
    }
    
    // Check if both data sets are loaded
    if (nodeData.current && linkData.current) {
      setIsDataLoaded(true);
      console.log('Both node and link GeoJSON data loaded successfully');
    } else {
      console.error('Failed to load either node or link GeoJSON data');
    }
  };

  /**
   * Get a node feature by ID
   */
  const getNodeById = (id: string) => {
    if (!nodeData.current || !nodeData.current.features) return null;
    
    return nodeData.current.features.find((feature: any) => 
      feature.properties && feature.properties.NODE_ID === id
    );
  };

  /**
   * Get a link feature by ID
   */
  const getLinkById = (id: string) => {
    if (!linkData.current || !linkData.current.features) return null;
    
    return linkData.current.features.find((feature: any) =>
      feature.properties && feature.properties.LINK_ID === id
    );
  };

  /**
   * Clear all displayed features from the map
   */
  const clearDisplayedFeatures = () => {
    displayedFeatures.current.forEach(feature => {
      if (feature && typeof feature.remove === 'function') {
        feature.remove();
      }
    });
    displayedFeatures.current = [];
  };

  /**
   * Render a route using node and link IDs
   */
  const renderRoute = (nodeIds: string[], linkIds: string[], style: any = {}) => {
    if (!map.current || !nodeData.current || !linkData.current) {
      console.error('Map or GeoJSON data not initialized');
      return [];
    }
    
    const features: any[] = [];
    
    // Clear previous features
    clearDisplayedFeatures();
    
    // Render links
    linkIds.forEach(linkId => {
      const link = getLinkById(linkId);
      if (link && link.geometry && link.geometry.coordinates) {
        // TODO: Add rendering logic for links
        console.log(`Rendering link ${linkId}`);
      }
    });
    
    // Render nodes
    nodeIds.forEach(nodeId => {
      const node = getNodeById(nodeId);
      if (node && node.geometry && node.geometry.coordinates) {
        // TODO: Add rendering logic for nodes
        console.log(`Rendering node ${nodeId}`);
      }
    });
    
    displayedFeatures.current.push(...features);
    return features;
  };

  /**
   * Render the entire network (all nodes and links)
   */
  const renderAllNetwork = () => {
    if (!map.current || !nodeData.current || !linkData.current) {
      console.error('Map or GeoJSON data not initialized');
      return;
    }
    
    clearDisplayedFeatures();
    
    console.log(`Rendering entire network with ${nodeData.current.features.length} nodes and ${linkData.current.features.length} links`);
    
    // Implement rendering logic here
  };

  // Initialize the GeoJSON layer reference
  useEffect(() => {
    if (geojsonLayerRef) {
      geojsonLayerRef.current = {
        renderRoute,
        renderAllNetwork,
        clearDisplayedFeatures,
        getNodeById,
        getLinkById
      };
    }
  }, [geojsonLayerRef]);

  // Load GeoJSON data when component mounts or dataUrl changes
  useEffect(() => {
    loadAllGeoJsonData();
  }, [dataUrl]);

  return (
    <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 10 }}>
      {isLoading && (
        <div className="bg-white p-2 rounded shadow">
          Loading GeoJSON data...
        </div>
      )}
      {error && (
        <div className="bg-red-100 p-2 rounded shadow text-red-700">
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default GeoJsonRenderer;
