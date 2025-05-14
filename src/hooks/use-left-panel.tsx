import { useState, useCallback } from 'react';
import { Place } from '@/types/supabase';
import { useToast } from "@/components/ui/use-toast";
import { createItinerary } from '@/lib/itinerary/itinerary-utils';

interface RegionSelection {
  regionSlidePanelOpen: boolean;
  selectedRegions: string[];
  regionConfirmed: boolean;
  setRegionSlidePanelOpen: (open: boolean) => void;
  handleRegionToggle: (region: string) => void;
  setRegionConfirmed: (confirmed: boolean) => void;
}

interface CategorySelection {
  categoryStepIndex: number;
  activeMiddlePanelCategory: string | null;
  confirmedCategories: string[];
  selectedKeywordsByCategory: { [category: string]: string[] };
  setCategoryStepIndex: (index: number) => void;
  setActiveMiddlePanelCategory: (category: string | null) => void;
  setConfirmedCategories: (categories: string[]) => void;
  setSelectedKeywordsByCategory: (keywords: { [category: string]: string[] }) => void;
  handleCategoryButtonClick: (category: string) => void;
  toggleKeyword: (category: string, keyword: string) => void;
  handlePanelBackByCategory: () => void;
}

interface KeywordsAndInputs {
  directInputValues: { [category: string]: string };
  onDirectInputChange: (category: string, value: string) => void;
  handleConfirmByCategory: (category: string) => void;
}

interface PlacesManagement {
  selectedPlaces: Place[];
  allCategoriesSelected: boolean;
  setAllCategoriesSelected: (selected: boolean) => void;
  handleSelectPlace: (place: Place) => void;
  handleRemovePlace: (placeId: string) => void;
  handleViewOnMap: (place: Place) => void;
}

interface TripDetails {
  dates: { startDate: Date; endDate: Date } | null;
  setDates: (dates: { startDate: Date; endDate: Date } | null) => void;
}

interface UiVisibility {
  showCategoryResult: boolean;
  showItinerary: boolean;
  setShowCategoryResult: (show: boolean) => void;
  setShowItinerary: (show: boolean) => void;
  handleResultClose: () => void;
}

interface ItineraryManagement {
  itinerary: any[] | null;
  selectedItineraryDay: number | null;
  itineraryLoading: boolean;
  setItinerary: (itinerary: any[] | null) => void;
  handleCreateItinerary: () => Promise<any[] | void>;
  handleSelectItineraryDay: (day: number) => void;
}

export const useLeftPanel = () => {
  const [regionSlidePanelOpen, setRegionSlidePanelOpen] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [regionConfirmed, setRegionConfirmed] = useState(false);

  const [categoryStepIndex, setCategoryStepIndex] = useState(0);
  const [activeMiddlePanelCategory, setActiveMiddlePanelCategory] = useState<string | null>(null);
  const [confirmedCategories, setConfirmedCategories] = useState<string[]>([]);
  const [selectedKeywordsByCategory, setSelectedKeywordsByCategory] = useState<{ [category: string]: string[] }>({});

  const [directInputValues, setDirectInputValues] = useState<{ [category: string]: string }>({});
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
  const [allCategoriesSelected, setAllCategoriesSelected] = useState(false);
  const [dates, setDates] = useState<{ startDate: Date; endDate: Date } | null>(null);
  const [showCategoryResult, setShowCategoryResult] = useState(false);
  const [showItinerary, setShowItinerary] = useState(false);
  const [itinerary, setItinerary] = useState<any[] | null>(null);
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number | null>(null);
  const [itineraryLoading, setItineraryLoading] = useState(false);
  const { toast } = useToast();

  const handleRegionToggle = (region: string) => {
    setSelectedRegions(prevRegions =>
      prevRegions.includes(region)
        ? prevRegions.filter(r => r !== region)
        : [...prevRegions, region]
    );
  };

  const handleCategoryButtonClick = (category: string) => {
    setActiveMiddlePanelCategory(category);
    setCategoryStepIndex(1);
  };

  const toggleKeyword = (category: string, keyword: string) => {
    setSelectedKeywordsByCategory(prev => {
      const prevKeywords = prev[category] || [];
      return {
        ...prev,
        [category]: prevKeywords.includes(keyword)
          ? prevKeywords.filter(kw => kw !== keyword)
          : [...prevKeywords, keyword],
      };
    });
  };

  const onDirectInputChange = (category: string, value: string) => {
    setDirectInputValues(prev => ({ ...prev, [category]: value }));
  };

  const handleConfirmByCategory = (category: string) => {
    if (!confirmedCategories.includes(category)) {
      setConfirmedCategories([...confirmedCategories, category]);
    }
    setCategoryStepIndex(0);
  };

  const handlePanelBackByCategory = () => {
    setCategoryStepIndex(0);
  };

  const handleSelectPlace = (place: Place) => {
    setSelectedPlaces(prevPlaces => {
      if (prevPlaces.find(p => p.id === place.id)) {
        return prevPlaces;
      }
      return [...prevPlaces, place];
    });
    setShowCategoryResult(false);
  };

  const handleRemovePlace = (placeId: string) => {
    setSelectedPlaces(prevPlaces => prevPlaces.filter(place => place.id !== placeId));
  };

  const handleViewOnMap = (place: Place) => {
    console.log("View on map:", place);
  };

  const handleResultClose = () => {
    setShowCategoryResult(false);
  };

  const handleSelectItineraryDay = (day: number) => {
    setSelectedItineraryDay(day);
  };

  // Fix the error in handleCreateItinerary function
  const handleCreateItinerary = async (): Promise<any[] | void> => {
    if (!dates) {
      toast.error("날짜를 먼저 선택해주세요");
      return;
    }
    
    console.log("일정 생성 시작");
    
    try {
      // 로딩 상태 업데이트
      setItineraryLoading(true);
      
      // 일정 생성 hook 호출
      const result = await createItinerary(dates, selectedPlaces);
      
      // 결과 확인
      if (Array.isArray(result) && result.length > 0) {
        console.log("일정 생성 성공:", result);
        setItinerary(result);
        setShowItinerary(true);
        
        // 첫번째 일자 선택
        setSelectedItineraryDay(1);
        toast.success(`${result.length}일 일정이 생성되었습니다`);
        return result;
      } else {
        console.error("일정 생성 결과가 비었거나 유효하지 않습니다:", result);
        toast.error("일정을 생성할 수 없습니다");
        return;
      }
    } catch (error) {
      console.error("일정 생성 오류:", error);
      toast.error("일정 생성 중 오류가 발생했습니다");
      return;
    } finally {
      setItineraryLoading(false);
    }
  };

  return {
    regionSelection: {
      regionSlidePanelOpen,
      selectedRegions,
      regionConfirmed,
      setRegionSlidePanelOpen,
      handleRegionToggle,
      setRegionConfirmed,
    },
    categorySelection: {
      categoryStepIndex,
      activeMiddlePanelCategory,
      confirmedCategories,
      selectedKeywordsByCategory,
      setCategoryStepIndex,
      setActiveMiddlePanelCategory,
      setConfirmedCategories,
      setSelectedKeywordsByCategory,
      handleCategoryButtonClick,
      toggleKeyword,
      handlePanelBackByCategory,
    },
    keywordsAndInputs: {
      directInputValues,
      onDirectInputChange,
      handleConfirmByCategory,
    },
    placesManagement: {
      selectedPlaces,
      allCategoriesSelected,
      setAllCategoriesSelected,
      handleSelectPlace,
      handleRemovePlace,
      handleViewOnMap,
    },
    tripDetails: {
      dates,
      setDates,
    },
    uiVisibility: {
      showCategoryResult,
      showItinerary,
      setShowCategoryResult,
      setShowItinerary,
      handleResultClose,
    },
    itineraryManagement: {
      itinerary,
      selectedItineraryDay,
      itineraryLoading,
      setItinerary,
      handleCreateItinerary,
      handleSelectItineraryDay,
    }
  };
};
