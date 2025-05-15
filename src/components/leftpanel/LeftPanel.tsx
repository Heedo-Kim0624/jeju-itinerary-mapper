import React, { useState, useCallback } from 'react';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useScheduleGenerator } from '@/hooks/use-schedule-generator';
import { getCategoryKorean } from '@/utils/categoryUtils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

// Define the allowed category names
type CategoryName = 'accommodation' | 'landmark' | 'restaurant' | 'cafe' | 'attraction';

const LeftPanel = ({ onCreateItinerary }) => {
  const [isRegionPanelOpen, setIsRegionPanelOpen] = useState(true);
  const [isDatePanelOpen, setIsDatePanelOpen] = useState(false);
  const [isAccommodationPanelOpen, setIsAccommodationPanelOpen] = useState(false);
  const [isLandmarkPanelOpen, setIsLandmarkPanelOpen] = useState(false);
  const [isRestaurantPanelOpen, setIsRestaurantPanelOpen] = useState(false);
  const [isCafePanelOpen, setIsCafePanelOpen] = useState(false);
  const [accommodationKeywords, setAccommodationKeywords] = useState<string[]>([]);
  const [landmarkKeywords, setLandmarkKeywords] = useState<string[]>([]);
  const [restaurantKeywords, setRestaurantKeywords] = useState<string[]>([]);
  const [cafeKeywords, setCafeKeywords] = useState<string[]>([]);
  const [accommodationDirectInputValue, setAccommodationDirectInputValue] = useState('');
  const [landmarkDirectInputValue, setLandmarkDirectInputValue] = useState('');
  const [restaurantDirectInputValue, setRestaurantDirectInputValue] = useState('');
  const [cafeDirectInputValue, setCafeDirectInputValue] = useState('');
  const [defaultAccommodationKeywords, setDefaultAccommodationKeywords] = useState([
    { eng: 'good_bedding', kr: 'good_bedding' },
    { eng: 'cleanliness', kr: 'cleanliness' },
    { eng: 'location', kr: 'location' },
    { eng: 'amenities', kr: 'amenities' }
  ]);
  const [defaultLandmarkKeywords, setDefaultLandmarkKeywords] = useState([
    { eng: 'scenic', kr: 'scenic' },
    { eng: 'historical', kr: 'historical' },
    { eng: 'family_friendly', kr: 'family_friendly' },
    { eng: 'cultural', kr: 'cultural' }
  ]);
  const [defaultRestaurantKeywords, setDefaultRestaurantKeywords] = useState([
    { eng: 'delicious', kr: 'delicious' },
    { eng: 'ambiance', kr: 'ambiance' },
    { eng: 'service', kr: 'service' },
    { eng: 'value', kr: 'value' }
  ]);
  const [defaultCafeKeywords, setDefaultCafeKeywords] = useState([
    { eng: 'coffee', kr: 'coffee' },
    { eng: 'desserts', kr: 'desserts' },
    { eng: 'atmosphere', kr: 'atmosphere' },
    { eng: 'views', kr: 'views' }
  ]);

  const openRegionPanel = () => setIsRegionPanelOpen(true);
  const closeRegionPanel = () => setIsRegionPanelOpen(false);
  const openDatePanel = () => setIsDatePanelOpen(true);
  const closeDatePanel = () => setIsDatePanelOpen(false);
  const openAccommodationPanel = () => setIsAccommodationPanelOpen(true);
  const closeAccommodationPanel = () => setIsAccommodationPanelOpen(false);
  const openLandmarkPanel = () => setIsLandmarkPanelOpen(true);
  const closeLandmarkPanel = () => setIsLandmarkPanelOpen(false);
  const openRestaurantPanel = () => setIsRestaurantPanelOpen(true);
  const closeRestaurantPanel = () => setIsRestaurantPanelOpen(false);
  const openCafePanel = () => setIsCafePanelOpen(true);
  const closeCafePanel = () => setIsCafePanelOpen(false);

  const toggleAccommodationKeyword = (keyword: string) => {
    setAccommodationKeywords(prev =>
      prev.includes(keyword) ? prev.filter(k => k !== keyword) : [...prev, keyword]
    );
  };

  const toggleLandmarkKeyword = (keyword: string) => {
    setLandmarkKeywords(prev =>
      prev.includes(keyword) ? prev.filter(k => k !== keyword) : [...prev, keyword]
    );
  };

  const toggleRestaurantKeyword = (keyword: string) => {
    setRestaurantKeywords(prev =>
      prev.includes(keyword) ? prev.filter(k => k !== keyword) : [...prev, keyword]
    );
  };

  const toggleCafeKeyword = (keyword: string) => {
    setCafeKeywords(prev =>
      prev.includes(keyword) ? prev.filter(k => k !== keyword) : [...prev, keyword]
    );
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

  const categoryDirectInputValue = {
    accommodation: accommodationDirectInputValue,
    landmark: landmarkDirectInputValue,
    restaurant: restaurantDirectInputValue,
    cafe: cafeDirectInputValue,
    attraction: landmarkDirectInputValue
  };

  const setCategoryDirectInputValue = {
    accommodation: setAccommodationDirectInputValue,
    landmark: setLandmarkDirectInputValue,
    restaurant: setRestaurantDirectInputValue,
    cafe: setCafeDirectInputValue,
    attraction: setLandmarkDirectInputValue
  };

  const confirmCategoryKeywords = {
    accommodation: confirmAccommodationKeywords,
    landmark: confirmLandmarkKeywords,
    restaurant: confirmRestaurantKeywords,
    cafe: confirmCafeKeywords,
    attraction: confirmLandmarkKeywords
  };

  const closeCategoryPanel = {
    accommodation: closeAccommodationPanel,
    landmark: closeLandmarkPanel,
    restaurant: closeRestaurantPanel,
    cafe: closeCafePanel,
    attraction: closeLandmarkPanel
  };

  const useCategoryPanel = (category: CategoryName) => {
    const isOpen = {
      accommodation: isAccommodationPanelOpen,
      landmark: isLandmarkPanelOpen,
      restaurant: isRestaurantPanelOpen,
      cafe: isCafePanelOpen,
      attraction: isLandmarkPanelOpen
    }[category];
    
    const openPanel = {
      accommodation: openAccommodationPanel,
      landmark: openLandmarkPanel,
      restaurant: openRestaurantPanel,
      cafe: openCafePanel,
      attraction: openLandmarkPanel
    }[category];
    
    const closePanel = closeCategoryPanel[category];
    const directInputValue = categoryDirectInputValue[category];
    const setDirectInputValueFn = setCategoryDirectInputValue[category];
    
    const selectedKeywords = {
      accommodation: accommodationKeywords,
      landmark: landmarkKeywords,
      restaurant: restaurantKeywords,
      cafe: cafeKeywords,
      attraction: landmarkKeywords
    }[category];
    
    const toggleKeyword = {
      accommodation: toggleAccommodationKeyword,
      landmark: toggleLandmarkKeyword,
      restaurant: toggleRestaurantKeyword,
      cafe: toggleCafeKeyword,
      attraction: toggleLandmarkKeyword
    }[category];
    
    const confirmKeywords = confirmCategoryKeywords[category];
    
    const defaultKeywords = {
      accommodation: defaultAccommodationKeywords,
      landmark: defaultLandmarkKeywords,
      restaurant: defaultRestaurantKeywords,
      cafe: defaultCafeKeywords,
      attraction: defaultLandmarkKeywords
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
      defaultKeywords
    };
  };

  return null;
};

export default LeftPanel;
