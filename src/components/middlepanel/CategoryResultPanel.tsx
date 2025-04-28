
import React, { useState, useEffect } from 'react';
import { Place } from '@/types/supabase';
import { useMapContext } from '../rightpanel/MapContext';
import PlaceDetailDialog from '../places/PlaceDetailDialog';
import { useCategoryResults } from '@/hooks/use-category-results';
import PlaceListingView from '../places/PlaceListingView';
import ResultHeader from './category-result/ResultHeader';
import ResultFooter from './category-result/ResultFooter';
import LoadingState from './category-result/LoadingState';
import ErrorState from './category-result/ErrorState';

interface CategoryResultPanelProps {
  category: '숙소' | '관광지' | '음식점' | '카페';
  locations: string[];
  keywords: string[];
  onClose: () => void;
  onSelectPlace: (place: Place, checked: boolean) => void;
  selectedPlaces: Place[];
}

const CategoryResultPanel: React.FC<CategoryResultPanelProps> = ({
  category,
  locations,
  keywords,
  onClose,
  onSelectPlace,
  selectedPlaces
}) => {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const { panTo, addMarkers, clearMarkersAndUiElements } = useMapContext();
  
  const { loading, error, recommendedPlaces, nearbyPlaces } = useCategoryResults(category, locations, keywords);

  useEffect(() => {
    clearMarkersAndUiElements();
    
    if (locations.length > 0 && recommendedPlaces.length > 0) {
      panTo(locations[0]);
      
      // Convert recommendedPlaces to Place objects with required fields
      const placesForMarkers: Place[] = recommendedPlaces.map(place => ({
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
        weight: place.weight,
        categoryDetail: "",
        operatingHours: ""
      }));
      
      addMarkers(placesForMarkers, { highlight: true });
    }
  }, [recommendedPlaces]);

  const handleViewDetails = (place: Place) => {
    // Ensure weight is included when showing place details
    setSelectedPlace(place);
    if (place.x && place.y) {
      clearMarkersAndUiElements();
      addMarkers([place], { highlight: true });
      panTo({ lat: place.y, lng: place.x });
    }
  };

  const recommendedPlacesConverted: Place[] = recommendedPlaces.map(place => ({
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
    weight: place.weight,
    categoryDetail: "",
    operatingHours: ""
  }));

  const nearbyPlacesConverted: Place[] = nearbyPlaces.map(place => ({
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
    weight: place.weight,
    categoryDetail: "",
    operatingHours: ""
  }));

  return (
    <div className="fixed top-0 left-[300px] w-[300px] h-full bg-white border-l border-r border-gray-200 z-40 shadow-md">
      <div className="h-full flex flex-col">
        <ResultHeader category={category} onClose={onClose} />

        <div className="flex-1 overflow-auto">
          {loading && <LoadingState />}
          
          {error && <ErrorState error={error} />}

          {!error && !loading && (
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

        <ResultFooter onClose={onClose} />
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
