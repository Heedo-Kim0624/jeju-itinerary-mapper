// @ts-nocheck
// TODO: map.js 관련 타입 정의 추가 필요

export const clearMarkers = (markers: any[]) => {
  if (markers && markers.length > 0) {
    markers.forEach(marker => {
      if (marker && typeof marker.setMap === 'function') {
        marker.setMap(null);
      }
    });
  }
  return []; // 항상 새 배열 반환
};

export const clearPolylines = (polylines: any[]) => {
  if (polylines && polylines.length > 0) {
    polylines.forEach(polyline => {
      if (polyline && typeof polyline.setMap === 'function') {
        polyline.setMap(null);
      }
    });
  }
  return []; // 항상 새 배열 반환
};

export const clearInfoWindows = (infoWindows: any[]) => {
  if (infoWindows && infoWindows.length > 0) {
    infoWindows.forEach(infoWindow => {
      if (infoWindow && typeof infoWindow.close === 'function') {
        infoWindow.close(); // 정보창 닫기
      }
      if (infoWindow && typeof infoWindow.setMap === 'function') {
        infoWindow.setMap(null); // 지도에서 제거 (필요한 경우)
      }
    });
  }
  return []; // 항상 새 배열 반환
};
