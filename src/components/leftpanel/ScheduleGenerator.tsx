
import React from 'react';
import axios from 'axios';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Place } from '@/types/supabase';
import { toast } from 'sonner';

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

interface ScheduleItem {
  time_block: string;
  place_type: string;
  place_name: string;
}

export const ScheduleGenerator: React.FC<ScheduleGeneratorProps> = ({
  selectedPlaces,
  dates,
  onClose
}) => {
  const [schedule, setSchedule] = React.useState<ScheduleItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  const preparePayload = () => {
    if (!dates) {
      toast.error("여행 날짜와 시간을 먼저 선택해주세요.");
      return null;
    }

    // Split selected places into main selections and backup candidates
    const selected = selectedPlaces.filter(place => place.isSelected);
    const candidates = selectedPlaces.filter(place => place.isRecommended && !place.isSelected);

    return {
      selected_places: selected.map(place => ({
        id: Number(place.id),
        name: place.name
      })),
      candidate_places: candidates.map(place => ({
        id: Number(place.id),
        name: place.name
      })),
      start_datetime: new Date(dates.startDate.setHours(
        parseInt(dates.startTime.split(':')[0]),
        parseInt(dates.startTime.split(':')[1])
      )).toISOString(),
      end_datetime: new Date(dates.endDate.setHours(
        parseInt(dates.endTime.split(':')[0]),
        parseInt(dates.endTime.split(':')[1])
      )).toISOString()
    };
  };

  const generateSchedule = async () => {
    const payload = preparePayload();
    if (!payload) return;

    setLoading(true);
    try {
      const response = await axios.post(
        "https://80bb-34-75-100-175.ngrok-free.app/generate_schedule",
        payload
      );

      setSchedule(response.data.schedule);
      toast.success("일정이 성공적으로 생성되었습니다!");
    } catch (err) {
      console.error(err);
      toast.error("일정 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">일정 생성</h2>
        <button
          onClick={onClose}
          className="text-sm text-blue-600 hover:underline"
        >
          ← 뒤로
        </button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <button
          onClick={generateSchedule}
          disabled={loading}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md disabled:opacity-50"
        >
          {loading ? "생성 중..." : "일정 생성하기"}
        </button>

        {schedule.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">생성된 일정</h3>
            <div className="space-y-4">
              {schedule.map((item, idx) => (
                <div key={idx} className="p-4 bg-muted rounded-lg">
                  <div className="font-medium">{item.time_block}</div>
                  <div className="text-sm text-muted-foreground">{item.place_type}</div>
                  <div className="mt-1">{item.place_name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
