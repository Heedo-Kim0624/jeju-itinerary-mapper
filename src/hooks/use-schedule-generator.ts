
import { useState } from 'react';
import { Place } from '@/types/supabase';
import { toast } from 'sonner';

interface ScheduleGeneratorOptions {
  places: Place[];
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
}

interface ScheduleDay {
  day: number;
  places: Place[];
  totalDistance: number;
}

export const useScheduleGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSchedule = async (options: ScheduleGeneratorOptions): Promise<ScheduleDay[] | null> => {
    const { places, startDate, endDate, startTime, endTime } = options;
    
    if (places.length === 0) {
      setError('선택된 장소가 없습니다.');
      toast.error('선택된 장소가 없습니다.');
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // 서버 URL 변경
      const serverUrl = 'https://4bd1-34-80-234-13.ngrok-free.app';
      
      console.log('일정 생성 요청 전송:', {
        장소수: places.length,
        시작일: startDate,
        종료일: endDate,
        시작시간: startTime,
        종료시간: endTime
      });

      const response = await fetch(`${serverUrl}/generate-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          places: places.map(place => ({
            id: place.id,
            name: place.name,
            x: place.x,
            y: place.y,
            category: place.category,
            address: place.address,
            rating: place.rating || 0,
            visit_time: place.visit_time || 60, // 타입 문제 해결을 위한 fallback
          })),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          startTime,
          endTime,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '서버 응답 오류' }));
        throw new Error(errorData.message || '일정 생성 중 오류가 발생했습니다.');
      }

      const data = await response.json();
      console.log('일정 생성 결과:', data);

      if (!data.schedule || !Array.isArray(data.schedule) || data.schedule.length === 0) {
        throw new Error('유효한 일정을 생성할 수 없습니다.');
      }

      // 서버에서 받은 일정 데이터 변환
      const schedule: ScheduleDay[] = data.schedule.map((day: any) => ({
        day: day.day,
        places: day.places.map((placeId: string) => {
          const place = places.find(p => p.id === placeId);
          if (!place) {
            console.warn(`ID가 ${placeId}인 장소를 찾을 수 없습니다.`);
            return null;
          }
          return place;
        }).filter(Boolean),
        totalDistance: day.totalDistance || 0,
      }));

      return schedule;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      console.error('일정 생성 오류:', errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateSchedule,
    isGenerating,
    error,
  };
};
