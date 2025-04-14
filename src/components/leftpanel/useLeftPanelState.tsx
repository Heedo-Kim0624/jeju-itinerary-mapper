
import { useState } from 'react';
import { DateRange, KeywordMapping } from './types';

// 키워드 매핑 객체
const keywordMapping: KeywordMapping = {
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

export const useLeftPanelState = () => {
  // 일정 관련 상태
  const [showItinerary, setShowItinerary] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  // 지역 선택 관련 상태
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [regionConfirmed, setRegionConfirmed] = useState(false);
  const [regionSelectorOpen, setRegionSelectorOpen] = useState(false);
  
  // 카테고리 관련 상태
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [categorySelectionConfirmed, setCategorySelectionConfirmed] = useState(false);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [activeMiddlePanelCategory, setActiveMiddlePanelCategory] = useState<string | null>(null);
  
  // 키워드 관련 상태
  const [selectedKeywordsByCategory, setSelectedKeywordsByCategory] = useState<Record<string, string[]>>({});
  const [keywordPriorityByCategory, setKeywordPriorityByCategory] = useState<Record<string, string[]>>({});
  
  // 직접 입력 관련 상태
  const [accomodationDirectInput, setAccomodationDirectInput] = useState('');
  const [landmarkDirectInput, setLandmarkDirectInput] = useState('');
  const [restaurantDirectInput, setRestaurantDirectInput] = useState('');
  const [cafeDirectInput, setCafeDirectInput] = useState('');
  
  // 날짜 선택 관련 상태
  const [dates, setDates] = useState<DateRange | null>(null);

  // 더미 일정 데이터
  const itinerary = [
    { day: 1, places: [], totalDistance: 0 },
    { day: 2, places: [], totalDistance: 0 },
  ];

  // 프롬프트 키워드 구성 : 각 카테고리의 키워드를 keywordMapping 사용하여 한글로 변환
  const buildPromptKeywords = () => {
    const allKeywords: string[] = [];
    // 지역 선택은 이미 한글로 입력된 값으로 가정
    allKeywords.push(...selectedRegions);
    
    // 카테고리별 키워드 처리 - 중복 키워드 방지를 위한 Set 사용
    const uniqueTranslatedKeywords = new Set<string>();
    
    categoryOrder.forEach((category) => {
      const keywords = selectedKeywordsByCategory[category] || [];
      const priorityKeywords = keywordPriorityByCategory[category] || [];
      
      keywords.forEach(kw => {
        const translated = keywordMapping[kw] || kw;
        
        // 중복 키워드는 건너뛰기 (우선순위 키워드는 중복 허용)
        if (priorityKeywords.includes(kw)) {
          allKeywords.push(`{${translated}}`);
        } else if (!uniqueTranslatedKeywords.has(translated)) {
          uniqueTranslatedKeywords.add(translated);
          allKeywords.push(translated);
        }
      });
    });
    
    return allKeywords;
  };

  const promptKeywords = buildPromptKeywords();

  // 카테고리 클릭 핸들러
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

  // 더미 데이터용: getKeywordsForCategory는 현재 빈 배열 (추후 구현)
  const getKeywordsForCategory = (category: string) => {
    const dummy: Record<string, string[]> = {
      숙소: [],
      관광지: [],
      음식점: [],
      카페: [],
    };
    return dummy[category] || [];
  };

  // 키워드 토글 핸들러
  const toggleKeyword = (category: string, keyword: string) => {
    setSelectedKeywordsByCategory((prev) => {
      const current = prev[category] || [];
      const updated = current.includes(keyword)
        ? current.filter((k) => k !== keyword)
        : [...current, keyword];
      return { ...prev, [category]: updated };
    });
  };

  // 공통 "뒤로" 액션: 현재 카테고리의 키워드 초기화하고, currentCategoryIndex 하나 감소
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

  // 날짜 선택 핸들러
  const handleDateSelect = (selectedDates: DateRange) => {
    setDates(selectedDates);
  };

  return {
    // 상태
    showItinerary,
    selectedDay,
    selectedRegions,
    regionConfirmed,
    categoryOrder,
    categorySelectionConfirmed,
    currentCategoryIndex,
    activeMiddlePanelCategory,
    selectedKeywordsByCategory,
    keywordPriorityByCategory,
    dates,
    accomodationDirectInput,
    landmarkDirectInput,
    restaurantDirectInput,
    cafeDirectInput,
    regionSelectorOpen,
    itinerary,
    promptKeywords,
    keywordMapping,
    
    // 상태 변경 함수
    setShowItinerary,
    setSelectedDay,
    setSelectedRegions,
    setRegionConfirmed,
    setCategoryOrder,
    setCategorySelectionConfirmed,
    setCurrentCategoryIndex,
    setActiveMiddlePanelCategory,
    setSelectedKeywordsByCategory,
    setKeywordPriorityByCategory,
    setDates,
    setAccomodationDirectInput,
    setLandmarkDirectInput,
    setRestaurantDirectInput,
    setCafeDirectInput,
    setRegionSelectorOpen,
    
    // 유틸리티 함수
    handleDateSelect,
    handleCategoryClick,
    handlePanelBack,
    toggleKeyword,
    getKeywordsForCategory,
    buildPromptKeywords,
  };
};
