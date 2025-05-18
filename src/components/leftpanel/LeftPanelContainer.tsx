
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Place } from '@/types/supabase';
import { ItineraryDay } from '@/hooks/use-itinerary';
// PlaceCart는 더 이상 사용되지 않으므로 주석 처리하거나 삭제합니다.
// import PlaceCart from './PlaceCart'; 
// ItineraryButton은 새로운 로딩 버튼 로직으로 대체됩니다.
// import ItineraryButton from './ItineraryButton';
import ScheduleViewer from './ScheduleViewer';

interface LeftPanelContainerProps {
  showItinerary: boolean;
  onSetShowItinerary: (show: boolean) => void;
  selectedPlaces: Place[];
  onRemovePlace: (id: string) => void; // PlaceCart가 제거되었으므로 이 prop은 LeftPanelContainer 내부에서 사용되지 않습니다.
  onViewOnMap: (place: Place) => void; // PlaceCart가 제거되었으므로 이 prop은 LeftPanelContainer 내부에서 사용되지 않습니다.
  allCategoriesSelected: boolean;
  children: React.ReactNode;
  dates: {
    startDate: Date | null;
    endDate: Date | null;
    startTime: string;
    endTime: string;
  } | null;
  onCreateItinerary: () => boolean;
  itinerary: ItineraryDay[] | null;
  selectedItineraryDay: number | null;
  onSelectDay: (day: number) => void;
  isGenerating?: boolean; // 로딩 상태 prop 추가
}

const LeftPanelContainer: React.FC<LeftPanelContainerProps> = ({
  showItinerary,
  onSetShowItinerary,
  selectedPlaces,
  // onRemovePlace, // LeftPanelContainer 내부에서 사용되지 않음
  // onViewOnMap,   // LeftPanelContainer 내부에서 사용되지 않음
  allCategoriesSelected,
  children,
  dates,
  onCreateItinerary,
  itinerary,
  selectedItineraryDay,
  onSelectDay,
  isGenerating = false, // 기본값 false
}) => {
  const [localIsGenerating, setLocalIsGenerating] = useState(isGenerating);
  
  useEffect(() => {
    console.log("[LeftPanelContainer] isGenerating prop 변경:", isGenerating);
    setLocalIsGenerating(isGenerating);
  }, [isGenerating]);
  
  useEffect(() => {
    const handleForceRerender = () => {
      console.log("[LeftPanelContainer] forceRerender 이벤트 수신, 로딩 상태 확인 및 해제");
      setLocalIsGenerating(false);
    };
    
    window.addEventListener('forceRerender', handleForceRerender);
    
    return () => {
      window.removeEventListener('forceRerender', handleForceRerender);
    };
  }, []);

  const handleCloseItinerary = () => {
    onSetShowItinerary(false);
  };

  if (showItinerary && itinerary) {
    console.log("LeftPanelContainer: Rendering ScheduleViewer directly (this path might be taken if LeftPanel's ItineraryView condition is not met)");
    return (
      <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-40 shadow-md">
        <ScheduleViewer
          schedule={itinerary}
          selectedDay={selectedItineraryDay}
          onDaySelect={onSelectDay}
          onClose={handleCloseItinerary}
          startDate={dates?.startDate || new Date()}
        />
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-l border-r border-gray-200 z-40 shadow-md flex flex-col">
      <div className="flex-1 overflow-auto">
        {children}
      </div>
      <div className="px-4 py-4 border-t">
        {/* PlaceCart 컴포넌트 대신 선택된 장소 개수 표시 */}
        <div className="mb-4">
          {selectedPlaces && selectedPlaces.length > 0 && (
            <div className="mb-2 text-sm font-medium">
              선택된 장소: {selectedPlaces.length}개
            </div>
          )}
        </div>
        
        {/* 일정 생성 버튼 - 로딩 상태에 따라 다르게 표시 */}
        {localIsGenerating ? (
          <div className="w-full py-3 bg-blue-500 text-white text-center rounded-md flex items-center justify-center cursor-wait" aria-busy="true" aria-live="polite">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            일정 생성 중...
          </div>
        ) : (
          <button
            className={`w-full py-3 ${
              allCategoriesSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } rounded-md font-medium transition-colors`}
            onClick={() => allCategoriesSelected && onCreateItinerary()}
            disabled={!allCategoriesSelected || localIsGenerating}
          >
            경로 생성하기
          </button>
        )}
      </div>
    </div>
  );
};

export default LeftPanelContainer;
