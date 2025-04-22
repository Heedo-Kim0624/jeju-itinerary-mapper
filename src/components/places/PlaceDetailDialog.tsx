
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Star, ExternalLink, X } from 'lucide-react';
import { Place } from '@/types/supabase';

interface PlaceDetailDialogProps {
  place: Place;
  onClose: () => void;
}

const PlaceDetailDialog: React.FC<PlaceDetailDialogProps> = ({ place, onClose }) => {
  const handleNaverMapClick = () => {
    if (place.naverLink) {
      window.open(place.naverLink, '_blank', 'noopener,noreferrer');
    } else if (place.x && place.y) {
      // If no direct link is available, create one using coordinates
      const naverMapUrl = `https://map.naver.com/v5/search/${encodeURIComponent(place.name)}/place/${place.x},${place.y}`;
      window.open(naverMapUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleInstagramClick = () => {
    if (place.instaLink) {
      window.open(place.instaLink, '_blank', 'noopener,noreferrer');
    } else {
      // If no direct link, search for the place on Instagram
      const instagramSearchUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent(place.name)}/`;
      window.open(instagramSearchUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog open={!!place} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <DialogTitle className="text-lg">{place.name}</DialogTitle>
            <DialogClose className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100">
              <X className="h-4 w-4" />
            </DialogClose>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {/* Rating and Reviews */}
          {place.rating !== undefined && (
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="font-medium text-lg">
                {typeof place.rating === 'number' ? place.rating.toFixed(1) : place.rating}
              </span>
              {place.reviewCount !== undefined && place.reviewCount > 0 && (
                <span className="text-sm text-gray-500">({place.reviewCount} 리뷰)</span>
              )}
            </div>
          )}
          
          {/* Address */}
          {place.address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
              <div className="text-sm text-gray-700">{place.address}</div>
            </div>
          )}
          
          {/* External Links */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleNaverMapClick}
            >
              <ExternalLink className="h-4 w-4" />
              네이버 지도
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleInstagramClick}
            >
              <ExternalLink className="h-4 w-4" />
              인스타그램
            </Button>
          </div>
          
          {/* Coordinates */}
          {place.x && place.y && (
            <div className="border-t pt-3 mt-3">
              <p className="text-xs text-gray-500">
                위도: {place.y}, 경도: {place.x}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlaceDetailDialog;
