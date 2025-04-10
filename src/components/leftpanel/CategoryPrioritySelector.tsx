// CategoryPrioritySelector.tsx
import React from 'react';

const CATEGORIES = ["숙소", "관광지", "음식점", "카페"];

interface Props {
  selectedOrder: string[];
  onSelect: (category: string) => void; // 선택하기
  onBack: () => void; // ✅ 대문자 B
  onConfirm: () => void; // ✅ 대문자 C
}

const CategoryPrioritySelector: React.FC<Props> = ({ selectedOrder, onSelect, onBack, onConfirm }) => {
  const getOrderNumber = (category: string) => {
    const index = selectedOrder.indexOf(category);
    return index !== -1 ? index + 1 : null;
  };

  return (
    <div className="space-y-2 mt-4">
      {/* ✅ 상단 뒤로가기 버튼 */}
      <div className="flex justify-start mb-2">
        <button
          onClick={onBack}
          className="text-sm text-blue-600 hover:underline"
        >
          ← 뒤로
        </button>
      </div>

      {/* ✅ 카테고리 리스트 */}
      {CATEGORIES.map((category) => {
        const order = getOrderNumber(category);
        const isSelected = order !== null;

        return (
          <button
            key={category}
            onClick={() => onSelect(category)}
            className={`w-full flex justify-between items-center px-4 py-2 rounded-lg border ${
              isSelected ? 'bg-blue-100 border-blue-400' : 'bg-gray-100'
            }`}
          >
            <span className="text-sm text-gray-800">{category}</span>
            {isSelected && (
              <span className="text-sm font-bold text-blue-700">{order}</span>
            )}
          </button>
        );
      })}

      {/* ✅ 확인 버튼 */}
      {selectedOrder.length === 4 && (
        <div className="flex justify-end mt-4">
          <button
            onClick={onConfirm}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
          >
            확인
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryPrioritySelector;
