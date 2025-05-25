
import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { GeoNode, GeoLink, GeoJsonGeometry, GeoCoordinates, GeoJsonNodeProperties, GeoJsonLinkProperties } from './GeoJsonTypes';
import { useGeoJsonContext } from '@/contexts/GeoJsonContext'; // Import useGeoJsonContext

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
  const { setGeoJsonData } = useGeoJsonContext(); // Get setGeoJsonData from context

  useEffect(() => {
    const loadGeoJsonData = async () => {
      if (!isMapInitialized || !isNaverLoaded) {
        console.log('[GeoJsonLoader] 맵 또는 Naver API가 초기화되지 않아 로드 대기 중');
        return;
      }
      
      try {
        console.log('[GeoJsonLoader] GeoJSON 데이터 파일 로드 시작');
        
        // 링크 파일 로드 및 디버깅
        console.log('[GeoJsonLoader] LINK_JSON.geojson 로드 시도');
        const linkRes = await fetch('/data/LINK_JSON.geojson');
        console.log('[GeoJsonLoader] LINK_JSON.geojson 응답 상태:', linkRes.status);
        
        if (!linkRes.ok) {
          throw new Error(`LINK_JSON.geojson 로드 실패: ${linkRes.status}`);
        }
        
        const linkText = await linkRes.text();
        console.log('[GeoJsonLoader] LINK_JSON.geojson 응답 크기:', linkText.length);
        
        let linkJson;
        try {
          linkJson = JSON.parse(linkText);
          console.log('[GeoJsonLoader] LINK_JSON.geojson 파싱 성공. Features 수:', linkJson.features?.length || 0);
          if (linkJson.features && linkJson.features.length > 0) {
            const firstFeature = linkJson.features[0];
            console.log('[GeoJsonLoader] LINK_JSON 첫 번째 feature 샘플:', {
              id_prop: firstFeature.id, // GeoJSON 표준에 id가 있을 수 있음
              properties_LINK_ID: firstFeature.properties?.LINK_ID,
              LINK_ID_TYPE: typeof firstFeature.properties?.LINK_ID
            });
          }
        } catch (e) {
          console.error('[GeoJsonLoader] LINK_JSON.geojson 파싱 실패:', e);
          throw new Error('LINK_JSON.geojson 파싱 실패');
        }

        // 노드 파일 로드
        console.log('[GeoJsonLoader] NODE_JSON.geojson 로드 시도');
        const nodeRes = await fetch('/data/NODE_JSON.geojson');
        if (!nodeRes.ok) {
          throw new Error(`NODE_JSON.geojson 로드 실패: ${nodeRes.status}`);
        }
        const nodeJson = await nodeRes.json();
        console.log('[GeoJsonLoader] NODE_JSON.geojson 파싱 성공. Features 수:', nodeJson.features?.length || 0);
        
        // 노드 객체 생성 (기존 로직 유지)
        const nodes = nodeJson.features.map((feature: any): GeoNode => {
          const id = String(feature.properties.NODE_ID);
          const coordinates = feature.geometry.coordinates as GeoCoordinates;
          
          return {
            id,
            type: 'node',
            geometry: feature.geometry as GeoJsonGeometry,
            properties: feature.properties as GeoJsonNodeProperties,
            coordinates,
            adjacentLinks: [],
            adjacentNodes: [],
            setStyles: (styles: any) => { /* 스타일 설정 로직 */ }
          };
        });
        
        // 링크 객체 생성 (기존 로직 유지하며 ID 정규화 부분 확인)
        const links = linkJson.features.map((feature: any): GeoLink => {
          const props = feature.properties;
          // LINK_ID 필드 정규화 - 다양한 형식 지원
          const rawLinkId = props.LINK_ID ?? props.link_id ?? props.LinkId ?? props.linkId;
          
          // feature.id는 GeoJSON 표준 속성일 수 있으므로, LINK_ID가 우선순위. 둘 다 없으면 랜덤 생성.
          const id = String(rawLinkId || feature.id || Math.random().toString(36).substring(2, 11));
          
          const fromNodeId = String(props.F_NODE || props.from_node || '');
          const toNodeId = String(props.T_NODE || props.to_node || '');
          const length = props.LENGTH || 0;
          
          // 노드 인접 링크 및 노드 업데이트 (기존 로직 유지)
          const fromNode = nodes.find(node => node.id === fromNodeId);
          const toNode = nodes.find(node => node.id === toNodeId);
          if (fromNode) {
            fromNode.adjacentLinks.push(id);
            if (toNodeId) fromNode.adjacentNodes.push(toNodeId);
          }
          if (toNode) {
            toNode.adjacentLinks.push(id);
            if (fromNodeId) toNode.adjacentNodes.push(fromNodeId);
          }
          
          return {
            id, // 정규화된 ID 사용
            type: 'link',
            geometry: feature.geometry as GeoJsonGeometry,
            properties: props as GeoJsonLinkProperties, // 원본 properties 유지
            coordinates: feature.geometry.coordinates as GeoCoordinates[],
            fromNode: fromNodeId,
            toNode: toNodeId,
            length,
            setStyles: (styles: any) => { /* 스타일 설정 로직 */ }
          };
        });
        
        // 변환된 links 배열 샘플 확인
        if (links.length > 0) {
          console.log('[GeoJsonLoader] 변환된 links 첫 번째 샘플:', {
            id: links[0].id, // 이 id가 정규화된 LINK_ID
            id_type: typeof links[0].id,
            properties_LINK_ID: links[0].properties?.LINK_ID, // 원본 properties의 LINK_ID
            properties_LINK_ID_type: typeof links[0].properties?.LINK_ID
          });
        }
        
        console.log('[GeoJsonLoader] onLoadSuccess 및 setGeoJsonData 호출 전. Nodes:', nodes.length, 'Links:', links.length);
        
        // 컨텍스트에 데이터 설정
        setGeoJsonData(nodes, links);
        
        // 기존 콜백도 호출 (MapContext 등 다른 곳에서 사용할 수 있도록)
        onLoadSuccess(nodes, links);
        console.log('[GeoJsonLoader] onLoadSuccess 및 setGeoJsonData 호출 완료');
        
      } catch (error) {
        console.error('[GeoJsonLoader] GeoJSON 데이터 로드 중 오류:', error);
        onLoadError(error instanceof Error ? error : new Error('GeoJSON 데이터 로드 실패'));
      }
    };
    
    loadGeoJsonData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapInitialized, isNaverLoaded, onLoadSuccess, onLoadError, setGeoJsonData]);
  
  return null;
};

export default GeoJsonLoader;
