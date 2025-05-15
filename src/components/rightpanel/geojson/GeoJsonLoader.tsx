
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { GeoJsonLoaderProps, GeoNode, GeoLink, GeoJsonGeometry, NodeProperties, LinkProperties } from './GeoJsonTypes';

const GeoJsonLoader: React.FC<GeoJsonLoaderProps> = ({
  isMapInitialized,
  isNaverLoaded,
  onLoadSuccess,
  onLoadError
}) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isMapInitialized && isNaverLoaded) {
      loadGeoJsonData();
    }
  }, [isMapInitialized, isNaverLoaded]);

  const loadGeoJsonData = async () => {
    try {
      setIsLoading(true);
      console.log('GeoJsonLoader: 데이터 파일 로드 시작');

      // 노드와 링크 GeoJSON 파일 가져오기 (로컬 또는 원격)
      const [nodesResponse, linksResponse] = await Promise.all([
        fetch('/data/jeju-nodes.geojson'),
        fetch('/data/jeju-links.geojson')
      ]);

      const nodesData = await nodesResponse.json();
      const linksData = await linksResponse.json();

      // GeoJSON 데이터를 내부 형식으로 변환
      const nodes = transformNodes(nodesData);
      const links = transformLinks(linksData);

      console.log('GeoJsonLoader: GeoJSON 데이터 로드 완료', {
        노드: nodes.length,
        링크: links.length
      });

      // 노드와 링크 간의 관계 설정
      buildRelationships(nodes, links);

      console.log('GeoJsonLoader: GeoJSON 데이터 처리 완료', {
        노드객체: nodes.length,
        링크객체: links.length
      });

      // 데이터 로드 성공 콜백 호출
      onLoadSuccess(nodes, links);
    } catch (error) {
      console.error('GeoJsonLoader: GeoJSON 데이터 로드 실패', error);
      onLoadError(error instanceof Error ? error : new Error('Unknown error'));
      toast.error('GeoJSON 데이터 로드에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // GeoJSON 노드 변환
  const transformNodes = (geoJson: any): GeoNode[] => {
    if (!geoJson.features) {
      return [];
    }

    return geoJson.features.map((feature: any) => {
      const id = String(feature.properties.NODE_ID);
      const coordinates = feature.geometry.coordinates as [number, number];
      
      return {
        id,
        type: 'node',
        geometry: feature.geometry as GeoJsonGeometry,
        properties: feature.properties as NodeProperties,
        coordinates,
        adjacentLinks: [],
        adjacentNodes: [],
        setStyles: () => {} // 초기 빈 구현
      };
    });
  };

  // GeoJSON 링크 변환
  const transformLinks = (geoJson: any): GeoLink[] => {
    if (!geoJson.features) {
      return [];
    }

    return geoJson.features.map((feature: any) => {
      const id = String(feature.properties.LINK_ID);
      const fromNode = String(feature.properties.F_NODE);
      const toNode = String(feature.properties.T_NODE);
      const coordinates = feature.geometry.coordinates as [number, number][];
      const length = feature.properties.LENGTH || 0;
      
      return {
        id,
        type: 'link',
        geometry: feature.geometry as GeoJsonGeometry,
        properties: feature.properties as LinkProperties,
        coordinates,
        fromNode,
        toNode,
        length,
        setStyles: () => {} // 초기 빈 구현
      };
    });
  };

  // 노드와 링크 간의 관계 설정
  const buildRelationships = (nodes: GeoNode[], links: GeoLink[]) => {
    // 노드 맵 생성 (ID로 빠르게 조회 가능)
    const nodeMap = new Map<string, GeoNode>();
    nodes.forEach(node => nodeMap.set(node.id, node));

    // 링크에 대해 양방향 관계 설정
    links.forEach(link => {
      const fromNode = nodeMap.get(link.fromNode);
      const toNode = nodeMap.get(link.toNode);

      if (fromNode) {
        fromNode.adjacentLinks.push(link.id);
        if (toNode) {
          fromNode.adjacentNodes.push(toNode.id);
        }
      }

      if (toNode) {
        toNode.adjacentLinks.push(link.id);
        if (fromNode) {
          toNode.adjacentNodes.push(fromNode.id);
        }
      }
    });
  };

  // 로딩 UI는 필요하지 않음 (GeoJsonLayer에서 처리)
  return null;
};

export default GeoJsonLoader;
