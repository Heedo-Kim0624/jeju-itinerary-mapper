
import React from 'react';
import { Place } from '@/types/supabase';
import PlaceCard from './PlaceCard';
import { PlaceResult } from '@/types/travel';
import { convertToPlace } from '@/lib/jeju/travelPromptUtils';

interface RecommendedPlacesProps {
  places: PlaceResult[];
  selectedPlaces: Place[];
  onSelectPlace: (place: Place, checked: boolean) => void;
  onViewDetails: (place: Place) => void;
}

const RecommendedPlaces: React.FC<RecommendedPlacesProps> = ({
  places,
  selectedPlaces,
  onSelectPlace,
  onViewDetails,
}) => {
  if (!places.length) return null;

  return (
    <div className="mb-6">
      <h4 className="text-md font-medium mb-3">✨ 추천 장소</h4>
      <div className="space-y-2">
        {places.map(place => {
          const placeObj = convertToPlace(place);
          return (
            <PlaceCard
              key={place.id}
              place={placeObj}
              isSelected={selectedPlaces.some(p => p.id === place.id)}
              onSelect={onSelectPlace}
              onClick={() => onSelectPlace(placeObj, true)}
              onViewDetails={() => onViewDetails(placeObj)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default RecommendedPlaces;
