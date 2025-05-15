import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { GeoJsonLayerRef } from '@/components/rightpanel/geojson/GeoJsonTypes';

interface GeoJsonData {
  nodes: any[];
  links: any[];
}

export const useGeoJsonState = (map: mapboxgl.Map | null) => {
  const [nodeData, setNodeData] = useState<any | null>(null);
  const [linkData, setLinkData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [displayedFeatures, setDisplayedFeatures] = useState<any[]>([]);

  // Function to add a line to the map
  const addLineToMap = (map: mapboxgl.Map, coordinates: number[][], style: any = {}) => {
    const sourceId = `route-${Math.random()}`;
    const layerId = `route-layer-${Math.random()}`;

    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        }
      }
    });

    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': style.color || '#888',
        'line-width': style.width || 2,
        'line-opacity': style.opacity || 0.8
      }
    });

    return { sourceId, layerId };
  };

  // Function to add a point to the map
  const addPointToMap = (map: mapboxgl.Map, coordinates: number[], style: any = {}) => {
    const sourceId = `point-${Math.random()}`;
    const layerId = `point-layer-${Math.random()}`;

    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: coordinates
        }
      }
    });

    map.addLayer({
      id: layerId,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': style.scale || 5,
        'circle-color': style.color || '#f00',
        'circle-opacity': style.opacity || 1
      }
    });

    return { sourceId, layerId };
  };

  // Load GeoJSON data
  const loadGeoJson = async (url: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Assuming the GeoJSON has features that are nodes and links
      const nodes = data.features.filter((feature: any) => feature.geometry.type === 'Point');
      const links = data.features.filter((feature: any) => feature.geometry.type === 'LineString');

      // Convert arrays to objects with id as key
      const nodesObject = nodes.reduce((obj: any, node: any) => {
        obj[node.properties.id] = node;
        return obj;
      }, {});

      const linksObject = links.reduce((obj: any, link: any) => {
        obj[link.properties.id] = link;
        return obj;
      }, {});

      setNodeData(nodesObject);
      setLinkData(linksObject);
    } catch (e: any) {
      setError(e.message);
      console.error("Failed to load GeoJSON:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (dataUrl) {
      loadGeoJson(dataUrl);
    }
  }, [dataUrl]);

  // Update the geoJsonLayer ref to include renderAllNetwork
  const geoJsonLayer = useRef<GeoJsonLayerRef>({
    renderRoute: (nodeIds: string[], linkIds: string[], style: any = {}) => {
      console.log("[GeoJSON] Rendering route", { nodeIds, linkIds, style });
      if (!map || !nodeData || !linkData) {
        console.warn("[GeoJSON] Cannot render route: map or data not ready");
        return [];
      }

      const renderedFeatures: any[] = [];

      // Render links
      linkIds.forEach(linkId => {
        const link = linkData[linkId];
        if (link && link.geometry && link.geometry.coordinates) {
          const feature = addLineToMap(map, link.geometry.coordinates, {
            color: style.lineColor || '#00f',
            width: style.lineWidth || 3,
            opacity: style.lineOpacity || 0.7
          });
          if (feature) renderedFeatures.push(feature);
        }
      });

      // Render nodes
      nodeIds.forEach(nodeId => {
        const node = nodeData[nodeId];
        if (node && node.geometry && node.geometry.coordinates) {
          const feature = addPointToMap(map, node.geometry.coordinates, {
            color: style.nodeColor || '#f00',
            scale: style.nodeScale || 5,
            opacity: style.nodeOpacity || 1
          });
          if (feature) renderedFeatures.push(feature);
        }
      });

      setDisplayedFeatures(prev => [...prev, ...renderedFeatures]);
      console.log(`[GeoJSON] Rendered ${renderedFeatures.length} route features`);
      return renderedFeatures;
    },

    renderAllNetwork: () => {
      console.log("[GeoJSON] Rendering entire network");
      if (!map || !nodeData || !linkData) {
        console.warn("[GeoJSON] Cannot render network: map or data not ready");
        return [];
      }

      const renderedFeatures: any[] = [];

      // Render all links with default style
      Object.values(linkData).forEach((link) => {
        if (link && link.geometry && link.geometry.coordinates) {
          const feature = addLineToMap(map, link.geometry.coordinates, {
            color: "#77DD77", // Light green
            width: 2,
            opacity: 0.5
          });
          if (feature) renderedFeatures.push(feature);
        }
      });

      // Render all nodes with default style
      Object.values(nodeData).forEach((node) => {
        if (node && node.geometry && node.geometry.coordinates) {
          const marker = new mapboxgl.Marker({
            color: "#AAAAAA",  // Gray for regular nodes
            scale: 0.5
          })
            .setLngLat(node.geometry.coordinates)
            .addTo(map);
          renderedFeatures.push(marker);
        }
      });

      console.log(`[GeoJSON] Rendered ${renderedFeatures.length} network features`);
      return renderedFeatures;
    },

    clearDisplayedFeatures: () => {
      console.log("[GeoJSON] Clearing displayed features");
      displayedFeatures.forEach(feature => {
        if (feature.sourceId && map.getSource(feature.sourceId)) {
          map.removeLayer(feature.layerId);
          map.removeSource(feature.sourceId);
        }
        // Check if the feature is a mapboxgl.Marker before attempting to remove it
        if (feature instanceof mapboxgl.Marker) {
          feature.remove();
        }
      });
      setDisplayedFeatures([]);
    },

    getNodeById: (id: string) => {
      if (!nodeData) return null;
      return nodeData[id];
    },

    getLinkById: (id: string) => {
      if (!linkData) return null;
      return linkData[id];
    }
  });

  return {
    geoJsonLayer,
    loadGeoJson,
    isLoading,
    error,
    setDataUrl,
  };
};
