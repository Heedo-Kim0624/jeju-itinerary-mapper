
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface GeoJsonLayerProps {
  map: any;
  visible: boolean;
  isMapInitialized: boolean;
  isNaverLoaded: boolean;
  onGeoJsonLoaded?: (nodes: any[], links: any[]) => void;
}

const GeoJsonLayer: React.FC<GeoJsonLayerProps> = ({ 
  map, 
  visible, 
  isMapInitialized,
  isNaverLoaded,
  onGeoJsonLoaded 
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  
  // GeoJSON 데이터 참조 (메모리에 한 번만 로드)
  const nodesRef = useRef<any[]>([]);
  const linksRef = useRef<any[]>([]);
  
  // 현재 지도에 표시 중인 GeoJSON 요소들
  const displayedFeaturesRef = useRef<any[]>([]);
  
  // GeoJSON 데이터 로드
  useEffect(() => {
    if (!map || !isMapInitialized || !isNaverLoaded || !window.naver) {
      return;
    }
    
    // 이미 데이터가 로드되었는지 확인
    if (nodesRef.current.length > 0 && linksRef.current.length > 0) {
      console.log('GeoJsonLayer: 이미 GeoJSON 데이터 로드됨');
      // 콜백 호출
      if (onGeoJsonLoaded) {
        onGeoJsonLoaded(nodesRef.current, linksRef.current);
      }
      return;
    }

    // drawing 모듈 존재 확인
    const hasDrawingModule = window.naver?.maps?.drawing && typeof window.naver.maps.drawing.JSONReader === 'function';
    
    console.log('GeoJsonLayer: 데이터 로드 시작', { hasDrawingModule });
    setIsLoading(true);
    setError(false);

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

        const [nodeData, linkData] = await Promise.all([
          nodeResponse.json(),
          linkResponse.json()
        ]);

        console.log('GeoJsonLayer: GeoJSON 데이터 로드 완료', {
          노드: nodeData.features.length,
          링크: linkData.features.length
        });

        // 가공된 GeoJSON 데이터를 메모리에 저장
        processGeoJsonData(nodeData, linkData);
        
        // 가시성에 따라 지도에 표시
        updateVisibility(visible);
        
        // 콜백 호출
        if (onGeoJsonLoaded) {
          onGeoJsonLoaded(nodesRef.current, linksRef.current);
        }
      } catch (error) {
        console.error('GeoJsonLayer: GeoJSON 데이터 로드 오류', error);
        setError(true);
        toast.error('경로 데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    // GeoJSON 데이터 처리 함수
    const processGeoJsonData = (nodeData: any, linkData: any) => {
      const nodeFeatures: any[] = [];
      const linkFeatures: any[] = [];
      
      try {
        if (hasDrawingModule) {
          // naver.maps.drawing.JSONReader 사용
          const nodeReader = new window.naver.maps.drawing.JSONReader(nodeData);
          const linkReader = new window.naver.maps.drawing.JSONReader(linkData);
          
          // 지도에 바로 표시하지 않고 메모리에만 저장
          nodeFeatures.push(...nodeReader.readGeoJson());
          linkFeatures.push(...linkReader.readGeoJson());
        } else {
          // 대체 방식 - naver.maps.Data 사용
          console.log('GeoJsonLayer: Drawing 모듈 없음, 대체 방식 사용');
          
          // 노드 처리
          nodeData.features.forEach((feature: any) => {
            const dataFeature = convertGeoJsonToDataFeature(feature);
            if (dataFeature) nodeFeatures.push(dataFeature);
          });
          
          // 링크 처리
          linkData.features.forEach((feature: any) => {
            const dataFeature = convertGeoJsonToDataFeature(feature);
            if (dataFeature) linkFeatures.push(dataFeature);
          });
        }
        
        // 참조에 저장
        nodesRef.current = nodeFeatures;
        linksRef.current = linkFeatures;
        
        console.log('GeoJsonLayer: GeoJSON 데이터 처리 완료', {
          노드객체: nodeFeatures.length,
          링크객체: linkFeatures.length
        });
      } catch (error) {
        console.error('GeoJsonLayer: GeoJSON 처리 오류', error);
        setError(true);
      }
    };
    
    // GeoJSON Feature를 Naver Maps Data 객체로 변환 (대체 방식)
    const convertGeoJsonToDataFeature = (feature: any) => {
      try {
        const dataFeature = new window.naver.maps.Data.Feature(
          feature.id,
          feature.geometry,
          feature.properties
        );
        return dataFeature;
      } catch (error) {
        console.error('GeoJsonLayer: 데이터 변환 오류', error);
        return null;
      }
    };
    
    // 데이터 로드 시작
    loadGeoJsonData();
    
    // 클린업 함수
    return () => {
      clearDisplayedFeatures();
    };
  }, [map, isMapInitialized, isNaverLoaded, onGeoJsonLoaded]);
  
  // 가시성 변경 시 호출되는 함수
  useEffect(() => {
    updateVisibility(visible);
  }, [visible, map]);
  
  // 표시 중인 GeoJSON 요소들 제거
  const clearDisplayedFeatures = () => {
    if (displayedFeaturesRef.current.length > 0) {
      displayedFeaturesRef.current.forEach(feature => {
        if (feature && typeof feature.setMap === 'function') {
          feature.setMap(null);
        }
      });
      displayedFeaturesRef.current = [];
    }
  };
  
  // GeoJSON 가시성 업데이트
  const updateVisibility = (isVisible: boolean) => {
    if (!map || nodesRef.current.length === 0 || linksRef.current.length === 0) {
      return;
    }
    
    // 기존에 표시된 요소들 제거
    clearDisplayedFeatures();
    
    if (!isVisible) {
      return;
    }
    
    try {
      console.log('GeoJsonLayer: GeoJSON 가시성 설정 - 표시');
      
      // 스타일 정의
      const nodeStyle = {
        fillColor: '#ff0000',
        fillOpacity: 0.1,
        radius: 2,
        strokeWeight: 0,
        strokeColor: 'transparent',
        clickable: false
      };
      
      const linkStyle = {
        strokeColor: '#777',
        strokeWeight: 1,
        strokeOpacity: 0.5,
        clickable: false
      };
      
      // 링크 추가 (노드보다 먼저 추가하여 노드가 위에 표시되도록)
      const links = linksRef.current.slice(0, 100); // 성능을 위해 일부만 표시
      links.forEach(link => {
        if (typeof link.setMap === 'function') {
          link.setStyles(linkStyle);
          link.setMap(map);
          displayedFeaturesRef.current.push(link);
        }
      });
      
      // 노드 추가
      const nodes = nodesRef.current.slice(0, 100); // 성능을 위해 일부만 표시
      nodes.forEach(node => {
        if (typeof node.setMap === 'function') {
          node.setStyles(nodeStyle);
          node.setMap(map);
          displayedFeaturesRef.current.push(node);
        }
      });
      
      console.log(`GeoJsonLayer: ${displayedFeaturesRef.current.length}개 요소 표시됨`);
    } catch (error) {
      console.error('GeoJsonLayer: 가시성 업데이트 오류', error);
      toast.error('경로 데이터 표시 중 오류가 발생했습니다.');
    }
  };
  
  // 특정 노드/링크 ID 배열을 사용하여 경로 렌더링
  const renderRoute = (nodeIds: string[], linkIds: string[], style: any = {}) => {
    if (!map || nodeIds.length === 0 || linkIds.length === 0) {
      return [];
    }
    
    const renderedFeatures: any[] = [];
    
    try {
      // 스타일 정의 (기본값 + 전달받은 스타일)
      const routeStyle = {
        strokeColor: '#3366FF',
        strokeWeight: 4,
        strokeOpacity: 0.8,
        zIndex: 100,
        clickable: false,
        ...style
      };
      
      // 링크 추가
      linkIds.forEach(id => {
        const link = linksRef.current.find(l => l.getId() === id);
        if (link && typeof link.setMap === 'function') {
          const clonedLink = link.clone();
          clonedLink.setStyles(routeStyle);
          clonedLink.setMap(map);
          renderedFeatures.push(clonedLink);
          displayedFeaturesRef.current.push(clonedLink);
        }
      });
      
      // 노드 추가 (선택사항)
      const nodeStyle = {
        fillColor: routeStyle.strokeColor,
        fillOpacity: 0.8,
        radius: 4,
        strokeWeight: 2,
        strokeColor: '#FFFFFF',
        clickable: false
      };
      
      nodeIds.forEach(id => {
        const node = nodesRef.current.find(n => n.getId() === id);
        if (node && typeof node.setMap === 'function') {
          const clonedNode = node.clone();
          clonedNode.setStyles(nodeStyle);
          clonedNode.setMap(map);
          renderedFeatures.push(clonedNode);
          displayedFeaturesRef.current.push(clonedNode);
        }
      });
      
      console.log(`GeoJsonLayer: ${renderedFeatures.length}개 경로 요소 렌더링됨`);
    } catch (error) {
      console.error('GeoJsonLayer: 경로 렌더링 오류', error);
    }
    
    return renderedFeatures;
  };
  
  // 외부에서 호출 가능한 함수를 객체로 반환
  const layerInterface = {
    renderRoute,
    clearDisplayedFeatures,
    getNodeById: (id: string) => nodesRef.current.find(n => n.getId() === id),
    getLinkById: (id: string) => linksRef.current.find(l => l.getId() === id)
  };
  
  // 부모 컴포넌트에서 접근할 수 있도록 ref에 함수들을 할당 (선택사항)
  
  return (
    <>
      {isLoading && (
        <div className="absolute bottom-16 left-4 bg-background/80 backdrop-blur-sm p-2 rounded-md text-sm">
          경로 데이터 로드 중...
        </div>
      )}
      
      {error && (
        <div className="absolute bottom-16 left-4 bg-red-500/80 text-white backdrop-blur-sm p-2 rounded-md text-sm">
          경로 데이터 로드 실패
        </div>
      )}
    </>
  );
};

export default GeoJsonLayer;
