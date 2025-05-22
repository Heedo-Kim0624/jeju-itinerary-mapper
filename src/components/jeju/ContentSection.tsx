import React from 'react';
import { Button } from '@/components/ui/button';
import PlaceList from '@/components/middlepanel/PlaceList';
import ItineraryView from '@/components/leftpanel/ItineraryView';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core'; // ItineraryPlaceWithTime 추가
import TravelPromptSearch from '@/components/jeju/TravelPromptSearch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// ContentSection 컴포넌트의 Props 정의
interface ContentSectionProps {
  showItinerary: boolean;
  filteredPlaces: Place[];
  loading: boolean;
  selectedPlace: (Place | ItineraryPlaceWithTime) | null; // 타입 변경 유지
  currentPage: number;
  totalPages: number;
  itinerary: ItineraryDay[] | null;
  // dateRange: { startDate: Date | null, endDate: Date | null }; // 이미 제거됨
  selectedItineraryDay: number | null;
  isPlaceListReady: boolean;
  isCategorySelectionComplete: boolean;
  onSelectPlace: (place: (Place | ItineraryPlaceWithTime)) => void; // 타입 변경 유지
  onPageChange: (page: number) => void;
  onCreateItinerary: () => void;
  onSelectItineraryDay: (day: number) => void;
  setShowItinerary: (show: boolean) => void;
  setItinerary: (itinerary: ItineraryDay[] | null) => void;
  setSelectedItineraryDay: (day: number | null) => void;
}

// Function to fetch place details directly from Supabase
async function fetchPlaceDetails(category: string, id: number): Promise<Place | null> {
  try {
    console.log(`Fetching details for ${category} with ID ${id}`);
    
    // Map UI category to database category
    const categoryMapping: Record<string, string> = {
      '숙소': 'accommodation',
      '관광지': 'landmark',
      '음식점': 'restaurant',
      '카페': 'cafe'
    };
    
    // Use mapped category or original if not in mapping
    const dbCategory = categoryMapping[category] || category;
    
    // Fetch from the appropriate tables using explicit table names to satisfy TypeScript
    let infoData = null;
    let ratingData = null;
    let linkData = null;
    let categoryData = null;
    
    if (dbCategory === 'accommodation') {
      const { data: info } = await supabase
        .from('accommodation_information')
        .select('*')
        .eq('id', id)
        .single();
      infoData = info;
      
      const { data: rating } = await supabase
        .from('accommodation_rating')
        .select('*')
        .eq('id', id)
        .single();
      ratingData = rating;
      
      const { data: link } = await supabase
        .from('accommodation_link')
        .select('*')
        .eq('id', id)
        .single();
      linkData = link;
      
      const { data: cat } = await supabase
        .from('accommodation_categories')
        .select('*')
        .eq('id', id)
        .single();
      categoryData = cat;
    } 
    else if (dbCategory === 'landmark') {
      const { data: info } = await supabase
        .from('landmark_information')
        .select('*')
        .eq('id', id)
        .single();
      infoData = info;
      
      const { data: rating } = await supabase
        .from('landmark_rating')
        .select('*')
        .eq('id', id)
        .single();
      ratingData = rating;
      
      const { data: link } = await supabase
        .from('landmark_link')
        .select('*')
        .eq('id', id)
        .single();
      linkData = link;
      
      const { data: cat } = await supabase
        .from('landmark_categories')
        .select('*')
        .eq('id', id)
        .single();
      categoryData = cat;
    }
    else if (dbCategory === 'restaurant') {
      const { data: info } = await supabase
        .from('restaurant_information')
        .select('*')
        .eq('id', id)
        .single();
      infoData = info;
      
      const { data: rating } = await supabase
        .from('restaurant_rating')
        .select('*')
        .eq('id', id)
        .single();
      ratingData = rating;
      
      const { data: link } = await supabase
        .from('restaurant_link')
        .select('*')
        .eq('id', id)
        .single();
      linkData = link;
      
      const { data: cat } = await supabase
        .from('restaurant_categories')
        .select('*')
        .eq('id', id)
        .single();
      categoryData = cat;
    }
    else if (dbCategory === 'cafe') {
      const { data: info } = await supabase
        .from('cafe_information')
        .select('*')
        .eq('id', id)
        .single();
      infoData = info;
      
      const { data: rating } = await supabase
        .from('cafe_rating')
        .select('*')
        .eq('id', id)
        .single();
      ratingData = rating;
      
      const { data: link } = await supabase
        .from('cafe_link')
        .select('*')
        .eq('id', id)
        .single();
      linkData = link;
      
      const { data: cat } = await supabase
        .from('cafe_categories')
        .select('*')
        .eq('id', id)
        .single();
      categoryData = cat;
    }

    if (!infoData) {
      console.error("No place found with ID:", id);
      return null;
    }
    
    // Construct the Place object with safe property access
    const place: Place = {
      id: id.toString(),
      name: infoData?.place_name || '',
      address: infoData?.road_address || infoData?.lot_address || '',
      phone: '',  // Fill required fields with defaults
      category: category, 
      description: '',  // Fill required fields with defaults
      categoryDetail: categoryData?.categories_details || categoryData?.Categories_Details || '',
      x: infoData?.longitude || 0,
      y: infoData?.latitude || 0,
      image_url: '',  // Fill required fields with defaults
      road_address: infoData?.road_address || '',
      homepage: '',  // Fill required fields with defaults
      rating: ratingData?.rating || 0,
      reviewCount: ratingData?.visitor_review_count || 0,
      naverLink: linkData?.link || '',
      instaLink: linkData?.instagram || '',
      operatingHours: infoData?.opening_hours || ''
    };
    
    return place;
    
  } catch (error) {
    console.error("Error fetching place details:", error);
    return null;
  }
}

const ContentSection: React.FC<ContentSectionProps> = ({
  showItinerary,
  filteredPlaces,
  loading,
  selectedPlace,
  currentPage,
  totalPages,
  itinerary,
  // dateRange, // 이미 제거됨
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
    // setFilteredPlaces(places); // This should be handled by the parent component that manages filteredPlaces
  };

  // ✨ 수정된 handleViewDetails
  const handleViewDetails = async (place: Place | ItineraryPlaceWithTime) => {
    console.log("View details for place:", place);
    // If it's already an ItineraryPlaceWithTime with sufficient details, or if it's a simple Place from search
    // We might not need to fetch again if all data is present.
    // However, the original logic fetches to ensure latest/complete data from Supabase.
    
    // Assuming place.id is always string from PlaceList, but could be number from elsewhere
    const idToFetch = typeof place.id === 'string' ? parseInt(place.id, 10) : Number(place.id);
    // Category might not be precise if it's a generic Place object.
    // Prefer `place.category` if available and specific.
    const categoryToFetch = place.category;

    if (isNaN(idToFetch)) {
        console.error("잘못된 장소 ID:", place.id);
        toast.error("장소 ID가 올바르지 않습니다.");
        onSelectPlace(place); // Show what we have
        return;
    }
    if (!categoryToFetch) {
        console.error("장소 카테고리 정보 없음:", place);
        toast.error("장소 카테고리 정보가 없습니다.");
        onSelectPlace(place); // Show what we have
        return;
    }

    console.log(`🔍 Supabase 직접 fetch 시작: category=${categoryToFetch}, id=${idToFetch}`);
    try {
      const detailedPlace = await fetchPlaceDetails(categoryToFetch, idToFetch);

      if (detailedPlace) {
        console.log("✅ Supabase 직접 fetch 성공:", detailedPlace);
        onSelectPlace(detailedPlace);
      } else {
        console.warn("⚠️ Supabase fetch 실패. 기존 데이터 사용.");
        onSelectPlace(place); // Fallback to the initially passed place object
      }
    } catch (error) {
      console.error("❌ Supabase fetch 에러:", error);
      toast.error("장소 정보를 가져오는 중 오류가 발생했습니다.");
      onSelectPlace(place); // Fallback
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
              onSelectPlace={onSelectPlace as (place: Place) => void} // Cast for PlaceList expectation
              selectedPlace={selectedPlace as Place | null} // Cast for PlaceList expectation
              page={currentPage}
              onPageChange={onPageChange}
              totalPages={totalPages}
              onViewDetails={handleViewDetails as (place: Place) => void} // Cast for PlaceList expectation
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
          {itinerary && selectedItineraryDay !== null && ( 
            <ItineraryView
              itinerary={itinerary}
              onSelectDay={onSelectItineraryDay}
              selectedDay={selectedItineraryDay}
            />
          )}
        </>
      )}
      {/* PlaceDetailDialog is opened from ItineraryView's internal usePopup hook, or if ContentSection manages its own dialog */}
      {/* Assuming selectedPlace from props is for PlaceList's selection, not directly for a dialog here unless explicitly handled */}
    </div>
  );
};

export default ContentSection;
