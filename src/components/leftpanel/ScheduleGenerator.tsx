
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
  // 로딩 후 강제 리렌더링을 위한 상태
  const [forceRefresh, setForceRefresh] = useState(0);
  
  const {
    itinerary,
    selectedDay,
    isLoading,
    handleSelectDay,
    runScheduleGenerationProcess,
    renderTrigger
  } = useScheduleManagement({
    selectedPlaces,
    dates,
    startDatetime: startDatetimeLocal,
    endDatetime: endDatetimeLocal,
  });

  // useScheduleManagement의 renderTrigger 변경 시 강제 리렌더링
  useEffect(() => {
    console.log(`[ScheduleGenerator] renderTrigger changed to ${renderTrigger}, forcing refresh`);
    setForceRefresh(prev => prev + 1);
  }, [renderTrigger]);

  // 일정 생성 로직
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
    
    console.log("[ScheduleGenerator] 일정 생성 프로세스 시작");
    runScheduleGenerationProcess();
    
    // 안전장치: 10초 후에도 로딩 상태면 강제로 refresh
    const safetyTimer = setTimeout(() => {
      console.log("[ScheduleGenerator] 안전장치: 10초 타임아웃 트리거, 강제 리렌더링");
      setForceRefresh(prev => prev + 1);
    }, 10000);
    
    return () => clearTimeout(safetyTimer);
  }, [startDatetimeLocal, endDatetimeLocal, selectedPlaces, onClose, runScheduleGenerationProcess]);

  // 상태에 따른 조건부 로깅 (디버깅용)
  useEffect(() => {
    console.log(`[ScheduleGenerator] 상태 변화 감지:
      - isLoading: ${isLoading}
      - forceRefresh: ${forceRefresh}
      - itinerary.length: ${itinerary.length}
      - selectedDay: ${selectedDay}`);
  }, [isLoading, forceRefresh, itinerary, selectedDay]);

  // 일정 생성 중 로딩 표시
  if (isLoading) {
    console.log("[ScheduleGenerator] 로딩 상태 표시 중 (isLoading === true)");
    return <ScheduleLoadingIndicator text="일정을 생성하는 중..." subtext="잠시만 기다려주세요" />;
  }

  // 일정 데이터가 없는 경우 (생성 실패)
  if (!itinerary || itinerary.length === 0) {
    console.log("[ScheduleGenerator] 일정 없음: 빈 상태 표시");
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <p className="text-lg font-medium text-center">일정이 생성되지 않았습니다.</p>
        <p className="text-sm text-muted-foreground mt-2 text-center">다른 장소나 날짜를 선택해보세요.</p>
        <Button onClick={() => {
          console.log("[ScheduleGenerator] 돌아가기 버튼 클릭");
          onClose();
        }} variant="outline" className="mt-4">
          돌아가기
        </Button>
      </div>
    );
  }

  // 일정 생성 완료 - 일정 패널 표시
  console.log(`[ScheduleGenerator] 일정 표시: ${itinerary.length}일 일정, 선택된 날짜: ${selectedDay}`);
  const panelStartDate = dates?.startDate || new Date();

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
