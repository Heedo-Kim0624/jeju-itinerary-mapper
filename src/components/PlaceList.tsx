import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, MapPin, Star, MessageCircle, Clock, ArrowUpDown, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils";

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

interface Place {
  id: string;
  name: string;
  address?: string;
  category: string;
  rating?: number;
  reviewCount?: number;
  operatingHours?: string;
  naverLink?: string;
  instaLink?: string;
  x: number;
  y: number;
}

interface ItineraryDay {
  day: number;
  places: Place[];
  totalDistance?: number;
}

interface ScheduleTable {
  [dayHour: string]: Place | null;
}

type SortOption = "recommendation" | "rating" | "reviews";

const sortPlacesByIds = (places: Place[], orderedIds: string[]): Place[] => {
  const placeMap = places.reduce((map, place) => {
    map[place.id] = place;
    return map;
  }, {} as Record<string, Place>);
  
  return orderedIds
    .filter(id => placeMap[id])
    .map(id => placeMap[id]);
};

const PlaceList: React.FC<PlaceListProps> = ({
  places,
  loading,
  onSelectPlace,
  selectedPlace,
  page,
  onPageChange,
  totalPages,
  orderedIds = []
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedPlaces, setSelectedPlaces] = useState<Record<string, boolean>>({});
  const [sortOption, setSortOption] = useState<SortOption>("recommendation");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedPlacesArray, setSelectedPlacesArray] = useState<Place[]>([]);

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

  useEffect(() => {
    const selected = places.filter(place => selectedPlaces[place.id]);
    setSelectedPlacesArray(selected);
  }, [selectedPlaces, places]);

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

  const handleComboboxItemSelect = (place: Place) => {
    setSelectedPlaces(prev => ({
      ...prev,
      [place.id]: !prev[place.id]
    }));
    
    onSelectPlace(place);
    setComboboxOpen(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jeju-green mb-4"></div>
        <p className="text-sm text-muted-foreground">장소 정보를 불러오는 중...</p>
      </div>
    );
  }

  const itemsPerPage = 10;
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, sortedPlaces.length);
  const currentPlaces = sortedPlaces.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push(0); // Represent ellipsis
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push(0); // Represent ellipsis
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(0); // Represent ellipsis
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i);
        }
        pages.push(0); // Represent ellipsis
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

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
          <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs justify-between">
                선택된 장소 ({selectedPlacesArray.length})
                <ArrowUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="end">
              <Command>
                <CommandInput placeholder="장소 검색" className="h-8 text-xs" />
                <CommandList>
                  <CommandEmpty>선택된 장소가 없습니다</CommandEmpty>
                  <CommandGroup>
                    {places.map((place) => (
                      <CommandItem
                        key={place.id}
                        value={place.id}
                        onSelect={() => handleComboboxItemSelect(place)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3 w-3",
                            selectedPlaces[place.id] ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="text-xs truncate">{place.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        
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
      </div>
      
      <div className="mb-2">
        <ScrollArea className="h-[calc(100vh-280px)] md:h-[calc(100vh-350px)]">
          {currentPlaces.map((place) => (
            <Card
              key={place.id}
              className={`mb-2 cursor-pointer overflow-hidden transition ${
                selectedPlaces[place.id] ? 'ring-2 ring-jeju-green' : ''
              }`}
              onClick={() => handlePlaceClick(place)}
            >
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span 
                        className={`${categoryColors[place.category].bg} ${categoryColors[place.category].text} text-[10px] rounded-sm px-1.5 py-0.5`}
                      >
                        {getCategoryName(place.category)}
                      </span>
                      <h3 className="text-sm font-medium truncate">{place.name}</h3>
                    </div>
                    
                    {place.address && (
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{place.address}</span>
                      </div>
                    )}
                    
                    {place.operatingHours && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{place.operatingHours}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mt-1.5">
                      {place.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-400" />
                          <span className="text-xs font-medium">{place.rating}</span>
                        </div>
                      )}
                      
                      {place.reviewCount && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageCircle className="h-3 w-3" />
                          <span>{place.reviewCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1 ml-2">
                    {place.naverLink && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        asChild
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <a href={place.naverLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                    
                    {place.instaLink && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        asChild
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <a href={place.instaLink} target="_blank" rel="noopener noreferrer">
                          <Instagram className="h-3 w-3 text-pink-500" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </ScrollArea>
      </div>
      
      {totalPages > 1 && (
        <Pagination className="mt-2">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                className="cursor-pointer" 
                onClick={() => page > 1 && onPageChange(page - 1)}
                tabIndex={0}
              />
            </PaginationItem>
            
            {getPageNumbers().map((pageNumber, i) => (
              pageNumber === 0 ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
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
                className="cursor-pointer"
                onClick={() => page < totalPages && onPageChange(page + 1)}
                tabIndex={0}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default PlaceList;
