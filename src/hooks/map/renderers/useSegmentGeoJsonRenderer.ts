
import { useCallback } from 'react';
// GeoJsonNodeFeature와 GeoCoordinates 타입을 import 합니다.
import type { GeoJsonNodeFeature, GeoCoordinates } from '@/components/rightpanel/geojson/GeoJsonTypes';
import type { SegmentRoute } from '@/types/schedule';
import { createNaverLatLng } from '@/utils/map/mapSetup';
import { fitBoundsToCoordinates } from '@/utils/map/mapViewControls';

const DEFAULT_ROUTE_COLOR = '#007bff';
const HIGHLIGHT_COLOR = '#ffc107'; // Standard highlight color

interface UseSegmentGeoJsonRendererProps {
  map: any;
  isNaverLoadedParam: boolean;
  geoJsonNodes: GeoJsonNodeFeature[]; // GeoJsonNodeFeature[] 사용
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
    if (!map || !isNaverLoadedParam || !route || !route.nodeIds || !route.linkIds) {
      console.warn('[SegmentGeoJsonRenderer] Cannot render GeoJSON route: invalid input or map not ready');
      return;
    }

    clearAllMapPolylines();

    // geoJsonNodes는 GeoJsonNodeFeature[] 타입입니다. properties는 GeoJsonNodeProperties 타입입니다.
    const routeNodes = route.nodeIds.map(nodeId => {
      return geoJsonNodes.find(node => String(node.properties.NODE_ID) === String(nodeId));
    }).filter(Boolean) as GeoJsonNodeFeature[]; // filter(Boolean) 후 타입 단언 유지

    if (routeNodes.length < 2) {
      console.warn('[SegmentGeoJsonRenderer] Not enough valid nodes to render GeoJSON route');
      return;
    }

    const coordinates = routeNodes.map(node => {
      // node는 GeoJsonNodeFeature 타입
      if (node.geometry.type === 'Point') {
        const geoCoords = node.geometry.coordinates as GeoCoordinates;
        if (geoCoords && typeof geoCoords[0] === 'number' && typeof geoCoords[1] === 'number') {
          return { lat: geoCoords[1], lng: geoCoords[0] };
        }
      }
      return null;
    }).filter(Boolean) as { lat: number; lng: number }[];

    if (coordinates.length < 2) {
      console.warn('[SegmentGeoJsonRenderer] Not enough valid coordinates to render GeoJSON route');
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

    if (!map || !isNaverLoadedParam || !segment || !segment.nodeIds || segment.nodeIds.length < 2) {
      return;
    }

    // geoJsonNodes는 GeoJsonNodeFeature[] 타입. properties는 GeoJsonNodeProperties
    const segmentNodes = segment.nodeIds.map(nodeId => {
      return geoJsonNodes.find(node => String(node.properties.NODE_ID) === String(nodeId));
    }).filter(Boolean) as GeoJsonNodeFeature[]; // filter(Boolean) 후 타입 단언 유지

    if (segmentNodes.length < 2) {
      console.warn('[SegmentGeoJsonRenderer] Not enough valid nodes to highlight segment');
      return;
    }

    const coordinates = segmentNodes.map(node => {
      // node는 GeoJsonNodeFeature 타입
      if (node.geometry.type === 'Point') {
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
