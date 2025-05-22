
export const createNaverPolyline = (
  map: any,
  path: any[], // naver.maps.LatLng[]
  options: {
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    strokeStyle?: string;
    strokeLineCap?: string;
    strokeLineJoin?: string;
    clickable?: boolean;
    visible?: boolean;
    zIndex?: number;
  }
) => {
  if (!window.naver || !window.naver.maps) {
    console.error("Naver Maps API not initialized when creating polyline.");
    return null;
  }
  const polyline = new window.naver.maps.Polyline({
    map: map,
    path: path,
    strokeColor: options.strokeColor || '#000000',
    strokeOpacity: options.strokeOpacity || 0.8,
    strokeWeight: options.strokeWeight || 5,
    strokeStyle: options.strokeStyle || 'solid',
    strokeLineCap: options.strokeLineCap || 'round',
    strokeLineJoin: options.strokeLineJoin || 'round',
    clickable: options.clickable || true,
    visible: options.visible !== false,
    zIndex: options.zIndex || 0,
  });
  return polyline;
};

