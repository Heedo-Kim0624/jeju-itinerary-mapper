import React, { useState } from 'react';
import { Place } from '@/types/supabase';
import DatePicker from './DatePicker';
import PromptKeywordBox from './PromptKeywordBox';
import CategoryPrioritySelector from './CategoryPrioritySelector';
// CategorySelectKeyword 관련 코드는 제거됨
import AccomodationPanel from '../middlepanel/AccomodationPanel';
import LandmarkPanel from '../middlepanel/LandmarkPanel';
import RestaurantPanel from '../middlepanel/RestaurantPanel';
import CafePanel from '../middlepanel/CafePanel';
// import PlaceDetailsPopup from './PlaceDetailsPopup'; // 사용하지 않으므로 주석 처리
// import PlaceList from './PlaceList'; // 사용하지 않으므로 주석 처리
// import ItineraryView from './ItineraryView'; // 사용하지 않으므로 주석 처리
import RegionSlidePanel from '../middlepanel/RegionSlidePanel';

interface LeftPanelProps {
  onToggleRegionPanel?: () => void;
}

const LeftPanel: React.FC<LeftPanelProps> = ({ onToggleRegionPanel }) => {
  const [showItinerary, setShowItinerary] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [regionConfirmed, setRegionConfirmed] = useState(false);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [categorySelectionConfirmed, setCategorySelectionConfirmed] = useState(false);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [activeMiddlePanelCategory, setActiveMiddlePanelCategory] = useState<string | null>(null);
  const [selectedKeywordsByCategory, setSelectedKeywordsByCategory] = useState<Record<string, string[]>>({});
  const [keywordPriorityByCategory, setKeywordPriorityByCategory] = useState<Record<string, string[]>>({});
  // const [placePage, setPlacePage] = useState(1);
  // const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  // const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  // const [isPlaceLoading, setIsPlaceLoading] = useState(false);
  const [dates, setDates] = useState<{
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
  } | null>(null);

  // 숙소 패널의 직접 입력값 상태
  const [accomodationDirectInput, setAccomodationDirectInput] = useState('');
  // 관광지 패널 직접 입력 상태 (추후 별도 상태 관리 가능)
  const [landmarkDirectInput, setLandmarkDirectInput] = useState('');
  // 음식점 패널 직접 입력 상태 (추후 별도 상태 관리 가능)
  const [restaurantDirectInput, setRestaurantDirectInput] = useState('');
  // 카페 패널 직접 입력 상태 (추후 별도 상태 관리 가능)
  const [cafeDirectInput, setCafeDirectInput] = useState('');

  // RegionSlidePanel 제어를 위한 상태
  const [regionSlidePanelOpen, setRegionSlidePanelOpen] = useState(false);

  const itinerary = [
    { day: 1, places: [], totalDistance: 0 },
    { day: 2, places: [], totalDistance: 0 },
  ];

  // const totalPlacePages = Math.ceil(filteredPlaces.length / 10);

  // 영어 키워드를 한글로 변환하는 매핑 객체
  const keywordMapping: Record<string, string> = {
    'kind_service': '친절함',
    'cleanliness': '청결도',
    'good_view': '좋은 뷰',
    'quiet_and_relax': '방음',
    'good_bedding': '침구',
    'stylish_interior': '인테리어',
    'good_aircon_heating': '냉난방',
    'well_equipped_bathroom': '욕실',
    'good_breakfast': '조식',
    'easy_parking': '주차',
    'Many_Attractions': '많은 볼거리',
    'Photogenic_Spot': '인생샷',
    'Diverse_Experience_Programs': '체험활동',
    'Friendly_Staff': '친절함',
    'Good_value_for_money': '가성비',
    'Great_for_group_gatherings': '단체',
    'Spacious_store': '공간감',
    'Clean_store': '깔끔함',
    'Large_portions': '푸짐함',
    'Delicious_food': '맛',
    'Special_menu_available': '특별함',
    'Good_for_solo_dining': '혼밥',
    'Tasty_drinks': '음료',
    'Delicious_coffee': '커피',
    'Good_for_photos': '포토존',
    'Delicious_desserts': '디저트',
    'Delicious_bread': '빵'
  };

  const handleDateSelect = (selectedDates: typeof dates) => {
    setDates(selectedDates);
  };

  // 프롬프트 키워드를 지역 정보와 각 카테고리에서 선택된 키워드들을 키워드 매핑을 통해 한글로 변환하여 구성
  const buildPromptKeywords = () => {
    const allKeywords: string[] = [];
    // 지역 선택은 이미 한글로 입력된 값으로 가정
    allKeywords.push(...selectedRegions);
    categoryOrder.forEach((category) => {
      const keywords = selectedKeywordsByCategory[category] || [];
      const priorityKeywords = keywordPriorityByCategory[category] || [];
      const result = keywords.map((kw) => {
        const translated = keywordMapping[kw] || kw;
        return priorityKeywords.includes(kw) ? `{${translated}}` : translated;
      });
      allKeywords.push(...result);
    });
    return allKeywords;
  };

  const promptKeywords = buildPromptKeywords();

  const handleCategoryClick = (category: string) => {
    const index = categoryOrder.indexOf(category);
    if (index !== -1) {
      const newOrder = [...categoryOrder];
      newOrder.splice(index, 1);
      setCategoryOrder(newOrder);
    } else if (categoryOrder.length < 4) {
      setCategoryOrder([...categoryOrder, category]);
    }
  };

  // 더미 데이터용: getKeywordsForCategory는 현재 빈 배열을 리턴 (실제 데이터 추후 구현)
  const getKeywordsForCategory = (category: string) => {
    const dummy: Record<string, string[]> = {
      숙소: [],
      관광지: [],
      음식점: [],
      카페: [],
    };
    return dummy[category] || [];
  };

  const toggleKeyword = (category: string, keyword: string) => {
    setSelectedKeywordsByCategory((prev) => {
      const current = prev[category] || [];
      const updated = current.includes(keyword)
        ? current.filter((k) => k !== keyword)
        : [...current, keyword];
      return { ...prev, [category]: updated };
    });
  };

  return (
    <div className="relative h-full">
      {/* 메인 콘텐츠 영역 (스크롤 가능한 영역) */}
      {!showItinerary && (
        <div className="w-[300px] h-screen bg-white shadow-md flex flex-col">
          <div className="p-4 flex-1 overflow-y-auto space-y-6">
            <h1 className="text-xl font-semibold">제주도 여행 플래너</h1>
            <DatePicker onDatesSelected={handleDateSelect} />
            <button
              onClick={() => {
                if (!dates) {
                  alert("먼저 날짜를 선택해주세요.");
                  return;
                }
                setRegionSlidePanelOpen(!regionSlidePanelOpen);
              }}
              className="w-full bg-blue-100 text-blue-800 rounded px-4 py-2 text-sm font-medium hover:bg-blue-200"
            >
              지역 선택
            </button>

            {regionConfirmed && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-800 mb-2">
                  카테고리 중요도 순서 선택
                </h3>
                <CategoryPrioritySelector
                  selectedOrder={categoryOrder}
                  onSelect={handleCategoryClick}
                  onBack={() => {
                    setRegionConfirmed(false);
                    setCategoryOrder([]);
                  }}
                  onConfirm={() => {
                    setCategorySelectionConfirmed(true);
                  }}
                />
              </div>
            )}

            {categorySelectionConfirmed && (
              <div className="mt-6 space-y-2">
                {categoryOrder.map((category, index) => {
                  const isActive = index === currentCategoryIndex;
                  return (
                    <button
                      key={category}
                      disabled={!isActive}
                      onClick={() => setActiveMiddlePanelCategory(category)}
                      className={`w-full py-2 rounded border ${
                        isActive
                          ? 'bg-white text-black hover:bg-gray-100'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 카테고리별 패널 렌더링 */}
            {activeMiddlePanelCategory === '숙소' && (
              <AccomodationPanel
                selectedKeywords={selectedKeywordsByCategory['숙소'] || []}
                onToggleKeyword={(kw) => toggleKeyword('숙소', kw)}
                directInputValue={accomodationDirectInput}
                onDirectInputChange={setAccomodationDirectInput}
                onConfirmAccomodation={(finalKeywords) => {
                  setSelectedKeywordsByCategory({
                    ...selectedKeywordsByCategory,
                    숙소: finalKeywords,
                  });
                  setActiveMiddlePanelCategory(null);
                  setCurrentCategoryIndex((prev) => prev + 1);
                }}
                onClose={() => {
                  setActiveMiddlePanelCategory(null);
                  setCurrentCategoryIndex((prev) => prev + 1);
                }}
              />
            )}
            {activeMiddlePanelCategory === '관광지' && (
              <LandmarkPanel
                selectedKeywords={selectedKeywordsByCategory['관광지'] || []}
                onToggleKeyword={(kw) => toggleKeyword('관광지', kw)}
                directInputValue={landmarkDirectInput}
                onDirectInputChange={setLandmarkDirectInput}
                onConfirmLandmark={(finalKeywords) => {
                  setSelectedKeywordsByCategory({
                    ...selectedKeywordsByCategory,
                    관광지: finalKeywords,
                  });
                  setActiveMiddlePanelCategory(null);
                  setCurrentCategoryIndex((prev) => prev + 1);
                }}
                onClose={() => {
                  setActiveMiddlePanelCategory(null);
                  setCurrentCategoryIndex((prev) => prev + 1);
                }}
              />
            )}
            {activeMiddlePanelCategory === '음식점' && (
              <RestaurantPanel
                selectedKeywords={selectedKeywordsByCategory['음식점'] || []}
                onToggleKeyword={(kw) => toggleKeyword('음식점', kw)}
                directInputValue={restaurantDirectInput}
                onDirectInputChange={setRestaurantDirectInput}
                onConfirmRestaurant={(finalKeywords) => {
                  setSelectedKeywordsByCategory({
                    ...selectedKeywordsByCategory,
                    음식점: finalKeywords,
                  });
                  setActiveMiddlePanelCategory(null);
                  setCurrentCategoryIndex((prev) => prev + 1);
                }}
                onClose={() => {
                  setActiveMiddlePanelCategory(null);
                  setCurrentCategoryIndex((prev) => prev + 1);
                }}
              />
            )}
            {activeMiddlePanelCategory === '카페' && (
              <CafePanel
                selectedKeywords={selectedKeywordsByCategory['카페'] || []}
                onToggleKeyword={(kw) => toggleKeyword('카페', kw)}
                directInputValue={cafeDirectInput}
                onDirectInputChange={setCafeDirectInput}
                onConfirmCafe={(finalKeywords) => {
                  setSelectedKeywordsByCategory({
                    ...selectedKeywordsByCategory,
                    카페: finalKeywords,
                  });
                  setActiveMiddlePanelCategory(null);
                  setCurrentCategoryIndex((prev) => prev + 1);
                }}
                onClose={() => {
                  setActiveMiddlePanelCategory(null);
                  setCurrentCategoryIndex((prev) => prev + 1);
                }}
              />
            )}

            {/* 아래 부분은 현재 사용하지 않으므로 주석 처리 */}
            {/*
            {selectedPlace && (
              <PlaceDetailsPopup
                place={selectedPlace}
                onClose={() => setSelectedPlace(null)}
              />
            )}
            */}
          </div>
        </div>
      )}

      {showItinerary && (
        <div className="absolute inset-0 z-10 bg-white p-4 overflow-y-auto">
          <button
            onClick={() => setShowItinerary(false)}
            className="text-sm text-blue-600 hover:underline mb-4"
          >
            ← 뒤로
          </button>
          {/*
          <ItineraryView
            itinerary={itinerary}
            startDate={dates?.startDate || new Date()}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />
          */}
        </div>
      )}

      {/* 왼쪽 패널 하단에 고정된 프롬프트 키워드 박스 */}
      {regionConfirmed && (
        <div className="absolute bottom-0 left-0 w-[300px] border-t p-4 bg-white">
          <PromptKeywordBox keywords={promptKeywords} />
        </div>
      )}

      {/* 지역 선택 버튼 클릭 시 RegionSlidePanel 렌더링 */}
      <RegionSlidePanel
        open={regionSlidePanelOpen}
        onClose={() => setRegionSlidePanelOpen(false)}
        selectedRegions={selectedRegions}
        onToggle={(region) => {
          if (selectedRegions.includes(region)) {
            setSelectedRegions(selectedRegions.filter((r) => r !== region));
          } else {
            setSelectedRegions([...selectedRegions, region]);
          }
        }}
        onConfirm={() => {
          setRegionSlidePanelOpen(false);
          setRegionConfirmed(true);
        }}
      />
    </div>
  );
};

export default LeftPanel;
