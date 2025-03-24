
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

// Default prompt text
const DEFAULT_PROMPT = `사전프롬프트:우리에겐 음식점DB, 숙소DB, 카페DB, 관광지DB가 각 7개씩의 DB가 있어 (rest_nm, rest_xy, rest_review, rest_addr, rest_review_cnt, rest_link, rest_time ..) nm에는 이름과 ID를 기본키로 하는 DB이고 xy는 ID를 외래키로 하고 xy좌표를 가지고 있는 DB이고 reivew는 ID를 외래키로 하고 음식이 맛있어요 등의 키워드리뷰의 종류가 칼럼명으로, 그 개수가 행에 들어있는 DB이고 addr은 ID를 외래키로 하여 주소를 저장하는 DB이고 review_cnt에는 ID를 외래키로 하며 방문자리뷰수, 블로그리뷰수, 평점 이 들어있는 DB이고 time은 ID를 외래키로 하여 월~일 오픈시간과 마감시간, 비고를 저장하는 DB이고 link는 네이버지도 링크와 인스타그램 링크가 들어있어 사용자가 입력한 날짜와 시간, 다음 사용자의 프롬프트를 보고 사용자가 선호할만한 음식점을 순서대로 나열 할수 있는 쿼리를 만들어줘`;

// Define interfaces for data structure
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
}

interface ItineraryDay {
  day: number;
  places: Place[];
  totalDistance: number;
}

// Mock data for the demo
const generateMockPlaces = (category: string, count: number): Place[] => {
  const categories = {
    restaurant: '음식점',
    cafe: '카페',
    attraction: '관광지',
    accommodation: '숙소'
  };
  
  const result: Place[] = [];
  
  for (let i = 1; i <= count; i++) {
    // Create different coordinate ranges for different categories to spread them on the map
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

// Algorithm to create an itinerary that minimizes total distance
const createItinerary = (places: Place[], startDate: Date, endDate: Date): ItineraryDay[] => {
  // Calculate days between start and end date
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const numDays = Math.max(1, daysDiff);
  
  // Group places by category to ensure diversity in each day
  const placesByCategory: Record<string, Place[]> = {};
  places.forEach(place => {
    if (!placesByCategory[place.category]) {
      placesByCategory[place.category] = [];
    }
    placesByCategory[place.category].push(place);
  });
  
  // Create itinerary days
  const itinerary: ItineraryDay[] = [];
  
  // Function to calculate distance between two places (simple Euclidean distance)
  const calculateDistance = (p1: Place, p2: Place) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    // Multiply by a constant to convert to approximate kilometers
    return Math.sqrt(dx * dx + dy * dy) * 111;
  };
  
  // Function to find nearest place to a given place
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
  
  // Distribute places evenly across days
  const placesPerDay = Math.ceil(places.length / numDays);
  
  for (let day = 1; day <= numDays; day++) {
    const dayPlaces: Place[] = [];
    let totalDistance = 0;
    let remainingPlaces = [...places];
    
    // Remove places already used in previous days
    itinerary.forEach(dayItinerary => {
      dayItinerary.places.forEach(place => {
        remainingPlaces = remainingPlaces.filter(p => p.id !== place.id);
      });
    });
    
    // If we still have places to allocate
    if (remainingPlaces.length > 0) {
      // Start with accommodation if available
      let currentPlace = remainingPlaces.find(p => p.category === 'accommodation') || remainingPlaces[0];
      dayPlaces.push(currentPlace);
      remainingPlaces = remainingPlaces.filter(p => p.id !== currentPlace.id);
      
      // Add the rest using nearest neighbor algorithm
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
      
      // Calculate total distance for the route (including return to first place)
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
  // State for date selection
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
  
  // State for search and filtering
  const [promptText, setPromptText] = useState<string>(DEFAULT_PROMPT);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  
  // State for itinerary
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number | null>(null);
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  
  // Initialize with all mock data
  useEffect(() => {
    const allPlaces = [
      ...generateMockPlaces('restaurant', 20),
      ...generateMockPlaces('cafe', 15),
      ...generateMockPlaces('attraction', 25),
      ...generateMockPlaces('accommodation', 10)
    ];
    setPlaces(allPlaces);
    setFilteredPlaces(allPlaces);
  }, []);
  
  // Handle date selection
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
  
  // Handle prompt text change
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPromptText(e.target.value);
  };
  
  // Handle category selection
  const handleCategoryClick = (category: string) => {
    if (selectedCategory === category) {
      // Deselect if already selected
      setSelectedCategory(null);
      setFilteredPlaces(places);
    } else {
      setSelectedCategory(category);
      const filtered = places.filter(place => place.category === category);
      setFilteredPlaces(filtered);
    }
    setCurrentPage(1);
  };
  
  // Handle place selection
  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place);
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle search button click
  const handleSearch = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      // Apply filters based on prompt and category
      let result = [...places];
      
      if (selectedCategory) {
        result = result.filter(place => place.category === selectedCategory);
      }
      
      // Sort by rating (a simple example of how the prompt might affect results)
      result.sort((a, b) => b.rating - a.rating);
      
      setFilteredPlaces(result);
      setLoading(false);
      setCurrentPage(1);
      
      toast.success('검색이 완료되었습니다');
    }, 1000);
  };
  
  // Handle create itinerary button click
  const handleCreateItinerary = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      toast.error('여행 날짜를 먼저 선택해주세요');
      return;
    }
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const generatedItinerary = createItinerary(
        filteredPlaces,
        dateRange.startDate,
        dateRange.endDate
      );
      
      setItinerary(generatedItinerary);
      setSelectedItineraryDay(1); // Select first day by default
      setShowItinerary(true);
      setLoading(false);
      
      toast.success('일정이 생성되었습니다');
    }, 1500);
  };
  
  // Handle itinerary day selection
  const handleSelectItineraryDay = (day: number) => {
    setSelectedItineraryDay(day);
  };
  
  // Get current places for pagination
  const getCurrentPlaces = () => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredPlaces.slice(indexOfFirstItem, indexOfLastItem);
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredPlaces.length / itemsPerPage);
  
  return (
    <div className="flex h-screen overflow-hidden bg-jeju-light-gray">
      {/* Left Panel - 30% width */}
      <div className="w-[30%] h-full p-4 flex flex-col">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 animate-fade-in">
          <h2 className="text-lg font-medium mb-4">제주도 여행 플래너</h2>
          
          {/* Date Picker */}
          <div className="mb-4">
            <DatePicker onDatesSelected={handleDatesSelected} />
          </div>
          
          {/* Prompt Input */}
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
          
          {/* Category Buttons */}
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
        
        {/* Place List or Itinerary View */}
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
                places={getCurrentPlaces()}
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
      
      {/* Right Panel - 70% width */}
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
