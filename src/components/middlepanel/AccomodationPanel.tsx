
import React, { useState } from 'react';
import BaseKeywordPanel from './common/BaseKeywordPanel';
import { KeywordOption } from '@/types/keyword';
import { Button } from '@/components/ui/button';
import { Hotel, Star } from 'lucide-react';

type AccommodationType = 'hotel' | 'pension' | null;
type HotelStarRating = '3star' | '4star' | '5star';

const defaultKeywords: KeywordOption[] = [
  { eng: 'kind_service', kr: '친절해요' },
  { eng: 'cleanliness', kr: '깨끗해요' },
  { eng: 'good_view', kr: '뷰가 좋아요' },
  { eng: 'quiet_and_relax', kr: '조용히 쉬기 좋아요' },
  { eng: 'good_bedding', kr: '침구가 좋아요' },
  { eng: 'stylish_interior', kr: '인테리어가 멋져요' },
  { eng: 'good_aircon_heating', kr: '냉난방이 잘돼요' },
  { eng: 'well_equipped_bathroom', kr: '화장실이 잘 되어 있어요' },
  { eng: 'good_breakfast', kr: '조식이 맛있어요' },
  { eng: 'easy_parking', kr: '주차하기 편해요' },
];

const AccomodationPanel: React.FC<{
  selectedKeywords: string[];
  onToggleKeyword: (keyword: string) => void;
  directInputValue: string;
  onDirectInputChange: (value: string) => void;
  onConfirmAccomodation: (finalKeywords: string[]) => void;
  onClose: () => void;
}> = ({
  selectedKeywords,
  onToggleKeyword,
  directInputValue,
  onDirectInputChange,
  onConfirmAccomodation,
  onClose,
}) => {
  const [selectedAccommodationType, setSelectedAccommodationType] = useState<AccommodationType>(null);
  const [selectedStarRatings, setSelectedStarRatings] = useState<HotelStarRating[]>([]);

  const handleAccommodationTypeSelect = (type: AccommodationType) => {
    setSelectedAccommodationType(type);
    if (type === 'pension') {
      setSelectedStarRatings([]);
    }
  };

  const handleStarRatingToggle = (rating: HotelStarRating) => {
    setSelectedStarRatings(prev => {
      if (prev.includes(rating)) {
        return prev.filter(r => r !== rating);
      }
      return [...prev, rating];
    });
  };

  const handleConfirm = () => {
    const typeKeyword = selectedAccommodationType === 'hotel' ? 'hotel_type' : 'pension_type';
    const starKeywords = selectedStarRatings.map(rating => `star_${rating}`);
    const finalKeywords = [...selectedKeywords, typeKeyword, ...starKeywords];
    onConfirmAccomodation(finalKeywords);
  };

  return (
    <div className="space-y-6 p-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">숙소 유형 선택</h3>
        <div className="flex gap-4 mb-6">
          <Button
            variant={selectedAccommodationType === 'hotel' ? 'default' : 'outline'}
            onClick={() => handleAccommodationTypeSelect('hotel')}
            className="flex-1"
          >
            <Hotel className="mr-2 h-4 w-4" />
            호텔
          </Button>
          <Button
            variant={selectedAccommodationType === 'pension' ? 'default' : 'outline'}
            onClick={() => handleAccommodationTypeSelect('pension')}
            className="flex-1"
          >
            <Star className="mr-2 h-4 w-4" />
            펜션
          </Button>
        </div>
      </div>

      {selectedAccommodationType === 'hotel' && (
        <div className="space-y-4">
          <h4 className="font-medium">호텔 등급 선택</h4>
          <div className="flex flex-col gap-2">
            <Button
              variant={selectedStarRatings.includes('3star') ? 'default' : 'outline'}
              onClick={() => handleStarRatingToggle('3star')}
              className="justify-start"
            >
              3성급 이하 호텔
            </Button>
            <Button
              variant={selectedStarRatings.includes('4star') ? 'default' : 'outline'}
              onClick={() => handleStarRatingToggle('4star')}
              className="justify-start"
            >
              4성급 호텔
            </Button>
            <Button
              variant={selectedStarRatings.includes('5star') ? 'default' : 'outline'}
              onClick={() => handleStarRatingToggle('5star')}
              className="justify-start"
            >
              5성급 호텔
            </Button>
          </div>
        </div>
      )}

      <BaseKeywordPanel
        selectedKeywords={selectedKeywords}
        onToggleKeyword={onToggleKeyword}
        directInputValue={directInputValue}
        onDirectInputChange={onDirectInputChange}
        onConfirm={handleConfirm}
        onClose={onClose}
        categoryName="숙소"
        defaultKeywords={defaultKeywords}
      />
    </div>
  );
};

export default AccomodationPanel;
