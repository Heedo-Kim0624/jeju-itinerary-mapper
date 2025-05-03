
import React from 'react';
import { toast } from 'sonner';

interface ItineraryButtonProps {
  allCategoriesSelected: boolean;
  onCreateItinerary: () => void;
}

const ItineraryButton: React.FC<ItineraryButtonProps> = ({
  allCategoriesSelected,
  onCreateItinerary
}) => {
  const handleClick = () => {
    if (!allCategoriesSelected) {
      toast.error("모든 카테고리에서 최소 1개 이상의 장소를 선택해주세요");
      return;
    }
    onCreateItinerary();
  };

  // 디버깅을 위한 로깅 추가
  console.log('경로 생성 버튼 활성화 상태:', allCategoriesSelected);

  return (
    <div className="mt-4">
      <button
        onClick={handleClick}
        className={`w-full py-2 rounded flex items-center justify-center transition-colors ${
          allCategoriesSelected 
            ? "bg-green-600 text-white hover:bg-green-700" 
            : "bg-gray-300 text-gray-600 cursor-not-allowed"
        }`}
        disabled={!allCategoriesSelected}
      >
        <span className="mr-1">경로 생성</span>
      </button>
    </div>
  );
};

export default ItineraryButton;
