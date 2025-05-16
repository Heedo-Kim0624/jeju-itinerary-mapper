
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
        if (!window.naver || !window.naver.maps) {
          throw new Error("네이버 지도 API가 올바르게 로드되지 않았습니다");
        }
        
        console.log("네이버 지도 API 로드 성공", window.naver.maps);
        setIsNaverLoaded(true);
        setIsInitializing(false);
      } catch (error) {
        console.error("네이버 지도 API 로드 실패:", error);
        setIsMapError(true);
        setIsInitializing(false);
        
        // 3초 후 재시도 설정
        setTimeout(() => {
          setLoadAttempts(prev => prev + 1);
          setIsMapError(false);
        }, 3000);
      }
    };
    
    if (!isNaverLoaded && !isMapError && !isInitializing) {
      initNaverMaps();
    }
  }, [loadAttempts, isNaverLoaded, isMapError, isInitializing]);

  // 지도 초기화
  useEffect(() => {
    if (!isNaverLoaded || !mapContainer.current || isMapInitialized || !window.naver || !window.naver.maps) {
      return;
    }

    let initTimeout: number;

    try {
      console.log("지도 초기화 시작");
      
      // 추가된 디버깅 정보
      console.log("지도 컨테이너 크기:", {
        width: mapContainer.current.clientWidth,
        height: mapContainer.current.clientHeight
      });
      
      const newMap = initializeNaverMap(mapContainer.current);
      
      if (newMap) {
        // 타임아웃 설정 - 이벤트가 발생하지 않더라도 성공으로 처리
        initTimeout = window.setTimeout(() => {
          if (!isMapInitialized) {
            console.log("지도 초기화 타임아웃 후 완료 처리");
            setMap(newMap);
            setIsMapInitialized(true);
            toast.success("지도가 준비되었습니다");
          }
        }, 3000);
        
        // 이벤트 기반 초기화 완료 감지
        window.naver.maps.Event.once(newMap, 'init_stylemap', () => {
          window.clearTimeout(initTimeout);
          console.log("지도 초기화 완료 이벤트 발생");
          setMap(newMap);
          setIsMapInitialized(true);
          toast.success("지도가 준비되었습니다");
        });
      } else {
        throw new Error("지도 초기화 실패");
      }
    } catch (error) {
      console.error("지도 초기화 중 오류 발생:", error);
      setIsMapError(true);
      toast.error("지도 초기화에 실패했습니다.");
    }

    return () => {
      if (initTimeout) {
        window.clearTimeout(initTimeout);
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
