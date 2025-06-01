// src/types/keyword.ts

export interface KeywordOption {
  eng: string;
  kr: string;
}

export interface KeywordPanelProps {
  selectedKeywords: string[];
  onToggleKeyword: (keyword: string) => void;
  directInputValue: string;
  onDirectInputChange: (categoryId: string, value: string) => void;
  onConfirm: (finalKeywords: string[], clearSelection?: boolean) => void;
  onClose: () => void;
  categoryName: string;
  defaultKeywords: KeywordOption[];

  // ✅ 아래 한 줄을 꼭 추가하세요
  categoryId: string;
}
