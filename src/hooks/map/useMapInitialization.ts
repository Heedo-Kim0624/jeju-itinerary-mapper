
import { useState, useEffect, useRef } from 'react';
import { loadNaverMaps } from "@/utils/loadNaverMaps";
import { initializeNaverMap } from '@/utils/map/mapInitializer';
import { toast } from "sonner";

export const useMapInitialization = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [isMapInitialized, setIsMapInitialized] = useState<boolean>(false);
  const [isNaverLoaded, setIsNaverLoaded] = useState<boolean>(false);
  const [isMapError, setIsMapError] = useState<boolean>(false);
  const [loadAttempts, setLoadAttempts] = useState<number>(0);
  const [map, setMap] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const initTimeoutRef = useRef<number | null>(null);
  const mapInstanceRef = useRef<any>(null); // Store map instance in ref to avoid recreation

  // 네이버 지도 API 로드
  useEffect(() => {
    const initNaverMaps = async () => {
      if (isNaverLoaded || isInitializing) return;
      
      if (loadAttempts >= 3) {
        console.error("최대 로드 시도 횟수에 도달했습니다. 재시도를 중단합니다.");
        setIsMapError(true);
        toast.error("지도 로드에 실패했습니다. 페이지를 새로고침해주세요.");
        return;
      }

      setIsInitializing(true);

      try {
        console.log(`네이버 지도 API 로드 시도 (${loadAttempts + 1}/3)`);
        await loadNaverMaps();
        
        // 네이버 맵 객체 검증
        if (!window.naver || !window.naver.maps || typeof window.naver.maps.Map !== 'function') {
          throw new Error("네이버 지도 API가 올바르게 로드되지 않았습니다");
        }
        
        console.log("네이버 지도 API 로드 성공", window.naver.maps);
        setIsNaverLoaded(true);
        setIsInitializing(false);
      } catch (error) {
        console.error("네이버 지도 API 로드 실패:", error);
        setIsMapError(true);
        setIsInitializing(false);
        
        // 실패 후 재시도 전 대기 시간을 점진적으로 증가
        const retryDelay = (loadAttempts + 1) * 2000; // 2초, 4초, 6초
        console.log(`${retryDelay}ms 후에 재시도합니다.`);
        
        setTimeout(() => {
          setLoadAttempts(prev => prev + 1);
          setIsMapError(false);
        }, retryDelay);
      }
    };
    
    if (!isNaverLoaded && !isMapError && !isInitializing) {
      initNaverMaps();
    }
    
    // 컴포넌트 언마운트 시 타임아웃 정리
    return () => {
      if (initTimeoutRef.current) {
        window.clearTimeout(initTimeoutRef.current);
      }
    };
  }, [loadAttempts, isNaverLoaded, isMapError, isInitializing]);

  // 지도 초기화
  useEffect(() => {
    // Prevent duplicate initialization
    if (!isNaverLoaded || !mapContainer.current || isMapInitialized || !window.naver || !window.naver.maps || mapInstanceRef.current) {
      return;
    }

    try {
      console.log("지도 초기화 시작");
      
      // 추가된 디버깅 정보
      console.log("지도 컨테이너 크기:", {
        width: mapContainer.current.clientWidth,
        height: mapContainer.current.clientHeight,
        offsetWidth: mapContainer.current.offsetWidth,
        offsetHeight: mapContainer.current.offsetHeight,
        style: mapContainer.current.style
      });
      
      // 컨테이너 크기가 0이면 최소 크기 설정
      if (mapContainer.current.clientWidth === 0 || mapContainer.current.clientHeight === 0) {
        console.warn("지도 컨테이너 크기가 0입니다. 최소 크기를 설정합니다.");
        mapContainer.current.style.minWidth = "300px";
        mapContainer.current.style.minHeight = "300px";
      }
      
      const newMap = initializeNaverMap(mapContainer.current);
      
      if (newMap) {
        // Store map instance in ref
        mapInstanceRef.current = newMap;
        
        // 타임아웃 설정 - 이벤트가 발생하지 않더라도 성공으로 처리
        initTimeoutRef.current = window.setTimeout(() => {
          if (!isMapInitialized) {
            console.log("지도 초기화 타임아웃 후 완료 처리");
            setMap(newMap);
            setIsMapInitialized(true);
            toast.success("지도가 준비되었습니다");
          }
        }, 5000); // 5초 타임아웃
        
        // 이벤트 기반 초기화 완료 감지
        if (window.naver && window.naver.maps && window.naver.maps.Event) {
          window.naver.maps.Event.once(newMap, 'init_stylemap', () => {
            if (initTimeoutRef.current) {
              window.clearTimeout(initTimeoutRef.current);
              initTimeoutRef.current = null;
            }
            console.log("지도 초기화 완료 이벤트 발생");
            setMap(newMap);
            setIsMapInitialized(true);
            toast.success("지도가 준비되었습니다");
          });
        }
        
        // 추가 검증: 지도 객체가 제대로 생성되었는지 확인
        try {
          const center = newMap.getCenter();
          const zoom = newMap.getZoom();
          console.log("지도 초기 중심점 및 줌 레벨 확인:", { center, zoom });
        } catch (err) {
          console.error("지도 상태 확인 중 오류:", err);
        }
      } else {
        throw new Error("지도 초기화 실패");
      }
    } catch (error) {
      console.error("지도 초기화 중 오류 발생:", error);
      setIsMapError(true);
      toast.error("지도 초기화에 실패했습니다.");
    }

    return () => {
      if (initTimeoutRef.current) {
        window.clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
    };
  }, [isNaverLoaded, isMapInitialized]);

  return {
    map,
    mapContainer,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
    isGeoJsonInitialized: !!(window.naver?.maps?.GeoJSON && typeof window.naver.maps.GeoJSON.read === 'function')
  };
};
