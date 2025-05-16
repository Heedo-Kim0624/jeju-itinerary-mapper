
import React, { useEffect } from 'react';
import { SelectedPlace } from '@/types/supabase';
import { toast } from 'sonner';
import ItineraryPanel from './ItineraryPanel';
import { ScheduleLoadingIndicator } from './ScheduleLoadingIndicator';
import { useScheduleManagement } from '@/hooks/useScheduleManagement';

interface ScheduleGeneratorProps {
  selectedPlaces: SelectedPlace[];
  dates: { // 이 dates는 startDate, endDate, startTime, endTime 객체여야 함
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
  } | null;
  startDatetimeLocal: string | null; // ISO 대신 local 추가, 또는 startDatetimeISO 이름 유지하고 값을 로컬 포맷으로
  endDatetimeLocal: string | null;   // ISO 대신 local 추가
  onClose: () => void;
}

export const ScheduleGenerator: React.FC<ScheduleGeneratorProps> = ({
  selectedPlaces,
  dates,
  startDatetimeLocal, // props 이름 변경 또는 값 형식 변경
  endDatetimeLocal,   // props 이름 변경 또는 값 형식 변경
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
    dates, // useScheduleManagement가 이 dates 객체를 받아서 내부적으로 start/end datetime 문자열 생성하도록 수정할 수도 있음
    startDatetimeISO: startDatetimeLocal, // useScheduleManagement에는 startDatetimeISO로 전달
    endDatetimeISO: endDatetimeLocal,     // useScheduleManagement에는 endDatetimeISO로 전달
  });

  useEffect(() => {
    // startDatetimeLocal과 endDatetimeLocal로 조건 변경
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
    runScheduleGenerationProcess();
  }, [startDatetimeLocal, endDatetimeLocal, selectedPlaces, onClose, runScheduleGenerationProcess]); // 의존성 배열 업데이트

  if (isLoading) {
    return <ScheduleLoadingIndicator />;
  }

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
