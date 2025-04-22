
import React, { useState } from 'react';
import { Star, MessageCircle, MapPin, Info, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Place } from '@/types/supabase';
import PlaceDetailDialog from './PlaceDetailDialog';
import { toast } from 'sonner';

interface PlaceListingViewProps {
  places: Place[];
  title: string;
  isLoading: boolean;
  selectedPlaces: Place[];
  onSelectPlace: (place: Place, selected: boolean) => void;
  onViewOnMap: (place: Place) => void;
}

const PlaceListingView: React.FC<PlaceListingViewProps> = ({
  places,
  title,
  isLoading,
  selectedPlaces,
  onSelectPlace,
  onViewOnMap
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [detailPlace, setDetailPlace] = useState<Place | null>(null);
  
  const placesPerPage = 8;
  const totalPages = Math.ceil(places.length / placesPerPage);
  const startIndex = (currentPage - 1) * placesPerPage;
  const currentPlaces = places.slice(startIndex, startIndex + placesPerPage);

  const isPlaceSelected = (placeId: string) => {
    return selectedPlaces.some(place => place.id === placeId);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSelectPlace = (place: Place) => {
    const isCurrentlySelected = isPlaceSelected(place.id);
    onSelectPlace(place, !isCurrentlySelected);
    
    if (!isCurrentlySelected) {
      toast.success(`${place.name} 장소가 추가되었습니다`);
    } else {
      toast.info(`${place.name} 장소가 제거되었습니다`);
    }
  };

  const handleViewDetails = (place: Place) => {
    setDetailPlace(place);
    onViewOnMap(place);
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
        <div className="flex flex-col gap-4 items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="text-sm text-gray-500">장소 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
        <div className="flex flex-col gap-2 items-center justify-center py-8 text-center">
          <p className="text-gray-500">장소 목록이 없습니다</p>
          <p className="text-sm text-gray-400">다른 키워드나 지역을 선택해보세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">{title}</h3>
        <span className="text-sm text-gray-500">총 {places.length}개 장소</span>
      </div>

      <div className="space-y-3">
        {currentPlaces.map(place => (
          <Card key={place.id} className="overflow-hidden border border-gray-200">
            <CardContent className="p-3">
              <div className="flex justify-between">
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => handleViewDetails(place)}
                >
                  <h3 className="font-medium text-sm">{place.name}</h3>
                </div>
                <Button 
                  variant={isPlaceSelected(place.id) ? "destructive" : "default"}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => handleSelectPlace(place)}
                >
                  {isPlaceSelected(place.id) ? (
                    <X className="w-3.5 h-3.5 mr-1" />
                  ) : (
                    <Check className="w-3.5 h-3.5 mr-1" />
                  )}
                  {isPlaceSelected(place.id) ? '취소' : '선택'}
                </Button>
              </div>

              <div className="mt-2">
                {place.address && (
                  <div className="flex items-start gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="truncate">{place.address}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center gap-2">
                  {place.rating !== undefined && (
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs font-medium">
                        {typeof place.rating === 'number' ? place.rating.toFixed(1) : place.rating}
                      </span>
                    </div>
                  )}
                  {place.reviewCount !== undefined && place.reviewCount > 0 && (
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{place.reviewCount}</span>
                    </div>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => handleViewDetails(place)}
                >
                  <Info className="w-3 h-3 mr-1" />
                  <span className="text-xs">자세히</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="h-7 w-7 p-0"
            >
              &lt;
            </Button>
            
            <span className="text-sm">
              {currentPage} / {totalPages}
            </span>
            
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="h-7 w-7 p-0"
            >
              &gt;
            </Button>
          </div>
        </div>
      )}

      {detailPlace && (
        <PlaceDetailDialog
          place={detailPlace}
          onClose={() => setDetailPlace(null)}
        />
      )}
    </div>
  );
};

export default PlaceListingView;
