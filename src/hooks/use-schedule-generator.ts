
import { useCallback, useState } from 'react';
import { useItinerary } from './use-itinerary';
import { toast } from 'sonner';
import { SchedulePayload } from '@/types/schedule';
import { ensureCompatibleItineraryData } from '@/utils/typeCompatibility';

export const useScheduleGenerator = () => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const { 
    setItinerary, 
    setSelectedItineraryDay, 
    setShowItinerary, 
    setIsItineraryCreated 
  } = useItinerary();
  
  const generateSchedule = useCallback(async (payload: SchedulePayload) => {
    console.log("[use-schedule-generator] 일정 생성 요청 시작 (using /api/generate-itinerary)");
    setIsGenerating(true);
    
    try {
      console.log("[use-schedule-generator] 서버 요청 payload:", payload);
      
      const response = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      console.log("[use-schedule-generator] Server response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[use-schedule-generator] Server error (${response.status}): ${errorText}`);
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      console.log("[use-schedule-generator] Raw data from server:", data);
      
      if (!data) {
        console.error("[use-schedule-generator] 서버 응답 데이터가 없습니다.");
        toast.error("서버 응답 데이터가 없습니다.");
        return null;
      }
      
      // Ensure start_datetime is available for ensureCompatibleItineraryData
      if (!data.start_datetime && payload.start_datetime) {
        data.start_datetime = payload.start_datetime;
      }

      const processedItinerary = ensureCompatibleItineraryData(data);
      
      if (processedItinerary.length === 0) {
        console.error("[use-schedule-generator] 처리된 일정 데이터가 없습니다. 서버 응답은 받았으나 변환 실패.", data);
        toast.error("일정 데이터를 처리할 수 없습니다.");
        return data; // Return original data as per prompt
      }
      
      setItinerary(processedItinerary);
      
      if (processedItinerary.length > 0) {
        setSelectedItineraryDay(processedItinerary[0].day);
      }
      
      setShowItinerary(true);
      setIsItineraryCreated(true);
      
      const event = new CustomEvent('itineraryCreated', { 
        detail: { 
          itinerary: processedItinerary,
          selectedDay: processedItinerary.length > 0 ? processedItinerary[0].day : null
        } 
      });
      window.dispatchEvent(event);
      
      console.log("[use-schedule-generator] 일정 데이터가 메모리에 저장되었습니다:", processedItinerary);
      return data; // Return original server data as per prompt
    } catch (error) {
      console.error("[use-schedule-generator] 일정 생성 중 오류 발생:", error);
      toast.error(`일정 생성 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 문제'}`);
      return null;
    } finally {
      console.log("[use-schedule-generator] Entering finally block. Attempting to set isGenerating to false.");
      setIsGenerating(false);
      console.log("[use-schedule-generator] setIsGenerating(false) has been called in finally block.");
    }
  }, [
    setItinerary, 
    setSelectedItineraryDay, 
    setShowItinerary, 
    setIsItineraryCreated, 
    setIsGenerating // Add setIsGenerating to dependency array
  ]);
  
  return {
    generateSchedule,
    isGenerating
  };
};
