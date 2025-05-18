
import React from 'react';

interface DevelopmentDebugInfoProps {
  showItinerary: boolean;
  itinerary: { day: number }[] | null; // Simplified itinerary type for debug
  selectedItineraryDay: number | null;
  // isGenerating: boolean; // Add if available and needed for debug
}

const DevelopmentDebugInfo: React.FC<DevelopmentDebugInfoProps> = ({
  showItinerary,
  itinerary,
  selectedItineraryDay,
  // isGenerating,
}) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded text-xs z-50">
      showItinerary: {showItinerary ? 'true' : 'false'}<br />
      itinerary: {itinerary ? `${itinerary.length}일` : 'null'}<br />
      selectedDay: {selectedItineraryDay || 'null'}<br />
      {/* isGenerating: {isGenerating ? 'true' : 'false'} */}
    </div>
  );
};

export default DevelopmentDebugInfo;
