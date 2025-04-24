
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
  console.log(`With keywords: ${keywords.join(', ')}`);
  
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
  const idField = determineIdFieldName(places[0]);
  console.log(`Using ID field: ${idField} for ${category}`);

  // Extract all place IDs
  const placeIds = places.map(p => getFieldValue(p, idField));
  
  // Fetch ratings
  const { data: ratings, error: ratingsError } = await supabase
    .from(categoryRatingMap[category])
    .select('*');

  if (ratingsError) {
    console.error(`${category} ratings fetch error:`, ratingsError);
    console.log('Continuing without ratings data');
  } else {
    console.log(`Successfully fetched ${ratings?.length || 0} ratings entries`);
  }

  // Fetch links
  const { data: links, error: linksError } = await supabase
    .from(categoryLinkMap[category])
    .select('*');

  if (linksError) {
    console.error(`${category} links fetch error:`, linksError);
    console.log('Continuing without link data');
  } else {
    console.log(`Successfully fetched ${links?.length || 0} link entries`);
  }

  // Merge places with ratings and links
  const placesWithData = places.map(place => {
    const placeId = getFieldValue(place, idField);
    
    // Find rating for this place by matching ID regardless of case
    const rating = ratings?.find(r => {
      const ratingId = getFieldValue(r, idField) || getFieldValue(r, idField.toLowerCase()) || getFieldValue(r, 'id') || getFieldValue(r, 'ID');
      return String(ratingId) === String(placeId);
    });

    // Find link for this place by matching ID regardless of case
    const link = links?.find(l => {
      const linkId = getFieldValue(l, idField) || getFieldValue(l, idField.toLowerCase()) || getFieldValue(l, 'id') || getFieldValue(l, 'ID');
      return String(linkId) === String(placeId);
    });
    
    // Debug log
    if (rating) {
      console.log(`Place ID ${placeId} has rating:`, rating);
    } else {
      console.log(`No rating found for place ID ${placeId}`);
    }
    
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
    let ratingValue = undefined;
    let visitorReviewCount = undefined;
    
    if (rating) {
      ratingValue = getFieldValue(rating, 'Rating') || getFieldValue(rating, 'rating');
      visitorReviewCount = getFieldValue(rating, 'visitor_review_count') || getFieldValue(rating, 'Visitor_Review_Count');
      
      // Debug log rating value
      console.log(`Extracted rating value: ${ratingValue}, review count: ${visitorReviewCount}`);
    }

    // Extract links, handling different field naming cases
    let naverLink = '';
    let instaLink = '';
    
    if (link) {
      naverLink = getFieldValue(link, 'link') || '';
      instaLink = getFieldValue(link, 'instagram') || '';
    }

    // Calculate basic weight (will be refined further)
    const weight = 0.5; // Default weight

    return {
      id: placeId.toString(),
      place_name: placeName,
      road_address: address,
      category: category,
      x: parseFloat(String(longitude)),
      y: parseFloat(String(latitude)),
      rating: parseRatingValue(ratingValue),
      visitor_review_count: visitorReviewCount ? parseInt(String(visitorReviewCount)) : undefined,
      naverLink: naverLink,
      instaLink: instaLink,
      weight: weight // Basic weight for now
    };
  });

  console.log(`Processed ${placesWithData.length} ${category} places with ratings and links`);
  
  return placesWithData;
}

// Helper function to determine ID field name
function determineIdFieldName(sampleObject: any): string {
  if (sampleObject['ID'] !== undefined) return 'ID';
  if (sampleObject['id'] !== undefined) return 'id';
  if (sampleObject['Id'] !== undefined) return 'Id';
  
  // Default to 'id' if nothing else found
  return 'id';
}
