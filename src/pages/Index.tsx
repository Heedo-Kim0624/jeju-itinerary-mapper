
import React, { useState, useEffect } from 'react';
import { ItineraryDay, Itinerary, ItineraryPlace, RouteData } from '@/types/itinerary'; // ItineraryPlace and RouteData imported
import { Place } from '@/types/supabase'; // Keep this if Place is used directly anywhere, or rely on ItineraryPlace's extension
import LeftPanel from '@/components/leftpanel/LeftPanel';
import RightPanel from '@/components/rightpanel/RightPanel';
import { usePanelVisibility } from '@/hooks/use-panel-visibility';
import TripContext from '@/components/leftpanel/TripContext';

const Index: React.FC = () => {
  const [places, setPlaces] = useState<Place[]>([]); // This state might be for general places, not itinerary places
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const { showItinerary } = usePanelVisibility();

  // Dummy itinerary data (replace with actual data fetching)
  // Ensure ItineraryPlace includes all required fields from Place
  const placeholderPlaceDetails = {
    address: 'Placeholder Address',
    phone: 'Placeholder Phone',
    description: 'Placeholder Description',
    rating: 0,
    review_count: 0,
    image_url: 'https://via.placeholder.com/150',
    // Assuming x and y are longitude and latitude from the Place type in supabase.ts
    // If they are named differently (e.g., latitude, longitude), adjust accordingly.
    // The original dummy data used 'x' and 'y'.
  };

  const itineraryData: Itinerary = {
    id: '1',
    title: 'My Trip',
    schedule: [
      {
        day: 1,
        places: [
          { ...placeholderPlaceDetails, id: '1', name: 'Place 1', category: 'attraction', x: 126.97797, y: 37.56635 },
          { ...placeholderPlaceDetails, id: '2', name: 'Place 2', category: 'restaurant', x: 126.986, y: 37.561 },
        ],
        route: { nodeIds: ['node1', 'node2'], linkIds: ['link1'] }, // Example RouteData
        totalDistance: 10,
      },
      {
        day: 2,
        places: [
          { ...placeholderPlaceDetails, id: '3', name: 'Place 3', category: 'cafe', x: 127.001, y: 37.568 },
          { ...placeholderPlaceDetails, id: '4', name: 'Place 4', category: 'accommodation', x: 127.01, y: 37.55 },
        ],
        route: { nodeIds: ['node3', 'node4'], linkIds: ['link2'] }, // Example RouteData
        totalDistance: 15,
      },
    ],
    totalDays: 2,
  };

  useEffect(() => {
    // Simulate fetching itinerary data
    const days: ItineraryDay[] = itineraryData?.schedule.map(day => convertToSupabaseItineraryDay(day)) || [];
    setItinerary(days);
  }, []);

  return (
    <div className="flex h-screen w-screen">
      <div className="w-80 flex-none">
        <TripContext.Provider value={{
          selectedPlaces: [], // This seems to be SelectedPlace[] from TripContext
          setSelectedPlaces: () => {},
          dates: {},
          setDates: () => {}
        }}>
          {/* The props for LeftPanel were previously determined to be correct.
              If error TS2322 for LeftPanel persists, it might be a more complex issue
              or LeftPanel's actual props might have diverged from what was noted. */}
          <LeftPanel places={places} setPlaces={setPlaces} setSelectedPlace={setSelectedPlace} />
        </TripContext.Provider>
      </div>
      <div className="flex-grow">
        <RightPanel
          places={places} // These are general places
          selectedPlace={selectedPlace}
          itinerary={showItinerary ? itinerary : null} // itinerary is ItineraryDay[]
          selectedDay={selectedDay}
          selectedPlaces={[]} // This should match the type expected by RightPanel
        />
      </div>
    </div>
  );
};

export default Index;
