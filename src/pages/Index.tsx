import React, { useState, useEffect } from 'react';
import { CalendarIcon, Search, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import Map from '@/components/Map';
import DatePicker from '@/components/DatePicker';
import PlaceList from '@/components/PlaceList';
import ItineraryView from '@/components/ItineraryView';
import { toast } from 'sonner';

const DEFAULT_PROMPT = '';

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
    [key: string]: number;
  };
  nodeId?: string;
}

interface ItineraryDay {
  day: number;
  places: Place[];
  totalDistance: number;
}

interface ScheduleTable {
  [dayHour: string]: Place | null;
}

const generateMockPlaces = (category: string, count: number): Place[] => {
  const categories = {
    restaurant: '음식점',
    cafe: '카페',
    attraction: '관광지',
    accommodation: '숙소'
  };
  
  const result: Place[] = [];
  
  for (let i = 1; i <= count; i++) {
    let xOffset = 0, yOffset = 0;
    switch(category) {
      case 'restaurant': xOffset = 0.02; yOffset = 0.01; break;
      case 'cafe': xOffset = -0.02; yOffset = 0.02; break;
      case 'attraction': xOffset = 0.01; yOffset = -0.01; break;
      case 'accommodation': xOffset = -0.01; yOffset = -0.02; break;
    }
    
    result.push({
      id: `${category}-${i}`,
      name: `${categories[category as keyof typeof categories]} ${i}`,
      address: `제주시 ${category} 거리 ${i}번길`,
      operatingHours: '09:00 - 21:00',
      naverLink: 'https://map.naver.com',
      instaLink: 'https://instagram.com',
      rating: 3.5 + Math.random() * 1.5,
      reviewCount: Math.floor(Math.random() * 200) + 10,
      category,
      x: 126.5311884 + xOffset + (Math.random() * 0.1 - 0.05),
      y: 33.3846216 + yOffset + (Math.random() * 0.1 - 0.05)
    });
  }
  
  return result;
};

const createEmptyScheduleTable = (startDate: Date, startTime: string, endDate: Date, endTime: string): ScheduleTable => {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const hours = Array.from({ length: 13 }, (_, i) => i + 9);
  const table: ScheduleTable = {};

  const startDay = days[startDate.getDay()];
  const endDay = days[endDate.getDay()];
  const [startHour] = startTime.split(':').map(Number);
  const [endHour] = endTime.split(':').map(Number);
  
  days.forEach(day => {
    hours.forEach(hour => {
      const key = `${day}_${hour}시`;
      table[key] = null;
    });
  });
  
  return table;
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

const createItinerary = (places: Place[], startDate: Date, endDate: Date, startTime: string, endTime: string): ItineraryDay[] => {
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const numDays = Math.max(1, daysDiff);
  
  const scheduleTable = createEmptyScheduleTable(startDate, startTime, endDate, endTime);
  
  const placesByCategory: Record<string, Place[]> = {};
  places.forEach(place => {
    if (!placesByCategory[place.category]) {
      placesByCategory[place.category] = [];
    }
    placesByCategory[place.category].push(place);
  });
  
  const itinerary: ItineraryDay[] = [];
  
  const calculateDistance = (p1: Place, p2: Place) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy) * 111;
  };
  
  const findNearestPlace = (currentPlace: Place, remainingPlaces: Place[]): Place | null => {
    if (remainingPlaces.length === 0) return null;
    
    let nearestPlace = remainingPlaces[0];
    let minDistance = calculateDistance(currentPlace, nearestPlace);
    
    for (let i = 1; i < remainingPlaces.length; i++) {
      const distance = calculateDistance(currentPlace, remainingPlaces[i]);
      if (distance < minDistance) {
        minDistance = distance;
        nearestPlace = remainingPlaces[i];
      }
    }
    
    return nearestPlace;
  };
  
  const placesPerDay = Math.ceil(places.length / numDays);
  
  for (let day = 1; day <= numDays; day++) {
    const dayPlaces: Place[] = [];
    let totalDistance = 0;
    let remainingPlaces = [...places];
    
    itinerary.forEach(dayItinerary => {
      dayItinerary.places.forEach(place => {
        remainingPlaces = remainingPlaces.filter(p => p.id !== place.id);
      });
    });
    
    if (remainingPlaces.length > 0) {
      let currentPlace = remainingPlaces.find(p => p.category === 'accommodation') || remainingPlaces[0];
      dayPlaces.push(currentPlace);
      remainingPlaces = remainingPlaces.filter(p => p.id !== currentPlace.id);
      
      while (dayPlaces.length < placesPerDay && remainingPlaces.length > 0) {
        const nearest = findNearestPlace(currentPlace, remainingPlaces);
        if (nearest) {
          totalDistance += calculateDistance(currentPlace, nearest);
          currentPlace = nearest;
          dayPlaces.push(currentPlace);
          remainingPlaces = remainingPlaces.filter(p => p.id !== currentPlace.id);
        } else {
          break;
        }
      }
      
      if (dayPlaces.length > 1) {
        totalDistance += calculateDistance(dayPlaces[dayPlaces.length - 1], dayPlaces[0]);
      }
      
      itinerary.push({
        day,
        places: dayPlaces,
        totalDistance
      });
    }
  }
  
  return itinerary;
};

const Index: React.FC = () => {
  const [dateRange, setDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
    startTime: string;
    endTime: string;
  }>({
    startDate: null,
    endDate: null,
    startTime: '10:00',
    endTime: '18:00',
  });
  
  const [promptText, setPromptText] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(20);
  
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number | null>(null);
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  
  useEffect(() => {
    const allPlaces = [
      ...generateMockPlaces('restaurant', 200),
      ...generateMockPlaces('cafe', 200),
      ...generateMockPlaces('attraction', 200),
      ...generateMockPlaces('accommodation', 200)
    ];
    setPlaces(allPlaces);
    setFilteredPlaces(allPlaces);
  }, []);
  
  const handleDatesSelected = (dates: {
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
  }) => {
    setDateRange({
      startDate: dates.startDate,
      endDate: dates.endDate,
      startTime: dates.startTime,
      endTime: dates.endTime,
    });
  };
  
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPromptText(e.target.value);
  };
  
  const handleCategoryClick = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
      setFilteredPlaces(places);
    } else {
      setSelectedCategory(category);
      const filtered = places.filter(place => place.category === category);
      setFilteredPlaces(filtered);
    }
    setCurrentPage(1);
  };
  
  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place);
    
    setSelectedPlaces(prev => {
      const alreadySelected = prev.some(p => p.id === place.id);
      if (alreadySelected) {
        return prev.filter(p => p.id !== place.id);
      } else {
        return [...prev, place];
      }
    });
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleSearch = async () => {
    setLoading(true);
    
    try {
      setTimeout(() => {
        let result = [...places];
        
        if (selectedCategory) {
          result = result.filter(place => place.category === selectedCategory);
        }
        
        result.sort((a, b) => b.rating - a.rating);
        
        setFilteredPlaces(result);
        setLoading(false);
        setCurrentPage(1);
        
        toast.success('검색이 완료되었습니다');
      }, 1000);
    } catch (error) {
      console.error('Error during search:', error);
      toast.error('검색 중 오류가 발생했습니다');
      setLoading(false);
    }
  };
  
  const handleCreateItinerary = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      toast.error('여행 날짜를 먼저 선택해주세요');
      return;
    }
    
    setLoading(true);
    
    setTimeout(() => {
      const placesToUse = selectedPlaces.length > 0 ? selectedPlaces : filteredPlaces;
      
      const generatedItinerary = createItinerary(
        placesToUse,
        dateRange.startDate,
        dateRange.endDate,
        dateRange.startTime,
        dateRange.endTime
      );
      
      setItinerary(generatedItinerary);
      setSelectedItineraryDay(1);
      setShowItinerary(true);
      setLoading(false);
      
      toast.success('일정이 생성되었습니다');
    }, 1500);
  };
  
  const handleSelectItineraryDay = (day: number) => {
    setSelectedItineraryDay(day);
  };
  
  const getCurrentPlaces = () => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredPlaces.slice(indexOfFirstItem, indexOfLastItem);
  };
  
  const totalPages = Math.ceil(filteredPlaces.length / itemsPerPage);
  
  return (
    <div className="flex h-screen overflow-hidden bg-jeju-light-gray">
      <div className="w-[30%] h-full p-4 flex flex-col">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 animate-fade-in">
          <h2 className="text-lg font-medium mb-4">제주도 여행 플래너</h2>
          
          <div className="mb-4">
            <DatePicker onDatesSelected={handleDatesSelected} />
          </div>
          
          <div className="mb-4">
            <Textarea
              placeholder="검색 프롬프트를 입력하세요"
              className="min-h-24 text-sm"
              value={promptText}
              onChange={handlePromptChange}
            />
            <Button 
              className="w-full mt-2"
              onClick={handleSearch}
              disabled={loading}
            >
              <Search className="h-4 w-4 mr-2" />
              검색
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              className={`category-btn ${selectedCategory === 'restaurant' ? 'active' : ''}`}
              onClick={() => handleCategoryClick('restaurant')}
            >
              음식점
            </button>
            <button
              className={`category-btn ${selectedCategory === 'cafe' ? 'active' : ''}`}
              onClick={() => handleCategoryClick('cafe')}
            >
              카페
            </button>
            <button
              className={`category-btn ${selectedCategory === 'attraction' ? 'active' : ''}`}
              onClick={() => handleCategoryClick('attraction')}
            >
              관광지
            </button>
            <button
              className={`category-btn ${selectedCategory === 'accommodation' ? 'active' : ''}`}
              onClick={() => handleCategoryClick('accommodation')}
            >
              숙소
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 flex-1 flex flex-col animate-fade-in" style={{ animationDelay: '100ms' }}>
          {!showItinerary ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">장소 목록</h2>
                {!loading && filteredPlaces.length > 0 && !showItinerary && (
                  <Button 
                    onClick={handleCreateItinerary}
                    disabled={!dateRange.startDate || !dateRange.endDate}
                  >
                    일정 생성
                  </Button>
                )}
              </div>
              <PlaceList
                places={filteredPlaces}
                loading={loading}
                onSelectPlace={handlePlaceSelect}
                selectedPlace={selectedPlace}
                page={currentPage}
                onPageChange={handlePageChange}
                totalPages={totalPages}
              />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">일정</h2>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowItinerary(false);
                    setItinerary(null);
                    setSelectedItineraryDay(null);
                  }}
                >
                  장소 목록으로 돌아가기
                </Button>
              </div>
              {itinerary && dateRange.startDate && (
                <ItineraryView
                  itinerary={itinerary}
                  startDate={dateRange.startDate}
                  onSelectDay={handleSelectItineraryDay}
                  selectedDay={selectedItineraryDay}
                />
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="w-[70%] h-full p-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <div className="w-full h-full rounded-lg overflow-hidden shadow-lg bg-white">
          <Map
            places={filteredPlaces}
            selectedPlace={selectedPlace}
            itinerary={itinerary}
            selectedDay={selectedItineraryDay}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
