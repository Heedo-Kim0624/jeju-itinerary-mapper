
import React, { useState, useEffect } from 'react';
import { Place } from '@/types/supabase';
import { useMapContext } from '../rightpanel/MapContext';
import { convertToPlace } from '@/lib/jeju/travelPromptUtils';
import PlaceList from './PlaceList';
import PlaceDetailsPopup from './PlaceDetailsPopup';
import RecommendedPlaces from './RecommendedPlaces';
import { useCategoryResults } from '@/hooks/use-category-results';

const CategoryResultPanel: React.FC<{
  category: '숙소' | '관광지' | '음식점' | '카페';
  locations: string[];
  keywords: string[];
  onClose: () => void;
  onSelectPlace: (place: Place, checked: boolean) => void;
  selectedPlaces: Place[];
}> = ({ category, locations, keywords, onClose, onSelectPlace, selectedPlaces }) => {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [page, setPage] = useState(1);
  const { panTo, addMarkers, clearMarkersAndUiElements } = useMapContext();
  
  const { loading, error, recommendedPlaces, nearbyPlaces } = useCategoryResults(category, locations, keywords);

  useEffect(() => {
    if (category === '숙소') {
      clearMarkersAndUiElements();
      if (locations.length) panTo(locations[0]);
      addMarkers(recommendedPlaces.map(convertToPlace), { highlight: true });
    }
  }, []);

  const handleSelectPlace = (place: Place, checked: boolean) => {
    onSelectPlace(place, checked);
    if (checked) {
      clearMarkersAndUiElements();
      addMarkers([place], { highlight: true });
      panTo({ lat: place.y, lng: place.x });
    }
  };

  const handleViewDetails = (place: Place) => {
    setSelectedPlace(place);
  };

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
          {loading && <p>로딩 중...</p>}
          {error && <p className="text-red-500">오류: {error}</p>}

          <RecommendedPlaces 
            places={recommendedPlaces}
            selectedPlaces={selectedPlaces}
            onSelectPlace={handleSelectPlace}
            onViewDetails={handleViewDetails}
          />

          {!loading && !error && nearbyPlaces.length > 0 && (
            <div>
              <h4 className="text-md font-medium mb-3">📍 주변 장소</h4>
              <PlaceList
                places={nearbyPlaces.map(convertToPlace)}
                loading={loading}
                selectedPlace={selectedPlace}
                onSelectPlace={(place) => handleSelectPlace(place, true)}
                page={page}
                onPageChange={setPage}
                totalPages={Math.ceil(nearbyPlaces.length / 10)}
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
            확인
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
