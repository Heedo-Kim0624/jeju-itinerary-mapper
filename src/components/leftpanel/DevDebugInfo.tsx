
import React from 'react';
import type { ItineraryDay } from '@/types';

interface DevDebugInfoProps {
  showItineraryHook: boolean;
  itineraryHook: ItineraryDay[] | null;
  selectedDayHook: number | null;
  isGeneratingPanel: boolean;
  itineraryReceivedPanel: boolean;
  tripStartDate: Date | null | undefined;
}

const DevDebugInfo: React.FC<DevDebugInfoProps> = ({
  showItineraryHook,
  itineraryHook,
  selectedDayHook,
  isGeneratingPanel,
  itineraryReceivedPanel,
  tripStartDate,
}) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded text-xs z-[100]">
      [Dev Debug Info]<br/>
      LP.showItinerary (Hook): {showItineraryHook ? 'true' : 'false'}<br />
      LP.itinerary (Hook): {itineraryHook ? `${itineraryHook.length}일 (${itineraryHook[0]?.places?.length || 0}곳)` : 'null'}<br />
      LP.selectedDay (Hook): {selectedDayHook || 'null'}<br />
      LP.isGenerating: {isGeneratingPanel ? 'true' : 'false'}<br />
      LP.itineraryReceived: {itineraryReceivedPanel ? 'true' : 'false'}<br />
      Trip Start: {tripStartDate?.toLocaleDateString() || 'N/A'}
    </div>
  );
};

export default DevDebugInfo;
