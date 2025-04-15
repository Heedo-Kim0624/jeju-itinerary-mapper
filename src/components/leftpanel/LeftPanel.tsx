import React, { useState, useMemo } from 'react';
import { Place } from '@/types/supabase';
import DatePicker from './DatePicker';
import PromptKeywordBox from './PromptKeywordBox';
import CategoryPrioritySelector from './CategoryPrioritySelector';
import AccomodationPanel from '../middlepanel/AccomodationPanel';
import LandmarkPanel from '../middlepanel/LandmarkPanel';
import RestaurantPanel from '../middlepanel/RestaurantPanel';
import CafePanel from '../middlepanel/CafePanel';
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
  const [dates, setDates] = useState<{
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
  } | null>(null);

  const [accomodationDirectInput, setAccomodationDirectInput] = useState('');
  const [landmarkDirectInput, setLandmarkDirectInput] = useState('');
  const [restaurantDirectInput, setRestaurantDirectInput] = useState('');
  const [cafeDirectInput, setCafeDirectInput] = useState('');

  const [regionSlidePanelOpen, setRegionSlidePanelOpen] = useState(false);

  const itinerary = [
    { day: 1, places: [], totalDistance: 0 },
    { day: 2, places: [], totalDistance: 0 },
  ];

  const keywordMapping: Record<string, string> = {
    'Many_Attractions': '많은 볼거리',
    'Photogenic_Spot': '인생샷',
    'Easy_Parking': '주차',
    'Well_Maintained_Walking_Trails': '산책로',
    'Kid_Friendly': '아이와 함께',
    'Great_View': '뷰',
    'Reasonable_Pricing': '가성비',
    'Diverse_Experience_Programs': '체험활동',
    'Large_Scale': '공간감',
    'Friendly_Staff': '친절함',
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
    'Good_value_for_money': '가성비',
    'Great_for_group_gatherings': '단체',
    'Spacious_store': '공간감',
    'Clean_store': '깔끔함',
    'Nice_view': '좋은 뷰',
    'Large_portions': '푸짐함',
    'Delicious_food': '맛',
    'Stylish_interior': '세련됨',
    'Fresh_ingredients': '신선함',
    'Friendly': '친절',
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

  function buildPromptKeywords() {
    const allKeywords: string[] = [];
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
  }

  const promptKeywords = useMemo(() => buildPromptKeywords(), [
    selectedRegions,
    categoryOrder,
    selectedKeywordsByCategory,
    keywordPriorityByCategory,
  ]);

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

  const handlePanelBack = (category: string) => {
    setSelectedKeywordsByCategory((prev) => {
      const newObj = { ...prev };
      delete newObj[category];
      return newObj;
    });
    setCurrentCategoryIndex((prev) => {
      const newIndex = prev > 0 ? prev - 1 : 0;
      setActiveMiddlePanelCategory(categoryOrder[newIndex] || null);
      return newIndex;
    });
  };

  return (
    <div className="relative h-full">
      {!showItinerary && (
        <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-l border-r border-gray-200 z-40 shadow-md flex flex-col">
          {/* 메인 내용 영역에 pb (padding-bottom) 추가하여 프롬프트 키워드 박스 공간 확보 */}
          <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
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
                  const isCurrent = index === currentCategoryIndex;
                  const isConfirmed = index < currentCategoryIndex;
                  const disabled = index > currentCategoryIndex;
                  return (
                    <button
                      key={category}
                      disabled={disabled}
                      onClick={() => setActiveMiddlePanelCategory(category)}
                      className={`w-full py-2 rounded border ${
                        isCurrent
                          ? 'bg-white text-black hover:bg-gray-100'
                          : isConfirmed
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            )}

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
                onClose={() => handlePanelBack('숙소')}
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
                onClose={() => handlePanelBack('관광지')}
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
                onClose={() => handlePanelBack('음식점')}
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
                onClose={() => handlePanelBack('카페')}
              />
            )}

            {categorySelectionConfirmed &&
              categoryOrder.length === 4 &&
              currentCategoryIndex >= categoryOrder.length && (
                <div className="mt-4">
                  <button
                    className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 text-sm"
                    onClick={() => {
                      console.log('장소 생성 버튼 클릭됨', promptKeywords);
                    }}
                  >
                    장소 생성
                  </button>
                </div>
              )}
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
        </div>
      )}

      {regionConfirmed && (
        <div className="absolute bottom-0 left-0 w-[300px] max-h-60 border-t p-4 bg-white overflow-y-auto z-50">
          <PromptKeywordBox keywords={promptKeywords} />
        </div>
      )}

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
          if (selectedRegions.length > 0) {
            setRegionConfirmed(true);
          } else {
            alert("지역을 선택해주세요.");
          }
        }}
      />
    </div>
  );
};

export default LeftPanel;
