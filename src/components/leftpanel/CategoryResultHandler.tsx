
import React from 'react';
import CategoryResultPanel from '../middlepanel/CategoryResultPanel';
import type { Place } from '@/types/supabase';
import type { CategoryName } from '@/utils/categoryUtils';

interface CategoryResultHandlerProps {
  showCategoryResult: CategoryName | null;
  selectedRegions: string[];
  selectedKeywordsByCategory: Record<CategoryName, string[]>;
  onClose: () => void;
  onSelectPlace: (place: Place, checked: boolean) => void;
  selectedPlaces: Place[];
}

const CategoryResultHandler: React.FC<CategoryResultHandlerProps> = ({
  showCategoryResult,
  selectedRegions,
  selectedKeywordsByCategory,
  onClose,
  onSelectPlace,
  selectedPlaces
}) => {
  const isPlaceSelected = (id: string | number) => {
    return selectedPlaces.some(place => place.id === id);
  };
  
  // 키워드 문자열에서 실제 키워드만 추출
  const extractKeywords = (keywordStrings: string[]): string[] => {
    if (!keywordStrings || keywordStrings.length === 0) return [];
    
    // 키워드 형식: "카테고리[키워드1,키워드2,{우선1,우선2}]"
    const keywords: string[] = [];
    
    keywordStrings.forEach(keywordStr => {
      // 대괄호 안의 내용 추출
      const match = keywordStr.match(/\[(.*?)\]/);
      if (match && match[1]) {
        const keywordContent = match[1];
        
        // 중괄호 내 우선순위 키워드 처리
        const priorityMatches = keywordContent.match(/\{(.*?)\}/g);
        if (priorityMatches) {
          priorityMatches.forEach(priorityMatch => {
            const priorityContent = priorityMatch.replace(/[\{\}]/g, '');
            const priorityKeywords = priorityContent.split(',');
            keywords.push(...priorityKeywords);
          });
        }
        
        // 일반 키워드 추출 (중괄호 제외)
        const cleanedContent = keywordContent.replace(/\{.*?\}/g, '');
        const remainingKeywords = cleanedContent
          .split(',')
          .filter(k => k.trim() !== '');
          
        keywords.push(...remainingKeywords);
      }
    });
    
    return keywords.filter(Boolean);
  };

  return (
    <>
      {showCategoryResult && (
        <CategoryResultPanel
          category={showCategoryResult}
          regions={selectedRegions}
          keywords={extractKeywords(selectedKeywordsByCategory[showCategoryResult])}
          onClose={onClose}
          onSelectPlace={onSelectPlace}
          isPlaceSelected={isPlaceSelected}
          isOpen={true}
        />
      )}
    </>
  );
};

export default CategoryResultHandler;
