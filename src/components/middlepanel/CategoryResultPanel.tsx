
import React, { useState, useEffect } from 'react';
import { Place } from '@/types/supabase';
import { useMapContext } from '../rightpanel/MapContext';
import PlaceDetailDialog from '../places/PlaceDetailDialog';
import { useCategoryResults } from '@/hooks/use-category-results';
import PlaceListingView from '../places/PlaceListingView';

const CategoryResultPanel: React.FC<{
  category: '숙소' | '관광지' | '음식점' | '카페';
  locations: string[];
  keywords: string[];
  onClose: () => void;
  onSelectPlace: (place: Place, checked: boolean) => void;
  selectedPlaces: Place[];
}> = ({ category, locations, keywords, onClose, onSelectPlace, selectedPlaces }) => {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const { panTo, addMarkers, clearMarkersAndUiElements } = useMapContext();
  
  const { loading, error, recommendedPlaces, nearbyPlaces } = useCategoryResults(category, locations, keywords);

  useEffect(() => {
    clearMarkersAndUiElements();
    
    if (locations.length > 0) {
      panTo(locations[0]);
      
      if (recommendedPlaces.length > 0) {
        // Make sure we're adding markers with all the necessary data
        addMarkers(recommendedPlaces.map(place => ({
          id: place.id,
          name: place.place_name,
          category: category,
          address: place.road_address,
          x: place.x,
          y: place.y,
          rating: place.rating || 0,
          reviewCount: place.visitor_review_count || 0,
          naverLink: place.naverLink ?? "",
          instaLink: place.instaLink ?? "",
          weight: place.weight // 가중치 추가
        })), { highlight: true });
      }
    }
  }, [recommendedPlaces]);

  const handleViewDetails = (place: Place) => {
    setSelectedPlace(place);
    // Also pan to the place when viewing details
    if (place.x && place.y) {
      clearMarkersAndUiElements();
      addMarkers([place], { highlight: true });
      panTo({ lat: place.y, lng: place.x });
    }
  };

  // Convert PlaceResults to Place objects for the recommended and nearby places
  const recommendedPlacesConverted = recommendedPlaces.map(place => ({
    id: place.id,
    name: place.place_name,
    category: category,
    address: place.road_address,
    x: place.x,
    y: place.y,
    rating: place.rating || 0,
    reviewCount: place.visitor_review_count || 0,
    naverLink: place.naverLink ?? "",
    instaLink: place.instaLink ?? "",
    weight: place.weight // 가중치 추가
  }));

  const nearbyPlacesConverted = nearbyPlaces.map(place => ({
    id: place.id,
    name: place.place_name,
    category: category,
    address: place.road_address,
    x: place.x,
    y: place.y,
    rating: place.rating || 0,
    reviewCount: place.visitor_review_count || 0,
    naverLink: place.naverLink ?? "",
    instaLink: place.instaLink ?? "",
    weight: place.weight // 가중치 추가
  }));

  return (
    <div className="fixed top-0 left-[300px] w-[300px] h-full bg-white border-l border-r border-gray-200 z-40 shadow-md">
      <div className="h-full flex flex-col">
        <header className="sticky top-0 bg-white p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">{category} 추천 목록</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            닫기
          </button>
        </header>

        <div className="flex-1 overflow-auto">
          {error && (
            <div className="p-4">
              <div className="bg-red-50 text-red-600 p-3 rounded">
                오류: {error}
              </div>
            </div>
          )}

          {!error && (
            <>
              <PlaceListingView
                places={recommendedPlacesConverted}
                title="🌟 추천 장소"
                isLoading={loading}
                selectedPlaces={selectedPlaces}
                onSelectPlace={onSelectPlace}
                onViewOnMap={handleViewDetails}
              />
              
              {nearbyPlacesConverted.length > 0 && (
                <PlaceListingView
                  places={nearbyPlacesConverted}
                  title="📍 주변 장소"
                  isLoading={loading}
                  selectedPlaces={selectedPlaces}
                  onSelectPlace={onSelectPlace}
                  onViewOnMap={handleViewDetails}
                />
              )}
            </>
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
        <PlaceDetailDialog
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
        />
      )}
    </div>
  );
};

export default CategoryResultPanel;
