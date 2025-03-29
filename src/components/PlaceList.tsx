
import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, MapPin, Star, MessageCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
    if (orderedIds.length > 0) {
      return sortPlacesByIds(places, orderedIds);
    }
    return places;
  }, [places, orderedIds]);

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
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="animate-pulse">
          <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 w-full bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (sortedPlaces.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
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
    <div className="w-full h-full flex flex-col">
      <div className="text-sm text-muted-foreground mb-1">
        검색 결과: {sortedPlaces.length}개의 장소
      </div>
      
      <div className="mb-2">
        <Pagination className="justify-start">
          <PaginationContent className="gap-0.5">
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => {
                  if (page > 1) {
                    onPageChange(page - 1);
                  } else if (hasPrevGroup) {
                    onPageChange(currentGroup * 5);
                  }
                }} 
                className={`h-7 min-w-7 px-1 text-xs ${page === 1 && !hasPrevGroup ? "pointer-events-none opacity-50" : ""}`} 
              />
            </PaginationItem>
            
            {pageNumbers.map((pageNum) => (
              <PaginationItem key={pageNum}>
                <PaginationLink 
                  isActive={pageNum === page}
                  onClick={() => onPageChange(pageNum)}
                  className="h-7 w-7 text-xs"
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
                className={`h-7 min-w-7 px-1 text-xs ${page === totalPages && !hasNextGroup ? "pointer-events-none opacity-50" : ""}`} 
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ScrollArea ref={scrollRef} className="h-[calc(100vh-400px)] w-full">
          <div className="space-y-2 pr-2 pb-4">
            {currentPagePlaces.map((place) => (
              <div
                key={place.id}
                className={`place-item p-2 border rounded hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedPlaces[place.id] ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => handlePlaceClick(place)}
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-sm">{place.name}</h3>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="h-3 w-3 fill-current" />
                    <span className="text-xs">{place.rating.toFixed(1)}</span>
                  </div>
                </div>
                
                <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{place.address}</span>
                </div>
                
                <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{place.operatingHours}</span>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageCircle className="h-3 w-3" />
                    <span>리뷰 {place.reviewCount}개</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {place.naverLink && (
                      <a
                        href={place.naverLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1"
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
                        className="text-xs text-purple-500 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        인스타
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default PlaceList;
