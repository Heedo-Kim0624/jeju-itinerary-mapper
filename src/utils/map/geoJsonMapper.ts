
/**
 * GeoJSON 매핑 유틸리티
 * 장소와 GeoJSON 노드 간의 매핑 및 경로 탐색 기능 제공
 */

import { Place } from '@/types/supabase';

// 최대 검색 거리 (미터 단위)
const MAX_SEARCH_DISTANCE = 1000;

// 노드간 최단 경로 찾기 알고리즘에서의 최대 노드 수
const MAX_PATH_NODES = 500;

/**
 * 장소에서 가장 가까운 GeoJSON 노드를 찾아 매핑
 */
export const mapPlacesToNodes = (places: Place[], nodes?: any[]): Place[] => {
  if (!nodes || !nodes.length) {
    // 노드 데이터가 없으면 원본 장소 반환
    return places;
  }

  return places.map(place => {
    // 이미 매핑된 경우 다시 계산하지 않음
    if (place.geoNodeId) return place;

    const nearestNode = findNearestNode(place, nodes);
    if (nearestNode) {
      return {
        ...place,
        geoNodeId: nearestNode.nodeId,
        geoNodeDistance: nearestNode.distance
      };
    }
    return place;
  });
};

/**
 * 장소에서 가장 가까운 노드를 찾음
 */
export const findNearestNode = (place: Place, nodes: any[]) => {
  if (!place.x || !place.y || !nodes.length) return null;

  let minDistance = Infinity;
  let nearestNodeId = null;

  for (const node of nodes) {
    if (!node.geometry || !node.geometry.coordinates) continue;

    const [nodeLng, nodeLat] = node.geometry.coordinates;
    
    // 위/경도 간 거리 계산
    const distance = calculateDistance(
      place.y, place.x,
      nodeLat, nodeLng
    );

    if (distance < minDistance && distance <= MAX_SEARCH_DISTANCE) {
      minDistance = distance;
      nearestNodeId = node.properties?.id || null;
    }
  }

  return nearestNodeId ? { nodeId: nearestNodeId, distance: minDistance } : null;
};

/**
 * 위/경도 간 거리 계산 (Haversine 공식)
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // 지구 반경 (미터)
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 미터 단위 거리
};

/**
 * 두 노드 간의 최단 경로 찾기 (Dijkstra 알고리즘)
 */
export const findPathBetweenNodes = (
  startNodeId: string | number,
  endNodeId: string | number,
  nodes: any[],
  links: any[]
): (string | number)[] => {
  // 노드 ID 문자열로 통일
  const start = String(startNodeId);
  const end = String(endNodeId);
  
  // 노드 ID로 인접 리스트 생성
  const adjacencyList = createAdjacencyList(nodes, links);
  
  // 방문 여부 추적
  const visited = new Set<string>();
  
  // 거리 추적 (무한대로 초기화)
  const distances: Record<string, number> = {};
  
  // 경로 추적을 위한 이전 노드
  const previous: Record<string, string | null> = {};
  
  // 모든 노드 거리 초기화
  for (const nodeId of Object.keys(adjacencyList)) {
    distances[nodeId] = Infinity;
    previous[nodeId] = null;
  }
  
  // 시작 노드 거리는 0
  distances[start] = 0;
  
  // 처리할 노드 우선순위 큐 (단순 배열로 구현)
  const queue: string[] = [start];
  
  // 노드 수 제한 (무한 루프 방지)
  let nodeCount = 0;
  
  // 다익스트라 알고리즘 수행
  while (queue.length > 0 && nodeCount < MAX_PATH_NODES) {
    nodeCount++;
    
    // 현재 거리가 가장 짧은 노드 선택
    queue.sort((a, b) => distances[a] - distances[b]);
    const current = queue.shift()!;
    
    // 목적지 도달 시 종료
    if (current === end) break;
    
    // 이미 방문한 노드는 건너뛰기
    if (visited.has(current)) continue;
    
    // 노드 방문 처리
    visited.add(current);
    
    // 인접 노드 처리
    for (const neighbor of adjacencyList[current] || []) {
      // 이미 방문한 노드는 건너뛰기
      if (visited.has(neighbor.id)) continue;
      
      // 거리 계산
      const distance = distances[current] + neighbor.weight;
      
      // 더 짧은 경로 발견
      if (distance < distances[neighbor.id]) {
        distances[neighbor.id] = distance;
        previous[neighbor.id] = current;
        queue.push(neighbor.id);
      }
    }
  }
  
  // 경로 역추적
  const path: (string | number)[] = [];
  let current = end;
  
  // 경로가 없는 경우
  if (previous[end] === null && start !== end) {
    return [];
  }
  
  // 경로 구성
  while (current) {
    path.unshift(current);
    current = previous[current] || '';
    if (!current) break;
  }
  
  return path;
};

/**
 * 노드와 링크를 기반으로 인접 리스트 생성
 */
export const createAdjacencyList = (nodes: any[], links: any[]) => {
  const adjacencyList: Record<string, { id: string, weight: number }[]> = {};
  
  // 모든 노드 초기화
  for (const node of nodes) {
    if (node.properties?.id) {
      const nodeId = String(node.properties.id);
      adjacencyList[nodeId] = [];
    }
  }
  
  // 링크 정보로 인접 관계 추가
  for (const link of links) {
    const props = link.properties || {};
    const sourceId = String(props.from_node_id);
    const targetId = String(props.to_node_id);
    const weight = props.length || calculateLinkLength(link);
    
    // 양방향 연결 추가
    if (!adjacencyList[sourceId]) adjacencyList[sourceId] = [];
    if (!adjacencyList[targetId]) adjacencyList[targetId] = [];
    
    adjacencyList[sourceId].push({ id: targetId, weight });
    
    // 일방통행이 아닌 경우에만 반대 방향 추가
    if (props.oneway !== 'yes' && props.oneway !== 'YES') {
      adjacencyList[targetId].push({ id: sourceId, weight });
    }
  }
  
  return adjacencyList;
};

/**
 * 링크 길이 계산
 */
export const calculateLinkLength = (link: any): number => {
  if (!link.geometry || !link.geometry.coordinates || link.geometry.coordinates.length < 2) {
    return 0;
  }
  
  const coords = link.geometry.coordinates;
  let totalLength = 0;
  
  for (let i = 1; i < coords.length; i++) {
    const [prevLng, prevLat] = coords[i - 1];
    const [currLng, currLat] = coords[i];
    
    // 연속된 두 점 사이의 거리 계산
    const segmentLength = calculateDistance(prevLat, prevLng, currLat, currLng);
    totalLength += segmentLength;
  }
  
  return totalLength;
};

/**
 * 경로에 해당하는 링크 찾기
 */
export const getLinksForPath = (path: (string | number)[], links: any[]): any[] => {
  if (path.length < 2) return [];
  
  const pathLinks: any[] = [];
  
  // 경로의 각 연속된 두 노드에 대한 링크 찾기
  for (let i = 0; i < path.length - 1; i++) {
    const fromNodeId = path[i];
    const toNodeId = path[i + 1];
    
    // 해당하는 링크 찾기
    for (const link of links) {
      const props = link.properties || {};
      const linkFrom = String(props.from_node_id);
      const linkTo = String(props.to_node_id);
      
      if (
        (String(fromNodeId) === linkFrom && String(toNodeId) === linkTo) ||
        (String(fromNodeId) === linkTo && String(toNodeId) === linkFrom)
      ) {
        pathLinks.push(link);
        break;
      }
    }
  }
  
  return pathLinks;
};

/**
 * 경로 스타일 생성
 */
export const createPathStyle = (isHighlighted = false) => {
  return isHighlighted ? {
    strokeColor: '#FF3B30',  // 강조 경로 (붉은색)
    strokeWeight: 5,
    strokeOpacity: 0.8,
    strokeLineCap: 'round',
    strokeLineJoin: 'round'
  } : {
    strokeColor: '#3878FF',  // 일반 경로 (파란색)
    strokeWeight: 3,
    strokeOpacity: 0.6,
    strokeLineCap: 'round',
    strokeLineJoin: 'round'
  };
};
