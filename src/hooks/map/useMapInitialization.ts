
import { useState, useEffect } from 'react';
import { loadNaverMaps } from "@/utils/loadNaverMaps";
import { initializeNaverMap } from '@/utils/map/mapInitializer';
import { toast } from "sonner";

export const useMapInitialization = (mapContainer: React.RefObject<HTMLDivElement>) => {
  const [isMapInitialized, setIsMapInitialized] = useState<boolean>(false);
  const [isNaverLoaded, setIsNaverLoaded] = useState<boolean>(false);
  const [isMapError, setIsMapError] = useState<boolean>(false);
  const [loadAttempts, setLoadAttempts] = useState<number>(0);
  const [map, setMap] = useState<any>(null);

  // 네이버 지도 API 로드
  useEffect(() => {
    const initNaverMaps = async () => {
      if (loadAttempts >= 3) {
        console.error("Maximum load attempts reached. Stopping retries.");
        setIsMapError(true);
        toast.error("지도 로드에 실패했습니다. 페이지를 새로고침해주세요.");
        return;
      }

      try {
        console.log(`네이버 지도 API 로드 시도 (${loadAttempts + 1}/3)`);
        await loadNaverMaps();
        console.log("네이버 지도 API 로드 성공");
        setIsNaverLoaded(true);
      } catch (error) {
        console.error("네이버 지도 API 로드 실패:", error);
        setIsMapError(true);
        
        // 3초 후 재시도 설정
        setTimeout(() => {
          setLoadAttempts(prev => prev + 1);
          setIsMapError(false);
        }, 3000);
      }
    };
    
    if (!isNaverLoaded && !isMapError) {
      initNaverMaps();
    }
  }, [loadAttempts, isNaverLoaded, isMapError]);

  // 지도 초기화
  useEffect(() => {
    if (!isNaverLoaded || !mapContainer.current) {
      return;
    }

    try {
      console.log("지도 초기화 시작");
      const newMap = initializeNaverMap(mapContainer.current);
      
      if (newMap) {
        // 지도 초기화 이벤트 리스너 추가
        if (window.naver && window.naver.maps) {
          window.naver.maps.Event.once(newMap, 'init_stylemap', () => {
            console.log("지도 초기화 완료");
            setMap(newMap);
            setIsMapInitialized(true);
            toast.success("지도가 준비되었습니다");
          });
        } else {
          setMap(newMap);
          setIsMapInitialized(true);
        }
      } else {
        throw new Error("지도 초기화 실패");
      }
    } catch (error) {
      console.error("지도 초기화 중 오류 발생:", error);
      setIsMapError(true);
      toast.error("지도 초기화에 실패했습니다.");
    }
  }, [isNaverLoaded, mapContainer]);

  return {
    map,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
  };
};
