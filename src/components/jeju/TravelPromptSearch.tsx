import React, { useState } from 'react';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import PlaceList from '@/components/middlepanel/PlaceList';
import PlaceDetailDialog from '@/components/places/PlaceDetailDialog';
import { Place } from '@/types/core'; // Updated to use Place from @/types/core
import { 
  parsePrompt, 
  fetchWeightedResults, 
  // convertToPlace, // convertToPlace is not directly used here, ensure it's used correctly elsewhere or remove if not needed.
} from '@/lib/jeju/travelPromptUtils';

interface TravelPromptSearchProps {
  onPlacesFound?: (places: Place[], category: string) => void;
}

// PlaceResult 인터페이스 추가
interface PlaceResult {
  id: string | number;
  name?: string;
  address?: string;
  category?: string;
  categoryDetail?: string;
  x?: number;
  y?: number;
  rating?: number;
  reviewCount?: number;
  weight?: number;
  naverLink?: string;
  instaLink?: string;
  operatingHours?: string;
  // ItineraryPlaceWithTime specific properties are not expected here,
  // as PlaceResult is for search results before becoming ItineraryPlaceWithTime
}

const TravelPromptSearch: React.FC<TravelPromptSearchProps> = ({ onPlacesFound }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  // const [sortOption, setSortOption] = useState("recommendation"); // sortOption is not used
  const mapCtx = useMapContext();
  
  const totalPages = Math.ceil(places.length / 10); // 10 items per page
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSelectedPlace(null);
    mapCtx.clearMarkersAndUiElements();
    
    try {
      // 1. Parse the prompt
      const parsed = parsePrompt(prompt);
      if (!parsed) {
        toast.error("입력 형식 오류: 올바른 형식으로 입력해주세요.");
        setLoading(false);
        return;
      }
      
      // 2. Show toast with keywords
      const allKeywords = [...parsed.rankedKeywords, ...parsed.unrankedKeywords];
      toast(`${parsed.category} 키워드: ${parsed.rankedKeywords.length > 0 ? 
          `순위: ${parsed.rankedKeywords.join(', ')}` : ''}
          ${parsed.unrankedKeywords.length > 0 ? 
          `추가: ${parsed.unrankedKeywords.join(', ')}` : ''}`);
      
      // 3. Fetch places
      const placeResults = await fetchWeightedResults(
        parsed.category, 
        parsed.locations, 
        allKeywords
      );
      
      // 4. Convert to Place type with all required fields
      const convertedPlaces: Place[] = placeResults.map((result: PlaceResult) => ({
        id: String(result.id),
        name: result.name || '',
        address: result.address || '',
        phone: '', 
        category: result.category || '',
        description: '',  
        rating: result.rating || 0,
        x: result.x || 0,
        y: result.y || 0,
        image_url: '', 
        road_address: result.address || '', // Assuming road_address can default to address if not present
        homepage: '',  
        categoryDetail: result.categoryDetail || '',
        reviewCount: result.reviewCount || 0,
        // weight: result.weight || 0, // weight is not part of Place type
        naverLink: result.naverLink || '',
        instaLink: result.instaLink || '',
        operatingHours: result.operatingHours || '',
        // ItineraryPlaceWithTime specific props like timeBlock, arriveTime are not added here
        // They are added when Place becomes an ItineraryPlaceWithTime
      }));
      
      setPlaces(convertedPlaces);
      setCurrentPage(1);
      
      // 5. Add markers to map
      if (convertedPlaces.length && mapCtx) {
        const recommended = convertedPlaces.slice(0, 4);
        const others = convertedPlaces.slice(4);
        mapCtx.addMarkers(recommended, { highlight: true });
        mapCtx.addMarkers(others, { highlight: false });
        
        if (convertedPlaces.length > 0 && convertedPlaces[0]) {
          mapCtx.panTo({ lat: convertedPlaces[0].y, lng: convertedPlaces[0].x });
        } else if (parsed.locations.length > 0) {
           // If locations are available from prompt, pan to the first one
          const firstLocation = parsed.locations[0];
          // Check if firstLocation is a non-empty string before panning
          if (typeof firstLocation === 'string' && firstLocation.trim() !== '') {
            mapCtx.panTo(firstLocation);
          } else if (typeof firstLocation === 'object' && firstLocation && 'lat' in firstLocation && 'lng' in firstLocation) {
            // This case should ideally not happen if parsed.locations is string[]
            // but keeping it for robustness or future changes in parsePrompt
            mapCtx.panTo(firstLocation as { lat: number; lng: number });
          }
        }
      }
      
      // 6. Call callback if provided
      if (onPlacesFound && convertedPlaces.length > 0) {
        onPlacesFound(convertedPlaces, parsed.category);
      }
      
      if (placeResults.length === 0) {
        toast.error("검색 결과 없음: 검색 조건에 맞는 장소를 찾을 수 없습니다.");
      } else {
        toast.success(`검색 완료: ${placeResults.length}개의 장소를 찾았습니다.`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error("검색 오류: 검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // const handleSortChange = (value: string) => { // sortOption and handleSortChange are not used
  //   setSortOption(value);
  //   // Sort logic would be implemented here
  // };

  const handleViewDetails = (place: Place) => {
    setSelectedPlace(place);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col h-full">
      <form onSubmit={handleSearch} className="mb-4">
        <div className="mb-2">
          <h2 className="text-lg font-medium mb-2">여행 프롬프트 검색</h2>
          <p className="text-sm text-muted-foreground mb-2">
            형식: 일정[MM.DD,HH:mm,MM.DD,HH:mm], 지역[지역1,지역2], 카테고리[{"{"}키워드1,키워드2{"}"}, 키워드3]
          </p>
          <Textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="예: 일정[04.23,10:00,04.29,18:00], 지역[조천,애월], 숙소[{good_bedding,냉난방,good_breakfast}, quiet_and_relax]"
            rows={4}
            required
            className="mb-2"
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? '검색 중...' : '장소 검색'}
          </Button>
        </div>
      </form>
      
      <div className="flex-grow overflow-hidden flex flex-col">
        {places.length > 0 && (
          <PlaceList
            places={places}
            loading={loading}
            onSelectPlace={setSelectedPlace}
            selectedPlace={selectedPlace}
            page={currentPage}
            onPageChange={setCurrentPage}
            totalPages={totalPages}
            onViewDetails={handleViewDetails}
          />
        )}
      </div>
      
      {selectedPlace && (
        <PlaceDetailDialog 
          place={selectedPlace} 
          open={!!selectedPlace} // open state managed by selectedPlace
          onOpenChange={(open) => !open && setSelectedPlace(null)} // Changed from onClose
        />
      )}
    </div>
  );
};

export default TravelPromptSearch;
