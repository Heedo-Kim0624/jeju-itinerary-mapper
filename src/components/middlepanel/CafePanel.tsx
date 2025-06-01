import React from 'react';
import BaseKeywordPanel from './common/BaseKeywordPanel';
import { KeywordOption } from '@/types/keyword';

const defaultKeywords: KeywordOption[] = [
  { eng: 'Tasty_drinks', kr: '음료가 맛있어요' },
  { eng: 'Stylish_interior', kr: '인테리어가 멋져요' },
  { eng: 'Friendly', kr: '친절해요' },
  { eng: 'Delicious_coffee', kr: '커피가 맛있어요' },
  { eng: 'Special_menu_available', kr: '특별한 메뉴가 있어요' },
  { eng: 'Nice_view', kr: '뷰가 좋아요' },
  { eng: 'Clean_store', kr: '매장이 청결해요' },
  { eng: 'Good_for_photos', kr: '사진이 잘 나와요' },
  { eng: 'Delicious_desserts', kr: '디저트가 맛있어요' },
  { eng: 'Delicious_bread', kr: '빵이 맛있어요' },
];

const CafePanel: React.FC<{
  selectedKeywords: string[];
  onToggleKeyword: (keyword: string) => void;
  directInputValue: string;
  onDirectInputChange: (categoryId: string, value: string) => void;
  onConfirmCafe: (finalKeywords: string[]) => void;
  onClose: () => void;
}> = ({
  selectedKeywords,
  onToggleKeyword,
  directInputValue,
  onDirectInputChange,
  onConfirmCafe,
  onClose,
}) => {
  const handleInputChange = (value: string) => {
    onDirectInputChange('cafe', value);
  };

  return (
    <BaseKeywordPanel
      categoryId="cafe"
      selectedKeywords={selectedKeywords}
      onToggleKeyword={onToggleKeyword}
      directInputValue={directInputValue} 
      onDirectInputChange={(val) => onDirectInputChange('cafe', val)} // ✅ categoryId 명시하여 호출
      onConfirm={onConfirmCafe}
      onClose={onClose}
      categoryName="카페"
      defaultKeywords={defaultKeywords}
    />
  );
};

export default CafePanel;
