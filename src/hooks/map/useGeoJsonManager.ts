
import { useState, useCallback, useRef } from 'react';
import { GeoNode, GeoLink } from '@/components/rightpanel/geojson/GeoJsonTypes';
import { toast } from 'sonner';

/**
 * GeoJSON 노드와 링크의 데이터 관리 담당 훅
 */
export const useGeoJsonManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [nodes, setNodes] = useState<GeoNode[]>([]);
  const [links, setLinks] = useState<GeoLink[]>([]);
  
  // 노드 및 링크 맵 (ID로 빠르게 조회)
  const nodeMapRef = useRef<Map<string, GeoNode>>(new Map());
  const linkMapRef = useRef<Map<string, GeoLink>>(new Map());
  
  // 데이터 로딩 성공 처리
  const handleLoadSuccess = useCallback((loadedNodes: GeoNode[], loadedLinks: GeoLink[]) => {
    setIsLoading(false);
    setIsLoaded(true);
    setNodes(loadedNodes);
    setLinks(loadedLinks);
    
    // 맵 생성
    const nodeMap = new Map<string, GeoNode>();
    const linkMap = new Map<string, GeoLink>();
    
    loadedNodes.forEach(node => nodeMap.set(node.id, node));
    loadedLinks.forEach(link => linkMap.set(link.id, link));
    
    nodeMapRef.current = nodeMap;
    linkMapRef.current = linkMap;
    
    console.log('GeoJSON 상태 초기화 완료:', {
      노드: loadedNodes.length,
      링크: loadedLinks.length
    });
  }, []);
  
  // 데이터 로딩 오류 처리
  const handleLoadError = useCallback((loadError: Error) => {
    setIsLoading(false);
    setError(loadError);
    console.error('GeoJSON 데이터 로드 실패:', loadError);
    toast.error('GeoJSON 데이터 로드에 실패했습니다.');
  }, []);
  
  // 노드 ID로 노드 조회
  const getNodeById = useCallback((id: string): GeoNode | undefined => {
    return nodeMapRef.current.get(id);
  }, []);
  
  // 링크 ID로 링크 조회
  const getLinkById = useCallback((id: string): GeoLink | undefined => {
    return linkMapRef.current.get(id);
  }, []);

  return {
    isLoading,
    isLoaded,
    error,
    nodes,
    links,
    handleLoadSuccess,
    handleLoadError,
    getNodeById,
    getLinkById
  };
};
