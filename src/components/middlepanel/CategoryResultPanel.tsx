
import React, { useState, useEffect } from 'react';
// Place 타입을 @/types/index.ts 에서 가져오도록 수정
import type { Place, CategoryName } from '@/types';
import { useMapContext } from '../rightpanel/MapContext';
import PlaceDetailDialog from '../places/PlaceDetailDialog';
import { useCategoryResults } from '@/hooks/use-category-results';
import PlaceListingView from '../places/PlaceListingView';
import ResultHeader from './category-result/ResultHeader';
import LoadingState from './category-result/LoadingState';
import ErrorState from './category-result/ErrorState';
import { Button } from '@/components/ui/button';
import { CheckIcon } from 'lucide-react';

interface CategoryResultPanelProps {
  category: CategoryName; // CategoryName 타입 사용
  regions: string[];
  keywords: string[];
  onClose: () => void;
  onSelectPlace: (place: Place, checked: boolean) => void; // Place 타입 사용
  isPlaceSelected: (id: string) => boolean; // id는 string으로 통일
  isOpen: boolean;
  onConfirm?: (category: CategoryName, selectedPlaces: Place[], recommendedPlaces: Place[]) => void; // Place 타입 사용
}

const CategoryResultPanel: React.FC<CategoryResultPanelProps> = ({
  category,
  regions,
  keywords,
  onClose,
  onSelectPlace,
  isPlaceSelected,
  isOpen,
  onConfirm
}) => {
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState<Place | null>(null); // Place 타입 사용
  const { panTo, addMarkers, clearMarkersAndUiElements } = useMapContext();
  const [userSelectedPlacesInternal, setUserSelectedPlacesInternal] = useState<Place[]>([]); // Place[] 타입 사용
  
  const safeRegions = Array.isArray(regions) ? regions : [];
  
  // useCategoryResults가 Place[] (index.ts 기준)를 반환한다고 가정
  const { isLoading, error, recommendedPlaces, normalPlaces } = useCategoryResults(category, keywords, safeRegions);

  useEffect(() => {
    clearMarkersAndUiElements();
    
    if (recommendedPlaces.length > 0) {
      console.log(`[CategoryResultPanel] 장소 표시: ${recommendedPlaces.length}개 추천 장소 (지역: ${safeRegions.join(', ')})`);
      
      if (recommendedPlaces[0] && recommendedPlaces[0].x && recommendedPlaces[0].y) {
        panTo({ lat: recommendedPlaces[0].y, lng: recommendedPlaces[0].x });
      } else if (safeRegions.length > 0) {
        panTo(safeRegions[0]);
      }
      
      addMarkers(recommendedPlaces, { useRecommendedStyle: true }); // addMarkers는 Place[]를 받음
      
      console.log(`장소 로딩 완료: 추천 장소 ${recommendedPlaces.length}개, 주변 장소 ${normalPlaces.length}개`);
    }
  }, [recommendedPlaces, normalPlaces, safeRegions, clearMarkersAndUiElements, panTo, addMarkers]);

  useEffect(() => {
    const selected = [...recommendedPlaces, ...normalPlaces].filter(
      place => isPlaceSelected(place.id) // place.id는 string
    );
    setUserSelectedPlacesInternal(selected);
  }, [recommendedPlaces, normalPlaces, isPlaceSelected]);

  const handleViewDetails = (place: Place) => { // Place 타입 사용
    setSelectedPlaceDetail(place);
    if (place.x && place.y) {
      clearMarkersAndUiElements();
      addMarkers([place], { highlight: true }); // addMarkers는 Place[]를 받음
      panTo({ lat: place.y, lng: place.x });
    }
  };

  const handlePlaceSelectInternal = (place: Place, checked: boolean) => { // Place 타입 사용
    if (checked) {
      setUserSelectedPlacesInternal(prev => [...prev, place]);
    } else {
      setUserSelectedPlacesInternal(prev => prev.filter(p => p.id !== place.id));
    }
    onSelectPlace(place, checked);
  };

  const handleConfirmInternal = () => {
    console.log(`[카테고리 확인] ${category} 카테고리 선택 완료: ${userSelectedPlacesInternal.length}개 장소`);
    if (onConfirm) {
      onConfirm(category, userSelectedPlacesInternal, recommendedPlaces);
    }
    onClose();
  };

  return (
    <div className="fixed top-0 left-[300px] w-[300px] h-full bg-white border-l border-r border-gray-200 z-40 shadow-md">
      <div className="h-full flex flex-col">
        <ResultHeader category={category} onClose={onClose} />

        <div className="flex-1 overflow-auto">
          {isLoading && <LoadingState />}
          {error && <ErrorState error={error} />}
          {!error && !isLoading && (
            <>
              <PlaceListingView
                places={recommendedPlaces} // Place[] 전달
                title={`🌟 추천 장소 (${safeRegions.join(', ')})`}
                isLoading={isLoading}
                onSelectPlace={handlePlaceSelectInternal}
                onViewOnMap={handleViewDetails}
                isPlaceSelected={isPlaceSelected}
              />
              {normalPlaces.length > 0 && (
                <PlaceListingView
                  places={normalPlaces} // Place[] 전달
                  title="📍 주변 장소"
                  isLoading={isLoading}
                  onSelectPlace={handlePlaceSelectInternal}
                  onViewOnMap={handleViewDetails}
                  isPlaceSelected={isPlaceSelected}
                />
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <Button 
            onClick={handleConfirmInternal}
            className="w-full" 
            variant="default"
          >
            <CheckIcon className="mr-2 h-4 w-4" /> 확인
          </Button>
        </div>
      </div>

      {selectedPlaceDetail && (
        <PlaceDetailDialog
          place={selectedPlaceDetail} // selectedPlaceDetail은 Place 타입
          onClose={() => setSelectedPlaceDetail(null)}
        />
      )}
    </div>
  );
};

export default CategoryResultPanel;
