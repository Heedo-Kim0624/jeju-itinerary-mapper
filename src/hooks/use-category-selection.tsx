
import { useState } from 'react';

export const useCategorySelection = () => {
  // --- 카테고리 순서 선택(4개까지) ---
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [categorySelectionConfirmed, setCategorySelectionConfirmed] = useState(false);

  // ★ 단계 인덱스: 0부터 categoryOrder.length-1
  const [stepIndex, setStepIndex] = useState(0);                                 // ★ 추가

  // ★ 현재 열려야 할 카테고리 패널
  const activeMiddlePanelCategory = categorySelectionConfirmed
    ? categoryOrder[stepIndex] || null
    : null;                                                                      // ★ 추가

  // --- 카테고리별 선택된 키워드 저장 ---
  const [selectedKeywordsByCategory, setSelectedKeywordsByCategory] = useState<Record<string, string[]>>({});
  const [keywordPriorityByCategory, setKeywordPriorityByCategory] = useState<Record<string, string[]>>({});

  // 카테고리 순서 클릭 (중복 제거/추가)
  const handleCategoryClick = (category: string) => {
    const idx = categoryOrder.indexOf(category);
    if (idx !== -1) {
      const newOrder = [...categoryOrder];
      newOrder.splice(idx, 1);
      setCategoryOrder(newOrder);
    } else if (categoryOrder.length < 4) {
      setCategoryOrder([...categoryOrder, category]);
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
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  // ★ 확인: 키워드 저장 + stepIndex 증가
  const handleConfirmCategory = (category: string, finalKeywords: string[]) => {
    setSelectedKeywordsByCategory((prev) => ({
      ...prev,
      [category]: finalKeywords,
    }));
    setStepIndex((i) => i + 1);
  };

  return {
    categoryOrder,
    categorySelectionConfirmed,
    setCategorySelectionConfirmed,

    // 단계 인덱스 & 현재 활성 카테고리
    stepIndex,                                // ★ 추가
    activeMiddlePanelCategory,                // ★ 추가

    // 키워드 저장 상태
    selectedKeywordsByCategory,
    keywordPriorityByCategory,

    // 행위들
    handleCategoryClick,
    toggleKeyword,
    handlePanelBack,                          // ★ 변경
    handleConfirmCategory,                    // ★ 변경
  };
};
