
import { useState, useCallback } from 'react';
// ServerRouteResponse 타입을 @/types/schedule.ts 에서 직접 가져옴
import type { ServerRouteResponse } from '@/types/schedule';

/**
 * 서버 경로 데이터 관리 훅
 */
export const useServerRoutes = () => {
  const [serverRoutesData, setServerRoutesDataState] = useState<Record<number, ServerRouteResponse>>({});

  // 서버에서 받은 경로 데이터 저장 (함수형 업데이트 지원하도록 수정)
  const setServerRoutes = useCallback((
    dayRoutesUpdater: Record<number, ServerRouteResponse> | ((prevRoutes: Record<number, ServerRouteResponse>) => Record<number, ServerRouteResponse>),
    showGeoJson: boolean, // 이 파라미터들은 useMapCore에서 setServerRoutes 호출 시 전달
    setShowGeoJson: (show: boolean) => void
  ) => {
    setServerRoutesDataState(prevData => {
      const newRoutes = typeof dayRoutesUpdater === 'function' ? dayRoutesUpdater(prevData) : dayRoutesUpdater;
      console.log('서버 경로 데이터 설정:', newRoutes);
      
      if (!showGeoJson && Object.keys(newRoutes).length > 0) {
        setShowGeoJson(true);
      }
      return newRoutes;
    });
  }, []); // showGeoJson, setShowGeoJson 의존성 제거 (setServerRoutesDataState가 함수형 업데이트를 사용하므로)

  return {
    serverRoutesData,
    setServerRoutes
  };
};
