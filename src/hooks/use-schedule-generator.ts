
import { useState } from 'react';
import { Place, SelectedPlace } from '@/types/supabase';
import { toast } from 'sonner';
import { useItineraryCreator } from './use-itinerary-creator';
import { SchedulePayload, ServerScheduleResponse, ParsedRoute } from '@/types/schedule';

// 서버 URL 환경 변수에서 가져오기 (환경변수가 없으면 고정 URL 사용)
const SERVER_URL = process.env.VITE_SERVER_URL || "https://8011-34-91-44-214.ngrok-free.app";

export const useScheduleGenerator = () => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<Error | null>(null);
  const { createItinerary } = useItineraryCreator();
  
  /**
   * 서버에서 받은 interleaved_route 배열에서 장소 간 경로 세그먼트를 추출
   * @param interleavedRoute 서버에서 받은 노드-링크-노드-... 배열
   * @returns 출발지-도착지-링크 형태로 구성된 세그먼트 배열
   */
  const parseInterleavedRoute = (interleavedRoute?: (string | number)[]): ParsedRoute[] => {
    if (!interleavedRoute || interleavedRoute.length < 3) {
      console.warn("파싱할 경로 데이터가 없거나 불완전합니다.");
      return [];
    }
    
    const segments: ParsedRoute[] = [];
    let currentSegment: ParsedRoute = {
      from: interleavedRoute[0],
      to: "",
      links: []
    };
    
    let i = 1;
    // 노드-링크-노드-링크-... 패턴에서 각 세그먼트 추출
    while (i < interleavedRoute.length - 1) {
      // 링크 추가 (홀수 인덱스)
      if (i % 2 === 1) {
        currentSegment.links.push(interleavedRoute[i]);
      } 
      // 다음 노드가 새로운 세그먼트의 시작인 경우 (짝수 인덱스)
      else {
        currentSegment.to = interleavedRoute[i];
        segments.push({...currentSegment});
        
        // 새 세그먼트 시작 (현재 노드가 다음 세그먼트의 출발지)
        currentSegment = {
          from: interleavedRoute[i],
          to: "",
          links: []
        };
      }
      i++;
    }
    
    // 마지막 세그먼트 완성 (있는 경우)
    if (i === interleavedRoute.length - 1) {
      currentSegment.to = interleavedRoute[i];
      segments.push(currentSegment);
    }
    
    console.log(`[경로 파싱] ${segments.length}개의 경로 세그먼트 추출 완료`);
    return segments;
  };
  
  // 서버에 일정 생성 요청
  const generateSchedule = async (payload: SchedulePayload): Promise<ServerScheduleResponse | null> => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      console.log('[일정 생성] 서버 요청 URL:', SERVER_URL);
      console.log('[일정 생성] 서버에 일정 생성 요청 전송:', JSON.stringify(payload, null, 2));
      
      // 서버에 요청
      const response = await fetch(`${SERVER_URL}/generate-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`서버 오류 (${response.status}): ${errorText}`);
      }
      
      const data: ServerScheduleResponse = await response.json();
      console.log('[일정 생성] 서버로부터 받은 일정 데이터:', data);
      
      // 서버 응답에 route 데이터가 있는지 디버깅
      if (data.routes) {
        console.log('[일정 생성] 경로 데이터 포함:', 
          Object.keys(data.routes).length + '일치 경로 데이터 수신');
        
        // 샘플 경로 데이터 출력
        const firstRouteDay = Object.keys(data.routes)[0];
        if (firstRouteDay) {
          const firstRoute = data.routes[firstRouteDay];
          console.log(`[일정 생성] ${firstRouteDay}일차 경로 샘플:`, {
            nodeIds_길이: firstRoute.nodeIds?.length || 0,
            첫20개: firstRoute.nodeIds?.slice(0, 20) || []
          });
          
          // 경로 세그먼트 파싱 테스트
          if (firstRoute.interleaved_route) {
            const parsedSegments = parseInterleavedRoute(firstRoute.interleaved_route);
            console.log(`[일정 생성] ${firstRouteDay}일차 파싱된 경로:`, parsedSegments);
          }
        }
      } else {
        console.warn('[일정 생성] 경로 데이터 누락: 서버 응답에 routes 필드가 없습니다!');
      }
      
      return data;
    } catch (error) {
      console.error('[일정 생성] 오류 발생:', error);
      setGenerationError(error instanceof Error ? error : new Error('알 수 없는 오류'));
      toast.error('일정 생성에 실패했습니다.');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };
  
  return {
    generateSchedule,
    isGenerating,
    generationError,
    parseInterleavedRoute
  };
};
