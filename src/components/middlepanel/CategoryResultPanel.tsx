
import React, { useState, useEffect } from 'react';
import { fetchWeightedResults, PlaceResult, convertToPlace } from '@/lib/jeju/travelPromptUtils';
import { useMapContext } from '../rightpanel/MapContext';
import PlaceList from './PlaceList';
import PlaceDetailsPopup from './PlaceDetailsPopup';
import { useToast } from "@/hooks/use-toast";
import { Place } from '@/types/supabase';
import PlaceCard from './PlaceCard';
import AccommodationTypeFilter from './AccommodationTypeFilter';

const categoryKeyMap = {
  '숙소': 'accommodation',
  '관광지': 'landmark',
  '음식점': 'restaurant',
  '카페': 'cafe',
} as const;

type AccommodationType = 'all' | 'hotel' | 'pension';
type HotelStarRating = '3star' | '4star' | '5star';

const CategoryResultPanel: React.FC<{
  category: '숙소' | '관광지' | '음식점' | '카페';
  locations: string[];
  keywords: string[];
  onClose: () => void;
  onSelectPlace: (place: Place, checked: boolean) => void;
  selectedPlaces: Place[];
}> = ({ category, locations, keywords, onClose, onSelectPlace, selectedPlaces }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendedPlaces, setRecommendedPlaces] = useState<PlaceResult[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<PlaceResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [page, setPage] = useState(1);
  const { panTo, addMarkers, clearMarkersAndUiElements } = useMapContext();
  
  // 숙소 필터링 상태
  const [accommodationType, setAccommodationType] = useState<AccommodationType>('all');
  const [hotelStarRatings, setHotelStarRatings] = useState<HotelStarRating[]>(['3star', '4star', '5star']);

  // 호텔 등급 변경 처리
  const handleStarRatingChange = (rating: HotelStarRating) => {
    setHotelStarRatings(prev => {
      if (prev.includes(rating)) {
        return prev.filter(r => r !== rating);
      } else {
        return [...prev, rating];
      }
    });
  };

  // 숙소 유형에 따른 필터링
  const filterByAccommodationType = (places: PlaceResult[]) => {
    if (category !== '숙소' || accommodationType === 'all') {
      return places;
    }

    return places.filter(place => {
      const categoryDetail = place.categoryDetail?.toLowerCase() || '';
      
      if (accommodationType === 'hotel') {
        const isHotel = categoryDetail.includes('호텔') || 
                      categoryDetail.includes('리조트') || 
                      categoryDetail.includes('hotel') || 
                      categoryDetail.includes('resort');
                      
        if (!isHotel) return false;
        
        // 호텔 등급 필터링
        if (hotelStarRatings.length === 0) return false;
        
        const starMatch = categoryDetail.match(/(\d)성급/);
        if (starMatch) {
          const stars = parseInt(starMatch[1]);
          
          if (stars <= 3 && hotelStarRatings.includes('3star')) return true;
          if (stars === 4 && hotelStarRatings.includes('4star')) return true;
          if (stars === 5 && hotelStarRatings.includes('5star')) return true;
          
          return false;
        }
        
        // 등급 정보가 없으면 3성급 이하로 간주
        return hotelStarRatings.includes('3star');
      } 
      
      if (accommodationType === 'pension') {
        return categoryDetail.includes('펜션') || 
               categoryDetail.includes('민박') || 
               categoryDetail.includes('게스트하우스') || 
               categoryDetail.includes('pension') ||
               categoryDetail.includes('guest house');
      }
      
      return true;
    });
  };

  useEffect(() => {
    const categoryDisplay = {
      '숙소': '숙소 🏨',
      '관광지': '관광지 🏛️',
      '음식점': '음식점 🍽️',
      '카페': '카페 ☕'
    };

    if (keywords.length > 0) {
      toast({
        title: `${categoryDisplay[category]} 키워드`,
        description: `선택된 키워드: ${keywords.join(', ')}`,
        duration: 5000,
      });
    }
  }, [category, keywords, toast]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const results = await fetchWeightedResults(
          categoryKeyMap[category],
          locations,
          keywords
        );

        // 결과를 추천 장소(상위 4개)와 주변 장소로 분리
        const MAX_RECOMMENDATIONS = 4;
        setRecommendedPlaces(results.slice(0, MAX_RECOMMENDATIONS));
        setNearbyPlaces(results.slice(MAX_RECOMMENDATIONS));

        // 지도 마커 업데이트
        clearMarkersAndUiElements();
        
        // 지역에 맞게 지도 줌
        if (locations.length) panTo(locations[0]);

        // 추천 장소와 주변 장소에 대해 다른 스타일의 마커 추가
        const recommendedMarkers = results.slice(0, MAX_RECOMMENDATIONS).map(convertToPlace);
        addMarkers(recommendedMarkers, { highlight: true });

      } catch (e) {
        console.error(e);
        setError((e as Error).message || '알 수 없는 오류');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [category, locations.join(','), keywords.join(',')]);

  // 숙소 타입이나 호텔 등급 변경 시 필터링 적용
  useEffect(() => {
    if (category === '숙소') {
      // 지도 마커 업데이트
      clearMarkersAndUiElements();
      
      // 지역에 맞게 지도 줌
      if (locations.length) panTo(locations[0]);
      
      // 필터링된 추천 장소에 대한 마커 추가
      const filteredRecommended = filterByAccommodationType(recommendedPlaces);
      const recommendedMarkers = filteredRecommended.map(convertToPlace);
      addMarkers(recommendedMarkers, { highlight: true });
    }
  }, [accommodationType, hotelStarRatings.join(',')]);

  const handleSelectPlace = (place: Place, checked: boolean) => {
    onSelectPlace(place, checked);
    
    if (checked) {
      // 선택 시 지도에 마커 표시 및 해당 위치로 이동
      clearMarkersAndUiElements();
      addMarkers([place], { highlight: true });
      panTo({ lat: place.y, lng: place.x });
    }
  };

  const handleViewDetails = (place: Place) => {
    setSelectedPlace(place);
  };

  const filteredRecommended = filterByAccommodationType(recommendedPlaces);
  const filteredNearby = filterByAccommodationType(nearbyPlaces);

  return (
    <div className="fixed top-0 left-[300px] w-[300px] h-full bg-white border-l border-r border-gray-200 z-40 shadow-md">
      <div className="h-full flex flex-col">
        <header className="sticky top-0 bg-white p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">{category} 추천 목록</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            닫기
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4">
          {category === '숙소' && (
            <AccommodationTypeFilter
              selectedType={accommodationType}
              onTypeChange={setAccommodationType}
              selectedStarRatings={hotelStarRatings}
              onStarRatingChange={handleStarRatingChange}
            />
          )}
          
          {loading && <p>로딩 중...</p>}
          {error && <p className="text-red-500">오류: {error}</p>}

          {!loading && !error && filteredRecommended.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium mb-3">✨ 추천 장소</h4>
              <div className="space-y-2">
                {filteredRecommended.map(place => (
                  <PlaceCard
                    key={place.id}
                    place={convertToPlace(place)}
                    isSelected={selectedPlaces.some(p => p.id === place.id)}
                    onSelect={handleSelectPlace}
                    onClick={() => handleSelectPlace(convertToPlace(place), true)}
                    onViewDetails={() => handleViewDetails(convertToPlace(place))}
                  />
                ))}
              </div>
            </div>
          )}

          {!loading && !error && filteredNearby.length > 0 && (
            <div>
              <h4 className="text-md font-medium mb-3">📍 주변 장소</h4>
              <PlaceList
                places={filteredNearby.map(convertToPlace)}
                loading={loading}
                selectedPlace={selectedPlace}
                onSelectPlace={(place) => handleSelectPlace(place, true)}
                page={page}
                onPageChange={setPage}
                totalPages={Math.ceil(filteredNearby.length / 10)}
                selectedPlaces={selectedPlaces}
                onViewDetails={handleViewDetails}
              />
            </div>
          )}
        </div>

        <div className="sticky bottom-0 p-4 bg-white border-t">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            다음 단계로
          </button>
        </div>
      </div>

      {selectedPlace && (
        <PlaceDetailsPopup
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
        />
      )}
    </div>
  );
};

export default CategoryResultPanel;
