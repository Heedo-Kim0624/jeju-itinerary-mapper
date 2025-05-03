
import { useState } from 'react';
import axios from 'axios';
import { SchedulePayload, ScheduleItem, DaySchedule } from '@/types/schedule';
import { differenceInDays, parseISO, format } from 'date-fns';

export const useScheduleGenerator = () => {
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const generateSchedule = async (payload: SchedulePayload) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        "https://fa1c-34-75-244-221.ngrok-free.app/generate_schedule",
        payload
      );

      // Calculate number of days
      const days = differenceInDays(
        parseISO(payload.end_datetime),
        parseISO(payload.start_datetime)
      ) + 1;

      // Group schedule items by day
      const scheduleByDay: DaySchedule[] = Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        items: []
      }));

      // Sort items by time_block and group by day
      const sortedItems = [...response.data.schedule].sort((a, b) => 
        a.time_block.localeCompare(b.time_block)
      );

      // Distribute items into days (simplified version - you may need to adjust based on your actual data structure)
      sortedItems.forEach((item: ScheduleItem, index: number) => {
        const dayIndex = Math.floor(index / (sortedItems.length / days));
        if (scheduleByDay[dayIndex]) {
          scheduleByDay[dayIndex].items.push(item);
        }
      });

      setSchedule(scheduleByDay);
      setSelectedDay(1); // Select first day by default
    } catch (err) {
      console.error(err);
      setError("일정 생성에 실패했습니다.");
    }

    setLoading(false);
  };

  return {
    schedule,
    loading,
    error,
    selectedDay,
    setSelectedDay,
    generateSchedule
  };
};
