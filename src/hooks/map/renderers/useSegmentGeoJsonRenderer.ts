
import { useCallback } from 'react';
import type { SegmentRoute } from '@/types/core/route-data';
import type { GeoJsonNodeFeature } from '@/components/rightpanel/geojson/GeoJsonTypes';
import { createNaverLatLng } from '@/utils/map/mapSetup'; 

interface UseSegmentGeoJsonRendererProps {
  map: any;
  isNaverLoadedParam: boolean;
  geoJsonNodes: GeoJsonNodeFeature[];
  addPolyline: (path: any[], options: any) => any;
  setHighlightedPolyline: (path: any[], options: any) => void;
  clearHighlightedPolyline: () => void;
  clearAllMapPolylines: () => void;
}

export const useSegmentGeoJsonRenderer = ({
  map,
  isNaverLoadedParam,
  geoJsonNodes,
  addPolyline,
  setHighlightedPolyline,
  clearHighlightedPolyline,
  clearAllMapPolylines,
}: UseSegmentGeoJsonRendererProps) => {

  // GeoJSON 노드 ID로부터 실제 좌표를 찾는 유틸리티 함수
  const getNodeCoordinates = useCallback((nodeId: string): { lat: number; lng: number } | null => {
    const node = geoJsonNodes.find(n => n.id === nodeId);
    if (!node || !node.geometry || !node.geometry.coordinates) {
      console.warn(`[useSegmentGeoJsonRenderer] Node not found or geometry/coordinates missing for ID: ${nodeId}`);
      return null;
    }

    const coordsArray = node.geometry.coordinates;

    // 좌표가 [경도, 위도] 숫자 쌍인지 확인 (Point 지오메트리)
    if (Array.isArray(coordsArray) && 
        coordsArray.length === 2 &&
        typeof coordsArray[0] === 'number' &&
        typeof coordsArray[1] === 'number') {
      // GeoJSON 형식은 [경도, 위도] 순서이므로 반대로 반환
      return {
        lat: coordsArray[1], // 위도
        lng: coordsArray[0]  // 경도
      };
    } else {
      // 다른 지오메트리 타입(LineString, Polygon 등)이거나 예기치 않은 구조일 경우
      console.warn(`[useSegmentGeoJsonRenderer] Node ${nodeId} (type: ${node.geometry.type}) has unexpected coordinate structure. Expected a Point geometry. Coordinates:`, coordsArray);
      return null;
    }
  }, [geoJsonNodes]);

  // 특정 세그먼트 경로만 렌더링하는 함수
  const renderGeoJsonSegmentRoute = useCallback((segment: SegmentRoute) => {
    if (!map || !isNaverLoadedParam || !segment || !segment.nodeIds) {
      console.warn("[useSegmentGeoJsonRenderer] Cannot render segment: missing map, naver API, segment, or nodeIds.");
      return;
    }

    console.log(`[useSegmentGeoJsonRenderer] Rendering segment route from index ${segment.fromIndex} to ${segment.toIndex}`);
    
    const path: any[] = [];
    
    // 세그먼트의 노드 ID를 좌표로 변환
    segment.nodeIds.forEach(nodeId => {
      const coords = getNodeCoordinates(nodeId);
      if (coords) {
        const naverLatLng = createNaverLatLng(coords.lat, coords.lng);
        // 타입 안전성을 위해 naverLatLng가 유효한지 확인 후 추가
        if (naverLatLng && typeof naverLatLng === 'object') {
          path.push(naverLatLng);
        }
      }
    });

    if (path.length < 2) {
      console.warn(`[useSegmentGeoJsonRenderer] Not enough valid coordinates to draw segment ${segment.fromIndex}-${segment.toIndex}. Path length: ${path.length}`);
      return;
    }

    // 세그먼트 경로 추가
    addPolyline(path, {
      strokeColor: '#2563eb',
      strokeOpacity: 0.8,
      strokeWeight: 5
    });

  }, [map, isNaverLoadedParam, getNodeCoordinates, addPolyline]);

  // 특정 세그먼트를 하이라이트 표시하는 함수
  const highlightGeoJsonSegment = useCallback((segment: SegmentRoute | null) => {
    if (!map || !isNaverLoadedParam) {
      console.warn("[useSegmentGeoJsonRenderer] Cannot highlight segment: map not ready");
      return;
    }

    // 기존 하이라이트 제거
    clearHighlightedPolyline();

    if (!segment || !segment.nodeIds || segment.nodeIds.length < 2) {
      console.log("[useSegmentGeoJsonRenderer] No valid segment to highlight or clear.");
      return;
    }

    console.log(`[useSegmentGeoJsonRenderer] Highlighting segment from index ${segment.fromIndex} to ${segment.toIndex}`);
    
    const path: any[] = [];
    
    // 세그먼트의 노드 ID를 좌표로 변환
    segment.nodeIds.forEach(nodeId => {
      const coords = getNodeCoordinates(nodeId);
      if (coords) {
        const naverLatLng = createNaverLatLng(coords.lat, coords.lng);
        // 타입 안전성을 위해 naverLatLng가 유효한지 확인 후 추가
        if (naverLatLng && typeof naverLatLng === 'object') {
          path.push(naverLatLng);
        }
      }
    });

    if (path.length < 2) {
      console.warn(`[useSegmentGeoJsonRenderer] Not enough valid coordinates to highlight segment ${segment.fromIndex}-${segment.toIndex}. Path length: ${path.length}`);
      return;
    }

    // 하이라이트된 세그먼트를 다른 색상으로 표시
    setHighlightedPolyline(path, {
      strokeColor: '#f97316', // 하이라이트 색상 (주황색)
      strokeOpacity: 0.9,
      strokeWeight: 6
    });

  }, [map, isNaverLoadedParam, getNodeCoordinates, clearHighlightedPolyline, setHighlightedPolyline]);

  return {
    renderGeoJsonSegmentRoute,
    highlightGeoJsonSegment
  };
};
