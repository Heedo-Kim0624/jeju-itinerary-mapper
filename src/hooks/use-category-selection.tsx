import { useState } from 'react';

export const useCategorySelection = () => {
  // --- 카테고리 순서 선택(4개까지) ---
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [categorySelectionConfirmed, setCategorySelectionConfirmed] = useState(false);

  // ★ 단계 인덱스: 0부터 categoryOrder.length-1
  const [stepIndex, setStepIndex] = useState(0);                                 

  // ★ 현재 열려있는 카테고리 패널
  const [activeMiddlePanelCategory, setActiveMiddlePanelCategory] = useState<string | null>(null);

  // --- 카테고리별 선택된 키워드 저장 ---
  const [selectedKeywordsByCategory, setSelectedKeywordsByCategory] = useState<Record<string, string[]>>({});
  const [keywordPriorityByCategory, setKeywordPriorityByCategory] = useState<Record<string, string[]>>({});

  // 카테고리 순서 클릭 (중복 제거/추가) - 카테고리 중요도 선택 단계에서만 사용
  const handleCategoryClick = (category: string) => {
    if (!categorySelectionConfirmed) {
      // 카테고리 우선순위 선택 단계에서는 기존 로직 유지
      const idx = categoryOrder.indexOf(category);
      if (idx !== -1) {
        const newOrder = [...categoryOrder];
        newOrder.splice(idx, 1);
        setCategoryOrder(newOrder);
      } else if (categoryOrder.length < 4) {
        setCategoryOrder([...categoryOrder, category]);
      }
    } else {
      // 카테고리 선택이 확정된 후에는 패널 토글만 수행
      // 현재 열린 패널이 클릭된 카테고리와 같다면 닫고, 다르다면 해당 카테고리 패널을 엽니다
      setActiveMiddlePanelCategory(prev => 
        prev === category ? null : category
      );
    }
  };

  // 토글 키워드 (체크/언체크)
  const toggleKeyword = (category: string, keyword: string) => {
    setSelectedKeywordsByCategory((prev) => {
      const curr = prev[category] || [];
      const updated = curr.includes(keyword)
        ? curr.filter((k) => k !== keyword)
        : [...curr, keyword];
      return { ...prev, [category]: updated };
    });
  };

  // ★ 뒤로가기: 현재 단계의 키워드 제거 + stepIndex 감소
  const handlePanelBack = () => {
    // 이전 카테고리로 자동 이동하지 않고 단순히 현재 패널만 닫습니다
    setActiveMiddlePanelCategory(null);
  };

  // ★ 확인: 키워드 저장 + stepIndex 증가
  const handleConfirmCategory = (category: string, finalKeywords: string[]) => {
    setSelectedKeywordsByCategory((prev) => ({
      ...prev,
      [category]: finalKeywords,
    }));
    // 자동으로 다음 패널을 열지 않고 현재 패널만 닫습니다
    setActiveMiddlePanelCategory(null);
  };

  return {
    categoryOrder,
    categorySelectionConfirmed,
    setCategorySelectionConfirmed,

    // 단계 인덱스 & 현재 활성 카테고리
    stepIndex,                                
    activeMiddlePanelCategory,                

    // 키워드 저장 상태
    selectedKeywordsByCategory,
    keywordPriorityByCategory,

    // 행위들
    handleCategoryClick,
    toggleKeyword,
    handlePanelBack,                          
    handleConfirmCategory,                    
  };
};
