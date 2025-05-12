
import { useEffect, useRef, useState } from 'react';

interface GeoJsonLayerProps {
  map: any;
  visible: boolean;
  isMapInitialized?: boolean;
  isNaverLoaded?: boolean;
}

const GeoJsonLayer: React.FC<GeoJsonLayerProps> = ({ 
  map, 
  visible,
  isMapInitialized = true,
  isNaverLoaded = true 
}) => {
  const linkFeatures = useRef<any[]>([]);
  const nodeFeatures = useRef<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 5;

  // GeoJSON API가 로드되었는지 명확하게 확인하는 함수
  const isGeoJsonReady = () => {
    return !!(window.naver?.maps?.GeoJSON && typeof window.naver.maps.GeoJSON.read === 'function');
  };

  useEffect(() => {
    // 지도가 없거나 지도가 초기화되지 않았거나 네이버 API가 로드되지 않았으면 리턴
    if (!map || !isMapInitialized || !isNaverLoaded) {
      console.log("지도가 준비되지 않아 GeoJSON을 로드하지 않습니다.", {
        map: !!map,
        isMapInitialized,
        isNaverLoaded
      });
      return;
    }

    const loadGeoJson = async () => {
      try {
        // 네이버 맵스 GeoJSON API가 로드되었는지 확인
        if (!isGeoJsonReady()) {
          if (retryCount < MAX_RETRIES) {
            console.log(`GeoJSON API가 준비되지 않았습니다. 재시도 ${retryCount + 1}/${MAX_RETRIES}`);
            setRetryCount(prev => prev + 1);
            setTimeout(loadGeoJson, 1000); // 1초 후 다시 시도
          } else {
            console.warn('GeoJSON API 로드 최대 재시도 횟수 초과');
          }
          return;
        }

        // GeoJSON이 이미 로드되었으면 다시 로드하지 않음
        if (isLoaded && linkFeatures.current.length > 0) {
          console.log('GeoJSON이 이미 로드되어 있습니다.');
          if (visible) {
            showGeoJsonOnMap();
          }
          return;
        }

        console.log("GeoJSON 데이터 로드 시작");
        const [linkRes, nodeRes] = await Promise.all([
          fetch('/data/LINK_JSON.geojson'),
          fetch('/data/NODE_JSON.geojson')
        ]);
    
        const [linkGeoJson, nodeGeoJson] = await Promise.all([
          linkRes.json(),
          nodeRes.json()
        ]);
    
        console.log('GeoJSON 데이터 로드 완료');
    
        linkFeatures.current = window.naver.maps.GeoJSON.read(linkGeoJson);
        nodeFeatures.current = window.naver.maps.GeoJSON.read(nodeGeoJson);
    
        console.log('✅ GeoJSON 처리 완료', {
          linkCount: linkFeatures.current.length,
          nodeCount: nodeFeatures.current.length
        });

        setIsLoaded(true);
        
        if (visible) {
          showGeoJsonOnMap();
        }
      } catch (err) {
        console.error('GeoJSON 파일 로드 오류:', err);
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          setTimeout(loadGeoJson, 3000); // 오류 발생 시 3초 후 다시 시도
        }
      }
    };

    loadGeoJson();

    return () => {
      hideGeoJsonFromMap();
    };
  }, [map, isMapInitialized, isNaverLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (visible) {
      showGeoJsonOnMap();
    } else {
      hideGeoJsonFromMap();
    }
  }, [visible, isLoaded]);

  const showGeoJsonOnMap = () => {
    if (!map || !linkFeatures.current.length) return;
    console.log('GeoJSON 데이터를 지도에 표시합니다');
    linkFeatures.current.forEach(f => f.setMap(map));
    nodeFeatures.current.forEach(f => f.setMap(map));
  };
  
  const hideGeoJsonFromMap = () => {
    if (!linkFeatures.current.length) return;
    console.log('GeoJSON 데이터를 지도에서 제거합니다');
    linkFeatures.current.forEach(f => f.setMap(null));
    nodeFeatures.current.forEach(f => f.setMap(null));
  };

  return null;
};

export default GeoJsonLayer;
