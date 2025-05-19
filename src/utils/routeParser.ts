
import { ParsedRoute } from '@/types/schedule'; // 타입 경로 수정

// interleaved_route: [장소 NODE_ID, 링크 ID, 장소 NODE_ID, 링크 ID, ..., 장소 NODE_ID] (number[])
export const parseInterleavedRoute = (interleavedRoute: number[]): ParsedRoute[] => {
  const segments: ParsedRoute[] = [];
  if (!interleavedRoute || interleavedRoute.length < 1) return segments;

  // 최소 3개 요소 (장소-링크-장소) 부터 유효한 세그먼트
  for (let i = 0; i < interleavedRoute.length - 2; i += 2) {
    const fromNode = interleavedRoute[i];
    const linkId = interleavedRoute[i+1];
    const toNode = interleavedRoute[i+2];
    
    if (typeof fromNode === 'number' && typeof linkId === 'number' && typeof toNode === 'number') {
      segments.push({
        from: fromNode,
        links: [linkId], // 현재 구조에서는 한 세그먼트당 링크 하나로 가정
        to: toNode,
      });
    }
  }
  return segments;
};

export const extractAllNodesFromRoute = (interleavedRoute: (string | number)[]): (string | number)[] => {
  if (!interleavedRoute) return [];
  return interleavedRoute.filter((_, index) => index % 2 === 0);
};

export const extractAllLinksFromRoute = (interleavedRoute: (string | number)[]): (string | number)[] => {
  if (!interleavedRoute) return [];
  return interleavedRoute.filter((_, index) => index % 2 !== 0);
};
