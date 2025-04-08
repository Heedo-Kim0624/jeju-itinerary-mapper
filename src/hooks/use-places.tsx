
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { fetchPlacesByCategory, fetchRestaurants, fetchAccommodations, fetchLandmarks, fetchCafes } from '@/services/restaurantService';
import { Place } from '@/types/supabase';

export const usePlaces = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [hasCategorySelected, setHasCategorySelected] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [orderedIds, setOrderedIds] = useState<string[]>([]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('데이터 로드 시작...');
        
        const restaurants = await fetchRestaurants();
        console.log('레스토랑 데이터 가져옴:', restaurants.length);
        
        const accommodations = await fetchAccommodations();
        console.log('숙소 데이터 가져옴:', accommodations.length, '개');
        
        const attractions = await fetchLandmarks();
        console.log('관광지 데이터 가져옴:', attractions.length, '개');
        
        const cafes = await fetchCafes();
        console.log('카페 데이터 가져옴:', cafes.length, '개');
        
        const allPlaces = [
          ...restaurants,
          ...accommodations,
          ...attractions,
          ...cafes
        ];
        
        console.log('총 로드된 장소 수:', allPlaces.length);
        
        setPlaces(allPlaces);
      } catch (error) {
        console.error('초기 데이터 로드 오류:', error);
        toast.error('데이터 로딩 중 오류가 발생했습니다.');
      }
    };

    loadInitialData();
  }, []);

  const handleCategoryClick = async (category: string) => {
    if (!hasSearched) {
      toast.error('먼저 검색을 해주세요');
      return;
    }
    
    setLoading(true);
    
    try {
      const categoryPlaces = await fetchPlacesByCategory(category);
      
      if (categoryPlaces.length === 0) {
        toast.warning(`${getCategoryName(category)} 데이터를 찾을 수 없습니다.`);
      }
      
      if (selectedCategory === category) {
        setSelectedCategory(null);
        setFilteredPlaces(places);
      } else {
        setSelectedCategory(category);
        setFilteredPlaces(categoryPlaces);
      }
      
      setHasCategorySelected(true);
      setCurrentPage(1);
    } catch (error) {
      console.error(`${category} 데이터 로드 중 오류 발생:`, error);
      toast.error(`${getCategoryName(category)} 데이터를 불러오는데 실패했습니다.`);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place);
    
    setSelectedPlaces(prev => {
      const alreadySelected = prev.some(p => p.id === place.id);
      if (alreadySelected) {
        return prev.filter(p => p.id !== place.id);
      } else {
        return [...prev, place];
      }
    });
  };

  const handleSearch = async (promptText: string, isDateSelectionComplete: boolean) => {
    if (!isDateSelectionComplete) {
      toast.error('먼저 날짜를 선택해주세요');
      return;
    }
    
    if (!promptText.trim()) {
      toast.error('검색 프롬프트를 입력하세요');
      return;
    }
    
    setLoading(true);
    
    try {
      setSelectedCategory(null);
      
      setTimeout(() => {
        const result = [...places];
        result.sort((a, b) => {
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return ratingB - ratingA;
        });
        
        setFilteredPlaces(result);
        setHasSearched(true);
        setLoading(false);
        setCurrentPage(1);
        
        toast.success('검색이 완료되었습니다');
      }, 1000);
    } catch (error) {
      console.error('Error during search:', error);
      toast.error('검색 중 오류가 발생했습니다');
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return {
    places,
    filteredPlaces,
    selectedCategory,
    selectedPlace,
    selectedPlaces,
    loading,
    hasSearched,
    hasCategorySelected,
    currentPage,
    orderedIds,
    setFilteredPlaces,
    setSelectedCategory,
    setSelectedPlace,
    setSelectedPlaces,
    setLoading,
    setHasSearched,
    setHasCategorySelected,
    setCurrentPage,
    setOrderedIds,
    handleCategoryClick,
    handlePlaceSelect,
    handleSearch,
    handlePageChange
  };
};

import { getCategoryName } from '@/utils/categoryColors';
