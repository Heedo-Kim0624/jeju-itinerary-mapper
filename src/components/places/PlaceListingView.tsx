
import React from 'react';
import { Place } from '@/types/supabase';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PlaceListingViewProps {
  places: Place[];
  title?: string;
  isLoading?: boolean;
  selectedPlaces: Place[];
  onSelectPlace: (place: Place, checked: boolean) => void;
  onViewOnMap?: (place: Place) => void;
}

const PlaceListingView: React.FC<PlaceListingViewProps> = ({
  places,
  title = "장소 목록",
  isLoading = false,
  selectedPlaces,
  onSelectPlace,
  onViewOnMap
}) => {
  if (isLoading) {
    return (
      <div className="p-4">
        <h3 className="text-sm font-medium mb-3">{title}</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-md p-3 flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded" />
              <div className="flex-1">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="p-4">
        <h3 className="text-sm font-medium mb-3">{title}</h3>
        <div className="text-sm text-muted-foreground text-center py-6">
          장소가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-medium mb-3">{title}</h3>
      <div className="space-y-2">
        {places.map((place) => {
          const placeId = place.id.toString();
          // 확인을 위한 ID 문자열 변환
          const isSelected = selectedPlaces.some(p => p.id.toString() === placeId);
          
          return (
            <div
              key={placeId}
              className={cn(
                "border rounded-md p-3",
                isSelected ? "border-primary" : "border-border"
              )}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => onSelectPlace(place, !!checked)}
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{place.name}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{place.address}</span>
                  </div>
                  
                  {place.rating > 0 && (
                    <div className="flex items-center gap-1 text-xs mt-1">
                      <Star className="h-3 w-3 text-yellow-400" />
                      <span>{place.rating.toFixed(1)}</span>
                      {place.reviewCount > 0 && (
                        <span className="text-muted-foreground">
                          ({place.reviewCount})
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {onViewOnMap && (
                  <button
                    onClick={() => onViewOnMap(place)}
                    className="text-xs text-blue-500 hover:underline"
                  >
                    지도보기
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlaceListingView;
