
import type { ItineraryDay, NewServerScheduleResponse, ServerScheduleItem, ServerRouteSummaryItem } from '@/types/core';

// 일정 데이터 유효성 검사 함수
export const validateItineraryData = (itinerary: ItineraryDay[] | null): { valid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  if (!itinerary) {
    issues.push('일정 데이터가 null입니다.');
    return { valid: false, issues };
  }
  
  if (!Array.isArray(itinerary)) {
    issues.push(`일정 데이터가 배열이 아닙니다. 타입: ${typeof itinerary}`);
    return { valid: false, issues };
  }
  
  if (itinerary.length === 0) {
    // 빈 배열 자체는 유효할 수 있으므로, 이슈로 처리하지 않거나 경고 수준으로 처리할 수 있습니다.
    // 여기서는 일단 문제로 보지 않겠습니다. 필요시 활성화:
    // issues.push('일정 데이터가 빈 배열입니다.'); 
  }
  
  // 각 일자별 검증
  itinerary.forEach((day, index) => {
    if (!day) {
      issues.push(`${index + 1}번째 일자 데이터가 null 또는 undefined입니다.`);
      return;
    }
    
    // 필수 필드 검증
    if (typeof day.day !== 'number') {
      issues.push(`${index + 1}번째 일자의 day 필드가 숫자가 아닙니다: ${day.day}`);
    }
    
    if (!day.dayOfWeek) {
      issues.push(`${index + 1}번째 일자의 dayOfWeek 필드가 없습니다.`);
    }
    
    if (!day.date) {
      issues.push(`${index + 1}번째 일자의 date 필드가 없습니다.`);
    }
    
    if (!day.places || !Array.isArray(day.places)) {
      issues.push(`${index + 1}번째 일자의 places 필드가 배열이 아닙니다.`);
    } else { // 장소가 0개인 날도 유효할 수 있음
      // 장소 데이터 검증 (장소가 있을 경우에만)
      day.places.forEach((place, placeIndex) => {
        if (!place.id) {
          issues.push(`${index + 1}번째 일자의 ${placeIndex + 1}번째 장소의 id 필드가 없습니다.`);
        }
        if (!place.name) {
          issues.push(`${index + 1}번째 일자의 ${placeIndex + 1}번째 장소의 name 필드가 없습니다.`);
        }
        if (!place.category) {
          issues.push(`${index + 1}번째 일자의 ${placeIndex + 1}번째 장소의 category 필드가 없습니다.`);
        }
        // x, y 좌표는 선택적일 수 있으나, 지도 표시에 필요하므로 누락 시 경고 수준으로 처리 가능
        if (place.x === undefined || place.y === undefined) {
          issues.push(`${index + 1}번째 일자의 ${placeIndex + 1}번째 장소의 좌표(x, y) 정보가 없습니다.`);
        }
      });
    }
    
    if (!day.routeData) {
      issues.push(`${index + 1}번째 일자의 routeData 필드가 없습니다.`);
    } else {
      if (!Array.isArray(day.routeData.nodeIds)) {
        issues.push(`${index + 1}번째 일자의 routeData.nodeIds 필드가 배열이 아닙니다.`);
      }
      if (!Array.isArray(day.routeData.linkIds)) {
        issues.push(`${index + 1}번째 일자의 routeData.linkIds 필드가 배열이 아닙니다.`);
      }
    }
    
    if (!day.interleaved_route || !Array.isArray(day.interleaved_route)) {
      issues.push(`${index + 1}번째 일자의 interleaved_route 필드가 배열이 아닙니다.`);
    }
  });
  
  return { valid: issues.length === 0, issues };
};

// 일정 데이터 요약 함수
export const summarizeItineraryData = (itinerary: ItineraryDay[] | null): string => {
  if (!itinerary) return '일정 데이터가 null입니다.';
  if (!Array.isArray(itinerary)) return `일정 데이터가 배열이 아닙니다. 타입: ${typeof itinerary}`;
  if (itinerary.length === 0) return '일정 데이터가 빈 배열입니다.';
  
  const totalPlaces = itinerary.reduce((sum, day) => sum + (day.places?.length || 0), 0);
  const daysSummary = itinerary.map(day => {
    const placesCount = day.places?.length || 0;
    const categoryCounts: Record<string, number> = {};
    
    day.places?.forEach(place => {
      const category = place.category || 'unknown';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    const categoryStr = Object.entries(categoryCounts)
      .map(([category, count]) => `${category}=${count}개`)
      .join(', ');
    
    return `${day.day}일차 (${day.date} ${day.dayOfWeek}): ${placesCount}개 장소 (${categoryStr})`;
  }).join('\n');
  
  return `총 ${itinerary.length}일 일정, ${totalPlaces}개 장소\n${daysSummary}`;
};

// 서버 응답 데이터 요약 함수
export const summarizeServerResponse = (response: NewServerScheduleResponse | null): string => {
  if (!response) return '서버 응답이 null입니다.';
  
  const scheduleCount = response.schedule?.length || 0;
  const routeSummaryCount = response.route_summary?.length || 0;
  
  let result = `서버 응답: schedule=${scheduleCount}개 항목, route_summary=${routeSummaryCount}개 항목\n`;
  
  if (scheduleCount > 0) {
    const dayMap = new Map<string, number>();
    response.schedule.forEach((item: ServerScheduleItem) => {
      const day = item.time_block?.split('_')[0] || 'unknown';
      dayMap.set(day, (dayMap.get(day) || 0) + 1);
    });
    
    result += '일자별 schedule 항목 수:\n';
    dayMap.forEach((count, day) => {
      result += `- ${day}: ${count}개\n`;
    });
  }
  
  if (routeSummaryCount > 0) {
    result += '일자별 route_summary 정보:\n';
    response.route_summary.forEach((route: ServerRouteSummaryItem) => {
      result += `- ${route.day}: 총 거리 ${route.total_distance_m / 1000}km, interleaved_route ${route.interleaved_route?.length || 0}개 항목\n`;
    });
  }
  
  return result;
};

