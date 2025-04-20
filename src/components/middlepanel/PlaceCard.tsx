import React from 'react';
import { Star, MessageCircle, MapPin, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Place } from '@/types/supabase';

interface PlaceCardProps {
  place: Place;
  isSelected: boolean;
  onSelect: (place: Place, checked: boolean) => void;
  onClick: () => void;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ 
  place, 
  isSelected, 
  onSelect,
  onClick 
}) => {
  return (
    <Card className="overflow-hidden cursor-pointer">
      <CardContent className="p-3" onClick={onClick}>
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(place, checked === true)}
              onClick={(e) => e.stopPropagation()}
            />
            <h3 className="text-sm font-medium truncate">{place.name}</h3>
          </div>
          <div className="flex gap-1">
            {place.rating && (
              <div className="flex items-center gap-1 text-xs text-amber-500">
                <Star className="w-3 h-3" />
                {place.rating.toFixed(1)}
              </div>
            )}
            {place.reviewCount && (
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
          {place.categoryDetail && (
            <Badge variant="outline" className="mt-1 text-[10px] h-4 px-1">
              {place.categoryDetail}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlaceCard;
