
import React from 'react';
import { ExternalLink, MapPin, Star, MessageCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pagination } from './Pagination';

interface PlaceListProps {
  places: Place[];
  loading: boolean;
  onSelectPlace: (place: Place) => void;
  selectedPlace: Place | null;
  page: number;
  onPageChange: (page: number) => void;
  totalPages: number;
}

interface Place {
  id: string;
  name: string;
  address: string;
  operatingHours: string;
  naverLink: string;
  instaLink: string;
  rating: number;
  reviewCount: number;
  category: string;
  x: number;
  y: number;
}

const PlaceList: React.FC<PlaceListProps> = ({
  places,
  loading,
  onSelectPlace,
  selectedPlace,
  page,
  onPageChange,
  totalPages,
}) => {
  const handlePlaceClick = (place: Place) => {
    onSelectPlace(place);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="animate-pulse-gentle">
          <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 w-full bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
        <p>장소를 검색하거나 카테고리를 선택해주세요</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="text-sm text-muted-foreground mb-2">
        검색 결과: {places.length}개의 장소
      </div>
      
      <ScrollArea className="flex-1 overflow-y-auto pr-2 h-[calc(100%-60px)]">
        <div className="space-y-2">
          {places.map((place) => (
            <div
              key={place.id}
              className={`place-item p-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedPlace?.id === place.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => handlePlaceClick(place)}
            >
              <div className="flex items-start justify-between">
                <h3 className="font-medium">{place.name}</h3>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="h-3 w-3 fill-current" />
                  <span className="text-xs">{place.rating.toFixed(1)}</span>
                </div>
              </div>
              
              <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{place.address}</span>
              </div>
              
              <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                <Clock className="h-3 w-3" />
                <span>{place.operatingHours}</span>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageCircle className="h-3 w-3" />
                  <span>리뷰 {place.reviewCount}개</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {place.naverLink && (
                    <a
                      href={place.naverLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      네이버
                    </a>
                  )}
                  
                  {place.instaLink && (
                    <a
                      href={place.instaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-purple-500 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      인스타
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="mt-4 pt-2 border-t">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
};

export default PlaceList;
