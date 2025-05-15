import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { GeoNode, GeoLink, GeoJsonGeometry, GeoCoordinates, NodeProperties, LinkProperties } from './GeoJsonTypes';

interface GeoJsonLoaderProps {
  isMapInitialized: boolean;
  isNaverLoaded: boolean;
  onLoadSuccess: (nodes: GeoNode[], links: GeoLink[]) => void;
  onLoadError: (error: Error) => void;
}

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
        
        const [nodeJson, linkJson] = await Promise.all([
          nodeRes.json(),
          linkRes.json()
        ]);
        
        console.log('GeoJsonLoader: GeoJSON 데이터 로드 완료', {
          노드: nodeJson.features.length,
          링크: linkJson.features.length
        });
        
        const tempNodes: GeoNode[] = nodeJson.features.map((feature: any): GeoNode => {
          const id = String(feature.properties.NODE_ID);
          const coordinates = feature.geometry.coordinates as GeoCoordinates;
          
          return {
            id,
            type: 'node',
            geometry: { type: 'Point', coordinates },
            properties: feature.properties as NodeProperties,
            coordinates,
            adjacentLinks: [],
            adjacentNodes: [],
            setStyles: (styles: any) => {}
          };
        });
        
        const tempLinks: GeoLink[] = linkJson.features.map((feature: any): GeoLink => {
          const id = String(feature.properties.LINK_ID);
          const fromNodeId = String(feature.properties.F_NODE);
          const toNodeId = String(feature.properties.T_NODE);
          const length = feature.properties.LENGTH || 0;
          
          const fromNode = tempNodes.find(node => node.id === fromNodeId);
          const toNode = tempNodes.find(node => node.id === toNodeId);
          
          if (fromNode) {
            fromNode.adjacentLinks.push(id);
            if (toNodeId) fromNode.adjacentNodes.push(toNodeId);
          }
          
          if (toNode) {
            toNode.adjacentLinks.push(id);
            if (fromNodeId) toNode.adjacentNodes.push(fromNodeId);
          }
          
          return {
            id,
            type: 'link',
            geometry: { type: 'LineString', coordinates: feature.geometry.coordinates as GeoCoordinates[] },
            properties: feature.properties as LinkProperties,
            coordinates: feature.geometry.coordinates as GeoCoordinates[],
            fromNode: fromNodeId,
            toNode: toNodeId,
            length,
            setStyles: (styles: any) => {}
          };
        });
        
        console.log('GeoJsonLoader: GeoJSON 데이터 처리 완료', {
          노드객체: tempNodes.length,
          링크객체: tempLinks.length
        });
        
        onLoadSuccess(tempNodes, tempLinks);
        
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
