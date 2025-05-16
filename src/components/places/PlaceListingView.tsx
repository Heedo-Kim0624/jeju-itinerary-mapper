
import React from 'react';
import { Place } from '@/types/supabase';
import { Checkbox } from '@/components/ui/checkbox';
import { MapIcon, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PlaceListingViewProps {
  title: string;
  places: Place[];
  isLoading: boolean;
  selectedPlaces: Place[];
  onSelectPlace: (place: Place, checked: boolean) => void;
  onViewDetails: (place: Place) => void;
  isPlaceSelected: (id: string | number) => boolean;
}

const PlaceListingView: React.FC<PlaceListingViewProps> = ({
  title,
  places,
  isLoading,
  onSelectPlace,
  onViewDetails,
  isPlaceSelected
}) => {
  if (isLoading) {
    return (
      <div className="p-4">
        <h3 className="text-md font-medium mb-2">{title}</h3>
        <div className="animate-pulse">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-md mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="p-4">
        <h3 className="text-md font-medium mb-2">{title}</h3>
        <div className="text-center py-4 text-gray-500">
          No places found
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-md font-medium mb-2">{title}</h3>
      <div className="space-y-2 mt-1">
        {places.map(place => (
          <div 
            key={place.id} 
            className={cn(
              "flex items-start p-2 border rounded-md",
              isPlaceSelected(place.id) ? "bg-primary/10 border-primary/30" : "bg-white border-gray-200"
            )}
          >
            <Checkbox 
              checked={isPlaceSelected(place.id)}
              onCheckedChange={(checked) => onSelectPlace(place, checked === true)}
              className="mt-1 mr-2"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{place.name}</p>
              <p className="text-xs text-gray-600 truncate">{place.address}</p>
              {place.categoryDetail && (
                <p className="text-xs text-gray-500">{place.categoryDetail}</p>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-8 h-8 ml-1" 
              onClick={() => onViewDetails(place)}
            >
              <Eye size={16} />
              <span className="sr-only">View details</span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaceListingView;
