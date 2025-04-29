
import React from 'react';
import { Place } from '@/types/supabase';
import PlaceCard from '@/components/middlepanel/PlaceCard';
import { Skeleton } from '@/components/ui/skeleton';

interface PlaceListingViewProps {
  places: Place[];
  title: string;
  isLoading: boolean;
  selectedPlaces: Place[];
  onSelectPlace: (place: Place, checked: boolean) => void;
  onViewOnMap: (place: Place) => void;
}

const PlaceListingView: React.FC<PlaceListingViewProps> = ({
  places,
  title,
  isLoading,
  selectedPlaces,
  onSelectPlace,
  onViewOnMap
}) => {
  if (isLoading) {
    return (
      <div className="p-4">
        <h2 className="text-sm font-medium mb-3">{title}</h2>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="w-full h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-sm font-medium mb-3">{title}</h2>
        <p className="text-sm text-muted-foreground text-center py-4">
          장소가 없습니다.<br />
          다른 키워드나 지역을 선택해보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 border-b">
      <h2 className="text-sm font-medium mb-3">{title}</h2>
      <div className="space-y-2">
        {places.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            isSelected={selectedPlaces.some(p => p.id === place.id)}
            onSelect={onSelectPlace}
            onViewDetails={() => onViewOnMap(place)}
          />
        ))}
      </div>
    </div>
  );
};

export default PlaceListingView;
