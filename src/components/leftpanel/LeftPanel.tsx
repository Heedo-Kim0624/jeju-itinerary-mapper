import React, { useState, useCallback } from 'react';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { SchedulePayload } from '@/types/schedule';
import { ItineraryDay, Place } from '@/types/supabase';
import { useScheduleGenerator } from '@/hooks/use-schedule-generator';
import { CategoryName } from '@/utils/categoryUtils';
import { KeywordPanel } from '@/components/middlepanel/KeywordPanel';
import { getCategoryKorean, mapCategoryNameToKey } from '@/utils/categoryUtils';
import { toast } from 'sonner';

interface LeftPanelProps {
  onCreateItinerary: (itinerary: ItineraryDay[]) => void;
}

const LeftPanel: React.FC<LeftPanelProps> = ({ onCreateItinerary }) => {
  const { centerMapToMarkers } = useMapContext();
  const [isAccommodationPanelOpen, setIsAccommodationPanelOpen] = useState(false);
  const [isLandmarkPanelOpen, setIsLandmarkPanelOpen] = useState(false);
  const [isRestaurantPanelOpen, setIsRestaurantPanelOpen] = useState(false);
  const [isCafePanelOpen, setIsCafePanelOpen] = useState(false);
  
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
  const [candidatePlaces, setCandidatePlaces] = useState<Place[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  const [accommodationDirectInputValue, setAccommodationDirectInputValue] = useState('');
  const [landmarkDirectInputValue, setLandmarkDirectInputValue] = useState('');
  const [restaurantDirectInputValue, setRestaurantDirectInputValue] = useState('');
  const [cafeDirectInputValue, setCafeDirectInputValue] = useState('');
  
  const [accommodationKeywords, setAccommodationKeywords] = useState<string[]>([]);
  const [landmarkKeywords, setLandmarkKeywords] = useState<string[]>([]);
  const [restaurantKeywords, setRestaurantKeywords] = useState<string[]>([]);
  const [cafeKeywords, setCafeKeywords] = useState<string[]>([]);

  const defaultAccommodationKeywords = [
    { eng: 'hotel', kr: '호텔' },
    { eng: 'guesthouse', kr: '게스트하우스' },
    { eng: 'pension', kr: '펜션' },
  ];

  const defaultLandmarkKeywords = [
    { eng: 'museum', kr: '박물관' },
    { eng: 'park', kr: '공원' },
    { eng: 'beach', kr: '해변' },
  ];

  const defaultRestaurantKeywords = [
    { eng: 'korean', kr: '한식' },
    { eng: 'western', kr: '양식' },
    { eng: 'chinese', kr: '중식' },
  ];

  const defaultCafeKeywords = [
    { eng: 'coffee', kr: '커피' },
    { eng: 'dessert', kr: '디저트' },
    { eng: 'brunch', kr: '브런치' },
  ];

  const togglePlaceSelection = (place: Place) => {
    setSelectedPlaces((prevSelectedPlaces) => {
      const isPlaceSelected = prevSelectedPlaces.some((selectedPlace) => selectedPlace.id === place.id);
      if (isPlaceSelected) {
        return prevSelectedPlaces.filter((selectedPlace) => selectedPlace.id !== place.id);
      } else {
        return [...prevSelectedPlaces, place];
      }
    });
  };

  const toggleCandidatePlace = (place: Place) => {
    setCandidatePlaces((prevCandidatePlaces) => {
      const isCandidate = prevCandidatePlaces.some((candidatePlace) => candidatePlace.id === place.id);
      if (isCandidate) {
        return prevCandidatePlaces.filter((candidatePlace) => candidatePlace.id !== place.id);
      } else {
        return [...prevCandidatePlaces, place];
      }
    });
  };

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  const openAccommodationPanel = () => setIsAccommodationPanelOpen(true);
  const openLandmarkPanel = () => setIsLandmarkPanelOpen(true);
  const openRestaurantPanel = () => setIsRestaurantPanelOpen(true);
  const openCafePanel = () => setIsCafePanelOpen(true);

  const closeAccommodationPanel = () => setIsAccommodationPanelOpen(false);
  const closeLandmarkPanel = () => setIsLandmarkPanelOpen(false);
  const closeRestaurantPanel = () => setIsRestaurantPanelOpen(false);
  const closeCafePanel = () => setIsCafePanelOpen(false);

  const toggleAccommodationKeyword = (keyword: string) => {
    setAccommodationKeywords((prev) => (prev.includes(keyword) ? prev.filter((k) => k !== keyword) : [...prev, keyword]));
  };

  const toggleLandmarkKeyword = (keyword: string) => {
    setLandmarkKeywords((prev) => (prev.includes(keyword) ? prev.filter((k) => k !== keyword) : [...prev, keyword]));
  };

  const toggleRestaurantKeyword = (keyword: string) => {
    setRestaurantKeywords((prev) => (prev.includes(keyword) ? prev.filter((k) => k !== keyword) : [...prev, keyword]));
  };

  const toggleCafeKeyword = (keyword: string) => {
    setCafeKeywords((prev) => (prev.includes(keyword) ? prev.filter((k) => k !== keyword) : [...prev, keyword]));
  };

  const confirmAccommodationKeywords = (keywords: string[], clearSelection: boolean = false) => {
    setAccommodationKeywords(keywords);
    if (clearSelection) {
      closeAccommodationPanel();
    }
  };

  const confirmLandmarkKeywords = (keywords: string[], clearSelection: boolean = false) => {
    setLandmarkKeywords(keywords);
    if (clearSelection) {
      closeLandmarkPanel();
    }
  };

  const confirmRestaurantKeywords = (keywords: string[], clearSelection: boolean = false) => {
    setRestaurantKeywords(keywords);
    if (clearSelection) {
      closeRestaurantPanel();
    }
  };

  const confirmCafeKeywords = (keywords: string[], clearSelection: boolean = false) => {
    setCafeKeywords(keywords);
    if (clearSelection) {
      closeCafePanel();
    }
  };

  const handleCreateItinerary = async (): Promise<boolean> => {
    if (!startDate || !endDate) {
      toast.error('시작일과 종료일을 선택해주세요.');
      return false;
    }

    if (selectedPlaces.length === 0 && candidatePlaces.length === 0) {
      toast.error('최소 1개 이상의 장소를 선택해주세요.');
      return false;
    }

    const formattedSelectedPlaces = selectedPlaces.map(p => ({ id: String(p.id), name: p.name || "" }));
    const formattedCandidatePlaces = candidatePlaces.map(p => ({ id: String(p.id), name: p.name || "" }));

    const payload: SchedulePayload = {
        selected_places: formattedSelectedPlaces,
        candidate_places: formattedCandidatePlaces,
        start_datetime: startDate.toISOString(),
        end_datetime: endDate.toISOString(),
    };
    
    centerMapToMarkers();
    return true;
  };

  const categoryDirectInputValue: Record<CategoryName, string> = {
    accommodation: accommodationDirectInputValue,
    landmark: landmarkDirectInputValue,
    restaurant: restaurantDirectInputValue,
    cafe: cafeDirectInputValue,
    attraction: landmarkDirectInputValue,
  };

  const setCategoryDirectInputValue: Record<CategoryName, React.Dispatch<React.SetStateAction<string>>> = {
    accommodation: setAccommodationDirectInputValue,
    landmark: setLandmarkDirectInputValue,
    restaurant: setRestaurantDirectInputValue,
    cafe: setCafeDirectInputValue,
    attraction: setLandmarkDirectInputValue,
  };

  const confirmCategoryKeywords: Record<CategoryName, (keywords: string[], clearSelection?: boolean) => void> = {
    accommodation: confirmAccommodationKeywords,
    landmark: confirmLandmarkKeywords,
    restaurant: confirmRestaurantKeywords,
    cafe: confirmCafeKeywords,
    attraction: confirmLandmarkKeywords,
  };

  const closeCategoryPanel: Record<CategoryName, () => void> = {
    accommodation: closeAccommodationPanel,
    landmark: closeLandmarkPanel,
    restaurant: closeRestaurantPanel,
    cafe: closeCafePanel,
    attraction: closeLandmarkPanel,
  };

  const useCategoryPanel = (category: CategoryName) => {
    const isOpen = {
      accommodation: isAccommodationPanelOpen,
      landmark: isLandmarkPanelOpen,
      restaurant: isRestaurantPanelOpen,
      cafe: isCafePanelOpen,
      attraction: isLandmarkPanelOpen,
    }[category];

    const openPanel = {
      accommodation: openAccommodationPanel,
      landmark: openLandmarkPanel,
      restaurant: openRestaurantPanel,
      cafe: openCafePanel,
      attraction: openLandmarkPanel,
    }[category];

    const closePanel = closeCategoryPanel[category];
    const directInputValue = categoryDirectInputValue[category];
    const setDirectInputValueFn = setCategoryDirectInputValue[category];
    
    const selectedKeywords = {
      accommodation: accommodationKeywords,
      landmark: landmarkKeywords,
      restaurant: restaurantKeywords,
      cafe: cafeKeywords,
      attraction: landmarkKeywords,
    }[category];
    
    const toggleKeyword = {
      accommodation: toggleAccommodationKeyword,
      landmark: toggleLandmarkKeyword,
      restaurant: toggleRestaurantKeyword,
      cafe: toggleCafeKeyword,
      attraction: toggleLandmarkKeyword,
    }[category];
    
    const confirmKeywords = confirmCategoryKeywords[category];
    
    const defaultKeywords = {
      accommodation: defaultAccommodationKeywords,
      landmark: defaultLandmarkKeywords,
      restaurant: defaultRestaurantKeywords,
      cafe: defaultCafeKeywords,
      attraction: defaultLandmarkKeywords,
    }[category];

    return {
      isOpen,
      openPanel,
      closePanel,
      directInputValue,
      setDirectInputValue: setDirectInputValueFn,
      selectedKeywords,
      toggleKeyword,
      confirmKeywords,
      defaultKeywords,
    };
  };

  const accommodationPanel = useCategoryPanel('accommodation');
  const landmarkPanel = useCategoryPanel('landmark');
  const restaurantPanel = useCategoryPanel('restaurant');
  const cafePanel = useCategoryPanel('cafe');

  const accommodationTypeUI = (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">숙소 유형</label>
      <div className="flex gap-2">
        <button
          type="button"
          className={`px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs`}
        >
          호텔
        </button>
        <button
          type="button"
          className={`px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs`}
        >
          게스트하우스
        </button>
        <button
          type="button"
          className={`px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs`}
        >
          펜션
        </button>
      </div>
    </div>
  );

  const createItineraryWrapper = useCallback(async (payload: SchedulePayload): Promise<ItineraryDay[]> => {
    if (!payload.start_datetime || !payload.end_datetime) {
        toast.error("Date information is missing in payload for itinerary generation.");
        return Promise.reject(new Error("Date information is missing"));
    }
    const sDate = new Date(payload.start_datetime);
    const eDate = new Date(payload.end_datetime);
    
    const localItineraryDays: ItineraryDay[] = [];
    let currentDate = new Date(sDate);
    while (currentDate <= eDate) {
        localItineraryDays.push({
            id: currentDate.toISOString().split('T')[0],
            date: currentDate.toISOString(), 
            places: [],
            user_id: '',
            trip_id: '',
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return Promise.resolve(localItineraryDays);
  }, []);

  useScheduleGenerator({
    selectedPlaces,
    candidatePlaces,
    createItinerary: createItineraryWrapper,
    onItineraryCreated,
    startDate,
    endDate,
  });

  return (
    <div className="w-[300px] h-full bg-gray-100 border-r border-gray-200 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">여행 계획 설정</h2>

      {/* 날짜 선택 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">여행 기간</label>
        {/* <DateRangePicker onDateChange={handleDateChange} /> */}
      </div>

      {/* 장소 선택 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">장소 선택</label>
        {/* 여기에 장소 선택 컴포넌트 추가 */}
      </div>

      {/* 키워드 선택 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">키워드 선택</label>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={accommodationPanel.openPanel}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            {getCategoryKorean('accommodation')} 키워드 선택
          </button>
          <button
            type="button"
            onClick={landmarkPanel.openPanel}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            {getCategoryKorean('landmark')} 키워드 선택
          </button>
          <button
            type="button"
            onClick={restaurantPanel.openPanel}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            {getCategoryKorean('restaurant')} 키워드 선택
          </button>
          <button
            type="button"
            onClick={cafePanel.openPanel}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            {getCategoryKorean('cafe')} 키워드 선택
          </button>
        </div>
      </div>

      {/* 선택된 장소 및 후보 장소 목록 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">선택된 장소 ({selectedPlaces.length})</label>
        {selectedPlaces.map((place) => (
          <div key={place.id} className="flex items-center justify-between px-3 py-2 bg-white rounded shadow-sm text-sm mb-1">
            <span>{place.name}</span>
            <button
              onClick={() => togglePlaceSelection(place)}
              className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
            >
              제거
            </button>
          </div>
        ))}
        {selectedPlaces.length === 0 && <p className="text-xs text-gray-500">선택된 장소가 없습니다.</p>}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">후보 장소 ({candidatePlaces.length})</label>
        {candidatePlaces.map((place) => (
          <div key={place.id} className="flex items-center justify-between px-3 py-2 bg-white rounded shadow-sm text-sm mb-1">
            <span>{place.name}</span>
            <button
              onClick={() => toggleCandidatePlace(place)}
              className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
            >
              제거
            </button>
          </div>
        ))}
        {candidatePlaces.length === 0 && <p className="text-xs text-gray-500">후보 장소가 없습니다.</p>}
      </div>

      {/* 여행 생성 버튼 */}
      <button
        onClick={handleCreateItinerary}
        className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
      >
        여행 일정 생성
      </button>

      {/* 키워드 선택 패널 */}
      {isAccommodationPanelOpen && (
        <KeywordPanel
          categoryName={getCategoryKorean('accommodation') as CategoryName}
          selectedKeywords={accommodationKeywords}
          onToggleKeyword={toggleAccommodationKeyword}
          directInputValue={accommodationDirectInputValue}
          onDirectInputChange={(val) => setAccommodationDirectInputValue(val)}
          onConfirm={confirmAccommodationKeywords}
          onClose={closeAccommodationPanel}
          defaultKeywords={defaultAccommodationKeywords}
          accommodationTypeUI={accommodationTypeUI}
        />
      )}
      {isLandmarkPanelOpen && (
        <KeywordPanel
          categoryName={getCategoryKorean('landmark') as CategoryName}
          selectedKeywords={landmarkKeywords}
          onToggleKeyword={toggleLandmarkKeyword}
          directInputValue={landmarkDirectInputValue}
          onDirectInputChange={(val) => setLandmarkDirectInputValue(val)}
          onConfirm={confirmLandmarkKeywords}
          onClose={closeLandmarkPanel}
          defaultKeywords={defaultLandmarkKeywords}
        />
      )}
      {isRestaurantPanelOpen && (
        <KeywordPanel
          categoryName={getCategoryKorean('restaurant') as CategoryName}
          selectedKeywords={restaurantKeywords}
          onToggleKeyword={toggleRestaurantKeyword}
          directInputValue={restaurantDirectInputValue}
          onDirectInputChange={(val) => setRestaurantDirectInputValue(val)}
          onConfirm={confirmRestaurantKeywords}
          onClose={closeRestaurantPanel}
          defaultKeywords={defaultRestaurantKeywords}
        />
      )}
      {isCafePanelOpen && (
        <KeywordPanel
          categoryName={getCategoryKorean('cafe') as CategoryName}
          selectedKeywords={cafeKeywords}
          onToggleKeyword={toggleCafeKeyword}
          directInputValue={cafeDirectInputValue}
          onDirectInputChange={(val) => setCafeDirectInputValue(val)}
          onConfirm={confirmCafeKeywords}
          onClose={closeCafePanel}
          defaultKeywords={defaultCafeKeywords}
        />
      )}
    </div>
  );
};

export default LeftPanel;

// This local createItinerary function is likely superseded by the one in useScheduleGenerator or an API call.
// If it's still needed locally for some reason, it should be typed correctly.
// const createItinerary = (
//   placesToUse: Place[],
//   startDate: Date,
//   endDate: Date,
//   startTime: string,
//   endTime: string
// ): ItineraryDay[] => {
//   const itinerary: ItineraryDay[] = [];
//   let currentDate = new Date(startDate);

//   while (currentDate <= endDate) {
//     const day: ItineraryDay = {
//       // Fill according to ItineraryDay structure
//       id: currentDate.toISOString().split('T')[0], // Example
//       date: currentDate.toISOString(),
//       places: [], // Populate based on placesToUse for this day
//       user_id: '', // if required
//       trip_id: '', // if required
//     };
//     itinerary.push(day);
//     currentDate.setDate(currentDate.getDate() + 1);
//   }

//   return itinerary;
// };
