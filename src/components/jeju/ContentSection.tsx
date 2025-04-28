
import React from 'react';
import { Button } from '@/components/ui/button';
import PlaceList from '@/components/middlepanel/PlaceList';
import ItineraryView from '@/components/leftpanel/ItineraryView';
import type { Place, ItineraryDay } from '@/types/supabase';
import TravelPromptSearch from '@/components/jeju/TravelPromptSearch';
import { fetchPlaceDetails } from '@/lib/fetchPlaceDetails';
import { toast } from 'sonner';

// ContentSection 컴포넌트의 Props 정의
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
  const handlePlacesFound = (places: Place[]) => {
    console.log("Places found:", places);
    // 여기서 필요한 상태를 업데이트할 수 있습니다
  };

  // 수정된 handleViewDetails 함수
  const handleViewDetails = async (place: Place) => {
    console.log("View details for place:", place);
    try {
      // 카테고리와 ID를 추출하여 상세 정보 조회
      const category = place.category as '숙소' | '관광지' | '음식점' | '카페' | 'accommodation' | 'landmark' | 'restaurant' | 'cafe';
      const id = parseInt(place.id);
      
      if (!category || isNaN(id)) {
        console.error("잘못된 장소 정보:", { category, id });
        toast.error("장소 정보가 올바르지 않습니다.");
        return;
      }
      
      // 상세 정보 조회
      console.log(`장소 상세 정보 조회: ${category}, ID: ${id}`);
      const placeDetails = await fetchPlaceDetails(category, id);
      
      if (placeDetails) {
        console.log("장소 상세 정보 조회 성공:", placeDetails);
        // 상세 정보를 상위 컴포넌트로 전달
        onSelectPlace(placeDetails as unknown as Place);
      } else {
        console.warn("장소 상세 정보를 찾을 수 없습니다.");
        toast.warning("상세 정보를 불러올 수 없습니다");
        // 상세 정보를 찾을 수 없더라도 기본 정보는 전달
        onSelectPlace(place);
      }
    } catch (error) {
      console.error("장소 상세 정보 조회 오류:", error);
      toast.error("상세 정보를 불러오는 중 오류가 발생했습니다");
      // 오류 발생 시 기본 정보 전달
      onSelectPlace(place);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex-1 flex flex-col animate-fade-in" style={{ animationDelay: '100ms' }}>
      {/* 일정 생성 전 화면 */}
      {!showItinerary ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">장소 목록</h2>
            {/* 일정 생성 버튼 */}
            {!loading && isPlaceListReady && !showItinerary && (
              <Button onClick={onCreateItinerary} disabled={!isPlaceListReady}>
                일정 생성
              </Button>
            )}
          </div>

          {/* 장소 목록 or 프롬프트 검색 */}
          {isCategorySelectionComplete ? (
            <PlaceList
              places={filteredPlaces}
              loading={loading}
              onSelectPlace={onSelectPlace}
              selectedPlace={selectedPlace}
              page={currentPage}
              onPageChange={onPageChange}
              totalPages={totalPages}
              onViewDetails={handleViewDetails}
            />
          ) : (
            <TravelPromptSearch onPlacesFound={handlePlacesFound} />
          )}
        </>
      ) : (
        <>
          {/* 일정 보기 화면 */}
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
          {/* 일정 목록 렌더링 */}
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
