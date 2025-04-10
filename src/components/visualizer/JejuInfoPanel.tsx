
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Place } from '@/types/supabase';
import { ExternalLink, Map, Instagram, Clock, MapPin, Star } from 'lucide-react';

interface JejuInfoPanelProps {
  place: Place | null;
  onClose: () => void;
}

const JejuInfoPanel: React.FC<JejuInfoPanelProps> = ({ place, onClose }) => {
  if (!place) return null;
  
  return (
    <Card className="shadow-lg animate-fade-in">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{place.name}</span>
          <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
        </CardTitle>
        <CardDescription>
          <div className="flex items-center space-x-1">
            <MapPin className="h-3.5 w-3.5" />
            <span>{place.address}</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {place.operatingHours && (
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="h-4 w-4 text-gray-500" />
            <span>{place.operatingHours}</span>
          </div>
        )}
        
        {place.rating && (
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4 text-amber-500" />
            <span className="font-medium">{place.rating.toFixed(1)}</span>
            {place.reviewCount && (
              <span className="text-sm text-gray-500">({place.reviewCount})</span>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {place.naverLink && (
          <Button variant="outline" size="sm" onClick={() => window.open(place.naverLink, '_blank')}>
            <Map className="h-3.5 w-3.5 mr-1" />
            네이버 지도
          </Button>
        )}
        {place.instaLink && (
          <Button variant="outline" size="sm" onClick={() => window.open(place.instaLink, '_blank')}>
            <Instagram className="h-3.5 w-3.5 mr-1" />
            인스타그램
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default JejuInfoPanel;
