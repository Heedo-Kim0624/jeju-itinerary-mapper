
import React from 'react';
import { ItineraryDay } from '@/types';
import ScheduleViewer from './ScheduleViewer';

interface ContainedScheduleViewerProps {
  itinerary: ItineraryDay[];
  selectedItineraryDay: number | null;
  onSelectDay: (day: number) => void;
  onClose: () => void;
  startDate: Date;
}

const ContainedScheduleViewer: React.FC<ContainedScheduleViewerProps> = ({
  itinerary,
  selectedItineraryDay,
  onSelectDay,
  onClose,
  startDate,
}) => {
  return (
    <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-40 shadow-md">
      <ScheduleViewer
        schedule={itinerary}
        selectedDay={selectedItineraryDay}
        onDaySelect={onSelectDay}
        onClose={onClose}
        startDate={startDate}
      />
    </div>
  );
};

export default ContainedScheduleViewer;
