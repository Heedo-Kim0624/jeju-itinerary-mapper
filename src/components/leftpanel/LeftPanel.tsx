import React, { useState } from 'react';
import { Place } from '@/types/supabase';
import DatePicker from './DatePicker';
import PromptKeywordBox from './PromptKeywordBox';
import CategoryPrioritySelector from './CategoryPrioritySelector';
// 기존 MiddlePanel 대신 CategorySelectKeyword를 import 합니다.
import CategorySelectKeyword from '../middlepanel/CategorySelectKeyword';
import PlaceDetailsPopup from './PlaceDetailsPopup';
import PlaceList from './PlaceList';
import ItineraryView from './ItineraryView';
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
  const [placePage, setPlacePage] = useState(1);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [isPlaceLoading, setIsPlaceLoading] = useState(false);
  const [dates, setDates] = useState<{
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
  } | null>(null);

  // RegionSlidePanel 제어를 위한 상태
  const [regionSlidePanelOpen, setRegionSlidePanelOpen] = useState(false);

  const itinerary = [
    { day: 1, places: [], totalDistance: 0 },
    { day: 2, places: [], totalDistance: 0 },
  ];

  const totalPlacePages = Math.ceil(filteredPlaces.length / 10);

  const handleDateSelect = (selectedDates: typeof dates) => {
    setDates(selectedDates);
  };

  const buildPromptKeywords = () => {
    const allKeywords: string[] = [];
    allKeywords.push(...selectedRegions);
    categoryOrder.forEach((category) => {
      const keywords = selectedKeywordsByCategory[category] || [];
      const priorityKeywords = keywordPriorityByCategory[category] || [];
      const result = keywords.map((kw) =>
        priorityKeywords.includes(kw) ? `{${kw}}` : kw
      );
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

  const getKeywordsForCategory = (category: string) => {
    const dummy: Record<string, string[]> = {
      숙소: [], 관광지: [], 음식점: [], 카페: [],
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

            {activeMiddlePanelCategory && (
              // 활성 카테고리가 있을 때, CategorySelectKeyword 컴포넌트 실행
              <CategorySelectKeyword
                category={activeMiddlePanelCategory}
                keywords={getKeywordsForCategory(activeMiddlePanelCategory)}
                selectedKeywords={selectedKeywordsByCategory[activeMiddlePanelCategory] || []}
                onToggleKeyword={(kw) => toggleKeyword(activeMiddlePanelCategory, kw)}
                onClose={() => {
                  setActiveMiddlePanelCategory(null);
                  setCurrentCategoryIndex((prev) => prev + 1);
                  setKeywordPriorityByCategory((prev) => ({
                    ...prev,
                    [activeMiddlePanelCategory!]: [],
                  }));
                }}
              />
            )}

            {selectedPlace && (
              <PlaceDetailsPopup
                place={selectedPlace}
                onClose={() => setSelectedPlace(null)}
              />
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
          <ItineraryView
            itinerary={itinerary}
            startDate={dates?.startDate || new Date()}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />
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
            setSelectedRegions(selectedRegions.filter(r => r !== region));
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
