
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { GeoJsonCollection, GeoNode, GeoLink } from './GeoJsonTypes';

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
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // 맵 초기화와 네이버 맵 API 로드 상태 확인
    if (!isMapInitialized || !isNaverLoaded || !window.naver) {
      return;
    }

    console.log('GeoJsonLoader: 데이터 로드 시작');
    setIsLoading(true);
    
    // GeoJSON 파일 로드 함수
    const loadGeoJsonData = async () => {
      try {
        const [nodeResponse, linkResponse] = await Promise.all([
          fetch('/data/NODE_JSON.geojson'),
          fetch('/data/LINK_JSON.geojson')
        ]);

        if (!nodeResponse.ok || !linkResponse.ok) {
          throw new Error('GeoJSON 파일을 불러오는데 실패했습니다.');
        }

        const [nodeData, linkData] = await Promise.all<GeoJsonCollection>([
          nodeResponse.json(),
          linkResponse.json()
        ]);

        console.log('GeoJsonLoader: GeoJSON 데이터 로드 완료', {
          노드: nodeData.features.length,
          링크: linkData.features.length
        });

        // 데이터를 순수 JavaScript 객체로 처리
        const { nodeFeatures, linkFeatures } = processGeoJsonData(nodeData, linkData);
        
        // 로드 성공 콜백 호출
        onLoadSuccess(nodeFeatures, linkFeatures);
      } catch (error) {
        console.error('GeoJsonLoader: GeoJSON 데이터 로드 오류', error);
        onLoadError(error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.'));
        toast.error('경로 데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    // 데이터 로드 시작
    loadGeoJsonData();
  }, [isMapInitialized, isNaverLoaded, onLoadSuccess, onLoadError]);

  return isLoading ? (
    <div className="absolute bottom-16 left-4 bg-background/80 backdrop-blur-sm p-2 rounded-md text-sm">
      경로 데이터 로드 중...
    </div>
  ) : null;
};

// GeoJSON 데이터 처리 함수 - 네이버 API 의존성 제거
const processGeoJsonData = (nodeData: GeoJsonCollection, linkData: GeoJsonCollection) => {
  // 노드 처리
  const nodeFeatures = nodeData.features.map((feature) => ({
    id: feature.id || feature.properties?.NODE_ID || '',
    type: 'node' as const,
    geometry: feature.geometry,
    properties: feature.properties,
    coordinates: feature.geometry.coordinates,
    // 메서드 추가
    getId: function() { return this.id; },
    getGeometryAt: function() { return { 
      getCoordinates: function() { 
        const [x, y] = feature.geometry.coordinates;
        return { x, y };
      }
    }; },
    clone: function() { return {...this}; },
    setMap: function(m: any) { this.map = m; },
    setStyles: function(styles: any) { this.styles = styles; }
  }));
  
  // 링크 처리
  const linkFeatures = linkData.features.map((feature) => ({
    id: feature.id || feature.properties?.LINK_ID || '',
    type: 'link' as const,
    geometry: feature.geometry,
    properties: feature.properties,
    coordinates: feature.geometry.coordinates,
    // 메서드 추가
    getId: function() { return this.id; },
    clone: function() { return {...this}; },
    setMap: function(m: any) { this.map = m; },
    setStyles: function(styles: any) { this.styles = styles; }
  }));
  
  console.log('GeoJsonLoader: GeoJSON 데이터 처리 완료', {
    노드객체: nodeFeatures.length,
    링크객체: linkFeatures.length
  });
  
  return { nodeFeatures, linkFeatures };
};

export default GeoJsonLoader;
