
import React from 'react';
import { Place } from '@/types/supabase';
import { cn } from '@/lib/utils';
import { MapPin, Star, ExternalLink, Instagram, Info } from 'lucide-react';
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
  // Ensure place ID is always treated as a number
  const normalizedPlace = {
    ...place,
    id: typeof place.id === 'string' ? parseInt(place.id, 10) : place.id
  };

  const handleCheckboxChange = (checked: boolean) => {
    onSelect(normalizedPlace, checked);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (onClick) {
      onClick();
    }
  };

  const handleViewDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails(normalizedPlace);
  };

  // Handle external links
  const handleExternalLinkClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div 
      className={cn(
        "bg-white p-3 rounded-md border cursor-pointer hover:shadow-md transition-shadow",
        isSelected ? "border-primary" : "border-gray-200"
      )}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-3">
        <Checkbox 
          checked={isSelected}
          onCheckedChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
          className="mt-1"
        />
        
        <div className="flex-1">
          <h4 className="font-medium text-sm">{place.name}</h4>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{place.address}</span>
          </div>
          
          {place.rating > 0 && (
            <div className="flex items-center gap-1 text-xs mt-1">
              <Star className="h-3 w-3 text-amber-500 flex-shrink-0" />
              <span>{place.rating.toFixed(1)}</span>
              {place.reviewCount > 0 && (
                <span className="text-muted-foreground">
                  ({place.reviewCount})
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-1">
            {place.naverLink && (
              <button 
                onClick={(e) => handleExternalLinkClick(e, place.naverLink)}
                className="text-xs text-blue-600 flex items-center"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                네이버
              </button>
            )}
            {place.instaLink && (
              <button 
                onClick={(e) => handleExternalLinkClick(e, place.instaLink)}
                className="text-xs text-purple-600 flex items-center"
              >
                <Instagram className="h-3 w-3 mr-1" />
                인스타
              </button>
            )}
          </div>
        </div>
        
        <button
          onClick={handleViewDetailsClick}
          className="text-xs text-blue-600 hover:underline whitespace-nowrap"
        >
          자세히
        </button>
      </div>
    </div>
  );
};

export default PlaceCard;
