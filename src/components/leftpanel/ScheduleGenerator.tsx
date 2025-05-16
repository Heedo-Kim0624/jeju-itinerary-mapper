
import React, { useEffect } from 'react';
import { SelectedPlace } from '@/types/supabase';
import { toast } from 'sonner';
import ItineraryPanel from './ItineraryPanel'; // This likely renders ItineraryView
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
  startDatetimeLocal: string | null; // Changed from startDatetimeISO
  endDatetimeLocal: string | null;   // Changed from endDatetimeISO
  onClose: () => void;
}

export const ScheduleGenerator: React.FC<ScheduleGeneratorProps> = ({
  selectedPlaces,
  dates,
  startDatetimeLocal, // Changed
  endDatetimeLocal,   // Changed
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
    startDatetimeLocal, // Pass local formatted string
    endDatetimeLocal,   // Pass local formatted string
  });

  useEffect(() => {
    // This check is now more critical as preparePayload relies on these local strings
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
  }, [startDatetimeLocal, endDatetimeLocal, selectedPlaces, onClose, runScheduleGenerationProcess]);

  if (isLoading) {
    return <ScheduleLoadingIndicator />;
  }
  
  // If itinerary is empty after loading, it means generation failed or returned no data.
  // The toast for this is handled inside useScheduleManagement.
  // We might want a visual indicator here too, or ItineraryPanel can handle empty state.
  if (!isLoading && itinerary.length === 0) {
    // ItineraryPanel should ideally display a message for empty itinerary.
    // The error toast "⚠️ 선택한 장소 정보 또는 경로 계산이 부족하여 일정을 생성하지 못했습니다."
    // would have already been shown by useScheduleManagement.
    // So, ItineraryPanel needs to gracefully handle empty `itinerary`.
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

