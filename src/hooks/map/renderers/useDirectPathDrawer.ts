
import { useCallback } from 'react';
import type { Place } from '@/types/core';
import { createNaverLatLng } from '@/utils/map/mapSetup';

interface UseDirectPathDrawerProps {
  map: any;
  isNaverLoadedParam: boolean;
  addPolyline: (path: any[], options: any) => any;
}

export const useDirectPathDrawer = ({
  map,
  isNaverLoadedParam,
  addPolyline,
}: UseDirectPathDrawerProps) => {

  // 두 지점 사이의 직선 경로를 그리는 함수
  const drawDirectPath = useCallback((places: Place[]) => {
    if (!map || !isNaverLoadedParam || !places || places.length < 2) {
      console.warn("[useDirectPathDrawer] Cannot draw direct path: missing data or not enough places");
      return;
    }

    console.log(`[useDirectPathDrawer] Drawing direct paths between ${places.length} places`);
    
    // 연속된 장소들 사이에 직선 경로 그리기
    for (let i = 0; i < places.length - 1; i++) {
      const from = places[i];
      const to = places[i + 1];
      
      if (!from.y || !from.x || !to.y || !to.x) {
        console.warn(`[useDirectPathDrawer] Missing coordinates for path ${i} to ${i+1}`);
        continue;
      }
      
      const fromLatLng = createNaverLatLng(from.y, from.x);
      const toLatLng = createNaverLatLng(to.y, to.x);
      
      addPolyline([fromLatLng, toLatLng], {
        strokeColor: '#9333ea', // 보라색
        strokeOpacity: 0.7,
        strokeWeight: 3,
        strokeStyle: 'dashed'
      });
    }
    
  }, [map, isNaverLoadedParam, addPolyline]);

  return { drawDirectPath };
};
