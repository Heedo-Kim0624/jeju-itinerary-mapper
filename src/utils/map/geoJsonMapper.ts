
/**
 * GeoJSON 노드와 장소 간의 매핑을 처리하는 유틸리티 함수들
 */

import { Place } from "@/types/supabase";

/**
 * 주어진 좌표와 가장 가까운 GeoJSON 노드를 찾습니다
 * @param nodes GeoJSON 노드 배열
 * @param lng 경도
 * @param lat 위도
 * @param maxDistance 최대 검색 거리 (미터 단위)
 * @returns 가장 가까운 노드 또는 null
 */
export const findNearestNode = (nodes: any[], lng: number, lat: number, maxDistance: number = 100): any | null => {
  if (!nodes || nodes.length === 0) {
    console.warn('GeoJSON 노드가 없습니다');
    return null;
  }

  let nearestNode = null;
  let minDistance = Number.MAX_VALUE;

  // 노드 순회
  for (const node of nodes) {
    try {
      // 노드의 좌표
      const nodeLng = node.geometry?.coordinates?.[0];
      const nodeLat = node.geometry?.coordinates?.[1];

      // 좌표 확인
      if (!nodeLng || !nodeLat) continue;

      // 거리 계산
      const distance = calculateHaversineDistance(
        lat, lng, 
        nodeLat, nodeLng
      );

      // 더 가까운 노드 발견하면 갱신
      if (distance < minDistance) {
        minDistance = distance;
        nearestNode = node;
      }
    } catch (error) {
      console.error('노드 처리 중 오류:', error);
    }
  }

  // 최대 거리 내에 있는 노드만 반환
  return minDistance <= maxDistance ? nearestNode : null;
};

/**
 * 장소 목록에 가장 가까운 GeoJSON 노드 ID를 추가합니다
 * @param places 장소 배열
 * @param nodes GeoJSON 노드 배열
 * @returns 노드 ID가 추가된 장소 배열
 */
export const mapPlacesToNodes = (places: Place[], nodes: any[]): Place[] => {
  if (!nodes || nodes.length === 0) {
    console.warn('GeoJSON 노드가 없어 매핑을 진행할 수 없습니다');
    return places;
  }

  console.log(`${places.length}개 장소와 ${nodes.length}개 GeoJSON 노드 매핑 시작`);

  return places.map(place => {
    const nearestNode = findNearestNode(nodes, place.x, place.y);
    
    return {
      ...place,
      geoNodeId: nearestNode?.properties?.node_id || null,
      geoNodeDistance: nearestNode ? calculateHaversineDistance(place.y, place.x, 
        nearestNode.geometry.coordinates[1], 
        nearestNode.geometry.coordinates[0]) : null
    };
  });
};

/**
 * 하버사인 공식을 사용하여 두 좌표 사이의 거리를 계산합니다 (미터 단위)
 * @param lat1 첫 번째 위치의 위도
 * @param lng1 첫 번째 위치의 경도
 * @param lat2 두 번째 위치의 위도
 * @param lng2 두 번째 위치의 경도
 * @returns 미터 단위의 거리
 */
export const calculateHaversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000; // 지구 반지름 (미터)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // 미터 단위 거리
};

/**
 * 두 GeoJSON 노드 사이의 경로를 찾습니다
 * @param startNodeId 시작 노드 ID
 * @param endNodeId 종료 노드 ID
 * @param nodes 전체 노드 목록
 * @param links 전체 링크 목록
 * @returns 경로를 구성하는 노드 ID 배열
 */
export const findPathBetweenNodes = (
  startNodeId: string,
  endNodeId: string,
  nodes: any[],
  links: any[]
): string[] => {
  // 실제 경로 탐색 알고리즘은 복잡하므로 간단한 구현으로 대체
  // 실제로는 다익스트라 또는 A* 알고리즘을 사용해야 함
  console.log(`${startNodeId}에서 ${endNodeId}까지의 경로 탐색`);
  
  // 노드 연결 정보 구성
  const nodeConnections: Record<string, string[]> = {};
  
  links.forEach(link => {
    try {
      const fromNode = link.properties?.from_node;
      const toNode = link.properties?.to_node;
      
      if (fromNode && toNode) {
        if (!nodeConnections[fromNode]) nodeConnections[fromNode] = [];
        if (!nodeConnections[toNode]) nodeConnections[toNode] = [];
        
        nodeConnections[fromNode].push(toNode);
        nodeConnections[toNode].push(fromNode); // 양방향 연결 가정
      }
    } catch (error) {
      console.error('링크 처리 중 오류:', error);
    }
  });
  
  // 현재는 임시로 두 노드만 포함하는 경로 반환
  return [startNodeId, endNodeId];
};

/**
 * 특정 장소 간의 경로를 시각화하기 위한 GeoJSON 링크 배열을 반환합니다
 */
export const getLinksForPath = (path: string[], links: any[]): any[] => {
  if (path.length < 2) return [];
  
  const pathLinks: any[] = [];
  
  // 경로의 각 인접한 노드 쌍 처리
  for (let i = 0; i < path.length - 1; i++) {
    const fromNode = path[i];
    const toNode = path[i + 1];
    
    // 해당 노드 쌍을 연결하는 링크 찾기
    const link = links.find(l => 
      (l.properties?.from_node === fromNode && l.properties?.to_node === toNode) ||
      (l.properties?.from_node === toNode && l.properties?.to_node === fromNode)
    );
    
    if (link) pathLinks.push(link);
  }
  
  return pathLinks;
};
