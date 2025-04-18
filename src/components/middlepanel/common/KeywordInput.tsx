
import React from 'react';

interface KeywordInputProps {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
}

const KeywordInput: React.FC<KeywordInputProps> = ({ value, onChange, onAdd }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">직접 입력</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="키워드를 입력하세요"
        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-300"
      />
      <div className="mt-2">
        <button
          type="button"
          onClick={onAdd}
          className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          확인
        </button>
      </div>
    </div>
  );
};

export default KeywordInput;
