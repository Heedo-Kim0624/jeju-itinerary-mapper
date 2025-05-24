
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
  
  // 추가: LINK_ID로 더 빠르게 조회하기 위한 별도의 Map
  const linkIdMapRef = useRef<Map<string, GeoLink>>(new Map());

  const handleLoadSuccess = useCallback((loadedNodes: GeoNode[], loadedLinks: GeoLink[]) => {
    setIsLoading(false);
    setIsLoaded(true);
    setNodes(loadedNodes);
    setLinks(loadedLinks);

    const newNodeMap = new Map<string, GeoNode>();
    loadedNodes.forEach(node => newNodeMap.set(String(node.id), node));
    nodeMapRef.current = newNodeMap;

    const newLinkMap = new Map<string, GeoLink>();
    const newLinkIdMap = new Map<string, GeoLink>();
    
    loadedLinks.forEach(link => {
      // 기본 ID로 링크 맵 설정
      newLinkMap.set(String(link.id), link);
      
      // LINK_ID로도 별도 맵 설정 (다양한 필드명 지원)
      if (link.properties) {
        const props = link.properties;
        const linkId = props.LINK_ID || props.link_id || props.Link_Id || props.linkId || props.LinkId;
        if (linkId !== undefined) {
          newLinkIdMap.set(String(linkId), link);
        }
      }
    });
    
    linkMapRef.current = newLinkMap;
    linkIdMapRef.current = newLinkIdMap;

    console.log('[useGeoJsonData] GeoJSON 데이터 처리 및 상태 업데이트 완료:', {
      노드수: newNodeMap.size,
      링크수: newLinkMap.size,
      LINK_ID맵: newLinkIdMap.size
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
  
  // 추가: LINK_ID로 링크 검색하는 함수
  const getLinkByLinkId = useCallback((linkId: string): GeoLink | undefined => {
    return linkIdMapRef.current.get(String(linkId));
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
    getLinkByLinkId, // 새로운 함수 노출
    // Expose isLoaded status as a function for the global interface
    getIsLoaded: useCallback(() => isLoaded, [isLoaded]),
  };
};
