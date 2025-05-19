
import React, { useState, useEffect } from 'react';
import { PanelLeftClose, PanelRightClose, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PlaceSearch from './PlaceSearch';
import SelectedPlacesPanel from './SelectedPlacesPanel';
import ItineraryPanel from './ItineraryPanel';
import { useDebouncedCallback } from 'use-debounce';
import type { Place, ItineraryDay, SelectedPlace } from '@/types'; // SelectedPlace 추가
import { useSettings } from '@/hooks/useSettings';
// useItinerary 훅을 사용 (selectedItineraryDay를 ItineraryDay 객체로 받음)
import { useItinerary } from '@/hooks/use-itinerary'; 
import { useScheduleStore } from '@/store/scheduleStore'; // 스토어 import (경로 확인 필요)


const LeftPanel: React.FC = () => {
  const { leftPanelWidth, setLeftPanelWidth, leftPanelOpen, setLeftPanelOpen } = useSettings();
  
  // useItinerary 훅 사용. selectedItineraryDay는 ItineraryDay | null 타입
  const { 
    itinerary, 
    selectedItineraryDay, 
    handleSelectItineraryDay, // Day 객체로 받는 함수
    showItinerary, 
    setShowItinerary 
  } = useItinerary();

  // Zustand 스토어에서 상태 가져오기
  const { 
    selectedPlaces, 
    candidatePlaces, 
    // actions 
  } = useScheduleStore(state => ({
    selectedPlaces: state.selectedPlaces,
    candidatePlaces: state.candidatePlaces,
  }));


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
  
  // itinerary 생성/업데이트 시 자동으로 itinerary 뷰로 전환하는 로직은 useItinerary 훅 내부 또는
  // itineraryCreated 이벤트 리스너에서 setShowItinerary(true) 호출로 처리될 수 있음.
  // 여기서는 showItinerary 상태를 직접 사용하여 currentView를 설정.
  useEffect(() => {
    if (showItinerary && itinerary && itinerary.length > 0) {
      setCurrentView('itinerary');
      if (!leftPanelOpen) setLeftPanelOpen(true);
    } else if (!showItinerary && currentView === 'itinerary') {
      // 일정이 닫히거나 없어지면 검색 뷰로 돌아갈 수 있음 (선택적)
      // setCurrentView('search'); 
    }
  }, [showItinerary, itinerary, currentView, leftPanelOpen, setLeftPanelOpen]);


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
            <PlaceSearch 
              onViewSelectedPlaces={() => setCurrentView('selected')}
              onShowItinerary={handleShowItinerary} // 일정 보기 버튼에 연결
            />
          )}
          {currentView === 'selected' && (
            <SelectedPlacesPanel
              onBack={() => setCurrentView('search')}
              onShowItinerary={handleShowItinerary}
            />
          )}
          {currentView === 'itinerary' && itinerary && (
            <ItineraryPanel
              itinerary={itinerary}
              // startDate는 useItinerary 훅에서 관리하거나, 생성 시점에 고정된 값을 사용해야 함.
              // 여기서는 임시로 new Date() 사용. 실제로는 tripDetails 등에서 가져와야 함.
              startDate={new Date()} 
              selectedDay={selectedItineraryDay?.day || null} // ItineraryDay 객체에서 day 숫자만 전달
              onSelectDay={(dayNum) => { // ItineraryPanel에서 day 숫자로 콜백
                 const newSelectedDay = itinerary.find(d => d.day === dayNum);
                 if (newSelectedDay) handleSelectItineraryDay(newSelectedDay); // ItineraryDay 객체로 변환하여 상태 업데이트
              }}
              onClose={handleClosePanelWithBackButton} // 'X' 버튼 대신 '뒤로' 버튼의 핸들러 사용
            />
          )}
        </div>
        
        {/* 패널 하단 닫기 버튼 (텍스트 기반으로 변경) */}
        {leftPanelOpen && (
           <div className="p-2 border-t flex justify-center">
            <Button 
              variant="outline" // 일반 버튼 스타일
              onClick={handleClosePanelWithBackButton} // '뒤로' 버튼과 동일한 기능 또는 패널 닫기
              className="text-blue-600 font-medium hover:bg-blue-50" // 요청된 스타일
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
          style={{ left: effectivePanelWidth - 4 }} // Resizer 위치 조정
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

