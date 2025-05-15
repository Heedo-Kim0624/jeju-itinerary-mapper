
import { supabase } from '@/lib/supabaseClient';
import { categoryTableMap, categoryRatingMap } from '@/lib/jeju/dbMapping';
import { calculatePlaceScore } from '@/lib/jeju/placeScoring';
import { Place } from '@/types/supabase';
import { toast } from 'sonner';
import { KeywordWeight } from '@/lib/jeju/interfaces';

// Mapping from Korean keywords to database columns
export const keywordToColumn: Record<string, string> = {
  // Accommodation keywords
  '친절해요': 'kindness',
  '깨끗해요': 'cleanliness',
  '뷰가 좋아요': 'view',
  '조용히 쉬기 좋아요': 'quiet_and_relax',
  '침구가 좋아요': 'good_bedding',
  '인테리어가 멋져요': 'interior',
  '냉난방이 잘돼요': 'aircon_heating',
  '화장실이 잘 되어 있어요': 'bathroom',
  '조식이 맛있어요': 'breakfast',
  '주차하기 편해요': 'parking',
  
  // Landmark keywords
  '인생샷': 'instagrammable',
  '힐링': 'healing',
  '가족': 'family_friendly',
  '액티비티': 'activity',
  '자연경관': 'nature',
  '역사': 'history',
  '한적함': 'quiet',
  '유명한': 'famous',
  '실내': 'indoor',
  '애인': 'romantic',
  
  // Restaurant keywords
  '음식이 맛있어요': 'tasty',
  '가성비가 좋아요': 'cost_effective',
  '양이 많아요': 'large_portion',
  '특별한 메뉴': 'special_menu',
  '분위기': 'atmosphere',
  '서비스': 'service',
  '메인 요리': 'main_dish',
  '디저트': 'dessert',
  '음료': 'beverages',
  '예약 필수': 'reservation_required',
  
  // Cafe keywords
  '디저트가 맛있어요': 'good_dessert',
  '커피가 맛있어요': 'good_coffee',
  '사진찍기 좋아요': 'photogenic',
  '넓어요': 'spacious',
  '오션뷰': 'ocean_view',
  '감성적': 'emotional',
  '조용해요': 'quiet',
  '브런치': 'brunch',
  '유명해요': 'famous',
  '야외석': 'outdoor_seating'
};

// Convert category name to database table category
export const categoryNameToDbCategory: Record<string, string> = {
  '숙소': 'accommodation',
  '관광지': 'landmark',
  '음식점': 'restaurant',
  '카페': 'cafe'
};

/**
 * Calculate weights for ranked and unranked keywords
 */
export function calculateWeights(keywords: string[]): KeywordWeight[] {
  // Check for ranked keywords (in format {keyword1,keyword2})
  let rankedKeywords: string[] = [];
  let unrankedKeywords: string[] = [];

  // Extract ranked keywords if they exist
  for (const keyword of keywords) {
    if (keyword.startsWith('{') && keyword.endsWith('}')) {
      // Parse ranked keywords from {keyword1,keyword2} format
      const extractedKeywords = keyword.slice(1, -1).split(',');
      rankedKeywords = extractedKeywords;
    } else {
      unrankedKeywords.push(keyword);
    }
  }

  console.log('[RecommendationService] Parsed keywords:', {
    ranked: rankedKeywords,
    unranked: unrankedKeywords
  });

  const weights: KeywordWeight[] = [];
  const rankedWeights = [0.4, 0.3, 0.2]; // Weights for top 3 ranked keywords

  // Assign weights to ranked keywords
  rankedKeywords.forEach((keyword, index) => {
    if (index < rankedWeights.length) {
      weights.push({
        keyword,
        weight: rankedWeights[index]
      });
    }
  });

  // Calculate remaining weight for unranked keywords
  const usedWeight = weights.reduce((sum, item) => sum + item.weight, 0);
  const remainingWeight = Math.max(0, 1 - usedWeight);
  
  // Distribute remaining weight equally among unranked keywords
  if (unrankedKeywords.length > 0) {
    const equalWeight = remainingWeight / unrankedKeywords.length;
    unrankedKeywords.forEach(keyword => {
      weights.push({
        keyword,
        weight: equalWeight
      });
    });
  }

  console.log('[RecommendationService] Calculated weights:', weights);
  return weights;
}

/**
 * Fetch recommended places based on category, regions, and keywords
 */
export async function fetchRecommendedPlaces(
  category: string,
  regions: string[],
  keywords: string[]
): Promise<Place[]> {
  console.log('[RecommendationService] Fetching recommended places:', {
    category,
    regions,
    keywords
  });
  
  const safeRegions = Array.isArray(regions) ? regions : [];
  const safeKeywords = Array.isArray(keywords) ? keywords : [];
  
  if (!category || safeKeywords.length === 0) {
    console.warn('[RecommendationService] Missing required parameters:', { category, keywordsCount: safeKeywords.length });
    return [];
  }

  try {
    // Convert Korean category name to database category
    const dbCategory = categoryNameToDbCategory[category] || category;
    
    // Get table names for this category
    const infoTable = categoryTableMap[dbCategory];
    const reviewTable = `${dbCategory}_review`;
    
    if (!infoTable) {
      console.error(`[RecommendationService] Invalid category: ${category} (${dbCategory})`);
      return [];
    }
    
    console.log(`[RecommendationService] Querying tables: ${infoTable}, ${reviewTable}`);
    
    // Calculate keyword weights
    const keywordWeights = calculateWeights(safeKeywords);
    
    // 1. Get place info data with region filter if provided
    let query = supabase.from(infoTable).select('*');
    if (safeRegions.length > 0) {
      query = query.in('location', safeRegions);
    }
    const { data: places, error: placesError } = await query;

    if (placesError) {
      console.error('[RecommendationService] Error fetching places:', placesError);
      return [];
    }

    if (!places || places.length === 0) {
      console.log(`[RecommendationService] No places found for ${category} in ${safeRegions.join(', ')}`);
      return [];
    }

    console.log(`[RecommendationService] Found ${places.length} places before applying keyword filters`);
    
    // 2. Get review data for scoring
    const placeIds = places.map(p => p.id).filter(id => id !== undefined);
    
    const { data: reviews, error: reviewsError } = await supabase
      .from(reviewTable)
      .select('*')
      .in('id', placeIds);
    
    if (reviewsError) {
      console.error('[RecommendationService] Error fetching reviews:', reviewsError);
      return [];
    }
    
    if (!reviews || reviews.length === 0) {
      console.log(`[RecommendationService] No review data found for ${category}`);
      return [];
    }
    
    // 3. Calculate scores and prepare Place objects
    const scoredPlaces = places.map(place => {
      const review = reviews.find(r => r.id === place.id);
      
      // Skip places without review data
      if (!review) return null;
      
      // Calculate score based on keywords and weights
      const score = calculatePlaceScore(review, keywordWeights, review.visitor_norm || 1);
      
      // Convert to standardized Place object
      const placeObject: Place = {
        id: String(place.id),
        name: place.place_name || '',
        address: place.address || place.road_address || '',
        phone: place.tel || '',
        category: dbCategory,
        description: place.description || '',
        rating: place.rating || 0,
        x: parseFloat(String(place.x || 0)),
        y: parseFloat(String(place.y || 0)),
        image_url: place.image_url || '',
        road_address: place.road_address || '',
        homepage: place.homepage || '',
        weight: score
      };
      
      return placeObject;
    }).filter(p => p !== null) as Place[];
    
    // 4. Filter out places with zero score and sort by score
    const filteredPlaces = scoredPlaces.filter(p => (p.weight || 0) > 0);
    const sortedPlaces = filteredPlaces.sort((a, b) => (b.weight || 0) - (a.weight || 0));
    
    console.log(`[RecommendationService] Found ${sortedPlaces.length} places with non-zero scores`);
    
    if (sortedPlaces.length === 0 && scoredPlaces.length > 0) {
      console.log('[RecommendationService] No places with positive scores, using fallback');
      // Fallback: if no places with positive scores, return all places sorted by rating
      return scoredPlaces.sort((a, b) => b.rating - a.rating).slice(0, 20);
    }
    
    return sortedPlaces;
  } catch (error) {
    console.error('[RecommendationService] Error in fetchRecommendedPlaces:', error);
    toast.error(`추천 장소를 불러오는 중 오류가 발생했습니다.`);
    return [];
  }
}
