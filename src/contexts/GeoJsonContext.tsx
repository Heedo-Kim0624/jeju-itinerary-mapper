
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { GeoNode, GeoLink } from '@/components/rightpanel/geojson/GeoJsonTypes';

interface GeoJsonContextType {
  geoJsonNodes: GeoNode[];
  geoJsonLinks: GeoLink[];
  isGeoJsonLoaded: boolean;
  setGeoJsonData: (nodes: GeoNode[], links: GeoLink[]) => void;
  getLinkByLinkIdFromContext: (linkId: string) => GeoLink | undefined; // 추가
}

const GeoJsonContext = createContext<GeoJsonContextType | undefined>(undefined);

export const GeoJsonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [geoJsonNodes, setGeoJsonNodes] = useState<GeoNode[]>([]);
  const [geoJsonLinks, setGeoJsonLinks] = useState<GeoLink[]>([]);
  const [isGeoJsonLoaded, setIsGeoJsonLoaded] = useState(false);

  const linkMapRef = React.useRef<Map<string, GeoLink>>(new Map());

  const setGeoJsonData = useCallback((nodes: GeoNode[], links: GeoLink[]) => {
    console.log('[GeoJsonContext] setGeoJsonData 호출됨:', {
      노드수: nodes.length,
      링크수: links.length,
      첫번째링크ID: links.length > 0 ? links[0].id : 'N/A'
    });

    setGeoJsonNodes(nodes);
    setGeoJsonLinks(links);
    setIsGeoJsonLoaded(true);

    // LINK_ID (GeoLink.id)로 빠르게 조회하기 위한 Map 생성
    const newLinkMap = new Map<string, GeoLink>();
    links.forEach(link => {
      if (link.id) { // link.id는 GeoJsonLoader에서 문자열로 정규화됨
        newLinkMap.set(String(link.id), link);
      }
    });
    linkMapRef.current = newLinkMap;
    console.log('[GeoJsonContext] linkMap 생성 완료. 항목 수:', newLinkMap.size);

  }, []);

  const getLinkByLinkIdFromContext = useCallback((linkId: string): GeoLink | undefined => {
    return linkMapRef.current.get(String(linkId));
  }, []);

  return (
    <GeoJsonContext.Provider value={{
      geoJsonNodes,
      geoJsonLinks,
      isGeoJsonLoaded,
      setGeoJsonData,
      getLinkByLinkIdFromContext
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
