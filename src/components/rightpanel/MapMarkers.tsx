import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useMapContext } from './MapContext';
import type { ItineraryPlaceWithTime } from '@/types/core';
import MarkerInfoWindow from './MarkerInfoWindow';

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
  
  // 선택된 마커 상태 관리
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<ItineraryPlaceWithTime | null>(null);
  const [markerPosition, setMarkerPosition] = useState<{ x: number, y: number } | null>(null);
  
  // InfoWindow 닫기 함수
  const handleCloseInfoWindow = useCallback(() => {
    setSelectedMarkerIndex(null);
    setSelectedPlace(null);
    setMarkerPosition(null);
  }, []);
  
  // 마커 생성 함수
  const createMarkers = useCallback(() => {
    if (!map || !isMapInitialized || !window.naver?.maps) {
      console.log('[MapMarkers] 지도가 초기화되지 않았거나 네이버 맵 API가 로드되지 않았습니다.');
      return;
    }
    
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
    
    // 새 마커 생성
    const newMarkers: naver.maps.Marker[] = [];
    
    places.forEach((place, index) => {
      if (!place.x || !place.y) {
        console.log(`[MapMarkers] 장소 ${place.name}의 좌표가 없습니다.`);
        return;
      }
      
      const position = new window.naver.maps.LatLng(place.y, place.x);
      
      // 마커 스타일 설정
      const markerOptions = {
        position,
        map,
        icon: {
          content: `
            <div style="background-color: #FF5A5F; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
              ${index + 1}
            </div>
          `,
          anchor: new window.naver.maps.Point(18, 18)
        },
        zIndex: 100 - index
      };
      
      const marker = new window.naver.maps.Marker(markerOptions);
      
      // 마커 클릭 이벤트 추가
      window.naver.maps.Event.addListener(marker, 'click', () => {
        // InfoWindow 표시를 위한 상태 업데이트
        setSelectedMarkerIndex(index);
        setSelectedPlace(place);
        setMarkerPosition({ x: place.x, y: place.y });
        
        // 상위 컴포넌트의 onPlaceClick 콜백 호출 (있는 경우)
        if (onPlaceClick) {
          onPlaceClick(place, index);
        }
      });
      
      newMarkers.push(marker);
    });
    
    markersRef.current = newMarkers;
    
    // 모든 마커가 보이도록 지도 조정
    if (newMarkers.length > 0) {
      const bounds = new window.naver.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        bounds.extend(marker.getPosition());
      });
      map.fitBounds(bounds);
    }
    
    console.log(`[MapMarkers] ${newMarkers.length}개의 마커 생성 완료 - 일자: ${selectedDay}`);
  }, [map, isMapInitialized, places, selectedDay, onPlaceClick]);
  
  // 마커 생성 실행
  useEffect(() => {
    console.log(`[MapMarkers] useEffect 실행 - 일자: ${selectedDay}, 장소 개수: ${places.length}`);
    createMarkers();
    
    // 일자 변경 시 InfoWindow 닫기
    handleCloseInfoWindow();
    
    // 컴포넌트 언마운트 시 마커 제거
    return () => {
      console.log('[MapMarkers] 컴포넌트 언마운트 - 마커 정리');
      if (markersRef.current.length > 0) {
        markersRef.current.forEach(marker => {
          if (marker && typeof marker.setMap === 'function') {
            marker.setMap(null);
          }
        });
        markersRef.current = [];
      }
    };
  }, [createMarkers, handleCloseInfoWindow]);
  
  return (
    <>
      {/* 선택된 마커가 있을 때만 InfoWindow 표시 */}
      {selectedMarkerIndex !== null && selectedPlace && markerPosition && (
        <MarkerInfoWindow
          selectedMarkerIndex={selectedMarkerIndex}
          place={selectedPlace}
          position={markerPosition}
          onClose={handleCloseInfoWindow}
        />
      )}
    </>
  );
};

export default React.memo(MapMarkers);
