
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { DaySchedule } from '@/types/schedule';

interface ScheduleViewerProps {
  schedule: DaySchedule[];
  selectedDay: number | null;
  onDaySelect: (day: number) => void;
  onClose: () => void;
}

const ScheduleViewer: React.FC<ScheduleViewerProps> = ({
  schedule,
  selectedDay,
  onDaySelect,
  onClose
}) => {
  if (schedule.length === 0) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">생성된 여행 일정</h2>
        <button
          onClick={onClose}
          className="text-sm text-blue-600 hover:underline"
        >
          ← 뒤로
        </button>
      </div>

      <div className="flex overflow-x-auto p-2 border-b">
        {schedule.map((day) => (
          <Button
            key={day.day}
            variant={selectedDay === day.day ? "default" : "outline"}
            className="mx-1 whitespace-nowrap"
            onClick={() => onDaySelect(day.day)}
          >
            {day.day}일차
          </Button>
        ))}
      </div>

      <ScrollArea className="flex-1 p-4">
        {selectedDay !== null && schedule.find(d => d.day === selectedDay) ? (
          <div className="space-y-4">
            {schedule
              .find(d => d.day === selectedDay)
              ?.items.map((item, idx) => (
                <div key={idx} className="flex border rounded-lg overflow-hidden bg-white">
                  <div className="h-full bg-primary-100 flex items-center justify-center w-12 font-bold text-lg border-r">
                    {idx + 1}
                  </div>
                  <div className="p-3 flex-1">
                    <div className="font-medium">{item.place_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.time_block} • {translatePlaceType(item.place_type)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            일자를 선택해주세요
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

const translatePlaceType = (type: string): string => {
  const types: Record<string, string> = {
    'landmark': '관광지',
    'restaurant': '음식점',
    'cafe': '카페',
    'accommodation': '숙소'
  };
  return types[type] || type;
};

export default ScheduleViewer;
