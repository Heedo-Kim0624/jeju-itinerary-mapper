
import { useEffect, useRef, useState } from 'react';

interface GeoJsonLayerProps {
  map: any;
  visible: boolean;
}

const GeoJsonLayer: React.FC<GeoJsonLayerProps> = ({ map, visible }) => {
  const linkFeatures = useRef<any[]>([]);
  const nodeFeatures = useRef<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 5;

  useEffect(() => {
    if (!map) return;

    const loadGeoJson = async () => {
      try {
        // 먼저 naver maps API가 로드되었는지 확인
        if (!window.naver || !window.naver.maps || !window.naver.maps.GeoJSON) {
          if (retryCount < MAX_RETRIES) {
            console.log(`🔄 네이버 지도 API가 아직 로드되지 않았습니다. 다시 시도합니다. (${retryCount + 1}/${MAX_RETRIES})`);
            setRetryCount(prev => prev + 1);
            setTimeout(loadGeoJson, 1000); // 1초 후 다시 시도
          } else {
            console.log('❌ 네이버 지도 API 로드 최대 재시도 횟수 초과');
            return;
          }
          return;
        }

        const [linkRes, nodeRes] = await Promise.all([
          fetch('/data/LINK_JSON.geojson'),
          fetch('/data/NODE_JSON.geojson')
        ]);
    
        const [linkGeoJson, nodeGeoJson] = await Promise.all([
          linkRes.json(),
          nodeRes.json()
        ]);
    
        console.log('🧪 linkGeoJson loaded');
        console.log('🧪 nodeGeoJson loaded');
    
        linkFeatures.current = window.naver.maps.GeoJSON.read(linkGeoJson);
        nodeFeatures.current = window.naver.maps.GeoJSON.read(nodeGeoJson);
    
        console.log('✅ GeoJSON 메모리에 저장 완료', {
          linkCount: linkFeatures.current.length,
          nodeCount: nodeFeatures.current.length
        });

        setIsLoaded(true);
        
        if (visible) {
          showGeoJsonOnMap();
        }
      } catch (err) {
        console.error('❌ GeoJSON 파일 로드 오류:', err);
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          setTimeout(loadGeoJson, 3000); // 오류 발생 시 3초 후 다시 시도
        } else {
          console.log('❌ GeoJSON 로드 최대 재시도 횟수 초과');
        }
      }
    };

    loadGeoJson();

    return () => {
      hideGeoJsonFromMap();
    };
  }, [map]);

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
    linkFeatures.current.forEach(f => f.setMap(map));
    nodeFeatures.current.forEach(f => f.setMap(map));
  };
  
  const hideGeoJsonFromMap = () => {
    if (!linkFeatures.current.length) return;
    linkFeatures.current.forEach(f => f.setMap(null));
    nodeFeatures.current.forEach(f => f.setMap(null));
  };

  return null;
};

export default GeoJsonLayer;
