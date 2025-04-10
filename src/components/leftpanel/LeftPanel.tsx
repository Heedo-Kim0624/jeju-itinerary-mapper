import React, { useState } from 'react';
import DatePicker from './DatePicker';
import DaySelector from './DaySelector';
import RegionSelector from './RegionSelector';
import PromptKeywordBox from './PromptKeywordBox';
import CategoryPrioritySelector from './CategoryPrioritySelector';
import MiddlePanel from '../middlepanel/MiddlePanel';
import PlaceDetailsPopup from './PlaceDetailsPopup';
import PlaceList from './PlaceList';
import ItineraryView from './ItineraryView';

const LeftPanel = () => {
  // ✅ 일정 생성 여부 상태
  const [showItinerary, setShowItinerary] = useState(false);
  
  // ✅ 선택된 일정 일자
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // ✅ 지역 선택 패널 열림 여부
  const [showRegionPanel, setShowRegionPanel] = useState(false);

  // ✅ 선택된 지역 리스트
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  // ✅ 지역 선택 완료 여부
  const [regionConfirmed, setRegionConfirmed] = useState(false);

  // ✅ 사용자가 선택한 카테고리 중요도 순서
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);

  // ✅ 카테고리 우선순위 선택 완료 여부
  const [categorySelectionConfirmed, setCategorySelectionConfirmed] = useState(false);

  // ✅ 현재 선택 중인 카테고리 인덱스
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);

  // ✅ 현재 열려 있는 MiddlePanel 카테고리
  const [activeMiddlePanelCategory, setActiveMiddlePanelCategory] = useState<string | null>(null);

  // ✅ 카테고리별로 선택된 키워드들
  const [selectedKeywordsByCategory, setSelectedKeywordsByCategory] = useState<Record<string, string[]>>({});

  // ✅ 우선순위 키워드 (향후 드래그앤드롭에 활용)
  const [keywordPriorityByCategory, setKeywordPriorityByCategory] = useState<Record<string, string[]>>({});

  // ✅ 장소 페이지네이션
  const [placePage, setPlacePage] = useState(1);

  // ✅ 선택된 장소 상세보기용
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // ✅ 필터링된 장소 목록
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);

  // ✅ 장소 로딩 상태
  const [isPlaceLoading, setIsPlaceLoading] = useState(false);

  // ✅ 날짜, 시간 정보
  const [dates, setDates] = useState<{
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
  } | null>(null);

  // ✅ 임시 일정 데이터 (실제 일정 생성 시 대체 예정)
  const itinerary = [
    { day: 1, places: [], totalDistance: 0 },
    { day: 2, places: [], totalDistance: 0 },
  ];

  // ✅ 페이지 수 계산
  const totalPlacePages = Math.ceil(filteredPlaces.length / 10);

  // ✅ 날짜 선택 처리
  const handleDateSelect = (selectedDates: typeof dates) => {
    setDates(selectedDates);
  };

  // ✅ 지역 체크 토글
  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  };

  // ✅ 키워드 묶음 생성 (지역 + 카테고리)
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

  // ✅ 카테고리 중요도 클릭 핸들러
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

  // ✅ 각 카테고리별 키워드 목록 불러오기
  const getKeywordsForCategory = (category: string) => {
    const dummy: Record<string, string[]> = {
      숙소: [],
      관광지: [],
      음식점: [],
      카페: [],
    };
    return dummy[category] || [];
  };

  // ✅ 키워드 선택/해제 토글
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
      {/* ✅ 기존 패널 - 일정 생성 전 UI */}
      <div className={showItinerary ? 'hidden' : ''}>
        <div className="p-4 w-[300px] space-y-6 bg-white shadow-md h-screen overflow-y-auto">
          <h1 className="text-xl font-semibold">제주도 여행 플래너</h1>
          {/* 지역 선택 */}
          <button
            onClick={() => setShowRegionPanel(true)}
            className="w-full bg-blue-100 text-blue-800 rounded px-4 py-2 text-sm font-medium hover:bg-blue-200"
          >
            지역 선택
          </button>
          <DatePicker onDatesSelected={handleDateSelect} />
          {/* 지역 선택 패널 */}
          {showRegionPanel && (
            <RegionSelector
              selectedRegions={selectedRegions}
              onToggle={toggleRegion}
              onClose={() => setShowRegionPanel(false)}
              onConfirm={() => {
                setRegionConfirmed(true);
                setShowRegionPanel(false);
              }}
            />
          )}
          {/* 프롬프트 or 장소목록 */}
          {dates && selectedRegions.length > 0 && (
            <>
              {categoryOrder.length === 4 ? (
                <PlaceList
                  places={filteredPlaces}
                  loading={isPlaceLoading}
                  selectedPlace={selectedPlace}
                  onSelectPlace={setSelectedPlace}
                  page={placePage}
                  onPageChange={setPlacePage}
                  totalPages={totalPlacePages}
                />
              ) : (
                <>
                  <h3 className="text-sm font-medium text-gray-800">프롬프트 키워드</h3>
                  <PromptKeywordBox keywords={promptKeywords} />
                </>
              )}
            </>
          )}
          {/* 카테고리 중요도 순서 */}
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
          {/* 키워드 선택용 카테고리 버튼 */}
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
          {/* MiddlePanel (키워드 선택창) */}
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
          {/* 장소 상세보기 팝업 */}
          {selectedPlace && (
            <PlaceDetailsPopup
              place={selectedPlace}
              onClose={() => setSelectedPlace(null)}
            />
          )}
          {/* 일정 생성 버튼 */}
          <button
            onClick={() => setShowItinerary(true)}
            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 mt-4"
          >
            일정 생성
          </button>
        </div>
      </div>
      {/* 일정 보기 패널 */}
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
