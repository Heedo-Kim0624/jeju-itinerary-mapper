
import React from 'react';
import { Place } from '@/types/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Star, PlusCircle, Info } from 'lucide-react';
import { formatDistance } from '@/utils/formatUtils';

interface CategoryResultPanelProps {
  category: string;
  recommendedPlaces: Place[];
  normalPlaces: Place[];
  selectedPlaces: Place[];
  onClose: () => void;
  onSelectPlace: (place: Place, selected: boolean) => void;
  onViewOnMap: (place: Place) => void;
  isSelected: (placeId: string) => boolean;
  isAccommodationLimitReached?: boolean;
}

export default function CategoryResultsPanel({
  category,
  recommendedPlaces,
  normalPlaces,
  selectedPlaces,
  onClose,
  onSelectPlace,
  onViewOnMap,
  isSelected,
  isAccommodationLimitReached = false
}: CategoryResultPanelProps) {
  const renderAddress = (place: Place) => {
    const road_address = place.road_address || '';
    const address = place.address || '';
    
    return (
      <div className="text-xs text-gray-500 mt-1">
        {road_address && <div>도로명: {road_address}</div>}
        {address && <div>지번: {address}</div>}
      </div>
    );
  };

  const isLimitReached = category === '숙소' && isAccommodationLimitReached;
  
  const renderPlaceItem = (place: Place, isRecommended: boolean = false) => {
    const alreadySelected = isSelected(place.id);
    
    return (
      <Card key={place.id} className={`p-3 mb-3 ${isRecommended ? 'border-blue-300 bg-blue-50' : ''}`}>
        <div className="flex justify-between">
          <div className="flex-1">
            <div className="font-medium flex items-center">
              <span className="flex-1">{place.name}</span>
              {isRecommended && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                  추천
                </span>
              )}
            </div>
            
            <div className="flex items-center text-xs text-gray-600 mt-1">
              <MapPin size={12} className="mr-1" />
              <span>{place.region || '제주도'}</span>
              {place.distance && (
                <span className="ml-2">{formatDistance(place.distance)}</span>
              )}
            </div>
            
            {place.rating && (
              <div className="flex items-center text-xs text-amber-600 mt-1">
                <Star size={12} className="mr-1 fill-amber-500" />
                <span>평점 {place.rating}/5</span>
                {place.review_count && (
                  <span className="text-gray-500 ml-1">({place.review_count}건)</span>
                )}
              </div>
            )}
            
            {renderAddress(place)}
          </div>
          
          <div className="flex flex-col ml-2">
            <Button 
              variant={alreadySelected ? "destructive" : "outline"} 
              size="sm"
              className="mb-2 px-2 h-8"
              disabled={!alreadySelected && isLimitReached}
              onClick={() => onSelectPlace(place, !alreadySelected)}
            >
              {alreadySelected ? '제거' : '선택'}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => onViewOnMap(place)}
            >
              지도
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-bold">{category} 장소 목록</h2>
        <button 
          onClick={onClose}
          className="text-sm text-blue-600 hover:underline"
        >
          뒤로
        </button>
      </div>
      
      {isLimitReached && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
          <div className="flex items-start">
            <Info size={16} className="mr-2 text-amber-500 mt-0.5" />
            <p className="text-sm text-amber-800">
              숙소는 여행 기간에 맞게 최대 한도까지만 선택할 수 있습니다.
            </p>
          </div>
        </div>
      )}
      
      <ScrollArea className="flex-1 p-4">
        {recommendedPlaces.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-medium mb-2 flex items-center">
              <PlusCircle size={16} className="mr-2 text-blue-500" />
              추천 장소
            </h3>
            <div>
              {recommendedPlaces.map(place => renderPlaceItem(place, true))}
            </div>
          </div>
        )}
        
        {normalPlaces.length > 0 && (
          <div>
            <h3 className="text-md font-medium mb-2">일반 장소</h3>
            <div>
              {normalPlaces.map(place => renderPlaceItem(place))}
            </div>
          </div>
        )}
        
        {recommendedPlaces.length === 0 && normalPlaces.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            <p>선택한 키워드에 맞는 장소가 없습니다.</p>
            <p className="mt-2">다른 키워드를 선택해보세요.</p>
          </div>
        )}
      </ScrollArea>
      
      <div className="p-4 border-t flex justify-between items-center bg-gray-50">
        <div className="text-sm">
          <span className="font-medium">선택됨: </span>
          <span>{selectedPlaces.filter(p => p.category?.toLowerCase() === category.toLowerCase()).length}개</span>
        </div>
        <Button onClick={onClose}>
          선택 완료
        </Button>
      </div>
    </div>
  );
}
