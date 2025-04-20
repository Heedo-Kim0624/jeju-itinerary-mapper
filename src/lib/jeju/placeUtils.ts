
import { supabase } from '@/lib/supabaseClient';
import { Place } from '@/types/supabase';
import { PlaceResult, TravelCategory } from '@/types/travel';
import { categoryTableMap, categoryRatingMap } from './dbMapping';

/**
 * Normalizes field names to handle case insensitivity
 */
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

/**
 * Converts a PlaceResult to the Place format used by the application
 */
export function convertToPlace(pr: PlaceResult): Place {
  return {
    id: pr.id,
    name: pr.place_name,
    address: pr.road_address,
    category: pr.category,
    categoryDetail: pr.categoryDetail,
    x: pr.x,
    y: pr.y,
    naverLink: '',
    instaLink: '',
    rating: pr.rating,
    reviewCount: pr.visitor_review_count,
  };
}

/**
 * Fetch and rank places based on category, location and keywords
 */
export async function fetchWeightedResults(
  category: TravelCategory,
  locations: string[],
  keywords: string[]
): Promise<PlaceResult[]> {
  const infoTable = categoryTableMap[category];
  const ratingTable = categoryRatingMap[category];
  
  if (!infoTable || !ratingTable) {
    console.error(`Invalid category: ${category}`);
    return [];
  }
  
  try {
    // Step 1: Query the information table with location filter
    let query = supabase
      .from(infoTable)
      .select('*');
    
    if (locations.length > 0) {
      query = query.in('location', locations);
    }

    const { data: places, error: placesError } = await query;
    
    if (placesError) {
      console.error('Places fetch error:', placesError);
      return [];
    }
    
    if (!places || places.length === 0) {
      console.log('No places found matching the criteria');
      return [];
    }

    const placeIds = places.map(p => normalizeField(p, 'ID') || normalizeField(p, 'id'));
    
    // Step 2: Fetch ratings
    const { data: ratings, error: ratingsError } = await supabase
      .from(ratingTable)
      .select('*')
      .in(places[0] && normalizeField(places[0], 'ID') !== undefined ? 'ID' : 'id', placeIds);
    
    if (ratingsError) {
      console.error('Ratings fetch error:', ratingsError);
      return [];
    }

    // Step 3: Fetch category details
    const categoryTable = category === 'accommodation' ? 'accomodation_categories' : 
                          category === 'landmark' ? 'landmark_categories' : 
                          category === 'restaurant' ? 'restaurant_categories' :
                          'cafe_categories';

    const { data: categories, error: categoriesError } = await supabase
      .from(categoryTable)
      .select('*')
      .in(places[0] && normalizeField(places[0], 'ID') !== undefined ? 'ID' : 'id', placeIds);

    if (categoriesError) {
      console.error('Categories fetch error:', categoriesError);
    }

    // Step 4: Combine and format results
    const placesWithRatings = places.map(place => {
      const placeId = normalizeField(place, 'ID') || normalizeField(place, 'id');
      
      const rating = ratings?.find(r => {
        const ratingId = normalizeField(r, 'ID') || normalizeField(r, 'id');
        return ratingId === placeId;
      });
      
      const categoryInfo = categories?.find(c => {
        const categoryId = normalizeField(c, 'ID') || normalizeField(c, 'id');
        return categoryId === placeId;
      });

      const placeName = normalizeField(place, 'Place_Name') || 
                       normalizeField(place, 'place_name') || 
                       normalizeField(place, 'Place_name');
      
      const roadAddress = normalizeField(place, 'Road_Address') || 
                         normalizeField(place, 'road_address') || 
                         normalizeField(place, 'Road_address');
      
      const longitude = normalizeField(place, 'Longitude') || normalizeField(place, 'longitude') || 0;
      const latitude = normalizeField(place, 'Latitude') || normalizeField(place, 'latitude') || 0;
      
      const ratingValue = rating ? normalizeField(rating, 'Rating') || normalizeField(rating, 'rating') || 0 : 0;
      const reviewCount = rating ? normalizeField(rating, 'visitor_review_count') || 0 : 0;

      const categoryDetail = categoryInfo ? 
        normalizeField(categoryInfo, 'Categories_Details') || 
        normalizeField(categoryInfo, 'categories_details') : '';
      
      let weight = ratingValue * Math.log(1 + reviewCount);
      
      return {
        id: placeId.toString(),
        place_name: placeName,
        road_address: roadAddress,
        category: category,
        categoryDetail: categoryDetail,
        x: longitude,
        y: latitude,
        rating: ratingValue,
        visitor_review_count: reviewCount,
        weight
      };
    });

    // Sort and return results without weight property
    return placesWithRatings
      .sort((a, b) => b.weight - a.weight)
      .map(({ weight, ...rest }) => rest);

  } catch (error) {
    console.error('Error in fetchWeightedResults:', error);
    return [];
  }
}
