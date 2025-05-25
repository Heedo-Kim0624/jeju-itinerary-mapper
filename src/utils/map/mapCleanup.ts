
// @ts-nocheck
// TODO: map.js 관련 타입 정의 추가 필요

/**
 * Clears all markers from the map and returns an empty array
 */
export const clearMarkers = (markers: any[]) => {
  if (markers && markers.length > 0) {
    markers.forEach(marker => {
      if (marker && typeof marker.setMap === 'function') {
        marker.setMap(null);
      }
    });
  }
  return []; // Always return empty array
};

/**
 * Clears all polylines from the map and returns an empty array
 */
export const clearPolylines = (polylines: any[]) => {
  if (polylines && polylines.length > 0) {
    polylines.forEach(polyline => {
      if (polyline && typeof polyline.setMap === 'function') {
        polyline.setMap(null);
      }
    });
  }
  return []; // Always return empty array
};

/**
 * Clears all info windows from the map and returns an empty array
 */
export const clearInfoWindows = (infoWindows: any[]) => {
  if (infoWindows && infoWindows.length > 0) {
    infoWindows.forEach(infoWindow => {
      if (infoWindow && typeof infoWindow.close === 'function') {
        infoWindow.close(); // Close info window
      }
      if (infoWindow && typeof infoWindow.setMap === 'function') {
        infoWindow.setMap(null); // Remove from map (if needed)
      }
    });
  }
  return []; // Always return empty array
};

/**
 * Clears all map UI elements (markers, polylines, info windows, etc.)
 */
export const clearAllMapElements = (mapElements: {
  markers?: any[],
  polylines?: any[],
  infoWindows?: any[],
  overlays?: any[]
}) => {
  const { markers = [], polylines = [], infoWindows = [], overlays = [] } = mapElements;
  
  clearMarkers(markers);
  clearPolylines(polylines);
  clearInfoWindows(infoWindows);
  
  // Clear any custom overlays
  if (overlays && overlays.length > 0) {
    overlays.forEach(overlay => {
      if (overlay && typeof overlay.setMap === 'function') {
        overlay.setMap(null);
      }
    });
  }
  
  return {
    markers: [],
    polylines: [],
    infoWindows: [],
    overlays: []
  };
};
