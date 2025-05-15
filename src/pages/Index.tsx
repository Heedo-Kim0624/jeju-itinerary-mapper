import React, { useState, useEffect } from 'react';
import { ItineraryDay, Itinerary } from '@/types/itinerary';
import { Place } from '@/types/supabase';
import LeftPanel from '@/components/leftpanel/LeftPanel';
import RightPanel from '@/components/rightpanel/RightPanel';
import { usePanelVisibility } from '@/hooks/use-panel-visibility';
import TripContext from '@/components/leftpanel/TripContext';

const Index: React.FC = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const { showItinerary } = usePanelVisibility();

  // Dummy itinerary data (replace with actual data fetching)
  const itineraryData: Itinerary = {
    id: '1',
    title: 'My Trip',
    schedule: [
      {
        day: 1,
        places: [
          { id: '1', name: 'Place 1', category: 'attraction', x: 126.97797, y: 37.56635 },
          { id: '2', name: 'Place 2', category: 'restaurant', x: 126.986, y: 37.561 },
        ],
        totalDistance: 10,
      },
      {
        day: 2,
        places: [
          { id: '3', name: 'Place 3', category: 'cafe', x: 127.001, y: 37.568 },
          { id: '4', name: 'Place 4', category: 'accommodation', x: 127.01, y: 37.55 },
        ],
        totalDistance: 15,
      },
    ],
    totalDays: 2,
  };

  useEffect(() => {
    // Simulate fetching itinerary data
    const days: ItineraryDay[] = itineraryData?.schedule || [];
    setItinerary(days);
  }, []);

  return (
    <div className="flex h-screen w-screen">
      <div className="w-80 flex-none">
        <TripContext.Provider value={{
          selectedPlaces: [],
          setSelectedPlaces: () => {},
          dates: {},
          setDates: () => {}
        }}>
          <LeftPanel places={places} setPlaces={setPlaces} setSelectedPlace={setSelectedPlace} />
        </TripContext.Provider>
      </div>
      <div className="flex-grow">
        <RightPanel
          places={places}
          selectedPlace={selectedPlace}
          itinerary={showItinerary ? itinerary : null}
          selectedDay={selectedDay}
          selectedPlaces={[]}
        />
      </div>
    </div>
  );
};

export default Index;
