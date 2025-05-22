
import { useState, useCallback, useRef } from 'react';
import type { GeoNode, GeoLink } from './GeoJsonTypes';

export const useGeoJsonData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [nodes, setNodes] = useState<GeoNode[]>([]);
  const [links, setLinks] = useState<GeoLink[]>([]);

  const nodeMapRef = useRef<Map<string, GeoNode>>(new Map());
  const linkMapRef = useRef<Map<string, GeoLink>>(new Map());

  const handleLoadSuccess = useCallback((loadedNodes: GeoNode[], loadedLinks: GeoLink[]) => {
    setIsLoading(false);
    setIsLoaded(true);
    setNodes(loadedNodes);
    setLinks(loadedLinks);

    const newNodeMap = new Map<string, GeoNode>();
    loadedNodes.forEach(node => newNodeMap.set(String(node.id), node));
    nodeMapRef.current = newNodeMap;

    const newLinkMap = new Map<string, GeoLink>();
    loadedLinks.forEach(link => newLinkMap.set(String(link.id), link));
    linkMapRef.current = newLinkMap;

    console.log('[useGeoJsonData] GeoJSON 데이터 처리 및 상태 업데이트 완료:', {
      노드수: newNodeMap.size,
      링크수: newLinkMap.size
    });
  }, []);

  const handleLoadError = useCallback((loadError: Error) => {
    setIsLoading(false);
    setError(loadError);
    setIsLoaded(false);
    console.error('[useGeoJsonData] GeoJSON 데이터 로드/처리 실패:', loadError);
  }, []);

  const getNodeById = useCallback((id: string): GeoNode | undefined => {
    return nodeMapRef.current.get(id);
  }, []);

  const getLinkById = useCallback((id: string): GeoLink | undefined => {
    return linkMapRef.current.get(id);
  }, []);

  return {
    isLoading,
    error,
    isLoaded,
    nodes,
    links,
    handleLoadSuccess,
    handleLoadError,
    getNodeById,
    getLinkById,
    // Expose isLoaded status as a function for the global interface
    getIsLoaded: useCallback(() => isLoaded, [isLoaded]),
  };
};
