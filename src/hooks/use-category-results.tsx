
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Place } from '@/types/supabase';
import { fetchWeightedResults, PlaceResult } from '@/lib/jeju/placeUtils';
import { useMapContext } from '../components/rightpanel/MapContext';

type CategoryType = '숙소' | '관광지' | '음식점' | '카페';

const categoryKeyMap = {
  '숙소': 'accommodation',
  '관광지': 'landmark',
  '음식점': 'restaurant',
  '카페': 'cafe',
} as const;

// Helper function to convert ratings from text to number if needed
const parseRating = (rating: any): number => {
  if (typeof rating === 'number') return rating;
  if (typeof rating === 'string') {
    const parsed = parseFloat(rating);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export const useCategoryResults = (
  category: CategoryType,
  locations: string[],
  keywords: string[],
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendedPlaces, setRecommendedPlaces] = useState<PlaceResult[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<PlaceResult[]>([]);
  const { panTo, addMarkers, clearMarkersAndUiElements } = useMapContext();

  useEffect(() => {
    const categoryDisplay = {
      '숙소': '숙소 🏨',
      '관광지': '관광지 🏛️',
      '음식점': '음식점 🍽️',
      '카페': '카페 ☕'
    };

    if (keywords.length > 0) {
      toast(`${categoryDisplay[category]} 키워드: ${keywords.join(', ')}`);
    }
  }, [category, keywords]);

  useEffect(() => {
    const load = async () => {
      if (locations.length === 0) {
        setError('선택된 지역이 없습니다. 지역을 선택해주세요.');
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Ensure we're using the correct category key mapping
        const categoryKey = categoryKeyMap[category];
        console.log(`Fetching results for category: ${category} (${categoryKey})`);
        console.log(`Using locations: ${locations.join(', ')}`);
        console.log(`Using keywords: ${keywords.join(', ')}`);
        
        // Clear any existing toast messages
        toast.dismiss();
        toast.info(`${category} 데이터 조회 중...`, {
          duration: 2000,
        });
        
        const results = await fetchWeightedResults(
          categoryKey as any,
          locations,
          keywords
        );
        
        console.log(`Fetched ${results.length} results for ${category}`);
        
        if (results.length === 0) {
          console.log(`No results found for ${category} in ${locations.join(', ')}`);
          setError(`${category} 검색 결과가 없습니다. 다른 지역이나 키워드로 시도해보세요.`);
          toast.error(`${category}에 대한 검색 결과가 없습니다`);
          setLoading(false);
          return;
        }
        
        // Check for rating data availability
        const withRatings = results.filter(p => p.rating !== undefined && p.rating > 0).length;
        console.log(`Places with ratings: ${withRatings}/${results.length}`);
        
        if (withRatings === 0) {
          console.warn("No places have rating data available");
          toast.warning(`${category}에 대한 평점 데이터를 가져오는 데 문제가 있습니다`, {
            duration: 3000
          });
        }
        
        // Log sorting by weight for debugging
        if (results.length > 0) {
          console.log("Top 5 results sorted by weight:");
          results.slice(0, 5).forEach((place, idx) => {
            console.log(`${idx+1}. ${place.place_name} - Weight: ${place.weight?.toFixed(3)}, Rating: ${place.rating}, Reviews: ${place.visitor_review_count}`);
          });
        }

        // Process results to ensure rating, review count and weight are numbers
        const processedResults = results.map(place => ({
          ...place,
          rating: parseRating(place.rating),
          visitor_review_count: place.visitor_review_count ? Number(place.visitor_review_count) : 0,
          naverLink: place.naverLink ?? "",
          instaLink: place.instaLink ?? "",
          weight: place.weight || 0 // Ensure weight is provided with a default of 0
        }));

        const MAX_RECOMMENDATIONS = 4;
        
        // Ensure we have valid places
        const validResults = processedResults.filter(p => p.place_name && p.x && p.y);
        
        if (validResults.length === 0) {
          console.log(`No valid places found for ${category}`);
          setError(`유효한 ${category} 결과가 없습니다. 데이터베이스 연결을 확인해주세요.`);
          toast.error(`${category}에 대한 유효한 결과가 없습니다`);
          setLoading(false);
          return;
        }

        // Sort by weight (recommendation score)
        const sortedResults = [...validResults].sort((a, b) => (b.weight || 0) - (a.weight || 0));
        
        // Set recommended and nearby places
        setRecommendedPlaces(sortedResults.slice(0, MAX_RECOMMENDATIONS));
        setNearbyPlaces(sortedResults.slice(MAX_RECOMMENDATIONS));
        
        console.log(`Set ${sortedResults.slice(0, MAX_RECOMMENDATIONS).length} recommended places and ${sortedResults.slice(MAX_RECOMMENDATIONS).length} nearby places`);

        if (validResults.length > 0) {
          toast.success(`${validResults.length}개의 ${category} 장소를 불러왔습니다`, {
            duration: 3000
          });
        }

        clearMarkersAndUiElements();
        
        if (locations.length > 0) {
          panTo(locations[0]);
        }

        const recommendedMarkers = sortedResults.slice(0, MAX_RECOMMENDATIONS).map(place => ({
          id: place.id,
          name: place.place_name,
          category: category,
          address: place.road_address,
          x: place.x,
          y: place.y,
          rating: place.rating || 0,
          reviewCount: place.visitor_review_count || 0,
          naverLink: place.naverLink ?? "",
          instaLink: place.instaLink ?? "",
          weight: place.weight // 지도 마커에도 가중치 포함
        }));
        
        addMarkers(recommendedMarkers, { highlight: true });

      } catch (e) {
        console.error('Error in useCategoryResults:', e);
        setError((e as Error).message || '데이터를 불러오는 중 오류가 발생했습니다');
        toast.error(`${category} 데이터 로딩 중 오류 발생`);
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [category, locations.join(','), keywords.join(',')]);

  return {
    loading,
    error,
    recommendedPlaces,
    nearbyPlaces,
  };
};
