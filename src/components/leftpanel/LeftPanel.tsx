
import React, { useState, useEffect } from 'react';
import { PanelLeftClose, PanelRightClose, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDebouncedCallback } from 'use-debounce';
import type { Place, ItineraryDay } from '@/types'; 
import { useItinerary } from '@/hooks/use-itinerary'; 

// LeftPanel의 Props 정의
interface LeftPanelProps {
  // 필요한 속성 추가
}

const LeftPanel: React.FC<LeftPanelProps> = () => {
  // 기본 패널 관련 상태
  const [leftPanelWidth, setLeftPanelWidth] = useState(320);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  
  // useItinerary 훅 사용
  const { 
    itinerary, 
    selectedItineraryDay, 
    setSelectedItineraryDay,
    showItinerary, 
    setShowItinerary 
  } = useItinerary();

  const [isResizing, setIsResizing] = useState(false);
  const [currentView, setCurrentView] = useState<'search' | 'selected' | 'itinerary'>('search');

  const handleShowItinerary = () => {
    if (itinerary && itinerary.length > 0) {
      setCurrentView('itinerary');
      setLeftPanelOpen(true); // 일정이 있으면 패널 열기
    } else {
      // 사용자에게 알림 (예: toast)
      console.warn("표시할 일정이 없습니다.");
    }
  };
  
  // itinerary 생성/업데이트 시 자동으로 itinerary 뷰로 전환
  useEffect(() => {
    if (showItinerary && itinerary && itinerary.length > 0) {
      setCurrentView('itinerary');
      if (!leftPanelOpen) setLeftPanelOpen(true);
    } else if (!showItinerary && currentView === 'itinerary') {
      // 일정이 닫히거나 없어지면 검색 뷰로 돌아갈 수 있음 (선택적)
      // setCurrentView('search'); 
    }
  }, [showItinerary, itinerary, currentView, leftPanelOpen]);

  const startResizing = React.useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resizePanel = useDebouncedCallback((mouseMoveEvent: MouseEvent) => {
    if (isResizing) {
      const newWidth = mouseMoveEvent.clientX;
      if (newWidth > 250 && newWidth < 800) { // Min/max width
        setLeftPanelWidth(newWidth);
      }
    }
  }, 10);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resizePanel);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resizePanel);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resizePanel);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resizePanel, stopResizing]);

  const togglePanel = () => {
    setLeftPanelOpen(!leftPanelOpen);
  };
  
  // '뒤로' 버튼 클릭 시 동작 (예: 검색 뷰로 돌아가기)
  const handleClosePanelWithBackButton = () => {
    if (currentView === 'itinerary') {
      // setShowItinerary(false); // 일정을 완전히 닫는다면
      setCurrentView('search'); // 또는 이전 뷰 (selected)로 돌아갈 수 있음
    } else if (currentView === 'selected') {
      setCurrentView('search');
    } else {
      setLeftPanelOpen(false); // 검색 뷰에서는 패널 닫기
    }
  };

  const effectivePanelWidth = leftPanelOpen ? leftPanelWidth : 0;

  return (
    <>
      <div
        className={`fixed top-0 left-0 h-full bg-background border-r transition-all duration-300 ease-in-out z-30 flex flex-col shadow-lg ${
          leftPanelOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: effectivePanelWidth }}
      >
        <div className="flex-grow overflow-y-auto">
          {currentView === 'search' && (
            <div className="p-4">
              <h2 className="text-lg font-medium mb-4">장소 검색</h2>
              {/* PlaceSearch 컴포넌트 자리 */}
            </div>
          )}
          {currentView === 'selected' && (
            <div className="p-4">
              <h2 className="text-lg font-medium mb-4">선택된 장소</h2>
              {/* SelectedPlacesPanel 컴포넌트 자리 */}
            </div>
          )}
          {currentView === 'itinerary' && itinerary && (
            <div className="p-4">
              <h2 className="text-lg font-medium mb-4">일정</h2>
              {/* 일정 표시 컴포넌트 자리 */}
              {/* 수평 스크롤 가능한 일자 버튼 */}
              <div className="flex overflow-x-auto whitespace-nowrap pb-2 mb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {itinerary.map((day, index) => (
                  <Button
                    key={index}
                    variant={selectedItineraryDay?.day === day.day ? "default" : "outline"}
                    className="mr-2 flex-shrink-0"
                    onClick={() => setSelectedItineraryDay(day)}
                  >
                    {`${day.day}일차`}
                    <span className="ml-1 text-xs opacity-70">
                      {day.date}
                    </span>
                  </Button>
                ))}
              </div>
              
              {/* 수직 스크롤 가능한 일정 내용 */}
              <div className="h-[calc(100vh-300px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {selectedItineraryDay && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      {selectedItineraryDay.day}일차 ({selectedItineraryDay.date})
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      총 이동 거리: {(selectedItineraryDay.totalDistance / 1000).toFixed(2)} km
                    </p>
                    
                    {/* 장소 목록 */}
                    {selectedItineraryDay.places.map((place, index) => (
                      <div key={index} className="mb-4 border-l-2 border-blue-500 pl-4 relative">
                        <div className="text-sm font-medium">{place.name}</div>
                        <div className="text-xs text-gray-500">{place.category}</div>
                        <div className="text-xs text-gray-500">{place.timeBlock}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* 패널 하단 닫기 버튼 (텍스트 기반으로 변경) */}
        {leftPanelOpen && (
           <div className="p-2 border-t flex justify-center">
            <Button 
              variant="outline"
              onClick={handleClosePanelWithBackButton}
              className="text-blue-600 font-medium hover:bg-blue-50"
            >
              뒤로
            </Button>
          </div>
        )}
      </div>

      {/* Resizer */}
      {leftPanelOpen && (
        <div
          className="fixed top-0 h-full w-2 cursor-col-resize z-30 flex items-center justify-center bg-transparent group"
          style={{ left: effectivePanelWidth - 4 }}
          onMouseDown={startResizing}
        >
          <GripVertical className="h-8 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}

      {/* Toggle button for closed panel */}
      {!leftPanelOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-1/2 left-2 -translate-y-1/2 z-40 bg-background/80 hover:bg-background backdrop-blur-sm rounded-full shadow-md"
          onClick={togglePanel}
        >
          <PanelRightClose className="h-5 w-5" />
        </Button>
      )}
    </>
  );
};

export default LeftPanel;
