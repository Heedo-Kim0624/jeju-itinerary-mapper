
import React from 'react';
import { Place } from '@/types/supabase';
import PlaceCard from '@/components/middlepanel/PlaceCard';
import { Skeleton } from '@/components/ui/skeleton';
import { sortByWeightDescending } from '@/lib/utils';

interface PlaceListingViewProps {
  places: Place[];
  title: string;
  isLoading: boolean;
  selectedPlaces: Place[];
  onSelectPlace: (place: Place, checked: boolean) => void;
  onViewOnMap: (place: Place) => void;
  isPlaceSelected?: (id: string | number) => boolean;
}

const PlaceListingView: React.FC<PlaceListingViewProps> = ({
  places,
  title,
  isLoading,
  selectedPlaces,
  onSelectPlace,
  onViewOnMap,
  isPlaceSelected
}) => {
  // 가중치(weight)를 기준으로 내림차순 정렬
  const sortedPlaces = sortByWeightDescending(places);

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

  if (sortedPlaces.length === 0) {
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

  const handlePlaceSelect = (place: Place, checked: boolean) => {
    onSelectPlace(place, checked);
  };

  return (
    <div className="p-4 border-b">
      <h2 className="text-sm font-medium mb-3">{title}</h2>
      <div className="space-y-2">
        {sortedPlaces.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            isSelected={isPlaceSelected ? isPlaceSelected(place.id) : selectedPlaces.some(p => p.id === place.id)}
            onSelect={(checked) => handlePlaceSelect(place, checked)}
            onViewDetails={() => onViewOnMap(place)}
          />
        ))}
      </div>
    </div>
  );
};

export default PlaceListingView;
