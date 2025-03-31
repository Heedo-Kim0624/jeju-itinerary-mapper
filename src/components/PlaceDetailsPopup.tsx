
import React from 'react';
import { MapPin, Star, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlaceDetailsPopupProps {
  place: {
    name: string;
    address?: string;
    operatingHours?: string;
    rating?: number;
    reviewCount?: number;
    naverLink?: string;
    instaLink?: string;
    category: string;
  }
}

const PlaceDetailsPopup: React.FC<PlaceDetailsPopupProps> = ({ place }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-medium">{place.name}</h3>
      
      {place.address && (
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
          <span className="text-sm">{place.address}</span>
        </div>
      )}
      
      {place.operatingHours && (
        <div className="flex items-start gap-2">
          <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
          <span className="text-sm">{place.operatingHours}</span>
        </div>
      )}
      
      {place.rating && (
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-medium">{place.rating}</span>
          {place.reviewCount && (
            <span className="text-xs text-gray-500">({place.reviewCount} 리뷰)</span>
          )}
        </div>
      )}
      
      <div className="flex gap-2 mt-3">
        {place.naverLink && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open(place.naverLink, '_blank')}
            className="flex gap-1"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            네이버 지도
          </Button>
        )}
        
        {place.instaLink && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(place.instaLink, '_blank')}
            className="flex gap-1"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            인스타그램
          </Button>
        )}
      </div>
    </div>
  );
};

export default PlaceDetailsPopup;
