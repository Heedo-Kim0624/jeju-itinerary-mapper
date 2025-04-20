
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
  const infoTable = categoryTableMap[category];
  const ratingTable = categoryRatingMap[category];
  
  if (!infoTable || !ratingTable) {
    console.error(`Invalid category: ${category}`);
    return { places: [], ratings: [], categories: [] };
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
      return { places: [], ratings: [], categories: [] };
    }
    
    if (!places || places.length === 0) {
      console.log('No places found matching the criteria');
      return { places: [], ratings: [], categories: [] };
    }

    const placeIds = places.map(p => normalizeField(p, 'ID') || normalizeField(p, 'id'));
    
    // Step 2: Fetch ratings
    const { data: ratings, error: ratingsError } = await supabase
      .from(ratingTable)
      .select('*')
      .in(places[0] && normalizeField(places[0], 'ID') !== undefined ? 'ID' : 'id', placeIds);
    
    if (ratingsError) {
      console.error('Ratings fetch error:', ratingsError);
      return { places, ratings: [], categories: [] };
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
      return { places, ratings, categories: [] };
    }

    return { places, ratings, categories };
  } catch (error) {
    console.error('Error in fetchPlaceData:', error);
    return { places: [], ratings: [], categories: [] };
  }
}
