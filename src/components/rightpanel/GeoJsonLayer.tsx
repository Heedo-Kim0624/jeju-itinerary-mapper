
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface GeoJsonLayerProps {
  map: any;
  visible: boolean;
  isMapInitialized?: boolean;
  isNaverLoaded?: boolean;
  onGeoJsonLoaded?: (nodes: any[], links: any[]) => void; // GeoJSON 로드 완료 콜백
}

const GeoJsonLayer: React.FC<GeoJsonLayerProps> = ({ 
  map, 
  visible,
  isMapInitialized = true,
  isNaverLoaded = true,
  onGeoJsonLoaded
}) => {
  const linkFeatures = useRef<any[]>([]);
  const nodeFeatures = useRef<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const pollingRef = useRef<{ interval: number | null; timeout: number | null }>({
    interval: null,
    timeout: null
  });

  // GeoJSON API가 로드되었는지 명확하게 확인하는 함수
  const isGeoJsonReady = () => {
    return !!(window.naver?.maps?.GeoJSON && typeof window.naver.maps.GeoJSON.read === 'function');
  };

  // GeoJSON API가 준비될 때까지 기다리는 함수
  const waitForGeoJsonReady = (callback: () => void) => {
    if (pollingRef.current.interval) {
      clearInterval(pollingRef.current.interval);
      pollingRef.current.interval = null;
    }
    
    if (pollingRef.current.timeout) {
      clearTimeout(pollingRef.current.timeout);
      pollingRef.current.timeout = null;
    }
    
    // 이미 준비되었으면 바로 콜백 실행
    if (isGeoJsonReady()) {
      console.log('GeoJSON API가 즉시 사용 가능합니다.');
      callback();
      return;
    }
    
    console.log('GeoJSON API 준비 대기 시작...');
    
    // 300ms마다 GeoJSON 준비 여부 확인
    pollingRef.current.interval = window.setInterval(() => {
      if (isGeoJsonReady()) {
        console.log('GeoJSON API가 준비되었습니다.');
        clearInterval(pollingRef.current.interval!);
        pollingRef.current.interval = null;
        
        if (pollingRef.current.timeout) {
          clearTimeout(pollingRef.current.timeout);
          pollingRef.current.timeout = null;
        }
        
        callback();
      }
    }, 300);
    
    // 10초 후에 타임아웃
    pollingRef.current.timeout = window.setTimeout(() => {
      if (pollingRef.current.interval) {
        clearInterval(pollingRef.current.interval);
        pollingRef.current.interval = null;
      }
      console.error('GeoJSON API 로딩 타임아웃 - 10초 초과');
      toast.error('지도 경로 기능을 불러오는데 실패했습니다.');
    }, 10000);
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
    
        // GeoJSON API가 준비된 상태이므로 안전하게 처리 가능
        linkFeatures.current = window.naver.maps.GeoJSON.read(linkGeoJson);
        nodeFeatures.current = window.naver.maps.GeoJSON.read(nodeGeoJson);
    
        console.log('✅ GeoJSON 처리 완료', {
          linkCount: linkFeatures.current.length,
          nodeCount: nodeFeatures.current.length
        });

        setIsLoaded(true);
        
        // 콜백으로 부모 컴포넌트에 로드된 GeoJSON 객체 전달
        if (onGeoJsonLoaded) {
          onGeoJsonLoaded(nodeFeatures.current, linkFeatures.current);
        }
        
        if (visible) {
          showGeoJsonOnMap();
        }
      } catch (err) {
        console.error('GeoJSON 파일 로드 오류:', err);
        toast.error("경로 데이터 로드 중 오류가 발생했습니다.");
      }
    };

    // GeoJSON API가 준비될 때까지 기다린 후 로드
    waitForGeoJsonReady(loadGeoJson);

    return () => {
      // 컴포넌트 언마운트 시 인터벌과 타임아웃 정리
      if (pollingRef.current.interval) {
        clearInterval(pollingRef.current.interval);
        pollingRef.current.interval = null;
      }
      
      if (pollingRef.current.timeout) {
        clearTimeout(pollingRef.current.timeout);
        pollingRef.current.timeout = null;
      }
      
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
    linkFeatures.current.forEach((f: any) => f.setMap(map));
    nodeFeatures.current.forEach((f: any) => f.setMap(map));
  };
  
  const hideGeoJsonFromMap = () => {
    if (!linkFeatures.current.length) return;
    console.log('GeoJSON 데이터를 지도에서 제거합니다');
    linkFeatures.current.forEach((f: any) => f.setMap(null));
    nodeFeatures.current.forEach((f: any) => f.setMap(null));
  };

  return null;
};

export default GeoJsonLayer;
