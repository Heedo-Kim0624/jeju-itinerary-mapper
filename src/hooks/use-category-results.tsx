
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useCategoryOrder } from './use-category-order';
import { useRegionSelection } from './use-region-selection';
import { Place } from '@/types/supabase';
import { fetchPlaceData } from '@/services/placeService';

export const useCategoryResults = (category: string, keywords: string[] = []) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [sortOrder, setSortOrder] = useState<'recommended' | 'rating' | 'reviews'>('recommended');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { categoryOrder } = useCategoryOrder();
  const { selectedRegions } = useRegionSelection();

  useEffect(() => {
    let isMounted = true;

    const loadPlaces = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use the placeService to fetch data
        const result = await fetchPlaceData(category, selectedRegions);
        const fetchedPlaces = result.places?.map(place => ({
          id: place.ID || place.id || '',
          name: place.Place_Name || place.place_name || '',
          address: place.Road_Address || place.road_address || '',
          category: category,
          categoryDetail: '',
          x: parseFloat(place.Longitude || place.longitude || '0'),
          y: parseFloat(place.Latitude || place.latitude || '0'),
          rating: parseFloat(place.rating || '0'),
          reviewCount: parseInt(place.visitor_review_count || '0', 10),
          naverLink: '',
          instaLink: '',
          weight: 0,
          operatingHours: ''
        })) || [];
        
        if (!isMounted) return;
        
        // Process places
        let processedPlaces = fetchedPlaces;
        
        // 지역 필터링 적용
        if (selectedRegions.length > 0) {
          processedPlaces = processedPlaces.filter(place => {
            const address = place.address?.toLowerCase() || '';
            return selectedRegions.some(region => 
              address.includes(region.toLowerCase())
            );
          });
        }
        
        // 키워드 기반 필터링 및 가중치 계산
        if (keywords.length > 0) {
          processedPlaces = processedPlaces.map(place => {
            // Simplified weight calculation for now
            const keywordMatch = keywords.some(
              keyword => place.name.toLowerCase().includes(keyword.toLowerCase()) || 
                        place.address.toLowerCase().includes(keyword.toLowerCase())
            );
            return {
              ...place,
              weight: keywordMatch ? 1 : 0
            };
          });
        }
        
        setPlaces(processedPlaces);
        
        // 기본 정렬 적용 (추천 순)
        const sorted = sortPlaces(processedPlaces, 'recommended');
        setFilteredPlaces(sorted);
        
        console.log(`로드된 ${category} 장소:`, processedPlaces.length);
      } catch (err) {
        console.error("Places loading error:", err);
        if (isMounted) {
          setError("데이터를 로드하는 중 오류가 발생했습니다.");
          toast.error("장소 데이터를 불러오는 데 실패했습니다.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    loadPlaces();
    
    return () => {
      isMounted = false;
    };
  }, [category, keywords, selectedRegions]);
  
  // Helper function to sort places
  const sortPlaces = (places: Place[], sortType: 'recommended' | 'rating' | 'reviews'): Place[] => {
    return [...places].sort((a, b) => {
      switch (sortType) {
        case 'recommended':
          return (b.weight || 0) - (a.weight || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'reviews':
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        default:
          return 0;
      }
    });
  };
  
  useEffect(() => {
    // 필터링된 결과 정렬
    const sorted = sortPlaces([...places], sortOrder);
    setFilteredPlaces(sorted);
  }, [sortOrder, places]);

  const handleSortChange = (newOrder: 'recommended' | 'rating' | 'reviews') => {
    setSortOrder(newOrder);
  };

  // 필터링된 결과를 추천 장소와 일반 장소로 나누기
  const getRecommendedPlaces = () => {
    // weight 값이 있고 0보다 큰 장소를 추천 장소로 간주
    return filteredPlaces
      .filter(place => place.weight && place.weight > 0)
      .slice(0, 80); // 최대 80개까지 표시
  };

  const getNormalPlaces = () => {
    // weight 값이 없거나 0인 장소를 일반 장소로 간주
    return filteredPlaces
      .filter(place => !place.weight || place.weight <= 0)
      .slice(0, 80); // 최대 80개까지 표시
  };

  return {
    isLoading: loading,
    error,
    allPlaces: places,
    filteredPlaces,
    recommendedPlaces: getRecommendedPlaces(),
    normalPlaces: getNormalPlaces(),
    sortOrder,
    handleSortChange
  };
};
