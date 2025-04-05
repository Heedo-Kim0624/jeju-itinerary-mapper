
import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, MapPin, Star, MessageCircle, Clock, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { categoryColors, getCategoryName } from '@/utils/categoryColors';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PlaceListProps {
  places: Place[];
  loading: boolean;
  onSelectPlace: (place: Place) => void;
  selectedPlace: Place | null;
  page: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  orderedIds?: string[]; // 프롬프트에서 정렬된 ID 순서
}

interface Place {
  id: string;
  name: string;
  address: string;
  operatingHours: string;
  naverLink: string;
  instaLink: string;
  rating: number;
  reviewCount: number;
  category: string;
  x: number;
  y: number;
  operationTimeData?: {
    [key: string]: number; // 요일_시간: 0(영업안함), 1(영업중), 999(정보없음)
  };
  nodeId?: string; // OSM 노드 ID
}

interface ScheduleTable {
  [dayHour: string]: Place | null; // 요일_시간: Place 객체 또는 null
}

type SortOption = "recommendation" | "rating" | "reviews";

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
  const [sortOption, setSortOption] = useState<SortOption>("recommendation");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [page]);

  useEffect(() => {
    if (selectedPlace) {
      setSelectedPlaces(prev => ({
        ...prev,
        [selectedPlace.id]: true
      }));
    }
  }, [selectedPlace]);

  const sortedPlaces = React.useMemo(() => {
    let result = [...places];
    
    if (sortOption === "recommendation" && orderedIds.length > 0) {
      return sortPlacesByIds(places, orderedIds);
    } else if (sortOption === "rating") {
      return [...places].sort((a, b) => b.rating - a.rating);
    } else if (sortOption === "reviews") {
      return [...places].sort((a, b) => b.reviewCount - a.reviewCount);
    }
    
    return places;
  }, [places, orderedIds, sortOption]);

  const handlePlaceClick = (place: Place) => {
    setSelectedPlaces(prev => ({
      ...prev,
      [place.id]: !prev[place.id]
    }));
    onSelectPlace(place);
  };

  const sortPlacesByIds = (places: Place[], orderedIds: string[]): Place[] => {
    const placeMap = places.reduce((map, place) => {
      map[place.id] = place;
      return map;
    }, {} as Record<string, Place>);
    
    return orderedIds
      .filter(id => placeMap[id])
      .map(id => placeMap[id]);
  };

  const getPageNumbersToShow = (): number[] => {
    const groupSize = 5;
    const currentGroup = Math.floor((page - 1) / groupSize);
    const startPage = currentGroup * groupSize + 1;
    const endPage = Math.min(startPage + groupSize - 1, totalPages);
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center h-[40vh]">
        <div className="animate-pulse">
          <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 w-full bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
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

  const currentPagePlaces = sortedPlaces.slice((page - 1) * 20, page * 20);
  const pageNumbers = getPageNumbersToShow();
  const currentGroup = Math.floor((page - 1) / 5);
  const hasNextGroup = (currentGroup + 1) * 5 < totalPages;
  const hasPrevGroup = currentGroup > 0;

  return (
    <div className="w-full flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] text-muted-foreground">
          검색 결과: {sortedPlaces.length}개의 장소
        </div>
        
        <Select
          value={sortOption}
          onValueChange={(value) => setSortOption(value as SortOption)}
        >
          <SelectTrigger className="w-[130px] h-7 text-xs">
            <SelectValue placeholder="정렬 기준" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recommendation" className="text-xs">추천순</SelectItem>
            <SelectItem value="rating" className="text-xs">별점순</SelectItem>
            <SelectItem value="reviews" className="text-xs">리뷰많은순</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="mb-2">
        <Pagination className="justify-start">
          <PaginationContent className="gap-2">
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => {
                  if (page > 1) {
                    onPageChange(page - 1);
                  } else if (hasPrevGroup) {
                    onPageChange(currentGroup * 5);
                  }
                }} 
                className={`h-8 min-w-[4rem] text-xs ${page === 1 && !hasPrevGroup ? "pointer-events-none opacity-50" : ""}`} 
              />
            </PaginationItem>
            
            {pageNumbers.map((pageNum) => (
              <PaginationItem key={pageNum}>
                <PaginationLink 
                  isActive={pageNum === page}
                  onClick={() => onPageChange(pageNum)}
                  className="h-8 w-8 text-sm font-medium"
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => {
                  if (page < totalPages) {
                    onPageChange(page + 1);
                  } else if (hasNextGroup) {
                    onPageChange((currentGroup + 1) * 5 + 1);
                  }
                }} 
                className={`h-8 min-w-[4rem] text-xs ${page === totalPages && !hasNextGroup ? "pointer-events-none opacity-50" : ""}`} 
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
      
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="space-y-1 pr-1 pb-1">
          {currentPagePlaces.map((place) => (
            <div
              key={place.id}
              className={`place-item px-2 py-2 border rounded hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedPlaces[place.id] 
                  ? `bg-${place.category === 'restaurant' ? 'jeju-orange' : place.category === 'cafe' ? 'jeju-green' : place.category === 'attraction' ? 'jeju-blue' : 'purple-500'}/10 border-${place.category === 'restaurant' ? 'jeju-orange' : place.category === 'cafe' ? 'jeju-green' : place.category === 'attraction' ? 'jeju-blue' : 'purple-500'}/30` 
                  : ''
              }`}
              onClick={() => handlePlaceClick(place)}
            >
              <div className="flex items-start gap-2">
                <div className="flex items-center justify-center pt-0.5">
                  <Checkbox 
                    checked={selectedPlaces[place.id] || false}
                    onCheckedChange={() => handlePlaceClick(place)}
                    className={`${
                      place.category === 'restaurant' ? 'data-[state=checked]:bg-jeju-orange data-[state=checked]:border-jeju-orange' : 
                      place.category === 'cafe' ? 'data-[state=checked]:bg-jeju-green data-[state=checked]:border-jeju-green' : 
                      place.category === 'attraction' ? 'data-[state=checked]:bg-jeju-blue data-[state=checked]:border-jeju-blue' : 
                      'data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500'
                    } h-3.5 w-3.5`}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-xs line-clamp-1">{place.name}</h3>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="text-[10px]">{place.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-[10px] text-muted-foreground mt-1 gap-0.5">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{place.address}</span>
                  </div>
                  
                  <div className="flex items-center text-[10px] text-muted-foreground mt-0.5 gap-0.5">
                    <Clock className="h-3 w-3" />
                    <span className="truncate">{place.operatingHours}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <MessageCircle className="h-3 w-3" />
                      <span>리뷰 {place.reviewCount}개</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <span 
                        className={`text-[9px] px-1.5 py-0.5 rounded-full ${categoryColors[place.category]?.bg || 'bg-gray-100'} ${categoryColors[place.category]?.text || 'text-gray-800'}`}
                      >
                        {getCategoryName(place.category)}
                      </span>
                      
                      {place.naverLink && (
                        <a
                          href={place.naverLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[9px] text-blue-500 hover:underline flex items-center gap-0.5"
                        >
                          <ExternalLink className="h-3 w-3" />
                          네이버
                        </a>
                      )}
                      
                      {place.instaLink && (
                        <a
                          href={place.instaLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[9px] text-purple-500 hover:underline flex items-center gap-0.5"
                        >
                          <ExternalLink className="h-3 w-3" />
                          인스타
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlaceList;
