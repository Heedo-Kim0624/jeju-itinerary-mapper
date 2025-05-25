
import { RouteData, SegmentRoute } from '@/types/core/route-data';
import type { ItineraryDay } from '@/types/core';

/**
 * interleaved_route 배열에서 nodeIds와 linkIds를 추출하여 RouteData 객체 생성
 * interleaved_route는 노드ID와 링크ID가 번갈아 나오는 배열입니다.
 */
export const convertInterleavedRouteToRouteData = (
  interleavedRoute: (string | number)[],
  day: number,
  routeId: string = `route_${day}_${Date.now()}`
): RouteData => {
  const nodeIds: string[] = [];
  const linkIds: string[] = [];
  
  if (!interleavedRoute || interleavedRoute.length === 0) {
    console.warn(`[routeDataConverter] Empty interleaved route for day ${day}`);
    return { nodeIds: [], linkIds: [], day, routeId };
  }
  
  // interleaved_route는 일반적으로 노드ID로 시작하고, 그 뒤에 링크ID가 있는 형태
  interleavedRoute.forEach((id, index) => {
    if (index % 2 === 0) {
      // 짝수 인덱스: 노드ID
      nodeIds.push(String(id));
    } else {
      // 홀수 인덱스: 링크ID
      linkIds.push(String(id));
    }
  });
  
  console.log(`[routeDataConverter] Converted interleaved route for day ${day}: ${nodeIds.length} nodes, ${linkIds.length} links`);
  
  return {
    nodeIds,
    linkIds,
    day,
    routeId
  };
};

/**
 * 일정 데이터의 경로 정보를 개별 세그먼트로 분할
 * 각 장소 사이의 경로를 별도의 세그먼트로 분리합니다.
 */
export const createRouteSegments = (routeData: RouteData, itineraryDay: ItineraryDay): SegmentRoute[] => {
  const { nodeIds, linkIds } = routeData;
  const places = itineraryDay.places || [];
  
  if (places.length < 2 || !nodeIds || nodeIds.length === 0) {
    console.warn('[routeDataConverter] Not enough places or node IDs to create segments');
    return [];
  }
  
  // 간단한 구현 (실제로는 더 복잡한 로직이 필요할 수 있음)
  // 이 예제에서는 하나의 전체 경로를 모든 장소 사이의 단일 세그먼트로 취급합니다.
  const segments: SegmentRoute[] = [{
    fromIndex: 0,
    toIndex: places.length - 1,
    nodeIds: [...nodeIds],
    linkIds: [...linkIds]
  }];
  
  return segments;
};

/**
 * 노드 ID와 GeoJSON 노드 데이터를 사용하여 경로 좌표 생성
 * 이 함수는 nodeId를 받아 해당 노드의 지리적 좌표를 반환합니다.
 */
export const getNodeCoordinates = (
  nodeId: string, 
  geoJsonNodes: any[]
): { lat: number; lng: number } | null => {
  const node = geoJsonNodes.find(n => n.id === nodeId);
  
  if (!node || !node.geometry || !node.geometry.coordinates) {
    return null;
  }
  
  // GeoJSON 좌표는 [경도, 위도] 형식이므로 변환
  return {
    lat: node.geometry.coordinates[1],
    lng: node.geometry.coordinates[0]
  };
};
