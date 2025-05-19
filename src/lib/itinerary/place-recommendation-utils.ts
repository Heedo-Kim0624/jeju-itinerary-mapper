import { Place, SelectedPlace, ItineraryDay, CategoryName, CategoryNameKorean, toCategoryName, toCategoryNameKorean } from '@/types';
import { getMinimumRecommendationsByCategory, timeOfDayWeights } from '@/utils/categoryUtils';

export const getCategoryKorean = (category?: string): string => {
  if (!category) return '기타';
  switch (category.toLowerCase()) {
    case 'accommodation': return '숙소';
    case 'attraction': return '관광지';
    case 'restaurant': return '음식점';
    case 'cafe': return '카페';
    default: return '기타';
  }
};

// Add the minimum recommendation count function
export function getMinimumRecommendationCount(nDays: number) {
  return {
    touristSpot: 4 * nDays, // 관광지
    restaurant: 3 * nDays,  // 식당
    cafe: 3 * nDays,        // 카페
    accommodation: 1,       // 숙소 (여행 기간 전체에 대해 1개로 고정)
  };
}

export function autoCompleteCandidatePlaces(
  currentPlaces: Place[],
  recommendedPlacesByCategory: { [key: string]: Place[] },
  tripDuration?: number
) {
  if (!tripDuration || tripDuration < 1) {
    console.warn("여행 기간이 유효하지 않아 자동 보완을 실행할 수 없습니다.");
    return { finalPlaces: currentPlaces, addedPlaces: [] };
  }

  console.log(`[자동 보완] 여행 기간 ${tripDuration}일에 대한 자동 보완 실행`);

  // Define minimum counts based on trip duration
  const minCounts = getMinimumRecommendationCount(tripDuration);

  // Create a mapping of Korean category names to English ones for the minCounts object
  const categoryMapping: Record<string, keyof typeof minCounts> = {
    '숙소': 'accommodation',
    '관광지': 'touristSpot',
    '음식점': 'restaurant',
    '카페': 'cafe',
  };

  // Count currently selected places by category
  const currentCountsByCategory: Record<string, number> = {
    '숙소': 0,
    '관광지': 0,
    '음식점': 0,
    '카페': 0
  };

  currentPlaces.forEach(place => {
    const category = getCategoryKorean(place.category);
    if (category in currentCountsByCategory) {
      currentCountsByCategory[category]++;
    }
  });

  console.log("[자동 보완] 카테고리별 현재 선택된 장소 수:", currentCountsByCategory);
  console.log("[자동 보완] 추천 받은 장소:", Object.fromEntries(
    Object.entries(recommendedPlacesByCategory).map(([category, places]) => 
      [category, places.map(p => p.name)]
    )
  ));

  // Determine how many places to add for each category
  const placesToAdd: Record<string, number> = {};
  Object.entries(currentCountsByCategory).forEach(([category, count]) => {
    const englishCategory = categoryMapping[category];
    if (englishCategory) {
      const targetCount = minCounts[englishCategory];
      placesToAdd[category] = Math.max(0, targetCount - count);
    }
  });

  console.log("[자동 보완] 카테고리별 추가할 장소 수:", placesToAdd);

  // Add places from recommendations
  const addedPlaces: Place[] = [];
  Object.entries(placesToAdd).forEach(([category, count]) => {
    if (count <= 0) return;

    const availablePlaces = recommendedPlacesByCategory[category] || [];
    
    // Filter out places that are already selected
    const notSelectedPlaces = availablePlaces.filter(place => 
      !currentPlaces.some(p => p.id === place.id)
    );
    
    console.log(`[자동 보완] ${category} 카테고리에 추가할 후보: ${notSelectedPlaces.length}개`);
    
    // Add up to the required count, or as many as available
    const placesToSelect = notSelectedPlaces.slice(0, count);
    
    addedPlaces.push(...placesToSelect);
    console.log(`[자동 보완] ${category} 카테고리에 추가할 장소: ${placesToSelect.length}개`);
  });

  // Combine current places with added places
  const finalPlaces = [...currentPlaces, ...addedPlaces];

  return { finalPlaces, addedPlaces };
}

export const calculatePlaceScore = (
  place: Place,
  keywords: string[],
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night',
  userRating?: number // Optional user rating for the place
): number => {
  let score = place.rating || 3.0; // Default score if no rating

  // Keyword matching bonus
  const placeKeywords = place.description?.toLowerCase().split(/\s+/) || [];
  const matchedKeywords = keywords.filter(kw => placeKeywords.includes(kw.toLowerCase()));
  score += matchedKeywords.length * 0.5; // Bonus for each matched keyword

  // Time of day weight bonus
  const categoryKorean = toCategoryNameKorean(place.category || 'landmark'); // Convert to Korean for timeOfDayWeights
  const weights = timeOfDayWeights[categoryKorean];
  if (weights) {
    score *= (1 + weights[timeOfDay] * 0.2); // Apply time-based weight
  }

  // User rating influence (if provided)
  if (userRating !== undefined) {
    score = (score + userRating) / 2; // Average with user's explicit rating
  }
  
  // Popularity (e.g., review count)
  if (place.reviewCount && place.reviewCount > 100) {
      score += Math.log10(place.reviewCount / 100);
  }

  return parseFloat(score.toFixed(2));
};

export const recommendPlacesForDay = (
  availablePlaces: Place[],
  selectedPlacesForDay: SelectedPlace[],
  dayNumber: number,
  totalTravelDays: number,
  preferredKeywordsByCategory: Record<CategoryName, string[]>, // Expects English CategoryName keys
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
): Place[] => {
  const recommendations: Place[] = [];
  const minRecsByCategory = getMinimumRecommendationsByCategory(totalTravelDays);

  const categoryNamesEnglish = Object.keys(preferredKeywordsByCategory) as CategoryName[];

  for (const category of categoryNamesEnglish) {
    const koreanCategory = toCategoryNameKorean(category); // Convert for minRecsByCategory
    const targetCount = minRecsByCategory[koreanCategory] || 0;
    const currentCount = selectedPlacesForDay.filter(p => toCategoryName(p.category || 'landmark') === category).length;
    let needed = targetCount - currentCount;

    if (needed <= 0) continue;

    const categoryPlaces = availablePlaces.filter(
      p => toCategoryName(p.category || 'landmark') === category && !selectedPlacesForDay.find(sp => sp.id === p.id)
    );

    const scoredPlaces = categoryPlaces
      .map(p => ({
        ...p,
        score: calculatePlaceScore(p, preferredKeywordsByCategory[category] || [], timeOfDay),
      }))
      .sort((a, b) => b.score - a.score);

    recommendations.push(...scoredPlaces.slice(0, needed));
  }

  // Add some diverse options if specific category needs are met
  if (recommendations.length < (totalTravelDays * 2)) { // Ensure some variety
      const generalPlaces = availablePlaces.filter(p => 
          !selectedPlacesForDay.find(sp => sp.id === p.id) && 
          !recommendations.find(rec => rec.id === p.id)
      );
      const scoredGeneralPlaces = generalPlaces
          .map(p => ({
              ...p,
              score: calculatePlaceScore(p, [], timeOfDay) // Generic scoring
          }))
          .sort((a, b) => b.score - a.score);
      
      recommendations.push(...scoredGeneralPlaces.slice(0, (totalTravelDays * 2) - recommendations.length));
  }
  
  // Remove duplicates that might have been added if a place fits multiple criteria (though less likely with current logic)
  return Array.from(new Map(recommendations.map(item => [item.id, item])).values());
};
