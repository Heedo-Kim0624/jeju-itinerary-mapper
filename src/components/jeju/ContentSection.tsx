import React from 'react';
import { Button } from '@/components/ui/button';
import PlaceList from '@/components/middlepanel/PlaceList';
import ItineraryView from '@/components/leftpanel/ItineraryView';
import type { Place, ItineraryDay } from '@/types/supabase';
import TravelPromptSearch from '@/components/jeju/TravelPromptSearch';
// import { fetchPlaceDetails } from '@/lib/fetchPlaceDetails'; // ❌ 기존 lovable용
import { fetchPlaceDetails } from '@/lib/fetchPlaceDetailsDirect'; // ✅ 직접 Supabase 연결용
import { toast } from 'sonner';

// ContentSection 컴포넌트의 Props 정의
interface ContentSectionProps {
  showItinerary: boolean;
  filteredPlaces: Place[];
  loading: boolean;
  selectedPlace: Place | null;
  currentPage: number;
  totalPages: number;
  itinerary: ItineraryDay[] | null;
  dateRange: { startDate: Date | null, endDate: Date | null };
  selectedItineraryDay: number | null;
  isPlaceListReady: boolean;
  isCategorySelectionComplete: boolean;
  onSelectPlace: (place: Place) => void;
  onPageChange: (page: number) => void;
  onCreateItinerary: () => void;
  onSelectItineraryDay: (day: number) => void;
  setShowItinerary: (show: boolean) => void;
  setItinerary: (itinerary: ItineraryDay[] | null) => void;
  setSelectedItineraryDay: (day: number | null) => void;
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
  };

  // ✨ 수정된 handleViewDetails
  const handleViewDetails = async (place: Place) => {
    console.log("View details for place:", place);
    try {
      const category = place.category as '숙소' | '관광지' | '음식점' | '카페' | 'accommodation' | 'landmark' | 'restaurant' | 'cafe';
      const id = typeof place.id === 'string' ? parseInt(place.id) : place.id;

      if (!category || isNaN(id)) {
        console.error("잘못된 장소 정보:", { category, id });
        toast.error("장소 정보가 올바르지 않습니다.");
        return;
      }

      console.log(`🔍 Supabase 직접 fetch 시작: category=${category}, id=${id}`);
      const detailedPlace = await fetchPlaceDetails(category, id);

      if (detailedPlace) {
        console.log("✅ Supabase 직접 fetch 성공:", detailedPlace);
        onSelectPlace(detailedPlace);
      } else {
        console.warn("⚠️ Supabase fetch 실패. 기본 데이터 사용.");
        onSelectPlace(place);
      }
    } catch (error) {
      console.error("❌ Supabase fetch 에러:", error);
      toast.error("장소 정보를 가져오는 중 오류가 발생했습니다.");
      onSelectPlace(place);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex-1 flex flex-col animate-fade-in" style={{ animationDelay: '100ms' }}>
      {!showItinerary ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">장소 목록</h2>
            {!loading && isPlaceListReady && !showItinerary && (
              <Button onClick={onCreateItinerary} disabled={!isPlaceListReady}>
                일정 생성
              </Button>
            )}
          </div>

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
