
import React from 'react';
import { Button } from '@/components/ui/button';
import ItineraryView from './ItineraryView';
import type { ItineraryDay } from '@/types'; 

interface ItineraryDisplayWrapperProps {
  itinerary: ItineraryDay[];
  // startDate: Date; // startDate 제거
  onSelectDay: (day: number) => void;
  selectedDay: number | null;
  onCloseItinerary: () => void;
  handleClosePanelWithBackButton: () => void;
  debug: {
    itineraryLength: number;
    selectedDay: number | null;
    showItinerary: boolean;
  };
}

const ItineraryDisplayWrapper: React.FC<ItineraryDisplayWrapperProps> = ({
  itinerary,
  // startDate, // startDate 제거
  onSelectDay,
  selectedDay,
  onCloseItinerary,
  handleClosePanelWithBackButton,
  // debug, // debug prop도 ItineraryView에 전달되지 않으므로 제거 가능성 있음. 일단 유지.
}) => {
  return (
    <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-[60] shadow-lg">
      <div className="absolute top-2 right-2 z-10">
        <Button
          variant="ghost"
          onClick={handleClosePanelWithBackButton}
          className="rounded-full bg-white shadow-sm hover:bg-gray-100 text-blue-500 font-medium px-3 py-1 text-sm"
        >
          뒤로
        </Button>
      </div>
      <ItineraryView
        itinerary={itinerary}
        // startDate={startDate} // startDate 제거
        onSelectDay={onSelectDay}
        selectedDay={selectedDay}
        onClose={onCloseItinerary} // onClose는 ItineraryView에서 선택적이므로, 여기서 전달하는 것은 문제 없음
        // debug={debug} // ItineraryView는 debug prop을 받지 않음
      />
    </div>
  );
};

export default ItineraryDisplayWrapper;
