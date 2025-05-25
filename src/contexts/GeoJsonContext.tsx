
import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import type { GeoNode, GeoLink } from '@/components/rightpanel/geojson/GeoJsonTypes';

interface GeoJsonContextType {
  geoJsonNodes: GeoNode[];
  geoJsonLinks: GeoLink[];
  isGeoJsonLoaded: boolean;
  setGeoJsonData: (nodes: GeoNode[], links: GeoLink[]) => void;
  getLinkByLinkIdFromContext: (linkId: string) => GeoLink | undefined;
  getNodeByIdFromContext: (nodeId: string) => GeoNode | undefined; // 추가
}

const GeoJsonContext = createContext<GeoJsonContextType | undefined>(undefined);

export const GeoJsonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [geoJsonNodes, setGeoJsonNodes] = useState<GeoNode[]>([]);
  const [geoJsonLinks, setGeoJsonLinks] = useState<GeoLink[]>([]);
  const [isGeoJsonLoaded, setIsGeoJsonLoaded] = useState(false);

  const linkMapRef = useRef<Map<string, GeoLink>>(new Map());
  const nodeMapRef = useRef<Map<string, GeoNode>>(new Map()); // 추가

  const setGeoJsonData = useCallback((nodes: GeoNode[], links: GeoLink[]) => {
    console.log('[GeoJsonContext] setGeoJsonData 호출됨:', {
      노드수: nodes.length,
      링크수: links.length,
      첫번째링크ID: links.length > 0 ? links[0].id : 'N/A'
    });

    setGeoJsonNodes(nodes);
    setGeoJsonLinks(links);
    setIsGeoJsonLoaded(true);

    const newLinkMap = new Map<string, GeoLink>();
    links.forEach(link => {
      if (link.id) {
        newLinkMap.set(String(link.id), link);
      }
    });
    linkMapRef.current = newLinkMap;
    console.log('[GeoJsonContext] linkMap 생성 완료. 항목 수:', newLinkMap.size);

    const newNodeMap = new Map<string, GeoNode>(); // 추가
    nodes.forEach(node => { // 추가
      if (node.id) { // 추가
        newNodeMap.set(String(node.id), node); // 추가
      } // 추가
    }); // 추가
    nodeMapRef.current = newNodeMap; // 추가
    console.log('[GeoJsonContext] nodeMap 생성 완료. 항목 수:', newNodeMap.size); // 추가

  }, []);

  const getLinkByLinkIdFromContext = useCallback((linkId: string): GeoLink | undefined => {
    return linkMapRef.current.get(String(linkId));
  }, []);

  const getNodeByIdFromContext = useCallback((nodeId: string): GeoNode | undefined => { // 추가
    return nodeMapRef.current.get(String(nodeId)); // 추가
  }, []); // 추가

  return (
    <GeoJsonContext.Provider value={{
      geoJsonNodes,
      geoJsonLinks,
      isGeoJsonLoaded,
      setGeoJsonData,
      getLinkByLinkIdFromContext,
      getNodeByIdFromContext // 추가
    }}>
      {children}
    </GeoJsonContext.Provider>
  );
};

export const useGeoJsonContext = () => {
  const context = useContext(GeoJsonContext);
  if (context === undefined) {
    throw new Error('useGeoJsonContext must be used within a GeoJsonProvider');
  }
  return context;
};
