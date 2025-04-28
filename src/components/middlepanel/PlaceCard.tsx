
import React from 'react';
import { Place } from '@/types/supabase';
import { cn } from '@/lib/utils';
import { MapPin, Star } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface PlaceCardProps {
  place: Place;
  isSelected: boolean;
  onSelect: (place: Place, checked: boolean) => void;
  onClick?: () => void;
  onViewDetails: (place: Place) => void;
}

const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  isSelected,
  onSelect,
  onClick,
  onViewDetails,
}) => {
  const handleCheckboxChange = (checked: boolean) => {
    onSelect(place, checked);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // 이벤트 핸들링을 위한 클릭 처리
    e.stopPropagation(); // 이벤트 전파 방지
    
    if (onClick) {
      onClick();
    }
  };

  const handleViewDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 이벤트 전파 방지
    onViewDetails(place);
  };

  return (
    <div 
      className={cn(
        "bg-white p-3 rounded-md border cursor-pointer hover:shadow-md transition-shadow",
        isSelected ? "border-primary" : "border-gray-200"
      )}
      onClick={handleCardClick}
    >
      <div className="flex items-center gap-3">
        <Checkbox 
          checked={isSelected}
          onCheckedChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
        />
        
        <div className="flex-1">
          <h4 className="font-medium text-sm">{place.name}</h4>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{place.address}</span>
          </div>
          
          {place.rating ? (
            <div className="flex items-center gap-1 text-xs mt-1">
              <Star className="h-3 w-3 text-amber-500" />
              <span>{place.rating.toFixed(1)}</span>
              {place.reviewCount && (
                <span className="text-muted-foreground">
                  ({place.reviewCount})
                </span>
              )}
            </div>
          ) : null}
        </div>
        
        <button
          onClick={handleViewDetailsClick}
          className="text-xs text-blue-600 hover:underline"
        >
          자세히
        </button>
      </div>
    </div>
  );
};

export default PlaceCard;
