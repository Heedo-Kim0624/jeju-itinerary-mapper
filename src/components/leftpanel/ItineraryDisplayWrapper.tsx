
import React from 'react';
import { Button } from '@/components/ui/button';
import ItineraryView from './ItineraryView';
// Import the specific prop type from the consolidated types file
import type { ItineraryDisplayWrapperPassedProps } from '@/types/left-panel/index';

// Props are now directly from the imported interface
const ItineraryDisplayWrapper: React.FC<ItineraryDisplayWrapperPassedProps> = ({
  itinerary,
  startDate,
  onSelectDay,
  selectedDay,
  onCloseItinerary,
  handleClosePanelWithBackButton,
  debug, // This is now optional due to ItineraryDisplayWrapperPassedProps definition
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
        startDate={startDate}
        onSelectDay={onSelectDay}
        selectedDay={selectedDay}
        onClose={onCloseItinerary}
        // Debug prop for ItineraryView might need to be adjusted or made optional there too
        // For now, passing it if ItineraryDisplayWrapperProps.debug exists.
        debug={debug ? { ...debug } : undefined} 
      />
    </div>
  );
};

export default ItineraryDisplayWrapper;
