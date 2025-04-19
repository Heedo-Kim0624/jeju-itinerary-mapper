// middlepanel/PlaceList.tsx (이 행 삭제 금지)
import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, MapPin, Star, MessageCircle, Clock, Instagram, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { categoryColors, getCategoryName } from '@/utils/categoryColors';
import { Place } from '@/types/supabase';

interface PlaceListProps {
  places: Place[];
  loading: boolean;
  onSelectPlace: (place: Place) => void;
  selectedPlace: Place | null;
  page: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  orderedIds?: string[];
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
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedPlaces, setSelectedPlaces] = useState<Record<string, boolean>>({});
  const [sortOption, setSortOption] = useState<'recommendation' | 'rating' | 'reviews'>('recommendation');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [page]);

  useEffect(() => {
    if (selectedPlace) {
      setSelectedPlaces(prev => ({
        ...prev,
        [selectedPlace.id]: !prev[selectedPlace.id]
      }));
    }
  }, [selectedPlace]);

  const sortedPlaces = React.useMemo(() => {
    let result = [...places];
    if (sortOption === 'recommendation' && orderedIds.length > 0) {
      const placeMap = Object.fromEntries(result.map(p => [p.id, p]));
      return orderedIds.filter(id => placeMap[id]).map(id => placeMap[id]);
    }
    if (sortOption === 'rating') {
      return result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    if (sortOption === 'reviews') {
      return result.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
    }
    return result;
  }, [places, orderedIds, sortOption]);

  const handleCheckboxChange = (place: Place, checked: boolean) => {
    setSelectedPlaces(prev => ({
      ...prev,
      [place.id]: checked
    }));
    if (checked) onSelectPlace(place);
  };

  const handleRefreshList = () => console.log('목록 새로고침');
  const handleFilterPlaces = () => console.log('장소 필터링');

  const itemsPerPage = 10;
  const currentPlaces = sortedPlaces.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const getPageNumbers = () => {
    const max = 5;
    if (totalPages <= max) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, 0, totalPages];
    if (page >= totalPages - 2) return [1, 0, ...Array.from({ length: 4 }, (_, i) => totalPages - 3 + i)];
    return [1, 0, page - 1, page, page + 1, 0, totalPages];
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jeju-green mb-4"></div>
        <p className="text-sm text-muted-foreground">장소 정보를 불러오는 중...</p>
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
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] text-muted-foreground">
          검색 결과: {sortedPlaces.length}개의 장소
        </div>
        <div className="flex items-center gap-2">
          <Select value={sortOption} onValueChange={(v) => setSortOption(v as any)}>
            <SelectTrigger className="w-[130px] h-7 text-xs">
              <SelectValue placeholder="정렬 기준" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recommendation" className="text-xs">추천순</SelectItem>
              <SelectItem value="rating" className="text-xs">별점순</SelectItem>
              <SelectItem value="reviews" className="text-xs">리뷰순</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 pr-2">
        <div className="space-y-2">
          {currentPlaces.map((place) => (
            <Card key={place.id} className="overflow-hidden cursor-pointer">
              <CardContent className="p-3" onClick={() => onSelectPlace(place)}>
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!!selectedPlaces[place.id]}
                      onCheckedChange={(checked) => handleCheckboxChange(place, checked === true)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className={`text-[10px] rounded-sm px-1.5 py-0.5 ${categoryColors[place.category]?.bg || 'bg-gray-200'} ${categoryColors[place.category]?.text || 'text-gray-800'}`}>
                      {getCategoryName(place.category)}
                    </span>
                    <h3 className="text-sm font-medium truncate">{place.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    {place.rating && (
                      <div className="flex items-center gap-1 text-xs text-amber-500">
                        <Star className="w-3 h-3" />
                        {place.rating.toFixed(1)}
                      </div>
                    )}
                    {place.reviewCount && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageCircle className="w-3 h-3" />
                        {place.reviewCount}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {place.address && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{place.address}</span>
                    </div>
                  )}
                  {place.operatingHours && (
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {place.operatingHours}
                    </div>
                  )}
                  {place.categoryDetail && (
                    <Badge variant="outline" className="mt-1 text-[10px] h-4 px-1">
                      {place.categoryDetail}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                className={cn('cursor-pointer', page <= 1 ? 'opacity-50 pointer-events-none' : '')}
                onClick={() => page > 1 && onPageChange(page - 1)}
              />
            </PaginationItem>

            {getPageNumbers().map((pageNumber, i) => (
              pageNumber === 0 ? (
                <PaginationItem key={`ellipsis-${i}`}><PaginationEllipsis /></PaginationItem>
              ) : (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    isActive={pageNumber === page}
                    onClick={() => onPageChange(pageNumber)}
                    className="cursor-pointer"
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              )
            ))}

            <PaginationItem>
              <PaginationNext
                className={cn('cursor-pointer', page >= totalPages ? 'opacity-50 pointer-events-none' : '')}
                onClick={() => page < totalPages && onPageChange(page + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* 목록 새로고침 & 필터 버튼 */}
      <div className="flex gap-2 mt-3">
        <Button variant="outline" size="sm" className="flex-1" onClick={handleRefreshList}>
          <RefreshCw className="h-4 w-4 mr-1" /> 목록 새로고침
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={handleFilterPlaces}>
          <Filter className="h-4 w-4 mr-1" /> 필터 설정
        </Button>
      </div>
    </div>
  );
};

export default PlaceList;
