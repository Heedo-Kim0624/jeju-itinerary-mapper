
import React, { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react';
import { GeoNode, GeoLink, RouteStyle, GeoJsonLayerRef } from './GeoJsonTypes';

// Default style for route rendering
const DEFAULT_STYLE: RouteStyle = {
  strokeColor: '#2196F3',
  strokeWeight: 5,
  strokeOpacity: 0.8,
  fillColor: '#FF5722',
  zIndex: 100
};

interface GeoJsonRendererProps {
  map: any;
  nodes: GeoNode[];
  links: GeoLink[];
  visible: boolean;
  onDisplayedFeaturesChange?: (markers: any[], polylines: any[]) => void;
}

const GeoJsonRenderer = forwardRef<GeoJsonLayerRef, GeoJsonRendererProps>(
  ({ map, nodes, links, visible, onDisplayedFeaturesChange }, ref) => {
    const markersRef = useRef<any[]>([]);
    const polylinesRef = useRef<any[]>([]);

    // Function to render a node
    const renderNode = (node: GeoNode, style: RouteStyle = DEFAULT_STYLE) => {
      if (!map || !window.naver || !window.naver.maps) return null;
      
      try {
        const position = new window.naver.maps.LatLng(
          node.coordinates[1],
          node.coordinates[0]
        );
        
        const marker = new window.naver.maps.Marker({
          map: visible ? map : null,
          position,
          icon: {
            content: `<div style="
              width: 8px;
              height: 8px;
              background-color: ${style.fillColor || '#FF5722'};
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
            "></div>`,
            anchor: new window.naver.maps.Point(4, 4)
          },
          zIndex: style.zIndex || 200
        });
        
        markersRef.current.push(marker);
        return marker;
      } catch (e) {
        console.error(`노드 ${node.id} 렌더링 중 오류:`, e);
        return null;
      }
    };
    
    // Function to render a link
    const renderLink = (link: GeoLink, style: RouteStyle = DEFAULT_STYLE) => {
      if (!map || !window.naver || !window.naver.maps) return null;
      
      try {
        const path = link.coordinates.map(coord => 
          new window.naver.maps.LatLng(coord[1], coord[0])
        );
        
        const polyline = new window.naver.maps.Polyline({
          map: visible ? map : null,
          path,
          strokeColor: style.strokeColor || DEFAULT_STYLE.strokeColor,
          strokeWeight: style.strokeWeight || DEFAULT_STYLE.strokeWeight,
          strokeOpacity: style.strokeOpacity || DEFAULT_STYLE.strokeOpacity,
          zIndex: style.zIndex || 100
        });
        
        polylinesRef.current.push(polyline);
        return polyline;
      } catch (e) {
        console.error(`링크 ${link.id} 렌더링 중 오류:`, e);
        return null;
      }
    };
    
    // Function to clear all features
    const clearAllFeatures = () => {
      markersRef.current.forEach(marker => {
        if (marker && typeof marker.setMap === 'function') {
          marker.setMap(null);
        }
      });
      markersRef.current = [];
      
      polylinesRef.current.forEach(polyline => {
        if (polyline && typeof polyline.setMap === 'function') {
          polyline.setMap(null);
        }
      });
      polylinesRef.current = [];
      
      if (onDisplayedFeaturesChange) {
        onDisplayedFeaturesChange([], []);
      }
    };
    
    // Function to get a node by ID
    const getNodeById = (id: string): GeoNode | undefined => {
      return nodes.find(node => String(node.id) === String(id));
    };
    
    // Function to get a link by ID
    const getLinkById = (id: string): GeoLink | undefined => {
      return links.find(link => String(link.id) === String(id));
    };
    
    // Function to render a route using node and link IDs
    const renderRoute = (nodeIds: string[], linkIds: string[], style: RouteStyle = DEFAULT_STYLE): any[] => {
      clearAllFeatures();
      
      console.log("[GeoJsonRenderer] renderRoute 호출됨. 요청 ID 수:", 
        `Nodes: ${nodeIds.length} (${nodeIds.slice(0,5).join(", ")}${nodeIds.length > 5 ? "..." : ""}),`,
        `Links: ${linkIds.length} (${linkIds.slice(0,5).join(", ")}${linkIds.length > 5 ? "..." : ""})`
      );
      
      const renderedFeatures: any[] = [];
      
      // Render links
      if (linkIds && linkIds.length > 0) {
        linkIds.forEach(linkId => {
          const link = getLinkById(linkId);
          if (link) {
            const polyline = renderLink(link, style);
            if (polyline) renderedFeatures.push(polyline);
          } else {
            console.warn(`[GeoJsonRenderer] 링크 ID "${linkId}" 찾을 수 없음`);
          }
        });
      }
      
      // Render nodes
      if (nodeIds && nodeIds.length > 0) {
        nodeIds.forEach(nodeId => {
          const node = getNodeById(nodeId);
          if (node) {
            const marker = renderNode(node, style);
            if (marker) renderedFeatures.push(marker);
          } else {
            console.warn(`[GeoJsonRenderer] 노드 ID "${nodeId}" 찾을 수 없음`);
          }
        });
      }
      
      console.log(`[GeoJsonRenderer] 경로 렌더링 완료: ${renderedFeatures.length}개 피처 (마커: ${markersRef.current.length}, 폴리라인: ${polylinesRef.current.length})`);
      
      if (onDisplayedFeaturesChange) {
        onDisplayedFeaturesChange(markersRef.current, polylinesRef.current);
      }
      
      return renderedFeatures;
    };
    
    // Function to render all network
    const renderAllNetwork = (style: RouteStyle = DEFAULT_STYLE): any[] => {
      clearAllFeatures();
      
      const renderedFeatures: any[] = [];
      
      // Limit the number of rendered items for performance
      const linkLimit = Math.min(500, links.length);
      const linkStep = Math.max(1, Math.floor(links.length / linkLimit));
      
      console.log(`[GeoJsonRenderer] 전체 네트워크 렌더링 시작 (${linkLimit}/${links.length} 링크 샘플)`);
      
      for (let i = 0; i < links.length; i += linkStep) {
        const link = links[i];
        if (!link) continue;
        
        const polyline = renderLink(link, {
          ...style,
          strokeWeight: style.strokeWeight || 3,
          strokeOpacity: style.strokeOpacity || 0.6
        });
        
        if (polyline) renderedFeatures.push(polyline);
      }
      
      console.log(`[GeoJsonRenderer] 전체 네트워크 렌더링 완료: ${renderedFeatures.length}개 피처`);
      
      if (onDisplayedFeaturesChange) {
        onDisplayedFeaturesChange(markersRef.current, polylinesRef.current);
      }
      
      return renderedFeatures;
    };
    
    // Expose functions via ref
    useImperativeHandle(ref, () => ({
      renderRoute,
      clearDisplayedFeatures: clearAllFeatures,
      getNodeById,
      getLinkById,
      renderAllNetwork // Added this function to the exposed interface
    }));
    
    // Clear features when component unmounts
    useEffect(() => {
      return () => {
        clearAllFeatures();
      };
    }, []);
    
    return null;
  }
);

export default GeoJsonRenderer;
