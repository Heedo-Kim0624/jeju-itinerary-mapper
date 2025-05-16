
import React, { useEffect } from 'react';
import { SelectedPlace } from '@/types/supabase';
import { toast } from 'sonner';
import ItineraryPanel from './ItineraryPanel';
import { ScheduleLoadingIndicator } from './ScheduleLoadingIndicator';
import { useScheduleManagement } from '@/hooks/useScheduleManagement';

interface ScheduleGeneratorProps {
  selectedPlaces: SelectedPlace[];
  dates: {
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
  } | null;
  startDatetimeISO: string | null;
  endDatetimeISO: string | null;
  onClose: () => void;
}

export const ScheduleGenerator: React.FC<ScheduleGeneratorProps> = ({
  selectedPlaces,
  dates,
  startDatetimeISO,
  endDatetimeISO,
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
    startDatetimeISO,
    endDatetimeISO,
  });

  useEffect(() => {
    if (!startDatetimeISO || !endDatetimeISO) {
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
  }, [startDatetimeISO, endDatetimeISO, selectedPlaces, onClose, runScheduleGenerationProcess]);

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
