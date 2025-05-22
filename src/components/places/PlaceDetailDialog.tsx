
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, MapPin, Phone, Info, Calendar, Clock, Home, Instagram } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { ItineraryPlaceWithTime } from '@/types/core';
import { formatPhoneNumber } from '@/utils/stringUtils';

interface PlaceDetailDialogProps {
  place: ItineraryPlaceWithTime | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PlaceDetailDialog: React.FC<PlaceDetailDialogProps> = ({ place, open, onOpenChange }) => {
  if (!place) return null;

  // Function to format time block (e.g., "Tue_0900" -> "09:00")
  const formatTimeBlock = (timeBlock: string): string => {
    if (!timeBlock) return '';
    const timePart = timeBlock.split('_')[1];
    if (!timePart || timePart === '시작' || timePart === '끝') {
      return timePart || '';
    }
    
    // If it's just digits (e.g., "0900")
    if (/^\d+$/.test(timePart)) {
      const hours = timePart.substring(0, 2);
      const minutes = timePart.length > 2 ? timePart.substring(2, 4) : '00';
      return `${hours}:${minutes}`;
    }
    
    return timePart;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{place.name}</DialogTitle>
          <DialogDescription className="flex items-center text-sm mt-1">
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {place.category}
            </span>
            {place.timeBlock && (
              <span className="ml-2 inline-flex items-center text-xs">
                <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                {formatTimeBlock(place.timeBlock)}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {place.image_url && (
            <div className="w-full h-48 overflow-hidden rounded-md">
              <img 
                src={place.image_url} 
                alt={place.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
                }}
              />
            </div>
          )}

          <div className="space-y-2">
            {place.road_address && (
              <div className="flex items-start">
                <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm">{place.road_address}</span>
              </div>
            )}

            {place.phone && (
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                <span className="text-sm">{formatPhoneNumber(place.phone)}</span>
              </div>
            )}

            {(place.arriveTime || place.departTime) && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                <span className="text-sm">
                  {place.arriveTime && `도착: ${place.arriveTime}`}
                  {place.arriveTime && place.departTime && ' / '}
                  {place.departTime && `출발: ${place.departTime}`}
                </span>
              </div>
            )}

            {place.stayDuration && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                <span className="text-sm">체류 시간: {Math.floor(place.stayDuration / 60)}시간 {place.stayDuration % 60}분</span>
              </div>
            )}
          </div>

          {place.description && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium flex items-center mb-1">
                  <Info className="h-4 w-4 mr-1 text-muted-foreground" />
                  상세 정보
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{place.description}</p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          {place.homepage && (
            <Button 
              variant="outline" 
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => window.open(place.homepage, '_blank')}
            >
              <Home className="h-4 w-4 mr-2" />
              웹사이트
            </Button>
          )}

          {place.instaLink && (
            <Button 
              variant="outline" 
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => window.open(place.instaLink, '_blank')}
            >
              <Instagram className="h-4 w-4 mr-2" />
              인스타그램
            </Button>
          )}

          {place.naverLink && (
            <Button 
              variant="outline" 
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => window.open(place.naverLink, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              네이버 지도
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlaceDetailDialog;
