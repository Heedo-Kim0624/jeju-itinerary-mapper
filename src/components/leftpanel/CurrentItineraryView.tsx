
import React from 'react';
import ItineraryView from './ItineraryView';
import { ItineraryDay } from '@/hooks/use-itinerary'; // Ensure this matches use-itinerary's export

interface CurrentItineraryViewProps {
  itinerary: ItineraryDay[];
  startDate: Date;
  onSelectDay: (day: number) => void;
  selectedItineraryDay: number | null;
  onClose: () => void;
  // For debug prop consistency with ItineraryView
  debugInfo?: {
    itineraryLength: number;
    selectedDay: number | null;
    showItinerary: boolean;
  };
}

const CurrentItineraryView: React.FC<CurrentItineraryViewProps> = ({
  itinerary,
  startDate,
  onSelectDay,
  selectedItineraryDay,
  onClose,
  debugInfo,
}) => {
  return (
    <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-40 shadow-md animate-slide-in-right">
      <ItineraryView
        itinerary={itinerary}
        startDate={startDate}
        onSelectDay={onSelectDay}
        selectedDay={selectedItineraryDay}
        onClose={onClose}
        debug={debugInfo}
      />
    </div>
  );
};

export default CurrentItineraryView;
