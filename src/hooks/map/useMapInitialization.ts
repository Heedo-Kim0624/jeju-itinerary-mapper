
import { useEffect, useRef, useState } from 'react';
import { loadNaverMaps } from '@/utils/loadNaverMaps';

declare global {
  interface Window {
    naver: any;
  }
}

export function useMapInitialization(mapContainerId: string) {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const naverMap = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const polylines = useRef<any[]>([]);
  const circles = useRef<any[]>([]);
  const infos = useRef<any[]>([]);

  useEffect(() => {
    const initializeMap = () => {
      try {
        if (!window.naver) {
          console.warn('Naver Maps SDK not loaded yet');
          return;
        }

        const mapOptions = {
          center: new window.naver.maps.LatLng(33.3846, 126.5535), // 제주도 중심 좌표
          zoom: 10,
          zoomControl: true,
          zoomControlOptions: {
            position: window.naver.maps.Position.TOP_RIGHT
          }
        };

        const mapElement = document.getElementById(mapContainerId);
        if (!mapElement) {
          console.error(`Map container element #${mapContainerId} not found`);
          return;
        }

        naverMap.current = new window.naver.maps.Map(mapContainerId, mapOptions);
        setIsMapInitialized(true);
        console.log('Naver Map initialized');
      } catch (error) {
        console.error('Error initializing Naver Map:', error);
      }
    };

    if (!isMapLoaded) {
      loadNaverMaps(() => {
        setIsMapLoaded(true);
        initializeMap();
      });
    } else if (!isMapInitialized) {
      initializeMap();
    }
  }, [isMapLoaded, isMapInitialized, mapContainerId]);

  return {
    naverMap,
    markers,
    polylines,
    circles,
    infos,
    isMapInitialized
  };
}
