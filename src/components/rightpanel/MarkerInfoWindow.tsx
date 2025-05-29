import React, { useState, useEffect, useRef } from 'react';
import { useMapContext } from './MapContext';
import type { ItineraryPlaceWithTime } from '@/types/core';

interface MarkerInfoWindowProps {
  selectedMarkerIndex: number | null;
  place: ItineraryPlaceWithTime | null;
  position: { x: number, y: number } | null;
  onClose: () => void;
}

const MarkerInfoWindow: React.FC<MarkerInfoWindowProps> = ({
  selectedMarkerIndex,
  place,
  position,
  onClose
}) => {
  const { map } = useMapContext();
  const infoWindowRef = useRef<naver.maps.InfoWindow | null>(null);
  
  useEffect(() => {
    // 선택된 마커와 위치 정보가 있을 때만 InfoWindow 표시
    if (map && place && position && selectedMarkerIndex !== null) {
      // 기존 InfoWindow가 있으면 닫기
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
      
      // InfoWindow 콘텐츠 생성
      const contentElement = document.createElement('div');
      contentElement.className = 'marker-info-window';
      contentElement.innerHTML = `
        <div style="width: 250px; padding: 12px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: bold;">${place.name}</h3>
            <span style="background: #FF5A5F; color: white; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: bold;">${selectedMarkerIndex + 1}</span>
          </div>
          <div style="margin-bottom: 8px; font-size: 14px;">
            ${place.category ? `<p style="margin: 4px 0; color: #666;">${place.category}</p>` : ''}
            ${place.rating ? `<p style="margin: 4px 0;">평점: ${place.rating}점</p>` : ''}
            ${place.address ? `<p style="margin: 4px 0; font-size: 13px; color: #666;">${place.address}</p>` : ''}
          </div>
          ${place.url ? `<a href="${place.url}" target="_blank" style="display: block; text-align: center; padding: 6px; background: #f0f0f0; border-radius: 4px; text-decoration: none; color: #333; font-size: 13px;">상세 정보 보기</a>` : ''}
          <button id="close-info-window" style="position: absolute; top: 8px; right: 8px; background: none; border: none; cursor: pointer; font-size: 16px; color: #999;">×</button>
        </div>
      `;
      
      // InfoWindow 생성 및 표시
      const infoWindow = new window.naver.maps.InfoWindow({
        content: contentElement,
        position: new window.naver.maps.LatLng(position.y, position.x),
        pixelOffset: new window.naver.maps.Point(0, -44), // 마커 위에 표시되도록 오프셋 조정
        zIndex: 200,
        disableAnchor: true,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderWidth: 0
      });
      
      infoWindow.open(map);
      infoWindowRef.current = infoWindow;
      
      // 닫기 버튼 이벤트 리스너 추가
      const closeButton = contentElement.querySelector('#close-info-window');
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          onClose();
          if (infoWindowRef.current) {
            infoWindowRef.current.close();
            infoWindowRef.current = null;
          }
        });
      }
      
      // 지도 클릭 시 InfoWindow 닫기
      const mapClickListener = window.naver.maps.Event.addListener(map, 'click', () => {
        onClose();
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
          infoWindowRef.current = null;
        }
        window.naver.maps.Event.removeListener(mapClickListener);
      });
    }
    
    // 컴포넌트 언마운트 시 InfoWindow 정리
    return () => {
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current = null;
      }
    };
  }, [map, place, position, selectedMarkerIndex, onClose]);
  
  // 실제 DOM 요소는 렌더링하지 않음 (InfoWindow는 네이버 지도 API에서 관리)
  return null;
};

export default MarkerInfoWindow;
