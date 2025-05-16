
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
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface CategoryResultPanelProps {
  category: '숙소' | '관광지' | '음식점' | '카페';
  regions: string[];
  keywords: string[];
  onClose: () => void;
  onSelectPlace: (place: Place, checked: boolean) => void;
  isPlaceSelected: (id: string | number) => boolean;
  isOpen: boolean;
}

const CategoryResultPanel: React.FC<CategoryResultPanelProps> = ({
  category,
  regions,
  keywords,
  onClose,
  onSelectPlace,
  isPlaceSelected,
  isOpen
}) => {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [tempSelectedPlaces, setTempSelectedPlaces] = useState<Place[]>([]);
  const { panTo, addMarkers, clearMarkersAndUiElements } = useMapContext();
  
  // 안전하게 regions 배열을 처리 - regions가 undefined일 경우 빈 배열 사용
  const safeRegions = Array.isArray(regions) ? regions : [];
  
  // useCategoryResults에 regions 대신 safeRegions 전달
  const { isLoading, error, recommendedPlaces, normalPlaces } = useCategoryResults(category, keywords, safeRegions);

  // 컴포넌트가 마운트되거나 카테고리/키워드/지역이 변경될 때 선택 상태 초기화
  useEffect(() => {
    setTempSelectedPlaces([]);
  }, [category, keywords.join(','), regions.join(',')]);

  useEffect(() => {
    clearMarkersAndUiElements();
    
    if (recommendedPlaces.length > 0) {
      console.log(`[CategoryResultPanel] 장소 표시: ${recommendedPlaces.length}개 추천 장소 (지역: ${safeRegions.join(', ')})`);
      
      // 첫번째 장소가 있으면 지도 중앙을 해당 위치로 이동
      if (recommendedPlaces[0] && recommendedPlaces[0].x && recommendedPlaces[0].y) {
        panTo({ lat: recommendedPlaces[0].y, lng: recommendedPlaces[0].x });
      } else if (safeRegions.length > 0) {
        // 장소가 없으면 선택된 지역으로 이동
        panTo(safeRegions[0]);
      }
      
      addMarkers(recommendedPlaces, { useRecommendedStyle: true });
      
      // Log successful places loaded
      console.log(`장소 로딩 완료: 추천 장소 ${recommendedPlaces.length}개, 주변 장소 ${normalPlaces.length}개`);
    }
  }, [recommendedPlaces, normalPlaces, safeRegions, clearMarkersAndUiElements, panTo, addMarkers]);

  const handleViewDetails = (place: Place) => {
    setSelectedPlace(place);
    if (place.x && place.y) {
      clearMarkersAndUiElements();
      addMarkers([place], { highlight: true });
      panTo({ lat: place.y, lng: place.x });
    }
  };

  // 임시 선택 상태를 관리하는 함수
  const handleTempSelectPlace = (place: Place, checked: boolean) => {
    if (checked) {
      setTempSelectedPlaces(prev => [...prev.filter(p => p.id !== place.id), place]);
    } else {
      setTempSelectedPlaces(prev => prev.filter(p => p.id !== place.id));
    }
  };

  // 임시 선택 여부 확인 함수
  const isTempSelected = (id: string | number): boolean => {
    return tempSelectedPlaces.some(p => p.id === id) || isPlaceSelected(id);
  };

  // 확인 버튼 클릭 시 모든 임시 선택 항목을 실제 선택으로 적용
  const handleConfirmSelection = () => {
    console.log(`[카테고리 결과] ${category} 카테고리에서 ${tempSelectedPlaces.length}개 장소 선택 확인`);
    
    // 선택한 모든 임시 장소를 실제 선택으로 적용
    tempSelectedPlaces.forEach(place => {
      if (!isPlaceSelected(place.id)) {
        onSelectPlace(place, true);
      }
    });
    
    // 선택 완료 후 패널 닫기
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
                places={recommendedPlaces}
                title={`🌟 추천 장소 (${safeRegions.join(', ')})`}
                isLoading={isLoading}
                selectedPlaces={tempSelectedPlaces}
                onSelectPlace={handleTempSelectPlace}
                onViewOnMap={handleViewDetails}
                isPlaceSelected={isTempSelected}
              />
              
              {normalPlaces.length > 0 && (
                <PlaceListingView
                  places={normalPlaces}
                  title="📍 주변 장소"
                  isLoading={isLoading}
                  selectedPlaces={tempSelectedPlaces}
                  onSelectPlace={handleTempSelectPlace}
                  onViewOnMap={handleViewDetails}
                  isPlaceSelected={isTempSelected}
                />
              )}
            </>
          )}
        </div>

        {/* 확인 및 취소 버튼 */}
        <div className="p-4 border-t border-gray-200 flex justify-between">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-1/3"
          >
            취소
          </Button>
          
          <Button 
            variant="default"
            onClick={handleConfirmSelection}
            className="w-2/3 ml-2 bg-jeju-green hover:bg-jeju-green/80"
            disabled={tempSelectedPlaces.length === 0}
          >
            <Check className="h-4 w-4 mr-2" />
            {tempSelectedPlaces.length}개 장소 확인
          </Button>
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
