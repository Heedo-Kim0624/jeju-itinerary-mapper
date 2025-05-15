
import React from 'react';
import { Place } from '@/types/supabase';
import { Star, MapPin, Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { formatAddress, formatDistance, formatReviewCount } from '@/utils/formatUtils';
import { categoryColors } from '@/utils/categoryColors';

interface CategoryResultsPanelProps {
  title: string;
  places: Place[];
  onPlaceSelect: (place: Place) => void;
  isLoading: boolean;
  onClose: () => void;
}

const CategoryResultsPanel: React.FC<CategoryResultsPanelProps> = ({
  title,
  places,
  onPlaceSelect,
  isLoading,
  onClose
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          onClick={onClose}
          className="text-sm text-blue-600 hover:underline"
        >
          ← 뒤로
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : places.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          선택한 조건에 맞는 장소가 없습니다.
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-1 gap-3 p-4">
            {places.map(place => (
              <div
                key={place.id}
                className="border rounded-md p-3 bg-white hover:border-primary transition-colors cursor-pointer"
                onClick={() => onPlaceSelect(place)}
              >
                <div className="font-medium">{place.name}</div>
                
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span className="truncate">{formatAddress(place.address)}</span>
                </div>
                
                <div className="flex items-center justify-between mt-2 text-xs">
                  <div className="flex items-center text-muted-foreground">
                    <Users className="w-3 h-3 mr-1" />
                    <span>{formatReviewCount(place.reviewCount)}</span>
                  </div>
                  
                  <div>
                    <span 
                      className={`px-2 py-0.5 rounded-full ${categoryColors[place.category]?.bg || 'bg-gray-100'} ${categoryColors[place.category]?.text || 'text-gray-800'}`}
                    >
                      {place.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default CategoryResultsPanel;
