import React from 'react';
import { Button } from '@/components/ui/button';
import PlaceList from '@/components/leftpanel/PlaceList';
import ItineraryView from '@/components/leftpanel/ItineraryView';
import type { Place, ItineraryDay } from '@/types/supabase';


// ✅ ContentSection 컴포넌트의 Props 정의
interface ContentSectionProps {
  showItinerary: boolean; // 일정 화면 보여줄지 여부
  filteredPlaces: Place[]; // 필터링된 장소 목록
  loading: boolean; // 로딩 상태
  selectedPlace: Place | null; // 선택된 장소
  currentPage: number; // 현재 페이지
  totalPages: number; // 전체 페이지 수
  itinerary: ItineraryDay[] | null; // 생성된 일정
  dateRange: { startDate: Date | null, endDate: Date | null }; // 날짜 범위
  selectedItineraryDay: number | null; // 선택된 일정 날짜 (Day 1, 2...)
  isPlaceListReady: boolean; // 장소 선택 완료 여부
  isCategorySelectionComplete: boolean; // 카테고리 선택 완료 여부
  onSelectPlace: (place: Place) => void; // 장소 클릭 시
  onPageChange: (page: number) => void; // 페이지 변경 시
  onCreateItinerary: () => void; // 일정 생성 버튼 클릭 시
  onSelectItineraryDay: (day: number) => void; // 일정 날짜 클릭 시
  setShowItinerary: (show: boolean) => void; // 일정 화면 toggle
  setItinerary: (itinerary: ItineraryDay[] | null) => void; // 일정 상태 변경
  setSelectedItineraryDay: (day: number | null) => void; // 일정 날짜 선택 상태 변경
}

const ContentSection: React.FC<ContentSectionProps> = ({
  showItinerary,
  filteredPlaces,
  loading,
  selectedPlace,
  currentPage,
  totalPages,
  itinerary,
  dateRange,
  selectedItineraryDay,
  isPlaceListReady,
  isCategorySelectionComplete,
  onSelectPlace,
  onPageChange,
  onCreateItinerary,
  onSelectItineraryDay,
  setShowItinerary,
  setItinerary,
  setSelectedItineraryDay
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex-1 flex flex-col animate-fade-in" style={{ animationDelay: '100ms' }}>
      {/* ✅ 일정 생성 전 화면 */}
      {!showItinerary ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">장소 목록</h2>
            {/* ✅ 일정 생성 버튼 */}
            {!loading && isPlaceListReady && !showItinerary && (
              <Button onClick={onCreateItinerary} disabled={!isPlaceListReady}>
                일정 생성
              </Button>
            )}
          </div>

          {/* ✅ 장소 목록 or 안내 메시지 */}
          {isCategorySelectionComplete ? (
            <PlaceList
              places={filteredPlaces}
              loading={loading}
              onSelectPlace={onSelectPlace}
              selectedPlace={selectedPlace}
              page={currentPage}
              onPageChange={onPageChange}
              totalPages={totalPages}
            />
          ) : (
            <div className="w-full flex flex-col items-center justify-center h-[40vh] text-muted-foreground">
              <p>카테고리를 선택해주세요</p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* ✅ 일정 보기 화면 */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">일정</h2>
            <Button 
              variant="outline"
              onClick={() => {
                setShowItinerary(false);
                setItinerary(null);
                setSelectedItineraryDay(null);
              }}
            >
              장소 목록으로 돌아가기
            </Button>
          </div>
          {/* ✅ 일정 목록 렌더링 */}
          {itinerary && dateRange.startDate && (
            <ItineraryView
              itinerary={itinerary}
              startDate={dateRange.startDate}
              onSelectDay={onSelectItineraryDay}
              selectedDay={selectedItineraryDay}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ContentSection;
