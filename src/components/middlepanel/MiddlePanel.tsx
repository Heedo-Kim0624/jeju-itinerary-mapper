import React from 'react';

interface MiddlePanelProps {
  category: string;
  keywords: string[];
  selectedKeywords: string[];
  onToggleKeyword: (keyword: string) => void;
  onClose: () => void;
}

const MiddlePanel: React.FC<MiddlePanelProps> = ({
  category,
  keywords,
  selectedKeywords,
  onToggleKeyword,
  onClose,
}) => {
  return (
    <div className="fixed top-0 left-[300px] w-[300px] h-full bg-white border-l border-r border-gray-200 z-40 shadow-md p-4 overflow-y-auto">
      {/* 상단 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{category} 관련 키워드 선택</h2>
        <button onClick={onClose} className="text-sm text-blue-600 hover:underline">닫기</button>
      </div>

      {/* 키워드 선택 버튼들 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {keywords.map((kw) => {
          const isSelected = selectedKeywords.includes(kw);
          return (
            <button
              key={kw}
              onClick={() => onToggleKeyword(kw)}
              className={`px-3 py-1 rounded-full text-sm border transition-all duration-150 shadow-sm active:scale-95
                ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'}`}
            >
              {kw}
            </button>
          );
        })}
      </div>

      {/* 중요도 순위 박스 (세로 3칸) - 향후 드래그앤드롭 구현 예정 */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-2">중요도 순서 선택 (최대 3개)</h3>
        <div className="space-y-2">
          <div className="w-full h-10 rounded border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
            1순위
          </div>
          <div className="w-full h-10 rounded border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
            2순위
          </div>
          <div className="w-full h-10 rounded border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
            3순위
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1">※ 드래그 앤 드롭 등 구현 예정</p>
      </div>
    </div>
  );
};

export default MiddlePanel;
