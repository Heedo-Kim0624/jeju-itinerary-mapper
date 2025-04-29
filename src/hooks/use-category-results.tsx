
import { useState, useEffect } from 'react';
import { Place } from '@/types/supabase';
import { toast } from 'sonner';
import { fetchPlacesByCategory } from '@/services/restaurantService';

interface CategoryResultsHookResult {
  isLoading: boolean;
  error: string | null;
  recommendedPlaces: Place[];
  normalPlaces: Place[];
  fetchPlaces: (category: string, keywords: string[]) => Promise<void>;
}

export function useCategoryResults(
  category: string,
  keywords: string[] = []
): CategoryResultsHookResult {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendedPlaces, setRecommendedPlaces] = useState<Place[]>([]);
  const [normalPlaces, setNormalPlaces] = useState<Place[]>([]);

  async function fetchPlaces(category: string, keywords: string[] = []): Promise<void> {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching places for category: ${category}, keywords:`, keywords);
      
      // Map category from UI to database category
      const categoryMapping: Record<string, string> = {
        '숙소': 'accommodation',
        '관광지': 'attraction',
        '음식점': 'restaurant',
        '카페': 'cafe'
      };
      
      const dbCategory = categoryMapping[category] || category;
      
      // Fetch places from the service
      const places = await fetchPlacesByCategory(dbCategory);
      console.log(`Fetched ${places.length} places for ${category}`);
      
      if (places.length === 0) {
        setError(`${category}을(를) 찾을 수 없습니다.`);
        setRecommendedPlaces([]);
        setNormalPlaces([]);
        return;
      }
      
      // Convert string IDs to numbers if needed
      const normalizedPlaces = places.map(place => ({
        ...place,
        id: typeof place.id === 'string' ? parseInt(place.id, 10) : place.id
      }));

      // For now, just split the results into recommended and normal
      // In a real implementation, you would use keywords to calculate recommendations
      const recommended = normalizedPlaces
        .filter(p => p.rating >= 4.5)
        .slice(0, 5);
        
      const normal = normalizedPlaces
        .filter(p => !recommended.some(r => r.id === p.id))
        .slice(0, 15);
        
      setRecommendedPlaces(recommended);
      setNormalPlaces(normal);
      
      console.log(`Processed: ${recommended.length} recommended, ${normal.length} normal places`);
      
    } catch (err) {
      console.error("Error fetching places:", err);
      setError(`데이터를 불러오는 중 오류가 발생했습니다.`);
      toast.error(`${category} 데이터를 불러오는 데 실패했습니다.`);
    } finally {
      setIsLoading(false);
    }
  }

  // Use useEffect instead of useDebounceEffect
  useEffect(() => {
    let timeoutId: number | null = null;
    
    if (category) {
      timeoutId = window.setTimeout(() => {
        fetchPlaces(category, keywords);
      }, 500);
    }
    
    return () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [category, keywords]);

  return {
    isLoading,
    error,
    recommendedPlaces,
    normalPlaces,
    fetchPlaces
  };
}
