
import React from 'react';
import BaseKeywordPanel from './common/BaseKeywordPanel';
import { KeywordOption } from '@/types/keyword';

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
}> = (props) => {
  return (
    <BaseKeywordPanel
      {...props}
      onConfirm={props.onConfirmAccomodation}
      categoryName="숙소"
      defaultKeywords={defaultKeywords}
    />
  );
};

export default AccomodationPanel;
