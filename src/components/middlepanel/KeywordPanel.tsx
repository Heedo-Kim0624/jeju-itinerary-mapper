
import React from 'react';
import BaseKeywordPanel from './common/BaseKeywordPanel';
import { KeywordOption } from '@/types/keyword';

interface KeywordPanelProps {
  categoryName: string;
  selectedKeywords: string[];
  onToggleKeyword: (keyword: string) => void;
  directInputValue: string;
  onDirectInputChange: (value: string) => void;
  onConfirm: (keywords: string[], clearSelection?: boolean) => void;
  onClose: () => void;
  defaultKeywords: KeywordOption[];
  accommodationTypeUI?: React.ReactNode;
}

export const KeywordPanel: React.FC<KeywordPanelProps> = (props) => {
  return <BaseKeywordPanel {...props} />;
};

export default KeywordPanel;
