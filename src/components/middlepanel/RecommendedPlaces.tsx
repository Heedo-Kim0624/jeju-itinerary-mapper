
import React from 'react';
import { Place } from '@/types/supabase';
import PlaceCard from './PlaceCard';
import { Skeleton } from '@/components/ui/skeleton';

interface RecommendedPlacesProps {
  places: Place[];
  loading: boolean;
  selectedPlaces: Place[];
  onSelectPlace: (place: Place, checked: boolean) => void;
  onViewDetails: (place: Place) => void;
}

const RecommendedPlaces: React.FC<RecommendedPlacesProps> = ({
  places,
  loading,
  selectedPlaces,
  onSelectPlace,
  onViewDetails,
}) => {
  if (loading) {
    return (
      <div className="p-4 space-y-2">
        <Skeleton className="w-1/2 h-5" />
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="w-full h-24" />
        ))}
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-sm font-medium mb-3">추천 장소</h2>
        <p className="text-sm text-muted-foreground">추천 장소가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="p-4 border-b">
      <h2 className="text-sm font-medium mb-3">추천 장소</h2>
      <div className="space-y-2">
        {places.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            isSelected={selectedPlaces.some(p => p.id === place.id)}
            onSelect={onSelectPlace}
            onViewDetails={() => onViewDetails(place)}
          />
        ))}
      </div>
    </div>
  );
};

export default RecommendedPlaces;
