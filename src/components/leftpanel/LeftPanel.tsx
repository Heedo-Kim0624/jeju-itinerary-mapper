import React, { useState } from 'react';
import { Place } from '@/types/supabase';
import DatePicker from './DatePicker';
import { RegionSelector } from './RegionSelector';
import PromptKeywordBox from './PromptKeywordBox';
import CategoryPrioritySelector from './CategoryPrioritySelector';
import MiddlePanel from '../middlepanel/MiddlePanel';
import PlaceDetailsPopup from './PlaceDetailsPopup';
import PlaceList from './PlaceList';
import ItineraryView from './ItineraryView';

const LeftPanel = () => {
  const [showItinerary, setShowItinerary] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showRegionPanel, setShowRegionPanel] = useState(false);
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

  const itinerary = [
    { day: 1, places: [], totalDistance: 0 },
    { day: 2, places: [], totalDistance: 0 },
  ];

  const totalPlacePages = Math.ceil(filteredPlaces.length / 10);

  const handleDateSelect = (selectedDates: typeof dates) => {
    setDates(selectedDates);
  };

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
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
      {!showItinerary && (
        <div className="w-[300px] h-screen bg-white shadow-md flex flex-col">
          {/* 상단 콘텐츠 (스크롤) */}
          <div className="p-4 flex-1 overflow-y-auto space-y-6">
            <h1 className="text-xl font-semibold">제주도 여행 플래너</h1>

            <DatePicker onDatesSelected={handleDateSelect} />

            <button
              onClick={() => setShowRegionPanel(prev => !prev)}
              className="w-full bg-blue-100 text-blue-800 rounded px-4 py-2 text-sm font-medium hover:bg-blue-200"
            >
              지역 선택
            </button>

            {showRegionPanel && (
              <div className="w-full mt-2">
                <RegionSelector
                  selectedRegions={selectedRegions}
                  onToggle={toggleRegion}
                  onClose={() => setShowRegionPanel(false)}
                  onConfirm={() => {
                    setRegionConfirmed(true);
                    setShowRegionPanel(false);
                  }}
                />
              </div>
            )}

            {regionConfirmed && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-800 mb-2">카테고리 중요도 순서 선택</h3>
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
              <MiddlePanel
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

            {categoryOrder.length === 4 && dates && selectedRegions.length > 0 && (
              <PlaceList
                places={filteredPlaces}
                loading={isPlaceLoading}
                selectedPlace={selectedPlace}
                onSelectPlace={setSelectedPlace}
                page={placePage}
                onPageChange={setPlacePage}
                totalPages={totalPlacePages}
              />
            )}
          </div>

          {/* 하단 고정 Prompt */}
          {dates && selectedRegions.length > 0 && categoryOrder.length !== 4 && (
            <div className="border-t p-4">
              <PromptKeywordBox keywords={promptKeywords} />
            </div>
          )}
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
    </div>
  );
};

export default LeftPanel;
