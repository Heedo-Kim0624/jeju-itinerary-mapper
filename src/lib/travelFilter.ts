
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
  naverLink?: string;
  instaLink?: string;
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

const categoryLinkMap = {
  'accommodation': 'accomodation_link',
  'landmark': 'landmark_link',
  'restaurant': 'restaurant_link',
  'cafe': 'cafe_link'
};

// Helper function to parse rating value properly
const parseRatingValue = (rating: any): number => {
  if (typeof rating === 'number') return rating;
  if (typeof rating === 'string') {
    const parsed = parseFloat(rating);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Helper function to normalize field access regardless of case
const getFieldValue = (obj: any, fieldName: string): any => {
  // Try exact match first
  if (obj[fieldName] !== undefined) return obj[fieldName];
  
  // Try case-insensitive match
  const lowerFieldName = fieldName.toLowerCase();
  for (const key of Object.keys(obj)) {
    if (key.toLowerCase() === lowerFieldName) {
      return obj[key];
    }
  }
  
  return undefined;
};

export async function fetchWeightedResults(
  category: 'accommodation' | 'landmark' | 'restaurant' | 'cafe', 
  locations: string[], 
  keywords: string[]
): Promise<PlaceResult[]> {
  console.log(`Fetching ${category} data for locations: ${locations.join(', ')}`);
  
  // Basic query for information table
  let query = supabase
    .from(categoryTableMap[category])
    .select('*');

  // Filter by locations if provided
  if (locations.length > 0) {
    query = query.in('location', locations);
  }

  const { data: places, error: placesError } = await query;

  if (placesError) {
    console.error(`${category} places fetch error:`, placesError);
    return [];
  }

  console.log(`Found ${places?.length || 0} ${category} places`);
  
  if (!places || places.length === 0) {
    return [];
  }

  // Determine the ID field name based on the category and first entry
  const idField = getFieldValue(places[0], 'ID') !== undefined ? 'ID' : 'id';
  console.log(`Using ID field: ${idField} for ${category}`);

  // Extract all place IDs
  const placeIds = places.map(p => getFieldValue(p, idField));
  
  // Fetch ratings
  const { data: ratings, error: ratingsError } = await supabase
    .from(categoryRatingMap[category])
    .select('*')
    .in(idField, placeIds);

  if (ratingsError) {
    console.error(`${category} ratings fetch error:`, ratingsError);
    console.log('Continuing without ratings data');
  }

  // Fetch links
  const { data: links, error: linksError } = await supabase
    .from(categoryLinkMap[category])
    .select('*')
    .in(idField, placeIds);

  if (linksError) {
    console.error(`${category} links fetch error:`, linksError);
    console.log('Continuing without link data');
  }

  // Merge places with ratings and links
  const placesWithData = places.map(place => {
    const placeId = getFieldValue(place, idField);
    
    // Find rating for this place
    const rating = ratings?.find(r => getFieldValue(r, idField) === placeId);
    // Find link for this place
    const link = links?.find(l => getFieldValue(l, idField) === placeId);
    
    // Extract road address and lot address, handling different field naming cases
    const roadAddress = getFieldValue(place, 'Road_Address') || getFieldValue(place, 'road_address') || '';
    const lotAddress = getFieldValue(place, 'Lot_Address') || getFieldValue(place, 'lot_address') || '';
    const address = roadAddress || lotAddress;
    
    // Extract place name, handling different field naming cases
    const placeName = getFieldValue(place, 'Place_Name') || getFieldValue(place, 'place_name') || '';
    
    // Extract longitude and latitude, handling different field naming cases
    const longitude = getFieldValue(place, 'Longitude') || getFieldValue(place, 'longitude') || 0;
    const latitude = getFieldValue(place, 'Latitude') || getFieldValue(place, 'latitude') || 0;

    // Extract rating and visitor_review_count, handling different field naming cases
    const ratingValue = rating ? 
      (getFieldValue(rating, 'Rating') || getFieldValue(rating, 'rating')) : undefined;
    
    const visitorReviewCount = rating ? 
      (getFieldValue(rating, 'visitor_review_count') || 0) : undefined;

    // Extract links, handling different field naming cases
    const naverLink = link ? 
      (getFieldValue(link, 'link') || '') : '';
    
    const instaLink = link ? 
      (getFieldValue(link, 'instagram') || '') : '';

    return {
      id: placeId.toString(),
      place_name: placeName,
      road_address: address,
      category: category,
      x: longitude,
      y: latitude,
      rating: parseRatingValue(ratingValue),
      visitor_review_count: visitorReviewCount,
      naverLink: naverLink,
      instaLink: instaLink
    };
  });

  console.log(`Processed ${placesWithData.length} ${category} places with ratings and links`);
  
  return placesWithData;
}

