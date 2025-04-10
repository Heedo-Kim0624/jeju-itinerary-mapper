
import React from 'react';
import { Button } from '@/components/ui/button';
import PlaceList from '@/components/leftpanel/PlaceList';
import ItineraryView from '@/components/leftpanel/ItineraryView';
import { Place } from '@/types/supabase';

interface ItineraryDay {
  day: number;
  places: Place[];
  totalDistance: number;
}

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
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex-1 flex flex-col animate-fade-in" style={{ animationDelay: '100ms' }}>
      {!showItinerary ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">장소 목록</h2>
            {!loading && isPlaceListReady && !showItinerary && (
              <Button 
                onClick={onCreateItinerary}
                disabled={!isPlaceListReady}
              >
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
            />
          ) : (
            <div className="w-full flex flex-col items-center justify-center h-[40vh] text-muted-foreground">
              <p>카테고리를 선택해주세요</p>
            </div>
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
