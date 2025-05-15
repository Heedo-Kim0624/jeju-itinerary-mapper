
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface KeywordOption {
  eng: string;
  kr: string;
}

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

export const KeywordPanel: React.FC<KeywordPanelProps> = ({
  categoryName,
  selectedKeywords,
  onToggleKeyword,
  directInputValue,
  onDirectInputChange,
  onConfirm,
  onClose,
  defaultKeywords,
  accommodationTypeUI
}) => {
  const [localKeywords, setLocalKeywords] = useState<string[]>(selectedKeywords);
  const [inputValue, setInputValue] = useState(directInputValue);

  useEffect(() => {
    setLocalKeywords(selectedKeywords);
  }, [selectedKeywords]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onDirectInputChange(val);
  };

  const handleAddKeyword = () => {
    if (inputValue.trim()) {
      const newKeyword = inputValue.trim();
      if (!localKeywords.includes(newKeyword)) {
        const updatedKeywords = [...localKeywords, newKeyword];
        setLocalKeywords(updatedKeywords);
        onConfirm(updatedKeywords, false);
        setInputValue('');
        onDirectInputChange('');
      }
    }
  };

  const handleKeywordToggle = (keyword: string) => {
    onToggleKeyword(keyword);
    const isSelected = localKeywords.includes(keyword);
    const updatedKeywords = isSelected
      ? localKeywords.filter(k => k !== keyword)
      : [...localKeywords, keyword];
    setLocalKeywords(updatedKeywords);
  };

  const handleConfirm = (clearSelection: boolean = true) => {
    onConfirm(localKeywords, clearSelection);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[500px] max-w-[90%] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{categoryName} 키워드 선택</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {accommodationTypeUI && <div className="mb-4">{accommodationTypeUI}</div>}
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            추천 키워드
          </label>
          <div className="flex flex-wrap gap-2">
            {defaultKeywords.map((keyword) => (
              <Button
                key={keyword.eng}
                variant={localKeywords.includes(keyword.kr) ? "default" : "outline"}
                size="sm"
                onClick={() => handleKeywordToggle(keyword.kr)}
              >
                {keyword.kr}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            선택된 키워드
          </label>
          <div className="flex flex-wrap gap-2">
            {localKeywords.length > 0 ? (
              localKeywords.map((keyword) => (
                <div
                  key={keyword}
                  className="bg-blue-100 px-3 py-1 rounded-full flex items-center text-sm"
                >
                  <span>{keyword}</span>
                  <button
                    onClick={() => handleKeywordToggle(keyword)}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">선택된 키워드가 없습니다.</p>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            직접 입력
          </label>
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={handleInputChange}
              placeholder="키워드 입력 후 추가 버튼을 누르세요"
              className="flex-grow"
            />
            <Button onClick={handleAddKeyword} disabled={!inputValue.trim()}>
              추가
            </Button>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={() => handleConfirm(true)}>
            선택 완료
          </Button>
        </div>
      </div>
    </div>
  );
};
