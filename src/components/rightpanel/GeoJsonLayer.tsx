import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface GeoJsonLayerProps {
  map: any;
  visible: boolean;
  isMapInitialized?: boolean;
  isNaverLoaded?: boolean;
  onGeoJsonLoaded?: (nodes: any[], links: any[]) => void; // GeoJSON 로드 완료 콜백
}

// 파일은 너무 길어 중요 부분만 수정합니다.
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
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
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
    setIsLoading(true);
    
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
        
        setIsLoading(false);
        callback();
      }
    }, 300);
    
    // 15초 후에 타임아웃 (시간 증가)
    pollingRef.current.timeout = window.setTimeout(() => {
      if (pollingRef.current.interval) {
        clearInterval(pollingRef.current.interval);
        pollingRef.current.interval = null;
      }
      console.error('GeoJSON API 로딩 타임아웃 - 15초 초과');
      setIsLoading(false);
      setLoadError('GeoJSON API 로드 실패');
      toast.error('지도 경로 기능을 불러오는데 실패했습니다.');
      
      // 타임아웃 후에도 시도할 방법 제공
      loadGeoJsonDirectly();
    }, 15000);
  };

  // GeoJSON 파일만 직접 로드하는 방법
  const loadGeoJsonDirectly = async () => {
    try {
      console.log("GeoJSON 데이터 직접 로드 시도");
      const [linkRes, nodeRes] = await Promise.all([
        fetch('/data/LINK_JSON.geojson'),
        fetch('/data/NODE_JSON.geojson')
      ]);
  
      const [linkGeoJson, nodeGeoJson] = await Promise.all([
        linkRes.json(),
        nodeRes.json()
      ]);
  
      console.log('GeoJSON 데이터 직접 로드 완료');
      
      // GeoJSON API가 없어도 기본적인 처리를 시도
      try {
        if (window.naver?.maps?.GeoJSON) {
          linkFeatures.current = window.naver.maps.GeoJSON.read(linkGeoJson);
          nodeFeatures.current = window.naver.maps.GeoJSON.read(nodeGeoJson);
        } else {
          // API가 없는 경우를 위한 임시 처리
          console.log("GeoJSON API 없이 데이터만 저장");
          linkFeatures.current = linkGeoJson.features || [];
          nodeFeatures.current = nodeGeoJson.features || [];
        }
        
        setIsLoaded(true);
        
        // 콜백으로 부모 컴포넌트에 로드된 GeoJSON 객체 전달
        if (onGeoJsonLoaded) {
          onGeoJsonLoaded(nodeFeatures.current, linkFeatures.current);
        }
        
        if (visible && window.naver?.maps?.GeoJSON) {
          showGeoJsonOnMap();
        }
      } catch (err) {
        console.error('GeoJSON 데이터 처리 오류:', err);
      }
    } catch (err) {
      console.error('GeoJSON 파일 직접 로드 오류:', err);
    }
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
      // 이미 로딩 중이면 중복 실행 방지
      if (isLoading) return;
      
      try {
        // GeoJSON이 이미 로드되었으면 다시 로드하지 않음
        if (isLoaded && linkFeatures.current.length > 0) {
          console.log('GeoJSON이 이미 로드되어 있습니다.');
          if (visible) {
            showGeoJsonOnMap();
          }
          return;
        }

        setIsLoading(true);
        setLoadError(null);
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
    
        // GeoJSON API가 준비되었는지 확인
        if (isGeoJsonReady()) {
          linkFeatures.current = window.naver.maps.GeoJSON.read(linkGeoJson);
          nodeFeatures.current = window.naver.maps.GeoJSON.read(nodeGeoJson);
      
          console.log('✅ GeoJSON 처리 완료', {
            linkCount: linkFeatures.current.length,
            nodeCount: nodeFeatures.current.length
          });

          setIsLoaded(true);
          setIsLoading(false);
          
          // 콜백으로 부모 컴포넌트에 로드된 GeoJSON 객체 전달
          if (onGeoJsonLoaded) {
            onGeoJsonLoaded(nodeFeatures.current, linkFeatures.current);
          }
          
          if (visible) {
            showGeoJsonOnMap();
          }
        } else {
          // GeoJSON API가 준비될 때까지 대기
          console.log('GeoJSON API 준비 대기...');
          
          // 임시로 GeoJSON 데이터를 저장만 해두고
          linkFeatures.current = linkGeoJson.features || [];
          nodeFeatures.current = nodeGeoJson.features || [];
          
          // API가 로드될 때까지 기다린 후 처리
          waitForGeoJsonReady(() => loadGeoJson());
        }
      } catch (err) {
        console.error('GeoJSON 파일 로드 오류:', err);
        setIsLoading(false);
        setLoadError('GeoJSON 데이터 로드 오류');
        toast.error("경로 데이터 로드 중 오류가 발생했습니다.");
      }
    };

    loadGeoJson();

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
    if (!isLoaded || !map) return;
    
    if (visible) {
      showGeoJsonOnMap();
    } else {
      hideGeoJsonFromMap();
    }
  }, [visible, isLoaded, map]);

  const showGeoJsonOnMap = () => {
    if (!map || !linkFeatures.current.length || !isGeoJsonReady()) {
      console.log('지도가 준비되지 않았거나 특징이 없어 표시하지 않습니다.');
      return;
    }
    console.log('GeoJSON 데이터를 지도에 표시합니다');
    
    try {
      linkFeatures.current.forEach((f: any) => {
        if (f && typeof f.setMap === 'function') {
          f.setMap(map);
        }
      });
      
      nodeFeatures.current.forEach((f: any) => {
        if (f && typeof f.setMap === 'function') {
          f.setMap(map);
        }
      });
    } catch (err) {
      console.error('GeoJSON 표시 오류:', err);
    }
  };
  
  const hideGeoJsonFromMap = () => {
    if (!linkFeatures.current.length) return;
    console.log('GeoJSON 데이터를 지도에서 제거합니다');
    
    try {
      linkFeatures.current.forEach((f: any) => {
        if (f && typeof f.setMap === 'function') {
          f.setMap(null);
        }
      });
      
      nodeFeatures.current.forEach((f: any) => {
        if (f && typeof f.setMap === 'function') {
          f.setMap(null);
        }
      });
    } catch (err) {
      console.error('GeoJSON 제거 오류:', err);
    }
  };

  // 에러 상태나 로딩 상태를 표시하는 UI 추가
  if (loadError && visible) {
    return (
      <div className="absolute bottom-20 right-4 bg-white p-2 rounded-md shadow-md z-10">
        <p className="text-red-500 text-xs">
          경로 데이터 로드 오류. 다시 시도해주세요.
        </p>
      </div>
    );
  }

  if (isLoading && visible) {
    return (
      <div className="absolute bottom-20 right-4 bg-white p-2 rounded-md shadow-md z-10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
          <p className="text-xs text-blue-500">경로 데이터 로드 중...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default GeoJsonLayer;
