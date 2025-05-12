
import React, { useState } from 'react';
import { toast } from 'sonner';

interface ItineraryButtonProps {
  allCategoriesSelected: boolean;
  onCreateItinerary: () => void;
}

const ItineraryButton: React.FC<ItineraryButtonProps> = ({
  allCategoriesSelected,
  onCreateItinerary
}) => {
  const [isCreating, setIsCreating] = useState(false);
  
  const handleClick = () => {
    if (!allCategoriesSelected) {
      toast.error("모든 카테고리에서 최소 1개 이상의 장소를 선택해주세요");
      return;
    }
    
    setIsCreating(true);
    
    // 디버깅용 로그 추가
    console.log('경로 생성 버튼 클릭됨, 경로 생성 함수 호출');
    
    try {
      // 함수 실행만 하고 결과값은 평가하지 않음
      onCreateItinerary();
      
      // onCreateItinerary 함수가 에러를 던지지 않았다면 성공으로 간주
      // 이 함수는 경로 생성 후 화면 전환을 처리하므로 여기서는 아무것도 하지 않음
      console.log('경로 생성 함수 호출 완료');
      
    } catch (error) {
      console.error('경로 생성 중 오류 발생', error);
      setIsCreating(false);
      toast.error("경로 생성 중 오류가 발생했습니다");
    }
  };

  // 디버깅을 위한 로깅 추가
  console.log('경로 생성 버튼 활성화 상태:', allCategoriesSelected);

  return (
    <div className="mt-4">
      <button
        onClick={handleClick}
        className={`w-full py-2 rounded flex items-center justify-center transition-colors ${
          isCreating 
            ? "bg-gray-500 text-white cursor-wait" 
            : allCategoriesSelected 
              ? "bg-green-600 text-white hover:bg-green-700" 
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
        }`}
        disabled={!allCategoriesSelected || isCreating}
      >
        {isCreating ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>일정 생성 중...</span>
          </>
        ) : (
          <span className="mr-1">경로 생성</span>
        )}
      </button>
    </div>
  );
};

export default ItineraryButton;
