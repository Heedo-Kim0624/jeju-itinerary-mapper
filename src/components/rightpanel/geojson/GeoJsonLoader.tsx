
import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { 
  GeoNode, 
  GeoLink, 
  GeoJsonLoaderProps, 
  GeoCoordinates, 
  GeoJsonGeometry, 
  NodeProperties, // Use NodeProperties
  LinkProperties  // Use LinkProperties
} from './GeoJsonTypes'; // Ensure these are exported from GeoJsonTypes

const GeoJsonLoader: React.FC<GeoJsonLoaderProps> = ({
  isMapInitialized,
  isNaverLoaded,
  onLoadSuccess,
  onLoadError
}) => {
  useEffect(() => {
    const loadGeoJsonData = async () => {
      if (!isMapInitialized || !isNaverLoaded) {
        return;
      }
      
      try {
        console.log('GeoJsonLoader: 데이터 파일 로드 시작');
        const [nodeRes, linkRes] = await Promise.all([
          fetch('/data/NODE_JSON.geojson'),
          fetch('/data/LINK_JSON.geojson')
        ]);
        
        if (!nodeRes.ok || !linkRes.ok) {
          throw new Error('GeoJSON 데이터를 가져오는데 실패했습니다.');
        }
        
        const nodeJson = await nodeRes.json();
        const linkJson = await linkRes.json();
        
        console.log('GeoJsonLoader: GeoJSON 데이터 로드 완료', {
          노드: nodeJson.features.length,
          링크: linkJson.features.length
        });
        
        const nodes: GeoNode[] = nodeJson.features.map((feature: any): GeoNode => {
          const id = String(feature.properties.NODE_ID); // Ensure NODE_ID exists
          const coordinates = feature.geometry.coordinates as GeoCoordinates; // [lng, lat]
          
          return {
            id,
            type: 'node',
            coordinates,
            properties: feature.properties as NodeProperties, // Cast to NodeProperties
            adjacentLinks: [],
            adjacentNodes: []
          };
        });
        
        const links: GeoLink[] = linkJson.features.map((feature: any): GeoLink => {
          const id = String(feature.properties.LINK_ID); // Ensure LINK_ID exists
          const fromNodeId = String(feature.properties.F_NODE); // Ensure F_NODE exists
          const toNodeId = String(feature.properties.T_NODE);   // Ensure T_NODE exists
          const length = feature.properties.LENGTH || 0;
          
          const fromNode = nodes.find(node => node.id === fromNodeId);
          const toNode = nodes.find(node => node.id === toNodeId);
          
          if (fromNode && fromNode.adjacentLinks && fromNode.adjacentNodes) {
            fromNode.adjacentLinks.push(id);
            if (toNodeId) fromNode.adjacentNodes.push(toNodeId);
          }
          
          if (toNode && toNode.adjacentLinks && toNode.adjacentNodes) {
            toNode.adjacentLinks.push(id);
            if (fromNodeId) toNode.adjacentNodes.push(fromNodeId);
          }
          
          return {
            id,
            type: 'link',
            coordinates: feature.geometry.coordinates as GeoCoordinates[],
            properties: feature.properties as LinkProperties, // Cast to LinkProperties
            fromNode: fromNodeId,
            toNode: toNodeId,
            length
          };
        });
        
        console.log('GeoJsonLoader: GeoJSON 데이터 처리 완료', {
          노드객체: nodes.length,
          링크객체: links.length
        });
        
        onLoadSuccess(nodes, links);
        
      } catch (error) {
        console.error('GeoJSON 데이터 로드 중 오류:', error);
        onLoadError(error instanceof Error ? error : new Error('GeoJSON 데이터 로드 실패'));
      }
    };
    
    loadGeoJsonData();
  }, [isMapInitialized, isNaverLoaded, onLoadSuccess, onLoadError]);
  
  return null;
};

export default GeoJsonLoader;
