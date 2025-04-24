
import React from 'react';
import { Star, MessageCircle, MapPin, Clock, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Place } from '@/types/supabase';

interface PlaceCardProps {
  place: Place;
  isSelected: boolean;
  onSelect: (place: Place, checked: boolean) => void;
  onClick: () => void;
  onViewDetails: () => void;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ 
  place, 
  isSelected, 
  onSelect,
  onClick,
  onViewDetails 
}) => {
  // Check if rating and reviewCount have valid values
  const hasRating = place.rating !== undefined && place.rating !== null && place.rating > 0;
  const hasReviews = place.reviewCount !== undefined && place.reviewCount !== null && place.reviewCount > 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(place, checked === true)}
              onClick={(e) => e.stopPropagation()}
            />
            <h3 
              className="text-sm font-medium truncate cursor-pointer"
              onClick={onClick}
            >
              {place.name}
            </h3>
          </div>
          <div className="flex gap-1">
            {hasRating && (
              <div className="flex items-center gap-1 text-xs text-amber-500">
                <Star className="w-3 h-3" />
                {typeof place.rating === 'number' ? place.rating.toFixed(1) : place.rating}
              </div>
            )}
            {hasReviews && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageCircle className="w-3 h-3" />
                {place.reviewCount}
              </div>
            )}
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          {place.address && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{place.address}</span>
            </div>
          )}
          {place.operatingHours && (
            <div className="flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" />
              {place.operatingHours}
            </div>
          )}
          
          <div className="flex justify-between items-center mt-2">
            {place.categoryDetail && (
              <Badge variant="outline" className="text-[10px] h-4 px-1">
                {place.categoryDetail}
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs ml-auto"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
            >
              <Info className="w-3 h-3 mr-1" />
              상세정보
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlaceCard;
