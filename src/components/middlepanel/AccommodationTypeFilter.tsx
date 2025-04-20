
import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

type AccommodationType = 'all' | 'hotel' | 'pension';
type HotelStarRating = '3star' | '4star' | '5star';

interface AccommodationTypeFilterProps {
  selectedType: AccommodationType;
  onTypeChange: (type: AccommodationType) => void;
  selectedStarRatings: HotelStarRating[];
  onStarRatingChange: (rating: HotelStarRating) => void;
}

const AccommodationTypeFilter: React.FC<AccommodationTypeFilterProps> = ({
  selectedType,
  onTypeChange,
  selectedStarRatings,
  onStarRatingChange
}) => {
  return (
    <div className="mb-4 space-y-3">
      <div>
        <h3 className="text-sm font-medium mb-2">숙소 유형</h3>
        <div className="flex gap-2">
          <Button
            variant={selectedType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTypeChange('all')}
          >
            전체
          </Button>
          <Button
            variant={selectedType === 'hotel' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTypeChange('hotel')}
          >
            호텔
          </Button>
          <Button
            variant={selectedType === 'pension' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => onTypeChange('pension')}
          >
            펜션
          </Button>
        </div>
      </div>
      
      {selectedType === 'hotel' && (
        <div>
          <h3 className="text-sm font-medium mb-2">호텔 등급</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="3star"
                checked={selectedStarRatings.includes('3star')}
                onCheckedChange={() => onStarRatingChange('3star')}
              />
              <label 
                htmlFor="3star" 
                className="text-sm cursor-pointer"
              >
                3성급 이하
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="4star"
                checked={selectedStarRatings.includes('4star')}
                onCheckedChange={() => onStarRatingChange('4star')}
              />
              <label 
                htmlFor="4star" 
                className="text-sm cursor-pointer"
              >
                4성급
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="5star"
                checked={selectedStarRatings.includes('5star')}
                onCheckedChange={() => onStarRatingChange('5star')}
              />
              <label 
                htmlFor="5star" 
                className="text-sm cursor-pointer"
              >
                5성급
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccommodationTypeFilter;
