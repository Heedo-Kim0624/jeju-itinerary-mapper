
import { supabase } from '@/lib/supabaseClient';
import { Place } from '@/types/supabase';

export interface PlaceResult {
  id: string;
  place_name: string;
  road_address: string;
  category: string;
  x: number;
  y: number;
  rating?: number;
  visitor_review_count?: number;
}

const categoryTableMap = {
  'accommodation': 'accomodation_information',
  'landmark': 'landmark_information',
  'restaurant': 'restaurant_information',
  'cafe': 'cafe_information'
};

const categoryRatingMap = {
  'accommodation': 'accomodation_rating',
  'landmark': 'landmark_rating',
  'restaurant': 'restaurant_rating',
  'cafe': 'cafe_rating'
};

export async function fetchWeightedResults(
  category: 'accommodation' | 'landmark' | 'restaurant' | 'cafe', 
  locations: string[], 
  keywords: string[]
): Promise<PlaceResult[]> {
  // Basic query for information table
  let query = supabase
    .from(categoryTableMap[category])
    .select('ID, Place_Name, Road_Address, location, Longitude, Latitude');

  // Filter by locations if provided
  if (locations.length > 0) {
    query = query.in('location', locations);
  }

  const { data: places, error: placesError } = await query;

  if (placesError) {
    console.error('Places fetch error:', placesError);
    return [];
  }

  // Fetch ratings
  const { data: ratings, error: ratingsError } = await supabase
    .from(categoryRatingMap[category])
    .select('ID, Rating, visitor_review_count')
    .in('ID', places.map(p => p.ID));

  if (ratingsError) {
    console.error('Ratings fetch error:', ratingsError);
    return [];
  }

  // Merge places with ratings
  const placesWithRatings = places.map(place => {
    const rating = ratings.find(r => r.ID === place.ID);
    return {
      id: place.ID.toString(),
      place_name: place.Place_Name,
      road_address: place.Road_Address,
      category: category,
      x: place.Longitude ?? 0,
      y: place.Latitude ?? 0,
      rating: rating?.Rating ?? 0,
      visitor_review_count: rating?.visitor_review_count ?? 0
    };
  });

  return placesWithRatings;
}
