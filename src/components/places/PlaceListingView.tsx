
import React from 'react';
import { Place } from '@/types/supabase';
import PlaceCard from '../middlepanel/PlaceCard';

interface PlaceListingViewProps {
  places: Place[];
  title: string;
  isLoading: boolean;
  selectedPlaces: Place[];
  onSelectPlace: (place: Place, checked: boolean) => void;
  onViewOnMap: (place: Place) => void;
  isPlaceSelected: (id: string | number) => boolean;
}

const PlaceListingView: React.FC<PlaceListingViewProps> = ({
  places,
  title,
  isLoading,
  selectedPlaces,
  onSelectPlace,
  onViewOnMap,
  isPlaceSelected,
}) => {
  if (isLoading) {
    return (
      <div className="p-4">
        <h3 className="text-sm font-medium mb-3">{title}</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 h-24 rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!places || places.length === 0) {
    return null;
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-medium mb-3">{title}</h3>
      <div className="space-y-3">
        {places.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            isSelected={isPlaceSelected(place.id)}
            onSelect={(checked) => onSelectPlace(place, checked)}
            onClick={() => {}}
            onViewDetails={() => onViewOnMap(place)}
          />
        ))}
      </div>
    </div>
  );
};

export default PlaceListingView;
