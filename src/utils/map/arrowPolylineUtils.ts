
export const createArrowPolyline = (
  map: any,
  path: any[], // naver.maps.LatLng[]
  options: {
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    arrowSize?: number;
    zIndex?: number;
  }
) => {
  if (!window.naver || !window.naver.maps || path.length < 2) {
    console.error("Naver Maps API not initialized or insufficient path points.");
    return null;
  }

  // 기본 폴리라인 생성
  const polyline = new window.naver.maps.Polyline({
    map: map,
    path: path,
    strokeColor: options.strokeColor || '#4285F4',
    strokeOpacity: options.strokeOpacity || 0.8,
    strokeWeight: options.strokeWeight || 3,
    strokeStyle: 'solid',
    strokeLineCap: 'round',
    strokeLineJoin: 'round',
    zIndex: options.zIndex || 50,
  });

  // 화살표 마커들을 생성
  const arrowMarkers: any[] = [];
  const arrowSize = options.arrowSize || 8;

  for (let i = 0; i < path.length - 1; i++) {
    const start = path[i];
    const end = path[i + 1];
    
    // 두 점 사이의 중점 계산
    const midLat = (start.lat() + end.lat()) / 2;
    const midLng = (start.lng() + end.lng()) / 2;
    const midPoint = new window.naver.maps.LatLng(midLat, midLng);
    
    // 방향 계산 (라디안)
    const deltaLat = end.lat() - start.lat();
    const deltaLng = end.lng() - start.lng();
    const angle = Math.atan2(deltaLat, deltaLng) * 180 / Math.PI;
    
    // 화살표 SVG 생성
    const arrowSvg = `
      <svg width="${arrowSize * 2}" height="${arrowSize * 2}" viewBox="0 0 ${arrowSize * 2} ${arrowSize * 2}" style="transform: rotate(${angle + 90}deg);">
        <polygon points="${arrowSize},2 ${arrowSize * 2 - 2},${arrowSize * 2 - 2} 2,${arrowSize * 2 - 2}" 
                 fill="${options.strokeColor || '#4285F4'}" 
                 stroke="white" 
                 stroke-width="1"/>
      </svg>
    `;
    
    const arrowMarker = new window.naver.maps.Marker({
      position: midPoint,
      map: map,
      icon: {
        content: arrowSvg,
        anchor: new window.naver.maps.Point(arrowSize, arrowSize)
      },
      zIndex: (options.zIndex || 50) + 10
    });
    
    arrowMarkers.push(arrowMarker);
  }

  return {
    polyline,
    arrowMarkers,
    setMap: (map: any) => {
      polyline.setMap(map);
      arrowMarkers.forEach(marker => marker.setMap(map));
    }
  };
};
