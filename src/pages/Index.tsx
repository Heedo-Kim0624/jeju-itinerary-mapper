import React from 'react';
import LeftPanel from '@/components/leftpanel/LeftPanel';
import RightPanel from '@/components/rightpanel/RightPanel';
import { usePlaces } from '@/hooks/use-places';
import { useItinerary } from '@/hooks/use-itinerary';

const Index: React.FC = () => {
  const { filteredPlaces, selectedPlace } = usePlaces();
  const { itinerary, selectedItineraryDay } = useItinerary();

  return (
    <div className="flex h-screen overflow-hidden bg-jeju-light-gray">
      <LeftPanel />
      <RightPanel
        places={filteredPlaces}
        selectedPlace={selectedPlace}
        itinerary={itinerary}
        selectedDay={selectedItineraryDay}
      />
    </div>
  );
};

export default Index;
