
import React, { useState, useEffect } from 'react';
import { Place } from '@/types/supabase';
import { toast } from 'sonner';
import { useItineraryCreator, ItineraryDay } from '@/hooks/use-itinerary-creator';
import ItineraryPanel from './ItineraryPanel';

interface ScheduleGeneratorProps {
  selectedPlaces: Place[];
  dates: {
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
  } | null;
  onClose: () => void;
}

export const ScheduleGenerator: React.FC<ScheduleGeneratorProps> = ({
  selectedPlaces,
  dates,
  onClose
}) => {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { createItinerary } = useItineraryCreator();

  useEffect(() => {
    if (!dates) {
      toast.error("여행 날짜와 시간 정보가 없습니다.");
      onClose();
      return;
    }

    if (selectedPlaces.length === 0) {
      toast.error("선택된 장소가 없습니다.");
      onClose();
      return;
    }

    generateSchedule();
  }, []);

  const generateSchedule = () => {
    if (!dates) return;
    
    try {
      setLoading(true);
      const generatedItinerary = createItinerary(
        selectedPlaces,
        dates.startDate,
        dates.endDate,
        dates.startTime,
        dates.endTime
      );
      
      setItinerary(generatedItinerary);
      
      // 첫 번째 일자 선택
      if (generatedItinerary.length > 0) {
        setSelectedDay(generatedItinerary[0].day);
      }
      
      toast.success("일정이 성공적으로 생성되었습니다!");
    } catch (error) {
      console.error("일정 생성 오류:", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-medium">일정을 생성하는 중...</p>
        <p className="text-sm text-muted-foreground mt-2">잠시만 기다려주세요</p>
      </div>
    );
  }

  return (
    <ItineraryPanel 
      itinerary={itinerary} 
      startDate={dates?.startDate || new Date()}
      onSelectDay={handleSelectDay}
      onClose={onClose}
      selectedDay={selectedDay}
    />
  );
}
