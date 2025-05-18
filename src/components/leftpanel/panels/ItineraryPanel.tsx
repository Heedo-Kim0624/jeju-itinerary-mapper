
import React from 'react';
import ItineraryView from '../ItineraryView';
import { ItineraryDay } from '@/hooks/use-itinerary';

interface ItineraryPanelProps {
  itinerary: ItineraryDay[] | null;
  selectedItineraryDay: number | null;
  startDate: Date | null;
  handleSelectItineraryDay: (day: number) => void;
  handleCloseItinerary: () => void;
  showItinerary: boolean;
}

const ItineraryPanel: React.FC<ItineraryPanelProps> = ({
  itinerary,
  selectedItineraryDay,
  startDate,
  handleSelectItineraryDay,
  handleCloseItinerary,
  showItinerary
}) => {
  if (!showItinerary) return null;

  return (
    <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-40 shadow-md">
      <ItineraryView
        itinerary={itinerary || []}
        startDate={startDate || new Date()}
        onSelectDay={handleSelectItineraryDay}
        selectedDay={selectedItineraryDay}
        onClose={handleCloseItinerary}
        debug={{
          itineraryLength: itinerary?.length || 0,
          selectedDay: selectedItineraryDay,
          showItinerary
        }}
      />
    </div>
  );
};

export default ItineraryPanel;
