
import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Place } from '@/types/supabase';
import PlaceCard from './PlaceCard';
import PlacePagination from './PlacePagination';
import PlaceSortControls from './PlaceSortControls';
import { sortByWeightDescending, paginateArray, calculateTotalPages } from '@/lib/utils';

interface PlaceListProps {
  places: Place[];
  loading: boolean;
  onSelectPlace: (place: Place) => void;
  selectedPlace: Place | null;
  page: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  orderedIds?: string[];
  selectedPlaces?: Place[];
  onViewDetails: (place: Place) => void;
}

const PlaceList: React.FC<PlaceListProps> = ({
  places,
  loading,
  onSelectPlace,
  selectedPlace,
  page,
  onPageChange,
  totalPages,
  orderedIds = [],
  selectedPlaces = [],
  onViewDetails,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sortOption, setSortOption] = useState<'recommendation' | 'rating' | 'reviews'>('recommendation');

  // 데이터 검증 로그
  useEffect(() => {
    if (places.length > 0) {
      console.log('PlaceList - 첫 번째 장소 데이터:', {
        id: places[0].id,
        name: places[0].name,
        rating: places[0].rating,
        reviewCount: places[0].reviewCount,
        weight: places[0].weight
      });
      console.log(`총 장소 수: ${places.length}, 한 페이지에 20개씩 표시, 총 페이지 수: ${Math.ceil(places.length / 20)}`);
    }
  }, [places]);

  // 페이지 변경 시 스크롤 맨 위로
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [page]);

  // places 데이터에서 정렬 옵션에 따라 정렬된 전체 장소 목록을 준비
  const sortedPlaces = React.useMemo(() => {
    let result = [...places].filter(place => place && place.name);
    
    if (sortOption === 'recommendation') {
      // 가중치(weight) 기준 정렬
      return sortByWeightDescending(result);
    }
    if (sortOption === 'rating') {
      return result.sort((a, b) => {
        // 별점 기준 내림차순, 동일 별점은 가중치로 정렬
        const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
        return ratingDiff !== 0 ? ratingDiff : ((b.weight ?? 0) - (a.weight ?? 0));
      });
    }
    if (sortOption === 'reviews') {
      return result.sort((a, b) => {
        // 리뷰 수 기준 내림차순, 동일 리뷰 수는 가중치로 정렬
        const reviewDiff = (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
        return reviewDiff !== 0 ? reviewDiff : ((b.weight ?? 0) - (a.weight ?? 0));
      });
    }
    return result;
  }, [places, sortOption]);

  const handleCheckboxChange = (place: Place, checked: boolean) => {
    if (checked) onSelectPlace(place);
  };

  // 한 페이지에 표시할 아이템 수
  const itemsPerPage = 20;
  
  // 현재 페이지에 표시할 장소 목록
  const currentPagePlaces = paginateArray(sortedPlaces, itemsPerPage, page);
  
  // 총 페이지 수 계산
  const calculatedTotalPages = calculateTotalPages(sortedPlaces.length, itemsPerPage);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jeju-green mb-4"></div>
        <p className="text-sm text-muted-foreground">장소 정보를 불러오는 중...</p>
        <p className="text-xs text-muted-foreground mt-2">잠시만 기다려주세요...</p>
      </div>
    );
  }

  if (sortedPlaces.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center h-[40vh] text-muted-foreground">
        <p>장소를 검색하거나 카테고리를 선택해주세요</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col h-full">
      <PlaceSortControls
        sortOption={sortOption}
        onSortChange={(value) => setSortOption(value as typeof sortOption)}
        totalPlaces={sortedPlaces.length}
      />

      <ScrollArea ref={scrollRef} className="flex-1 pr-2">
        <div className="space-y-2">
          {currentPagePlaces.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              isSelected={selectedPlaces?.some(p => p.id === place.id) || false}
              onSelect={handleCheckboxChange}
              onClick={() => onSelectPlace(place)}
              onViewDetails={() => onViewDetails(place)}
            />
          ))}
        </div>
      </ScrollArea>

      <PlacePagination
        currentPage={page}
        totalPages={calculatedTotalPages}
        onPageChange={onPageChange}
      />

      <div className="flex gap-2 mt-3">
        <Button variant="outline" size="sm" className="flex-1">
          <RefreshCw className="h-4 w-4 mr-1" /> 목록 새로고침
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          <Filter className="h-4 w-4 mr-1" /> 필터 설정
        </Button>
      </div>
    </div>
  );
};

export default PlaceList;
