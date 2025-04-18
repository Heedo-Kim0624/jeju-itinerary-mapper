//LeftPanel.tsx (이 행 삭제 금지)
import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Place } from '@/types/supabase';
import DatePicker from './DatePicker';
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

  const handleDateSelect = (selectedDates: typeof dates) => {
    setDates(selectedDates);
  };

  // 유지: 데이터를 백엔드로 보내기 위한 buildPromptKeywords 함수
  function buildPromptKeywords() {
    const allKeywords: string[] = [];

    if (dates) {
      const formattedStartDate = format(dates.startDate, 'MM.dd');
      const formattedEndDate = format(dates.endDate, 'MM.dd');
      allKeywords.push(`일정[${formattedStartDate},${dates.startTime},${formattedEndDate},${dates.endTime}]`);
    }

    if (selectedRegions.length > 0) {
      allKeywords.push(`지역[${selectedRegions.join(',')}]`);
    }

    categoryOrder.forEach((category) => {
      const keywords = selectedKeywordsByCategory[category] || [];
      if (keywords.length > 0) {
        allKeywords.push(`${category}[${keywords.join(',')}]`);
      }
    });

    return allKeywords;
  }

  const promptKeywords = useMemo(() => buildPromptKeywords(), [
    selectedRegions,
    categoryOrder,
    selectedKeywordsByCategory,
    keywordPriorityByCategory,
    dates,
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
                <h3 className="text-sm font-medium text-gray-800 mb-2">카테고리 중요도 순서 선택</h3>
                <CategoryPrioritySelector
                  selectedOrder={categoryOrder}
                  onSelect={handleCategoryClick}
                  onBack={() => { setRegionConfirmed(false); setCategoryOrder([]); }}
                  onConfirm={() => setCategorySelectionConfirmed(true)}
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
                  setSelectedKeywordsByCategory({ ...selectedKeywordsByCategory, 숙소: finalKeywords });
                  setActiveMiddlePanelCategory(null);
                  setCurrentCategoryIndex((prev) => prev + 1);
                }}
                onClose={() => { handlePanelBack('숙소'); setActiveMiddlePanelCategory(null); }}
              />
            )}

            {activeMiddlePanelCategory === '관광지' && (
              <LandmarkPanel
                selectedKeywords={selectedKeywordsByCategory['관광지'] || []}
                onToggleKeyword={(kw) => toggleKeyword('관광지', kw)}
                directInputValue={landmarkDirectInput}
                onDirectInputChange={setLandmarkDirectInput}
                onConfirmLandmark={(finalKeywords) => {
                  setSelectedKeywordsByCategory({ ...selectedKeywordsByCategory, 관광지: finalKeywords });
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
                  setSelectedKeywordsByCategory({ ...selectedKeywordsByCategory, 음식점: finalKeywords });
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
                  setSelectedKeywordsByCategory({ ...selectedKeywordsByCategory, 카페: finalKeywords });
                  setActiveMiddlePanelCategory(null);
                  setCurrentCategoryIndex((prev) => prev + 1);
                }}
                onClose={() => handlePanelBack('카페')}
              />
            )}

            {categorySelectionConfirmed && categoryOrder.length === 4 && currentCategoryIndex >= categoryOrder.length && (
              <div className="mt-4">
                <button
                  className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 text-sm"
                  onClick={() => console.log('장소 생성 버튼 클릭됨', promptKeywords)}
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

      {/* PromptKeywordBox 제거: UI에는 표시되지 않음, 데이터만 유지 */}

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
            alert('지역을 선택해주세요.');
          }
        }}
      />
    </div>
  );
};

export default LeftPanel;
