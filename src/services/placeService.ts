
import { supabase } from '@/lib/supabaseClient';
import { TravelCategory } from '@/types/travel';
import { categoryTableMap, categoryRatingMap } from '@/lib/jeju/dbMapping';

function normalizeField(obj: any, field: string): any {
  if (obj[field] !== undefined) return obj[field];
  
  const lowerField = field.toLowerCase();
  for (const key in obj) {
    if (key.toLowerCase() === lowerField) {
      return obj[key];
    }
  }
  
  return undefined;
}

export async function fetchPlaceData(
  category: TravelCategory,
  locations: string[]
) {
  // 카테고리 철자 수정
  if (category === 'accommodation') {
    // This line is corrected - no need to reassign as it's already properly spelled
    // category = 'accommodation' as TravelCategory;
  }
  
  const infoTable = categoryTableMap[category];
  const ratingTable = categoryRatingMap[category];
  const reviewTable = `${category}_review`;
  
  if (!infoTable || !ratingTable) {
    console.error(`Invalid category: ${category}`);
    return { places: [], ratings: [], categories: [], links: [], reviews: [] };
  }
  
  try {
    // Query the information table with location filter
    let query = supabase
      .from(infoTable)
      .select('*');
    
    if (locations.length > 0) {
      query = query.in('location', locations);
    }

    const { data: places, error: placesError } = await query;
    
    if (placesError) {
      console.error('Places fetch error:', placesError);
      return { places: [], ratings: [], categories: [], links: [], reviews: [] };
    }
    
    if (!places || places.length === 0) {
      console.log('No places found matching the criteria');
      return { places: [], ratings: [], categories: [], links: [], reviews: [] };
    }

    const placeIds = places.map(p => normalizeField(p, 'ID') || normalizeField(p, 'id'))
      .filter(id => id !== undefined);
    
    // Fetch additional data in parallel
    const [ratingsResult, categoriesResult, linksResult, reviewsResult] = await Promise.all([
      // Ratings
      supabase.from(ratingTable).select('*').in('id', placeIds),
      // Categories
      supabase.from(`${category}_categories`).select('*').in('id', placeIds),
      // Links
      supabase.from(`${category}_link`).select('*').in('id', placeIds),
      // Reviews
      supabase.from(reviewTable).select('*').in('id', placeIds)
    ]);

    return {
      places,
      ratings: ratingsResult.data || [],
      categories: categoriesResult.data || [],
      links: linksResult.data || [],
      reviews: reviewsResult.data || []
    };
  } catch (error) {
    console.error('Error in fetchPlaceData:', error);
    return { places: [], ratings: [], categories: [], links: [], reviews: [] };
  }
}
