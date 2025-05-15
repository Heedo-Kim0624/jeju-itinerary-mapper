
import React from 'react';
import { RegionDetails } from '@/types/region';
import { CategoryName } from '@/utils/categoryUtils';

interface CategorySelectorProps {
  selectedRegions: RegionDetails[];
  selectedCategory: CategoryName | null;
  onCategorySelect: (category: CategoryName) => void;
  onClose: () => void;
  onConfirmCategory: (category: CategoryName | null) => void;
  directInputValues: Record<CategoryName, string>;
  onDirectInputChange: (category: CategoryName, value: string) => void;
  selectedKeywordsByCategory: Record<CategoryName, string[]>;
  toggleKeyword: (category: CategoryName, keyword: string) => void;
  // setKeywords: (category: CategoryName, keywords: string[]) => void; // 이 함수들은 useCategorySelection 훅에서 직접 관리되도록 변경 가능성
  // clearKeywords: (category: CategoryName) => void; // 위와 동일
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedRegions,
  selectedCategory,
  onCategorySelect,
  onClose,
  onConfirmCategory,
  directInputValues,
  onDirectInputChange,
  selectedKeywordsByCategory,
  toggleKeyword,
}) => {
  // 기본 플레이스홀더 내용
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">카테고리 선택</h2>
      <p>선택된 지역: {selectedRegions.map(r => r.displayName || r.name).join(', ') || '없음'}</p>
      {/* 실제 카테고리 선택 UI 구현 필요 */}
      <button onClick={() => onConfirmCategory(selectedCategory)} className="p-2 bg-blue-500 text-white rounded mt-4">
        선택 완료
      </button>
      <button onClick={onClose} className="p-2 bg-gray-300 rounded mt-2 ml-2">
        뒤로
      </button>
    </div>
  );
};

export default CategorySelector;
