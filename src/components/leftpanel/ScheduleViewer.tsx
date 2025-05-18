import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { ItineraryDay } from '@/types/supabase';
import { format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { categoryColors, getCategoryName } from '@/utils/categoryColors';

interface ScheduleViewerProps {
  itinerary: ItineraryDay[];
  selectedDay: number | null;
  onDaySelect: (day: number) => void;
  startDate: Date;
  itineraryDay?: ItineraryDay | null;
  onClose?: () => void;
}

const ScheduleViewer: React.FC<ScheduleViewerProps> = ({
  itinerary,
  selectedDay,
  onDaySelect,
  startDate,
  itineraryDay,
  onClose
}) => {
  useEffect(() => {
    if (itineraryDay) {
      console.log(`[ScheduleViewer] Day ${itineraryDay.day} itinerary:`, itineraryDay);
    } else {
      console.log("[ScheduleViewer] No itinerary data for selected day.");
    }
  }, [itineraryDay]);

  const getDateForDay = (day: number) => {
    const date = addDays(new Date(startDate), day - 1);
    return format(date, 'yyyy년 MM월 dd일');
  };

  const getDayOfWeek = (day: number) => {
    const date = addDays(new Date(startDate), day - 1);
    return format(date, 'EEEE', { locale: ko });
  };

  if (!itinerary || itinerary.length === 0) {
    console.warn("[ScheduleViewer] No itinerary data available.");
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>일정이 없습니다.</p>
      </div>
    );
  }

  if (!itineraryDay) {
    console.warn(`[ScheduleViewer] No data for day ${selectedDay}`);
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>선택된 날짜에 해당하는 일정이 없습니다.</p>
      </div>
    );
  }

  const showSuccessMessage = () => {
    toast.success(`${itinerary.length}일에 대한 일정이 생성되었습니다.`);
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">
        {getDateForDay(itineraryDay.day)} ({getDayOfWeek(itineraryDay.day)})
      </h3>
      {itineraryDay.places && itineraryDay.places.length > 0 ? (
        <ul>
          {itineraryDay.places.map((place, index) => (
            <li key={index} className="mb-2 p-3 rounded-md shadow-sm">
              <div className="flex items-center gap-x-2">
                <span
                  className="inline-flex items-center justify-center rounded-full p-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-white"
                  style={{ backgroundColor: categoryColors[place.category]?.marker || '#808080' }}
                >
                  {index + 1}
                </span>
                <h4 className="text-sm font-medium">{place.name}</h4>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {getCategoryName(place.category)} | {place.formatted_address}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">이 날짜에는 계획된 장소가 없습니다.</p>
      )}
    </div>
  );
};

export default ScheduleViewer;
