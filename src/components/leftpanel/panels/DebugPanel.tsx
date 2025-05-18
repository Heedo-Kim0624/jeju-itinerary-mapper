
import React from 'react';
import { ItineraryDay } from '@/hooks/use-itinerary';

interface DebugPanelProps {
  showItinerary: boolean;
  itinerary: ItineraryDay[] | null;
  selectedItineraryDay: number | null;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ 
  showItinerary, 
  itinerary, 
  selectedItineraryDay 
}) => {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded text-xs z-50">
      showItinerary: {showItinerary ? 'true' : 'false'}<br />
      itinerary: {itinerary ? `${itinerary.length}일` : 'null'}<br />
      selectedDay: {selectedItineraryDay || 'null'} <br />
    </div>
  );
};

export default DebugPanel;
