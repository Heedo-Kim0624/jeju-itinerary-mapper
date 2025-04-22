
import React from 'react';

const CATEGORIES = ["숙소", "관광지", "음식점", "카페"];

interface Props {
  selectedOrder: string[];
  onSelect: (category: string) => void;
  onBack: () => void;
  onConfirm: () => void;
}

const CategoryPrioritySelector: React.FC<Props> = ({ selectedOrder, onSelect, onBack, onConfirm }) => {
  const getOrderNumber = (category: string) => {
    const index = selectedOrder.indexOf(category);
    return index !== -1 ? index + 1 : null;
  };

  return (
    <div className="space-y-2 mt-4">
      <div className="flex justify-start mb-2">
        <button
          onClick={onBack}
          className="text-sm text-blue-600 hover:underline"
        >
          ← 뒤로
        </button>
      </div>

      {/* Display instructions */}
      <p className="text-sm text-gray-600 mb-4">
        카테고리 중요도 순서를 선택해주세요.
      </p>

      {/* Category list */}
      {CATEGORIES.map((category) => {
        const order = getOrderNumber(category);

        return (
          <button
            key={category}
            onClick={() => onSelect(category)}
            className={`w-full flex justify-between items-center px-4 py-2 rounded-lg border ${
              order !== null 
              ? 'bg-blue-100 border-blue-400' 
              : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="text-sm text-gray-800">{category}</span>
            {order !== null && (
              <span className="text-sm font-bold text-blue-700">{order}순위</span>
            )}
          </button>
        );
      })}

      {/* Confirm button */}
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
