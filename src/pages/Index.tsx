
import React, { useState, useEffect } from 'react';
import { ItineraryDay, Itinerary, ItineraryPlace, RouteData, convertToSupabaseItineraryDay } from '@/types/itinerary'; 
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

  const placeholderPlaceDetails: Omit<ItineraryPlace, 'id' | 'name' | 'category' | 'x' | 'y'> & { x?: number; y?: number } = {
    address: 'Placeholder Address',
    phone: 'Placeholder Phone',
    description: 'Placeholder Description',
    rating: 0,
    reviewCount: 0,
    image_url: 'https://via.placeholder.com/150',
    road_address: '', // Optional in ItineraryPlace
    homepage: '', // Optional in ItineraryPlace
  };
  

  const itineraryData: Itinerary = {
    id: '1',
    title: 'My Trip',
    schedule: [
      {
        day: 1,
        places: [
          { ...placeholderPlaceDetails, id: '1', name: 'Place 1', category: 'attraction', x: 126.97797, y: 37.56635, road_address: 'Road Address 1', homepage: 'http://example.com/place1' },
          { ...placeholderPlaceDetails, id: '2', name: 'Place 2', category: 'restaurant', x: 126.986, y: 37.561, road_address: 'Road Address 2', homepage: 'http://example.com/place2' },
        ],
        route: { nodeIds: ['node1', 'node2'], linkIds: ['link1'] }, 
        totalDistance: 10,
      },
      {
        day: 2,
        places: [
          { ...placeholderPlaceDetails, id: '3', name: 'Place 3', category: 'cafe', x: 127.001, y: 37.568, road_address: 'Road Address 3', homepage: 'http://example.com/place3' },
          { ...placeholderPlaceDetails, id: '4', name: 'Place 4', category: 'accommodation', x: 127.01, y: 37.55, road_address: 'Road Address 4', homepage: 'http://example.com/place4' },
        ],
        route: { nodeIds: ['node3', 'node4'], linkIds: ['link2'] }, 
        totalDistance: 15,
      },
    ],
    totalDays: 2,
  };

  useEffect(() => {
    const days: ItineraryDay[] = itineraryData?.schedule.map(day => convertToSupabaseItineraryDay(day)) || [];
    setItinerary(days);
  }, []);

  return (
    <div className="flex h-screen w-screen">
      <div className="w-80 flex-none">
        <TripContext.Provider value={{
          selectedPlaces: [], 
          setSelectedPlaces: () => {},
          dates: {}, // Should be { startDate: Date; endDate: Date } based on typical usage
          setDates: () => {} // Should match setDates in TripContext
        }}>
          {/* Use appropriate props for LeftPanel */}
          <LeftPanel />
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
