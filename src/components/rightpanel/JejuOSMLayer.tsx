
import { useEffect, useRef, useState } from 'react';

interface JejuOSMLayerProps {
  map: any;
}

const JejuOSMLayer: React.FC<JejuOSMLayerProps> = ({ map }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const layersRef = useRef<any[]>([]);
  
  useEffect(() => {
    if (!map || !window.naver || !window.naver.maps || !window.naver.maps.drawing) return;
    
    // 이미 로드되었으면 중복 로드 방지
    if (isLoaded && layersRef.current.length > 0) {
      console.log("JejuOSMLayer: 레이어가 이미 로드되어 있음");
      return;
    }

    const loadGeoJson = async (url: string, style: any) => {
      try {
        console.log(`JejuOSMLayer: ${url} 로드 시작`);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`GeoJSON 로딩 실패: ${response.status} ${response.statusText}`);
        }
        
        const geojson = await response.json();
        console.log(`JejuOSMLayer: ${url} 로드 완료, 특성 ${geojson.features?.length || 0}개`);
        
        if (!geojson.features || geojson.features.length === 0) {
          console.warn(`JejuOSMLayer: ${url}에 특성이 없음`);
          return;
        }
        
        // 네이버 지도 drawing 기능 사용해 GeoJSON 렌더링
        const reader = new window.naver.maps.drawing.JSONReader(geojson, style);
        const layer = reader.read();
        
        // 모든 객체를 지도에 추가
        layer.forEach((feature: any) => {
          if (feature) {
            feature.setMap(map);
            layersRef.current.push(feature);
          }
        });
        
        console.log(`JejuOSMLayer: ${url}의 ${layer.length}개 요소를 지도에 추가함`);
        setIsLoaded(true);
      } catch (error) {
        console.error(`JejuOSMLayer: GeoJSON 파일(${url}) 로드 실패:`, error);
      }
    };

    // 스타일 정의
    const linkStyle = {
      strokeColor: '#777', // 더 연한 색상으로 변경
      strokeWeight: 1.5,   // 더 얇게
      strokeOpacity: 0.5,  // 더 투명하게
      clickable: false     // 클릭 이벤트 비활성화
    };

    const nodeStyle = {
      fillColor: '#ff0000',
      fillOpacity: 0.1,    // 매우 투명하게
      radius: 2,           // 더 작게
      strokeWeight: 0,     // 테두리 없애기
      strokeColor: 'transparent',
      clickable: false     // 클릭 이벤트 비활성화
    };

    // GeoJSON 로드
    loadGeoJson('/data/LINK_JSON.geojson', linkStyle);
    loadGeoJson('/data/NODE_JSON.geojson', nodeStyle);
    
    // 클린업 함수
    return () => {
      // 모든 레이어 제거
      if (layersRef.current.length > 0) {
        console.log(`JejuOSMLayer: ${layersRef.current.length}개 레이어 제거`);
        layersRef.current.forEach(feature => {
          if (feature && typeof feature.setMap === 'function') {
            feature.setMap(null);
          }
        });
        layersRef.current = [];
        setIsLoaded(false);
      }
    };
  }, [map]);

  return null;
};

export default JejuOSMLayer;
