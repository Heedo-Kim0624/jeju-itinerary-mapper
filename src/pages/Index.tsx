import React, { useState, useEffect, useRef } from 'react';
import { CalendarIcon, Search, MapPin, Clock, ArrowLeft, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import Map from '@/components/Map';
import DatePicker from '@/components/DatePicker';
import PlaceList from '@/components/PlaceList';
import ItineraryView from '@/components/ItineraryView';
import DaySelector from '@/components/DaySelector';
import { toast } from 'sonner';
import { categoryColors, getCategoryName } from '@/utils/categoryColors';
import { useIsMobile } from '@/hooks/use-mobile';
import { fetchRestaurants, fetchAccommodations, fetchLandmarks } from '@/services/restaurantService';

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
  
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [hasCategorySelected, setHasCategorySelected] = useState<boolean>(false);
  
  const { isMobile, isPortrait, isLandscape } = useIsMobile();
  const [mobileStep, setMobileStep] = useState<number>(1);
  const [isPanelHidden, setIsPanelHidden] = useState<boolean>(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const isDateSelectionComplete = dateRange.startDate !== null && dateRange.endDate !== null;
  const isSearchComplete = hasSearched;
  const isCategorySelectionComplete = hasSearched && (selectedCategory !== null || hasCategorySelected);
  const isPlaceListReady = isCategorySelectionComplete && filteredPlaces.length > 0;
  
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('데이터 로드 시작...');
        
        const restaurants = await fetchRestaurants();
        console.log('레스토랑 데이터 가져옴:', restaurants.length);
        
        const accommodations = await fetchAccommodations();
        console.log('숙소 데이터 가져옴:', accommodations.length, '개');
        console.log('첫 번째 숙소 데이터:', accommodations.length > 0 ? accommodations[0].name : '없음');
        
        const attractions = await fetchLandmarks();
        console.log('관광지 데이터 가져옴:', attractions.length, '개');
        console.log('첫 번째 관광지 데이터:', attractions.length > 0 ? attractions[0].name : '없음');
        
        const cafes = generateMockPlaces('cafe', 200);
        
        const allPlaces = [
          ...restaurants,
          ...accommodations,
          ...attractions,
          ...cafes
        ] as Place[];
        
        console.log('총 로드된 장소 수:', allPlaces.length);
        console.log('숙소 수:', accommodations.length);
        console.log('관광지 수:', attractions.length);
        
        setPlaces(allPlaces);
      } catch (error) {
        console.error('초기 데이터 로드 오류:', error);
        
        const allPlaces = [
          ...generateMockPlaces('restaurant', 200),
          ...generateMockPlaces('cafe', 200),
          ...generateMockPlaces('attraction', 200),
          ...generateMockPlaces('accommodation', 200)
        ];
        setPlaces(allPlaces);
        
        toast.error('데이터 로딩 중 오류가 발생했습니다.');
      }
    };

    loadInitialData();
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
    if (!isSearchComplete) {
      toast.error('먼저 검색을 해주세요');
      return;
    }
    
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
      const filtered = places.filter(place => place.category === category);
      setFilteredPlaces(filtered);
    }
    setHasCategorySelected(true);
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
    if (!isDateSelectionComplete) {
      toast.error('먼저 날짜를 선택해주세요');
      return;
    }
    
    if (!promptText.trim()) {
      toast.error('검색 프롬프트를 입력해주세요');
      return;
    }
    
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
        setHasSearched(true);
        
        toast.success('검색이 완료되었습니다');
      }, 1000);
    } catch (error) {
      console.error('Error during search:', error);
      toast.error('검색 중 오류가 발생했습니다');
      setLoading(false);
    }
  };
  
  const handleCreateItinerary = () => {
    if (!isPlaceListReady) {
      toast.error('먼저 장소 목록을 확인해주세요');
      return;
    }
    
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
      
      toast.success('일정이 생성되었��니다');
    }, 1500);
  };
  
  const handleSelectItineraryDay = (day: number) => {
    setSelectedItineraryDay(day);
  };
  
  const totalPages = Math.ceil(filteredPlaces.length / itemsPerPage);
  
  const goToNextStep = () => {
    if (mobileStep < 5) {
      setMobileStep(prevStep => prevStep + 1);
    }
  };
  
  const goToPrevStep = () => {
    if (mobileStep > 1) {
      setMobileStep(prevStep => prevStep - 1);
    }
  };
  
  const getMobileStepContent = () => {
    switch (mobileStep) {
      case 1: // Date selection
        return (
          <div className="p-4 bg-white rounded-lg shadow-sm h-full">
            <h2 className="text-lg font-medium mb-4">날짜 선택</h2>
            <DatePicker onDatesSelected={handleDatesSelected} />
            <div className="mt-4">
              <Button 
                className="w-full"
                onClick={goToNextStep}
                disabled={!isDateSelectionComplete}
              >
                다음 단계로
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      
      case 2: // Prompt search
        return (
          <div className="p-4 bg-white rounded-lg shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" onClick={goToPrevStep} className="p-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                이전
              </Button>
              <h2 className="text-lg font-medium">검색 프롬프트</h2>
              <div className="w-10"></div>
            </div>
            
            <Textarea
              placeholder="검색 프롬프트를 입력하세요"
              className="min-h-24 text-sm flex-grow"
              value={promptText}
              onChange={handlePromptChange}
              disabled={!isDateSelectionComplete}
            />
            <div className="flex gap-2 mt-4">
              <Button 
                className="flex-1"
                onClick={handleSearch}
                disabled={loading || !isDateSelectionComplete || !promptText.trim()}
              >
                <Search className="h-4 w-4 mr-2" />
                검색
              </Button>
              <Button 
                className="flex-1"
                onClick={goToNextStep}
                disabled={!isSearchComplete}
              >
                다음
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      
      case 3: // Category and place list selection
        return (
          <div className="p-4 bg-white rounded-lg shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" onClick={goToPrevStep} className="p-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                이전
              </Button>
              <h2 className="text-lg font-medium">카테고리 및 장소</h2>
              <div className="w-10"></div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {['restaurant', 'cafe', 'attraction', 'accommodation'].map((category) => (
                <Button
                  key={category}
                  variant="category"
                  className={`${
                    selectedCategory === category 
                      ? categoryColors[category].bg + ' ' + categoryColors[category].text 
                      : 'bg-jeju-gray text-jeju-black hover:bg-jeju-gray/80'
                  } ${!isSearchComplete ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={() => handleCategoryClick(category)}
                  disabled={!isSearchComplete}
                >
                  {getCategoryName(category)}
                </Button>
              ))}
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 mb-2">
                <PlaceList
                  places={filteredPlaces}
                  loading={loading}
                  onSelectPlace={handlePlaceSelect}
                  selectedPlace={selectedPlace}
                  page={currentPage}
                  onPageChange={handlePageChange}
                  totalPages={totalPages}
                />
              </ScrollArea>
            </div>
            
            <div className="flex gap-2 mt-auto sticky bottom-0 bg-white pt-2">
              <Button 
                className="flex-1"
                onClick={handleCreateItinerary}
                disabled={!isPlaceListReady}
              >
                일정 생성
              </Button>
              <Button 
                className="flex-1"
                onClick={goToNextStep}
                disabled={!itinerary}
              >
                다음
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      
      case 4: // Itinerary view
        return (
          <div className="p-4 bg-white rounded-lg shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" onClick={goToPrevStep} className="p-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                이전
              </Button>
              <h2 className="text-lg font-medium">일정 확인</h2>
              <div className="w-10"></div>
            </div>
            
            {itinerary && dateRange.startDate && (
              <div className="flex-1 overflow-auto">
                <ScrollArea className="h-full">
                  <ItineraryView
                    itinerary={itinerary}
                    startDate={dateRange.startDate}
                    onSelectDay={handleSelectItineraryDay}
                    selectedDay={selectedItineraryDay}
                  />
                </ScrollArea>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  const togglePanel = () => {
    setIsPanelHidden(!isPanelHidden);
  };

  if (isMobile && isPortrait) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-jeju-light-gray relative">
        <div className="absolute inset-0 z-0">
          <Map
            places={filteredPlaces}
            selectedPlace={selectedPlace}
            itinerary={itinerary}
            selectedDay={selectedItineraryDay}
          />
        </div>
        
        <div 
          className="fixed top-0 left-0 right-0 z-20 h-10 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-b-lg shadow-sm"
          onClick={togglePanel}
        >
          {isPanelHidden ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          )}
        </div>
        
        {isPanelHidden && itinerary && (
          <DaySelector 
            itinerary={itinerary}
            selectedDay={selectedItineraryDay}
            onSelectDay={handleSelectItineraryDay}
          />
        )}
        
        <div 
          ref={panelRef}
          className={`fixed left-0 right-0 z-10 transition-all duration-300 ease-in-out 
            bg-jeju-light-gray/95 backdrop-blur-sm rounded-b-xl shadow-lg
            ${isPanelHidden ? 'h-0 opacity-0 pointer-events-none' : 'h-[60vh] max-h-[60vh] opacity-100 overflow-auto'}`}
          style={{ top: '40px' }}
        >
          {getMobileStepContent()}
        </div>
      </div>
    );
  }
  
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
              disabled={!isDateSelectionComplete}
            />
            <Button 
              className="w-full mt-2"
              onClick={handleSearch}
              disabled={loading || !isDateSelectionComplete || !promptText.trim()}
            >
              <Search className="h-4 w-4 mr-2" />
              검색
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {['restaurant', 'cafe', 'attraction', 'accommodation'].map((category) => (
              <Button
                key={category}
                variant="category"
                className={`${
                  selectedCategory === category 
                    ? categoryColors[category].bg + ' ' + categoryColors[category].text 
                    : 'bg-jeju-gray text-jeju-black hover:bg-jeju-gray/80'
                } ${!isSearchComplete ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => handleCategoryClick(category)}
                disabled={!isSearchComplete}
              >
                {getCategoryName(category)}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 flex-1 flex flex-col animate-fade-in" style={{ animationDelay: '100ms' }}>
          {!showItinerary ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">장소 목록</h2>
                {!loading && isPlaceListReady && !showItinerary && (
                  <Button 
                    onClick={handleCreateItinerary}
                    disabled={!isPlaceListReady}
                  >
                    일정 생성
                  </Button>
                )}
              </div>
              {isCategorySelectionComplete ? (
                <PlaceList
                  places={filteredPlaces}
                  loading={loading}
                  onSelectPlace={handlePlaceSelect}
                  selectedPlace={selectedPlace}
                  page={currentPage}
                  onPageChange={handlePageChange}
                  totalPages={totalPages}
                />
              ) : (
                <div className="w-full flex flex-col items-center justify-center h-[40vh] text-muted-foreground">
                  <p>카테고리를 선택해주세요</p>
                </div>
              )}
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
