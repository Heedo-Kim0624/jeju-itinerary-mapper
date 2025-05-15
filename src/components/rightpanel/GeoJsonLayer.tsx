
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useGeoJsonState } from './geojson/useGeoJsonState';
import { GeoJsonRenderer } from './geojson/GeoJsonRenderer';
import { RenderStyle } from './geojson/GeoJsonTypes';
import { NodeFeature, LinkFeature } from './geojson/GeoJsonTypes';

export interface GeoJsonLayerRef {
  renderRoute: (nodeIds: string[], linkIds: string[], style?: RenderStyle) => any[];
  renderAllNetwork: (options?: {nodeStyle?: RenderStyle, linkStyle?: RenderStyle}) => any[];
  clearDisplayedFeatures: () => void;
  getNodeById: (id: string) => NodeFeature | undefined;
  getLinkById: (id: string) => LinkFeature | undefined;
}

interface GeoJsonLayerProps {
  map: any; // naver.maps.Map
  onDataLoaded?: () => void;
}

const GeoJsonLayer = forwardRef<GeoJsonLayerRef, GeoJsonLayerProps>(
  ({ map, onDataLoaded }, ref) => {
    const { state, actions, renderer } = useGeoJsonState(map);
    const rendererRef = useRef<GeoJsonRenderer | null>(null);

    useEffect(() => {
      // Make renderer available globally
      window.geoJsonLayer = {
        renderRoute: (nodeIds, linkIds, style) => {
          return renderer.renderRoute(nodeIds, linkIds, style);
        },
        renderAllNetwork: (options) => {
          return renderer.renderAllNetwork(options);
        },
        clearDisplayedFeatures: () => {
          renderer.clearDisplayedFeatures();
        },
        getNodeById: (id) => {
          return state.nodesById.get(id);
        },
        getLinkById: (id) => {
          return state.linksById.get(id);
        }
      };
      
      // Clear references when unmounting
      return () => {
        if (window.geoJsonLayer) {
          delete window.geoJsonLayer;
        }
      };
    }, [renderer, state.nodesById, state.linksById]);

    useImperativeHandle(ref, () => ({
      renderRoute: (nodeIds, linkIds, style) => {
        return renderer.renderRoute(nodeIds, linkIds, style);
      },
      renderAllNetwork: (options) => {
        return renderer.renderAllNetwork(options);
      },
      clearDisplayedFeatures: () => {
        renderer.clearDisplayedFeatures();
      },
      getNodeById: (id) => {
        return state.nodesById.get(id);
      },
      getLinkById: (id) => {
        return state.linksById.get(id);
      }
    }));

    return null;
  }
);

GeoJsonLayer.displayName = 'GeoJsonLayer';

export default GeoJsonLayer;
