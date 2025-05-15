
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

    console.log('GeoJsonLayer: 데이터 로드 시작');
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

        // 데이터를 순수 JavaScript 객체로 처리
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

    // GeoJSON 데이터 처리 함수 - 네이버 API 의존성 제거
    const processGeoJsonData = (nodeData: any, linkData: any) => {
      try {
        // 노드 처리
        const nodeFeatures = nodeData.features.map((feature: any) => ({
          id: feature.id || feature.properties?.NODE_ID,
          type: 'node',
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
        const linkFeatures = linkData.features.map((feature: any) => ({
          id: feature.id || feature.properties?.LINK_ID,
          type: 'link',
          geometry: feature.geometry,
          properties: feature.properties,
          coordinates: feature.geometry.coordinates,
          // 메서드 추가
          getId: function() { return this.id; },
          clone: function() { return {...this}; },
          setMap: function(m: any) { this.map = m; },
          setStyles: function(styles: any) { this.styles = styles; }
        }));
        
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
        if (feature && feature.map) {
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
      
      // 네이버 맵에 표시하는 대신 자체 렌더링 로직 구현
      renderCustomElements();
    } catch (error) {
      console.error('GeoJsonLayer: 가시성 업데이트 오류', error);
      toast.error('경로 데이터 표시 중 오류가 발생했습니다.');
    }
  };

  // 커스텀 요소 렌더링 (네이버 맵 의존성 제거 버전)
  const renderCustomElements = () => {
    // 링크와 노드를 표시하는 자체 로직 구현
    if (!map || !window.naver) return;
    
    try {
      // 링크 렌더링 (성능을 위해 일부만)
      const sampleLinks = linksRef.current.slice(0, 100);
      sampleLinks.forEach(link => {
        if (!link.geometry || !link.geometry.coordinates) return;
        
        const path = link.geometry.coordinates.map((coord: number[]) => 
          new window.naver.maps.LatLng(coord[1], coord[0])
        );
        
        const polyline = new window.naver.maps.Polyline({
          map: map,
          path: path,
          strokeColor: '#777',
          strokeWeight: 1,
          strokeOpacity: 0.5,
          clickable: false
        });
        
        // 참조에 저장하여 나중에 제거할 수 있도록 함
        link.naverElement = polyline;
        displayedFeaturesRef.current.push(polyline);
      });
      
      // 노드 렌더링 (성능을 위해 일부만)
      const sampleNodes = nodesRef.current.slice(0, 100);
      sampleNodes.forEach(node => {
        if (!node.geometry || !node.coordinates) return;
        
        const [lng, lat] = node.coordinates;
        
        const circle = new window.naver.maps.Circle({
          map: map,
          center: new window.naver.maps.LatLng(lat, lng),
          radius: 50,
          fillColor: '#ff0000',
          fillOpacity: 0.1,
          strokeWeight: 0,
          clickable: false
        });
        
        // 참조에 저장하여 나중에 제거할 수 있도록 함
        node.naverElement = circle;
        displayedFeaturesRef.current.push(circle);
      });
      
      console.log(`GeoJsonLayer: ${displayedFeaturesRef.current.length}개 요소 표시됨`);
    } catch (error) {
      console.error('GeoJsonLayer: 커스텀 렌더링 오류', error);
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
        if (link && link.geometry && link.geometry.coordinates) {
          const path = link.geometry.coordinates.map((coord: number[]) => 
            new window.naver.maps.LatLng(coord[1], coord[0])
          );
          
          const polyline = new window.naver.maps.Polyline({
            map: map,
            path: path,
            strokeColor: routeStyle.strokeColor,
            strokeWeight: routeStyle.strokeWeight,
            strokeOpacity: routeStyle.strokeOpacity,
            zIndex: routeStyle.zIndex,
            clickable: routeStyle.clickable
          });
          
          renderedFeatures.push(polyline);
          displayedFeaturesRef.current.push(polyline);
        }
      });
      
      // 노드 추가 (장소 표시용)
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
        if (node && node.coordinates) {
          const [lng, lat] = node.coordinates;
          
          const circle = new window.naver.maps.Circle({
            map: map,
            center: new window.naver.maps.LatLng(lat, lng),
            radius: nodeStyle.radius * 10,
            fillColor: nodeStyle.fillColor,
            fillOpacity: nodeStyle.fillOpacity,
            strokeWeight: nodeStyle.strokeWeight,
            strokeColor: nodeStyle.strokeColor,
            clickable: nodeStyle.clickable
          });
          
          renderedFeatures.push(circle);
          displayedFeaturesRef.current.push(circle);
        }
      });
      
      console.log(`GeoJsonLayer: ${renderedFeatures.length}개 경로 요소 렌더링됨`);
    } catch (error) {
      console.error('GeoJsonLayer: 경로 렌더링 오류', error);
    }
    
    return renderedFeatures;
  };
  
  // 외부에서 호출 가능한 함수를 객체로 반환하고 window에 저장
  useEffect(() => {
    if (isMapInitialized && isNaverLoaded) {
      // 외부에서 함수를 호출할 수 있도록 window 객체에 저장
      window.geoJsonLayer = {
        renderRoute,
        clearDisplayedFeatures,
        getNodeById: (id: string) => nodesRef.current.find(n => n.getId() === id),
        getLinkById: (id: string) => linksRef.current.find(l => l.getId() === id)
      };
      
      return () => {
        window.geoJsonLayer = undefined;
      };
    }
  }, [isMapInitialized, isNaverLoaded]);
  
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
