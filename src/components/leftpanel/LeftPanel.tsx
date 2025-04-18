//LeftPanel.tsx (이 행 삭제 금지)
import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import PanelHeader from './PanelHeader';
import CategoryOrderingStep from './CategoryOrderingStep';
import CategoryNavigation from './CategoryNavigation';
import CategoryPanels from './CategoryPanels';
import GenerateButton from './GenerateButton';
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

  const handleDateSelect = (selectedDates: typeof dates) => {
    setDates(selectedDates);
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

  const handleCategorySelection = (category: string) => {
    setActiveMiddlePanelCategory(category);
  };

  const handleConfirmCategory = {
    accomodation: (finalKeywords: string[]) => {
      setSelectedKeywordsByCategory({ ...selectedKeywordsByCategory, 숙소: finalKeywords });
      setActiveMiddlePanelCategory(null);
      setCurrentCategoryIndex((prev) => prev + 1);
    },
    landmark: (finalKeywords: string[]) => {
      setSelectedKeywordsByCategory({ ...selectedKeywordsByCategory, 관광지: finalKeywords });
      setActiveMiddlePanelCategory(null);
      setCurrentCategoryIndex((prev) => prev + 1);
    },
    restaurant: (finalKeywords: string[]) => {
      setSelectedKeywordsByCategory({ ...selectedKeywordsByCategory, 음식점: finalKeywords });
      setActiveMiddlePanelCategory(null);
      setCurrentCategoryIndex((prev) => prev + 1);
    },
    cafe: (finalKeywords: string[]) => {
      setSelectedKeywordsByCategory({ ...selectedKeywordsByCategory, 카페: finalKeywords });
      setActiveMiddlePanelCategory(null);
      setCurrentCategoryIndex((prev) => prev + 1);
    }
  };

  const handleGenerateClick = () => {
    console.log('장소 생성 버튼 클릭됨', promptKeywords);
  };

  const directInputValues = {
    accomodation: accomodationDirectInput,
    landmark: landmarkDirectInput,
    restaurant: restaurantDirectInput,
    cafe: cafeDirectInput
  };

  const onDirectInputChange = {
    accomodation: setAccomodationDirectInput,
    landmark: setLandmarkDirectInput,
    restaurant: setRestaurantDirectInput,
    cafe: setCafeDirectInput
  };

  const handlePanelBackByCategory = {
    accomodation: () => handlePanelBack('숙소'),
    landmark: () => handlePanelBack('관광지'),
    restaurant: () => handlePanelBack('음식점'),
    cafe: () => { handlePanelBack('카페'); setActiveMiddlePanelCategory(null); }
  };

  return (
    <div className="relative h-full">
      {!showItinerary && (
        <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-l border-r border-gray-200 z-40 shadow-md flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
            <PanelHeader 
              onDateSelect={handleDateSelect}
              onOpenRegionPanel={() => setRegionSlidePanelOpen(!regionSlidePanelOpen)}
              hasSelectedDates={!!dates}
            />

            <CategoryOrderingStep
              categoryOrder={categoryOrder}
              onCategoryClick={handleCategoryClick}
              onBackToRegionSelect={() => { setRegionConfirmed(false); setCategoryOrder([]); }}
              onConfirmCategoryOrder={() => setCategorySelectionConfirmed(true)}
              regionConfirmed={regionConfirmed}
            />

            <CategoryNavigation
              categoryOrder={categoryOrder}
              currentCategoryIndex={currentCategoryIndex}
              onCategoryClick={handleCategorySelection}
              categorySelectionConfirmed={categorySelectionConfirmed}
            />

            <CategoryPanels
              activeMiddlePanelCategory={activeMiddlePanelCategory}
              selectedKeywordsByCategory={selectedKeywordsByCategory}
              toggleKeyword={toggleKeyword}
              directInputValues={directInputValues}
              onDirectInputChange={onDirectInputChange}
              onConfirmCategory={handleConfirmCategory}
              handlePanelBack={handlePanelBackByCategory}
            />

            <GenerateButton
              categorySelectionConfirmed={categorySelectionConfirmed}
              categoryOrder={categoryOrder}
              currentCategoryIndex={currentCategoryIndex}
              promptKeywords={promptKeywords}
              onGenerateClick={handleGenerateClick}
            />
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
