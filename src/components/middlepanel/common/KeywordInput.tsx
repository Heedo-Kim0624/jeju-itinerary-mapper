
import React, { KeyboardEvent } from 'react';

interface KeywordInputProps {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
}

const KeywordInput: React.FC<KeywordInputProps> = ({ value, onChange, onAdd }) => {
  // Ensure value is never undefined
  const safeValue = value || '';
  
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && safeValue.trim() !== '') {
      onAdd();
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">직접 입력</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="키워드를 입력하세요"
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={safeValue.trim() === ''}
          className={`px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs ${
            safeValue.trim() === '' ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          추가
        </button>
      </div>
    </div>
  );
};

export default KeywordInput;
