
import { ParsedRoute } from '@/types/schedule';

/**
 * 서버에서 받은 interleaved_route 배열에서 장소 간 경로 세그먼트를 추출
 * @param interleavedRoute 서버에서 받은 노드-링크-노드-... 배열
 * @returns 출발지-도착지-링크 형태로 구성된 세그먼트 배열
 */
export function parseInterleavedRoute(interleavedRoute: (string | number)[]): ParsedRoute[] {
  if (!interleavedRoute || interleavedRoute.length < 3) {
    console.warn('[parseInterleavedRoute] 경로 데이터가 너무 짧거나 없습니다.');
    return [];
  }
  
  // 첫 노드는 항상 NODE_ID
  const result: ParsedRoute[] = [];
  let currentSegment: { from: string; to: string; links: string[] } | null = null;
  
  // 경로에서 각 세그먼트(노드-링크-노드) 추출
  for (let i = 0; i < interleavedRoute.length; i++) {
    const current = String(interleavedRoute[i]);
    
    // 홀수 인덱스는 항상 링크, 짝수 인덱스는 항상 노드
    if (i % 2 === 0) { // 노드 (시작 또는 도착)
      if (i === 0) { // 첫 번째 노드는 첫 세그먼트의 출발지
        currentSegment = { from: current, to: '', links: [] };
      } else { // 그 이후 노드는 이전 세그먼트의 도착지이자 새 세그먼트의 출발지
        if (currentSegment) {
          currentSegment.to = current;
          result.push({ ...currentSegment });
          
          // 마지막 노드가 아니면 새 세그먼트 시작
          if (i < interleavedRoute.length - 1) {
            currentSegment = { from: current, to: '', links: [] };
          } else {
            currentSegment = null;
          }
        } else {
          console.warn(`[parseInterleavedRoute] 인덱스 ${i}에서 currentSegment가 null입니다.`);
        }
      }
    } else { // 링크
      if (currentSegment) {
        currentSegment.links.push(current);
      } else {
        console.warn(`[parseInterleavedRoute] 인덱스 ${i}에서 링크를 추가하려 했으나 currentSegment가 null입니다.`);
      }
    }
  }
  
  return result;
}

/**
 * interleaved_route 배열에서 모든 NODE_ID를 추출
 * @param interleavedRoute 서버에서 받은 노드-링크-노드-... 배열
 * @returns NODE_ID 배열
 */
export function extractAllNodesFromRoute(interleavedRoute: (string | number)[]): string[] {
  if (!interleavedRoute || interleavedRoute.length === 0) {
    console.warn('[extractAllNodesFromRoute] 경로 데이터가 없습니다.');
    return [];
  }
  
  const nodes: string[] = [];
  // 짝수 인덱스는 항상 노드
  for (let i = 0; i < interleavedRoute.length; i += 2) {
    nodes.push(String(interleavedRoute[i]));
  }
  
  return nodes;
}

/**
 * interleaved_route 배열에서 모든 LINK_ID를 추출
 * @param interleavedRoute 서버에서 받은 노드-링크-노드-... 배열
 * @returns LINK_ID 배열
 */
export function extractAllLinksFromRoute(interleavedRoute: (string | number)[]): string[] {
  if (!interleavedRoute || interleavedRoute.length < 3) {
    console.warn('[extractAllLinksFromRoute] 경로 데이터가 너무 짧거나 없습니다.');
    return [];
  }
  
  const links: string[] = [];
  // 홀수 인덱스는 항상 링크
  for (let i = 1; i < interleavedRoute.length; i += 2) {
    links.push(String(interleavedRoute[i]));
  }
  
  return links;
}
