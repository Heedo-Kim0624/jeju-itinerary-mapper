import { useState, useEffect, useCallback } from 'react';
import { Place } from '@/types/supabase'; // ItineraryPlaceWithTime conflicts if Place is also imported from types/schedule
import { useItineraryCreator, ItineraryDay as CreatorItineraryDay } from './use-itinerary-creator';
import { toast } from 'sonner';

// Export ItineraryDay, ensuring it matches the type from use-itinerary-creator
export type ItineraryDay = CreatorItineraryDay;

export const useItinerary = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number | null>(null);
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  const [isItineraryCreated, setIsItineraryCreated] = useState<boolean>(false); // Keep this state
  
  const { createItinerary } = useItineraryCreator();

  const handleSelectItineraryDay = (day: number) => {
    setSelectedItineraryDay(day);
  };
  
  const generateItinerary = useCallback(async (payload: any): Promise<ItineraryDay[] | null> => {
    // This function's role might need to be re-evaluated based on useScheduleGenerationRunner.
    // For now, keeping its structure as it was, assuming it might be called from elsewhere or for different purposes.
    // However, the main schedule generation flow is now in useScheduleGenerationRunner.
    try {
      // This dynamic import might be problematic or not intended for the main flow.
      // The primary generation path is through useScheduleManagement -> useScheduleGenerationRunner.
      // const { generateSchedule } = await import('@/hooks/use-schedule-generator'); 
      // const scheduleGenerator = { generateSchedule: generateSchedule() }; // This instantiation is likely incorrect.
      // const serverItinerary = await scheduleGenerator.generateSchedule(payload);

      // Assuming this function is now more of a client-side fallback or direct invocation path
      // that bypasses the full useScheduleGenerationRunner flow.
      // If it's meant to be the primary client-side generation:
      if (!payload.placesToUse || !payload.startDate || !payload.endDate || !payload.startTime || !payload.endTime) {
          console.error("Client-side itinerary generation requires place and date/time info in payload.");
          toast.error("일정 생성에 필요한 정보가 부족합니다 (클라이언트).");
          return null;
      }
      const clientGeneratedItinerary = createItinerary(
          payload.placesToUse,
          payload.startDate,
          payload.endDate,
          payload.startTime,
          payload.endTime
      );

      if (!clientGeneratedItinerary || clientGeneratedItinerary.length === 0) {
        toast.error("클라이언트에서 일정을 생성할 수 없습니다.");
        return null;
      }
      
      return handleServerItineraryResponse(clientGeneratedItinerary); // Process it as if it came from a server
    } catch (error) {
      console.error("일정 생성 오류 (useItinerary - generateItinerary):", error);
      toast.error("일정 생성 중 오류가 발생했습니다 (useItinerary).");
      return null;
    }
  }, [createItinerary, /* handleServerItineraryResponse should be a dependency if used directly */]);
  
  const handleServerItineraryResponse = useCallback((serverItinerary: ItineraryDay[]) => {
    console.log("서버 일정 응답 처리 (useItinerary):", {
      일수: serverItinerary.length,
      첫날장소수: serverItinerary[0]?.places.length || 0
    });
    
    setItinerary(serverItinerary);
    setIsItineraryCreated(true); 
    
    if (serverItinerary.length > 0) {
      setSelectedItineraryDay(serverItinerary[0].day);
    }
    
    setShowItinerary(true); 
    
    console.log("일정 상태 업데이트 완료 (useItinerary):", {
      일정길이: serverItinerary.length,
      선택된일자: serverItinerary.length > 0 ? serverItinerary[0].day : null,
      일정패널표시: true,
      일정생성됨: true
    });
    
    return serverItinerary;
  }, []);
  
  useEffect(() => {
    const handleItineraryCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ itinerary: ItineraryDay[], selectedDay: number | null }>;
      // User requested specific log format
      console.log("[useItinerary] 'itineraryCreated' 이벤트 수신:", customEvent.detail);
      
      if (customEvent.detail.itinerary) {
        setItinerary(customEvent.detail.itinerary);
        setIsItineraryCreated(true);
        setShowItinerary(true);
        
        if (customEvent.detail.selectedDay !== null) {
          setSelectedItineraryDay(customEvent.detail.selectedDay);
        } else if (customEvent.detail.itinerary.length > 0) {
          setSelectedItineraryDay(customEvent.detail.itinerary[0].day);
        }
        
        // User requested specific log format
        console.log("[useItinerary] 이벤트에서 상태 업데이트:", {
          일정길이: customEvent.detail.itinerary.length,
          선택된일자: customEvent.detail.selectedDay || (customEvent.detail.itinerary.length > 0 ? customEvent.detail.itinerary[0].day : null),
          일정패널표시: true,
          일정생성됨: true
        });
        
        // 강제 리렌더링 이벤트 발생 (original had 0ms timeout, user snippet implies direct dispatch or short timeout)
        setTimeout(() => {
          console.log("[useItinerary] Dispatching forceRerender event");
          window.dispatchEvent(new Event('forceRerender'));
        }, 0); // Kept 0ms timeout
      }
    };
    
    window.addEventListener('itineraryCreated', handleItineraryCreated);
    
    return () => {
      window.removeEventListener('itineraryCreated', handleItineraryCreated);
    };
  }, []); // Dependencies: setItinerary, setIsItineraryCreated, setShowItinerary, setSelectedItineraryDay (or wrap them in useCallback)

  useEffect(() => {
    console.log("일정 관련 상태 변화 감지 (useItinerary):", {
      일정생성됨: isItineraryCreated,
      일정패널표시: showItinerary,
      선택된일자: selectedItineraryDay,
      일정길이: itinerary.length
    });
    
    if (itinerary.length > 0 && isItineraryCreated && !showItinerary) {
      console.log("[useItinerary] 일정이 생성되었으나 패널이 표시되지 않아 자동으로 활성화합니다.");
      setShowItinerary(true);
    }
    
    if (itinerary.length > 0 && isItineraryCreated && selectedItineraryDay === null) {
      console.log("[useItinerary] 일정이 생성되었으나 날짜가 선택되지 않아 첫 번째 날짜를 선택합니다.");
      setSelectedItineraryDay(itinerary[0].day);
    }
  }, [itinerary, showItinerary, selectedItineraryDay, isItineraryCreated]);

  return {
    itinerary,
    selectedItineraryDay,
    showItinerary,
    isItineraryCreated, // Expose this if LeftPanel needs it directly
    setItinerary,
    setSelectedItineraryDay,
    setShowItinerary,
    setIsItineraryCreated, // Expose this
    handleSelectItineraryDay,
    generateItinerary, // Expose if still needed
    handleServerItineraryResponse // Expose if still needed
  };
};
