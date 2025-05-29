
import React, { useEffect, useRef, useCallback } from 'react';
import { useMapContext } from './MapContext';
import { createArrowPolyline } from '@/utils/map/arrowPolylineUtils';
import type { ItineraryPlaceWithTime } from '@/types/core';

interface MapMarkersProps {
  places: ItineraryPlaceWithTime[];
  selectedDay: number | null;
  onPlaceClick?: (place: ItineraryPlaceWithTime, index: number) => void;
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  places,
  selectedDay,
  onPlaceClick,
}) => {
  const { map, isMapInitialized } = useMapContext();
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const routeElementsRef = useRef<any>(null); // 폴리라인과 화살표들을 포함하는 객체
  
  // 일차별 색상을 반환하는 함수
  const getMarkerColor = useCallback((day: number | null) => {
    if (!day) return '#FF5A5F';
    const colors = ['#FF5A5F', '#4285F4', '#34A853', '#FBBC05', '#EA4335', '#9C27B0', '#FF9800'];
    return colors[(day - 1) % colors.length];
  }, []);
  
  // 기존 마커와 폴리라인 정리
  const clearMarkersAndPolylines = useCallback(() => {
    // 기존 마커 제거
    if (markersRef.current.length > 0) {
      console.log(`[MapMarkers] 기존 마커 ${markersRef.current.length}개 제거`);
      markersRef.current.forEach(marker => {
        if (marker && typeof marker.setMap === 'function') {
          marker.setMap(null);
        }
      });
      markersRef.current = [];
    }
    
    // 기존 경로 요소들 제거
    if (routeElementsRef.current) {
      console.log('[MapMarkers] 기존 경로 요소들 제거');
      routeElementsRef.current.setMap(null);
      routeElementsRef.current = null;
    }
  }, []);
  
  // 마커와 폴리라인 생성 함수
  const createMarkersAndPolylines = useCallback(() => {
    if (!map || !isMapInitialized || !window.naver?.maps) {
      console.log('[MapMarkers] 지도가 초기화되지 않았거나 네이버 맵 API가 로드되지 않았습니다.');
      return;
    }
    
    // 기존 마커와 폴리라인 제거
    clearMarkersAndPolylines();
    
    if (places.length === 0) {
      console.log('[MapMarkers] 표시할 장소가 없습니다.');
      return;
    }
    
    // 새 마커 생성
    const newMarkers: naver.maps.Marker[] = [];
    const pathCoordinates: naver.maps.LatLng[] = [];
    const markerColor = getMarkerColor(selectedDay);
    
    places.forEach((place, index) => {
      if (!place.x || !place.y) {
        console.log(`[MapMarkers] 장소 ${place.name}의 좌표가 없습니다.`);
        return;
      }
      
      const position = new window.naver.maps.LatLng(place.y, place.x);
      pathCoordinates.push(position);
      
      // 마커 스타일 설정
      const markerOptions = {
        position,
        map,
        icon: {
          content: `
            <div style="background-color: ${markerColor}; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 2px solid white;">
              ${index + 1}
            </div>
          `,
          anchor: new window.naver.maps.Point(18, 18)
        },
        zIndex: 100 - index
      };
      
      const marker = new window.naver.maps.Marker(markerOptions);
      
      // 클릭 이벤트 추가
      if (onPlaceClick) {
        window.naver.maps.Event.addListener(marker, 'click', () => {
          onPlaceClick(place, index);
        });
      }
      
      newMarkers.push(marker);
    });
    
    markersRef.current = newMarkers;
    
    // 화살표가 있는 폴리라인 생성 (마커들을 연결하는 선)
    if (pathCoordinates.length > 1) {
      const routeElements = createArrowPolyline(map, pathCoordinates, {
        strokeColor: markerColor,
        strokeOpacity: 0.8,
        strokeWeight: 3,
        arrowSize: 8,
        zIndex: 50
      });
      
      routeElementsRef.current = routeElements;
      console.log(`[MapMarkers] 화살표 폴리라인 생성 완료 - ${pathCoordinates.length}개 지점 연결`);
    }
    
    // 모든 마커가 보이도록 지도 조정
    if (newMarkers.length > 0) {
      const bounds = new window.naver.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        bounds.extend(marker.getPosition());
      });
      map.fitBounds(bounds);
    }
    
    console.log(`[MapMarkers] ${newMarkers.length}개의 마커 생성 완료 - 일자: ${selectedDay}`);
  }, [map, isMapInitialized, places, selectedDay, onPlaceClick, clearMarkersAndPolylines, getMarkerColor]);
  
  // 마커와 폴리라인 생성 실행
  useEffect(() => {
    console.log(`[MapMarkers] useEffect 실행 - 일자: ${selectedDay}, 장소 개수: ${places.length}`);
    createMarkersAndPolylines();
    
    // 컴포넌트 언마운트 시 마커와 폴리라인 제거
    return () => {
      console.log('[MapMarkers] 컴포넌트 언마운트 - 마커와 폴리라인 정리');
      clearMarkersAndPolylines();
    };
  }, [createMarkersAndPolylines]);
  
  return null; // 실제 DOM 요소는 렌더링하지 않음
};

export default React.memo(MapMarkers);
