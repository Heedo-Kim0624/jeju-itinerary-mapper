
import React from 'react';
import { Place } from '@/types/supabase';
import PlaceCard from '@/components/middlepanel/PlaceCard';

interface PlaceListingViewProps {
  places: Place[];
  title: string;
  isLoading: boolean;
  selectedPlaces: Place[];
  onSelectPlace: (place: Place, checked: boolean) => void;
  onViewOnMap: (place: Place) => void; // This prop is kept on the interface for now
  isPlaceSelected: (id: string | number) => boolean;
}

const PlaceListingView: React.FC<PlaceListingViewProps> = ({
  places,
  title,
  isLoading,
  selectedPlaces,
  onSelectPlace,
  onViewOnMap, // Kept in destructuring, but not passed to PlaceCard if it doesn't accept it
  isPlaceSelected
}) => {
  if (isLoading) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-medium mb-3">{title}</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-24 bg-gray-200 animate-pulse rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!places || places.length === 0) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-medium mb-3">{title}</h3>
        <p className="text-gray-500">검색 결과가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-3">{title}</h3>
      <div className="space-y-4">
        {places.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            onSelect={onSelectPlace}
            // onViewOnMap prop is removed as PlaceCard does not seem to accept it based on the error.
            // If PlaceCard *should* have this, its own definition (read-only) needs an update.
            // For now, to fix the build error, we don't pass it.
            // The onViewOnMap function received by PlaceListingView can be used elsewhere if needed,
            // for example, by adding a separate button within PlaceListingView itself if desired.
            isSelected={isPlaceSelected(place.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default PlaceListingView;
