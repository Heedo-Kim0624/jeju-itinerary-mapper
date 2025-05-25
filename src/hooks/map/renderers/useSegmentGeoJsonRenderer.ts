
import { useCallback } from 'react';
import type { GeoJsonFeature, GeoJsonNodeProperties, GeoCoordinates } from '@/components/rightpanel/geojson/GeoJsonTypes';
// SegmentRoute 타입을 types/core/route-data.ts 에서 가져옵니다.
import type { SegmentRoute } from '@/types/core/route-data';
import { createNaverLatLng } from '@/utils/map/mapSetup';
import { fitBoundsToCoordinates } from '@/utils/map/mapViewControls';

const DEFAULT_ROUTE_COLOR = '#007bff';
const HIGHLIGHT_COLOR = '#ffc107';

interface UseSegmentGeoJsonRendererProps {
  map: any;
  isNaverLoadedParam: boolean;
  geoJsonNodes: GeoJsonFeature[];
  addPolyline: (
    pathCoordinates: { lat: number; lng: number }[],
    color: string,
    weight?: number,
    opacity?: number,
    zIndex?: number
  ) => any | null;
  setHighlightedPolyline: (
    pathCoordinates: { lat: number; lng: number }[],
    color: string,
    weight?: number,
    opacity?: number,
    zIndex?: number
  ) => any | null;
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
  const renderGeoJsonSegmentRoute = useCallback((route: SegmentRoute) => {
    if (!map || !isNaverLoadedParam || !route || !route.from_node || !route.to_node) {
      console.warn('[SegmentGeoJsonRenderer] Cannot render GeoJSON route: invalid input or map not ready');
      return;
    }

    clearAllMapPolylines();

    // SegmentRoute는 from_node와 to_node를 가집니다. 이를 기반으로 노드를 찾습니다.
    const routeNodeIds = [route.from_node, route.to_node];

    const routeNodes = routeNodeIds.map(nodeId => {
      return geoJsonNodes.find(node => {
        const props = node.properties as GeoJsonNodeProperties;
        return String(props.NODE_ID) === String(nodeId);
      });
    }).filter(Boolean) as GeoJsonFeature[];

    if (routeNodes.length < 2) {
      console.warn('[SegmentGeoJsonRenderer] Not enough valid nodes to render GeoJSON route for segment');
      return;
    }

    // SegmentRoute의 links 속성을 사용하여 경로를 그릴 수도 있지만, 여기서는 노드 간 직접 연결로 가정합니다.
    // 만약 links를 사용해야 한다면, geoJsonLinks에서 해당 링크들을 찾아 좌표를 연결해야 합니다.
    // 현재는 from_node와 to_node를 직접 연결하는 것으로 간주합니다.
    const coordinates = routeNodes.map(node => {
      if (node && node.geometry.type === 'Point') {
        const geoCoords = node.geometry.coordinates as GeoCoordinates;
        if (geoCoords && typeof geoCoords[0] === 'number' && typeof geoCoords[1] === 'number') {
          return { lat: geoCoords[1], lng: geoCoords[0] };
        }
      }
      return null;
    }).filter(Boolean) as { lat: number; lng: number }[];

    if (coordinates.length < 2) {
      console.warn('[SegmentGeoJsonRenderer] Not enough valid coordinates to render GeoJSON route for segment');
      return;
    }

    addPolyline(coordinates, DEFAULT_ROUTE_COLOR);

    const naverCoords = coordinates.map(c => createNaverLatLng(c.lat, c.lng)).filter(c => c !== null) as any[];
    if (naverCoords.length > 0) {
      fitBoundsToCoordinates(map, naverCoords);
    }
  }, [map, isNaverLoadedParam, geoJsonNodes, addPolyline, clearAllMapPolylines]);

  const highlightGeoJsonSegment = useCallback((segment: SegmentRoute | null) => {
    clearHighlightedPolyline();

    if (!map || !isNaverLoadedParam || !segment || !segment.from_node || !segment.to_node) {
      return;
    }
    
    const segmentNodeIds = [segment.from_node, segment.to_node];

    const segmentNodes = segmentNodeIds.map(nodeId => {
      return geoJsonNodes.find(node => {
        const props = node.properties as GeoJsonNodeProperties;
        return String(props.NODE_ID) === String(nodeId);
      });
    }).filter(Boolean) as GeoJsonFeature[];

    if (segmentNodes.length < 2) {
      console.warn('[SegmentGeoJsonRenderer] Not enough valid nodes to highlight segment');
      return;
    }

    const coordinates = segmentNodes.map(node => {
      if (node && node.geometry.type === 'Point') {
        const geoCoords = node.geometry.coordinates as GeoCoordinates;
        if (geoCoords && typeof geoCoords[0] === 'number' && typeof geoCoords[1] === 'number') {
          return { lat: geoCoords[1], lng: geoCoords[0] };
        }
      }
      return null;
    }).filter(Boolean) as { lat: number; lng: number }[];

    if (coordinates.length < 2) {
      console.warn('[SegmentGeoJsonRenderer] Not enough valid coordinates to highlight segment');
      return;
    }

    setHighlightedPolyline(coordinates, HIGHLIGHT_COLOR, 6, 0.8, 200);

    const naverCoords = coordinates.map(c => createNaverLatLng(c.lat, c.lng)).filter(c => c !== null) as any[];
    if (naverCoords.length > 0) {
      fitBoundsToCoordinates(map, naverCoords);
    }
  }, [map, isNaverLoadedParam, geoJsonNodes, setHighlightedPolyline, clearHighlightedPolyline]);

  return { renderGeoJsonSegmentRoute, highlightGeoJsonSegment };
};
