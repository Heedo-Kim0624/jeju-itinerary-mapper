
import React, { useEffect, useState } from 'react';
import { SelectedPlace } from '@/types/supabase';
import { toast } from 'sonner';
import ItineraryPanel from './ItineraryPanel';
import { ScheduleLoadingIndicator } from './ScheduleLoadingIndicator';
import { useScheduleManagement } from '@/hooks/useScheduleManagement';
import { Button } from '@/components/ui/button';

interface ScheduleGeneratorProps {
  selectedPlaces: SelectedPlace[];
  dates: {
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
  } | null;
  startDatetimeLocal: string | null;
  endDatetimeLocal: string | null;
  onClose: () => void;
}

export const ScheduleGenerator: React.FC<ScheduleGeneratorProps> = ({
  selectedPlaces,
  dates,
  startDatetimeLocal,
  endDatetimeLocal,
  onClose
}) => {
  // 렌더링 시도 카운터 추가
  const [renderCount, setRenderCount] = useState(0);
  // UI 강제 새로고침 트리거 추가
  const [forceRefresh, setForceRefresh] = useState(false);
  
  const {
    itinerary,
    selectedDay,
    isLoading,
    handleSelectDay,
    runScheduleGenerationProcess,
    renderTrigger // 추가: 렌더 트리거 수신
  } = useScheduleManagement({
    selectedPlaces,
    dates,
    startDatetime: startDatetimeLocal,
    endDatetime: endDatetimeLocal,
  });

  // 컴포넌트 렌더링 시마다 카운트 증가 (디버깅용)
  useEffect(() => {
    setRenderCount(prev => prev + 1);
    console.log(`[ScheduleGenerator] 컴포넌트 렌더링 (${renderCount}회)`);
  }, []);
  
  // 로딩 상태 변화 디버깅 로그
  useEffect(() => {
    console.log(`[ScheduleGenerator] 로딩 상태 변화 감지: ${isLoading ? '로딩 중' : '로딩 완료'}`, {
      renderTrigger,
      itineraryLength: itinerary.length,
      selectedDay
    });
    
    // 로딩이 완료되었으나 itinerary가 아직 없거나, 
    // 로딩은 완료되었으나 UI가 업데이트되지 않은 경우 강제 새로고침
    if (!isLoading && itinerary.length > 0 && !forceRefresh) {
      console.log("[ScheduleGenerator] 로딩 완료 및 일정 있음. UI 강제 새로고침 예약");
      // 약간의 지연 후 UI 강제 새로고침
      setTimeout(() => {
        setForceRefresh(true);
      }, 100);
    }
  }, [isLoading, itinerary.length, renderTrigger, forceRefresh]);

  // 초기 일정 생성 로직
  useEffect(() => {
    if (!startDatetimeLocal || !endDatetimeLocal) {
      toast.error("여행 날짜와 시간 정보가 올바르지 않아 일정을 생성할 수 없습니다.");
      onClose();
      return;
    }

    if (selectedPlaces.length === 0) {
      toast.error("선택된 장소가 없습니다.");
      onClose();
      return;
    }
    
    console.log("[ScheduleGenerator] 일정 생성 프로세스 시작 (useEffect dependency changed or initial run)");
    runScheduleGenerationProcess();
  }, [startDatetimeLocal, endDatetimeLocal, selectedPlaces, onClose, runScheduleGenerationProcess]);

  // 강제 새로고침으로 렌더링 문제 해결
  useEffect(() => {
    if (forceRefresh && itinerary.length > 0) {
      console.log("[ScheduleGenerator] UI 강제 새로고침 적용");
    }
  }, [forceRefresh, itinerary.length]);

  // 로딩 UI 조건 개선 (로딩 상태이고, 아직 itinerary가 없거나 강제 새로고침 전이면 로딩 표시)
  if (isLoading || (itinerary.length === 0 && !forceRefresh)) {
    console.log("[ScheduleGenerator] 로딩 인디케이터 렌더링: isLoading=", isLoading, 
      "itineraryLength=", itinerary.length, 
      "forceRefresh=", forceRefresh);
    return <ScheduleLoadingIndicator text="일정을 생성하는 중..." subtext="잠시만 기다려주세요" />;
  }

  console.log("[ScheduleGenerator] 로딩 종료 후 일정 확인: ", 
    "itineraryLength=", itinerary.length, 
    "forceRefresh=", forceRefresh);

  // 일정이 없는 경우 (로딩은 완료되었지만 데이터가 없는 경우)
  if (!itinerary || itinerary.length === 0) {
    console.log("[ScheduleGenerator] 빈 일정 상태 렌더링 (로딩 완료 but 데이터 없음)");
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <p className="text-lg font-medium text-center">일정이 생성되지 않았습니다.</p>
        <p className="text-sm text-muted-foreground mt-2 text-center">다른 장소나 날짜를 선택해보세요.</p>
        <Button onClick={onClose} variant="outline" className="mt-4">
          돌아가기
        </Button>
      </div>
    );
  }

  // 정상 일정 패널 렌더링
  const panelStartDate = dates?.startDate || new Date();

  console.log("[ScheduleGenerator] ItineraryPanel 렌더링:", { 
    itineraryLength: itinerary.length, 
    selectedDay: selectedDay,
    forceRefresh: forceRefresh
  });

  return (
    <ItineraryPanel 
      itinerary={itinerary} 
      startDate={panelStartDate}
      onSelectDay={handleSelectDay}
      onClose={onClose}
      selectedDay={selectedDay}
    />
  );
};
