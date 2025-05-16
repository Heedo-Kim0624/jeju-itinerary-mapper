
import React, { useState } from 'react';
import { toast } from 'sonner';

interface ItineraryButtonProps {
  allCategoriesSelected: boolean;
  onCreateItinerary: () => boolean; // 반환 타입을 boolean으로 변경
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
      const result = onCreateItinerary();
      if (!result) {
        console.log('경로 생성 결과 없음');
        // onCreateItinerary 내부에서 isGenerating 상태를 false로 설정할 것으로 예상되므로,
        // 여기서 직접 false로 설정하면 이중 호출 또는 의도치 않은 동작이 발생할 수 있습니다.
        // isCreating 상태는 useScheduleManagement의 isGenerating과 동기화되는 것이 좋습니다.
        // 임시로 여기서는 실패 시에만 false로 설정합니다.
        setIsCreating(false);
      } else {
        console.log('경로 생성 성공!', result);
        // 성공 시에는 ScheduleGenerator 컴포넌트가 마운트되면서
        // isGenerating 상태가 관리되므로, 여기서는 별도 처리 안 함.
        // setIsCreating(false) 호출은 생성 프로세스가 완료되거나 실패했을 때
        // useScheduleManagement 훅 내부에서 관리되는 isGenerating 상태에 따라 결정되어야 합니다.
        // 현재 구조에서는 onCreateItinerary가 동기 함수로 boolean을 반환하므로,
        // 실제 비동기 생성 로직의 상태를 정확히 반영하기 어렵습니다.
        // 가급적 onCreateItinerary가 Promise를 반환하고, 그 상태에 따라 isCreating을 조절하는 것이 좋습니다.
      }
    } catch (error) {
      console.error('경로 생성 중 오류 발생', error);
      setIsCreating(false);
      toast.error("경로 생성 중 오류가 발생했습니다");
    }
  };

  // 디버깅을 위한 로깅 추가
  console.log('경로 생성 버튼 활성화 상태 (ItineraryButton):', allCategoriesSelected);
  console.log('일정 생성 중 상태 (isCreating in ItineraryButton):', isCreating);


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
