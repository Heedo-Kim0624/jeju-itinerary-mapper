
import type { NewServerScheduleResponse, ServerScheduleItem, ServerRouteSummaryItem, Place } from '@/types/core';
import { usePlaceContext } from '@/contexts/PlaceContext'; // 장소 정보 가져오기 위해 추가

interface ParsedDayData {
  day: string; // "Mon", "Tue", ...
  placesScheduled: string[];
  nodeIds: string[];
  interleavedRoute: (string | number)[];
  totalDistanceM: number;
}

// Helper function to parse the main text block
function parseRouteLogText(logText: string): ParsedDayData[] {
  const dayBlocks = logText.split("--- 처리 중인 요일: ").slice(1);
  const finalSummarySection = logText.split("--- 최종 경로 요약 (요청하신 형식) ---")[1];
  const finalRoutes: Record<string, (string | number)[]> = {};

  if (finalSummarySection) {
    const daySummaries = finalSummarySection.trim().split("날짜: ").slice(1);
    daySummaries.forEach(summary => {
      const lines = summary.trim().split('\n');
      const day = lines[0].trim();
      const routeLine = lines.find(line => line.trim().startsWith("경로 :"));
      if (routeLine) {
        const routeString = routeLine.substring(routeLine.indexOf('[') + 1, routeLine.lastIndexOf(']'));
        finalRoutes[day] = routeString.split(',').map(id => {
          const numId = Number(id.trim());
          return isNaN(numId) ? id.trim() : numId; // 숫자로 변환 시도, 안되면 문자열 유지
        });
      }
    });
  }
  
  const parsedData: ParsedDayData[] = [];

  dayBlocks.forEach(block => {
    const lines = block.trim().split('\n');
    const day = lines[0].substring(0, lines[0].indexOf(" ---")).trim();
    
    let placesScheduled: string[] = [];
    const placesLine = lines.find(line => line.includes("경로 탐색 대상 장소:"));
    if (placesLine) {
      placesScheduled = JSON.parse(placesLine.substring(placesLine.indexOf('[')).replace(/'/g, '"'));
    }

    let nodeIds: string[] = [];
    const nodeIdsLine = lines.find(line => line.includes("경로 탐색 대상 NODE_IDs:"));
    if (nodeIdsLine) {
      // NODE_ID는 보통 숫자이므로, 문자열로 변환하여 저장
      nodeIds = JSON.parse(nodeIdsLine.substring(nodeIdsLine.indexOf('['))).map(String);
    }
    
    const distanceLine = lines.find(line => line.includes("요일 경로 계산 완료."));
    let totalDistanceM = 0;
    if (distanceLine) {
      const match = distanceLine.match(/총 거리: ([\d.]+)m/);
      if (match && match[1]) {
        totalDistanceM = parseFloat(match[1]);
      }
    }

    // 최종 요약의 interleaved_route 사용
    const interleavedRoute = finalRoutes[day] || [];

    parsedData.push({
      day,
      placesScheduled,
      nodeIds,
      interleavedRoute,
      totalDistanceM,
    });
  });

  return parsedData;
}


export function convertTextToMockServerResponse(logText: string, allPlacesMapByName: Map<string, Place>): NewServerScheduleResponse {
  const parsedDaysData = parseRouteLogText(logText);
  const schedule: ServerScheduleItem[] = [];
  const route_summary: ServerRouteSummaryItem[] = [];

  let placeDbIdCounter = 1000000000; // 임시 ID 생성용

  parsedDaysData.forEach((data, dayIndex) => {
    const dayAbbreviation = data.day.substring(0, 3); // "Mon", "Tue", etc.

    // Create ServerScheduleItem entries
    data.placesScheduled.forEach((placeName, placeIndex) => {
      const placeDetail = allPlacesMapByName.get(placeName);
      const placeNodeId = data.nodeIds[placeIndex] || String(placeDbIdCounter++); // Use mapped NODE_ID
      
      schedule.push({
        id: placeNodeId, // 여기서 숫자 ID를 문자열로 사용. 파서에서 String() 처리 필요
        time_block: `${dayAbbreviation}_${String(placeIndex + 1).padStart(2, '0')}`, // 예: Mon_01, Mon_02
        place_name: placeName,
        place_type: placeDetail?.category || 'unknown',
      });
    });

    // Create ServerRouteSummaryItem
    route_summary.push({
      day: dayAbbreviation,
      status: "성공",
      total_distance_m: data.totalDistanceM,
      places_scheduled: data.placesScheduled,
      places_routed: data.placesScheduled, // 동일하게 설정
      interleaved_route: data.interleavedRoute.map(id => typeof id === 'number' ? String(id) : id), // 모든 ID를 문자열로 변환
    });
  });
  
  // total_reward는 임의 값 또는 0으로 설정
  return {
    total_reward: 0,
    schedule,
    route_summary,
  };
}
