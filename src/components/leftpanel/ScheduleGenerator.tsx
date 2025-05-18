
import React, { useEffect } from 'react';
import { SelectedPlace } from '@/types/supabase';
import { toast } from 'sonner';
import ItineraryPanel from './ItineraryPanel';
import { ScheduleLoadingIndicator } from './ScheduleLoadingIndicator';
import { useScheduleManagement } from '@/hooks/useScheduleManagement';
import { Button } from '@/components/ui/button'; // Button 임포트 추가

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
  const {
    itinerary,
    selectedDay,
    isLoading,
    handleSelectDay,
    runScheduleGenerationProcess
  } = useScheduleManagement({
    selectedPlaces,
    dates,
    startDatetime: startDatetimeLocal,
    endDatetime: endDatetimeLocal,
  });

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
  }, [startDatetimeLocal, endDatetimeLocal, selectedPlaces, onClose, runScheduleGenerationProcess]);

  // 로딩 중이면 로딩 인디케이터 표시
  if (isLoading) {
    console.log("[ScheduleGenerator] 로딩 인디케이터 표시 중");
    return <ScheduleLoadingIndicator text="일정을 생성하는 중..." subtext="잠시만 기다려주세요" />;
  }

  // 일정이 없으면 오류 메시지와 함께 빈 상태 표시
  if (!itinerary || itinerary.length === 0) {
    console.log("[ScheduleGenerator] 일정이 없음");
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

  const panelStartDate = dates?.startDate || new Date();

  console.log("[ScheduleGenerator] 일정 패널 렌더링:", { 
    일수: itinerary.length, 
    선택된날짜: selectedDay 
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
