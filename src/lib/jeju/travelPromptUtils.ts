
import { supabase } from '@/lib/supabaseClient';
import { Place } from '@/types/supabase';

// Define the categories and mapping to table names as constants
export type TravelCategory = 'accommodation' | 'landmark' | 'restaurant' | 'cafe';

// Define result type for place search
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

// Define the structure for parsed prompt data
export interface ParsedPrompt {
  category: TravelCategory;
  locations: string[];
  rankedKeywords: string[];
  unrankedKeywords: string[];
  dateRange?: {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
  };
}

// Define category to DB table mapping as type-safe lookup objects
type TableMapping = {
  [key in TravelCategory]: string;
};

const categoryTableMap: TableMapping = {
  'accommodation': 'accomodation_information',
  'landmark': 'landmark_information',
  'restaurant': 'restaurant_information',
  'cafe': 'cafe_information',
};

const categoryRatingMap: TableMapping = {
  'accommodation': 'accomodation_rating',
  'landmark': 'landmark_rating',
  'restaurant': 'restaurant_rating',
  'cafe': 'cafe_rating',
};

/**
 * Converts a PlaceResult to the Place format used by the application
 */
export function convertToPlace(pr: PlaceResult): Place {
  return {
    id: pr.id,
    name: pr.place_name,
    address: pr.road_address,
    category: pr.category,
    x: pr.x,
    y: pr.y,
    naverLink: '',
    instaLink: '',
    rating: pr.rating,
    reviewCount: pr.visitor_review_count,
  };
}

/**
 * Parse user input prompt into structured data
 */
export function parsePrompt(prompt: string): ParsedPrompt | null {
  try {
    // Extract date range if present
    const dateRangeMatch = prompt.match(/일정\[([\d\.]+),([\d:]+),([\d\.]+),([\d:]+)\]/);
    const dateRange = dateRangeMatch ? {
      startDate: dateRangeMatch[1],
      startTime: dateRangeMatch[2],
      endDate: dateRangeMatch[3],
      endTime: dateRangeMatch[4]
    } : undefined;

    // Extract locations
    const locationMatch = prompt.match(/지역\[([^\]]+)\]/);
    const locations = locationMatch ? locationMatch[1].split(',').map(l => l.trim()) : [];

    // Extract category and keywords
    const categoryMatch = prompt.match(/(숙소|관광지|음식점|카페)\[([^\]]+)\]/);
    if (!categoryMatch) {
      console.error("No valid category found in prompt");
      return null;
    }

    // Map Korean category names to English
    const categoryMap: { [key: string]: TravelCategory } = {
      '숙소': 'accommodation',
      '관광지': 'landmark',
      '음식점': 'restaurant',
      '카페': 'cafe',
    };
    
    const category = categoryMap[categoryMatch[1]];
    
    // Parse keywords
    const keywordsPart = categoryMatch[2];
    
    // Extract ranked keywords (inside curly braces)
    const rankedMatch = keywordsPart.match(/\{([^}]+)\}/);
    const rankedKeywords = rankedMatch 
      ? rankedMatch[1].split(',').map(k => k.trim())
      : [];

    // Extract unranked keywords (outside curly braces)
    let unrankedKeywordsPart = keywordsPart.replace(/\{[^}]+\}/, '').trim();
    if (unrankedKeywordsPart.startsWith(',')) {
      unrankedKeywordsPart = unrankedKeywordsPart.substring(1);
    }
    
    const unrankedKeywords = unrankedKeywordsPart
      ? unrankedKeywordsPart.split(',').map(k => k.trim()).filter(Boolean)
      : [];

    return {
      category,
      locations,
      rankedKeywords,
      unrankedKeywords,
      dateRange,
    };
  } catch (error) {
    console.error("Error parsing prompt:", error);
    return null;
  }
}

/**
 * Normalize field name to handle case insensitivity
 * This function helps deal with ID vs id inconsistencies in the database
 */
function normalizeField(obj: any, field: string): any {
  // Check for exact match first
  if (obj[field] !== undefined) {
    return obj[field];
  }
  
  // If not found, try case-insensitive match
  const lowerField = field.toLowerCase();
  for (const key in obj) {
    if (key.toLowerCase() === lowerField) {
      return obj[key];
    }
  }
  
  // Not found
  return undefined;
}

/**
 * Fetch and rank places based on category, location and keywords
 */
export async function fetchWeightedResults(
  category: TravelCategory,
  locations: string[],
  keywords: string[]
): Promise<PlaceResult[]> {
  // Get the appropriate table names
  const infoTable = categoryTableMap[category];
  const ratingTable = categoryRatingMap[category];
  
  // Create a type guard to ensure we don't access invalid tables
  if (!infoTable || !ratingTable) {
    console.error(`Invalid category: ${category}`);
    return [];
  }
  
  try {
    // Step 1: Query the information table with location filter if provided
    let query = supabase
      .from(infoTable as any)
      .select('*'); // Select all fields to handle ID/id differences
    
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

    // Extract IDs, handling both ID and id field names
    const placeIds = places.map(p => normalizeField(p, 'ID') || normalizeField(p, 'id'));
    
    // Step 2: Fetch ratings for these places
    const { data: ratings, error: ratingsError } = await supabase
      .from(ratingTable as any)
      .select('*')
      .in(places[0] && normalizeField(places[0], 'ID') !== undefined ? 'ID' : 'id', placeIds);
    
    if (ratingsError) {
      console.error('Ratings fetch error:', ratingsError);
      return [];
    }

    // Step 3: Combine places with their ratings, apply keywords weighting in a simplified way
    const placesWithRatings = places.map(place => {
      const placeId = normalizeField(place, 'ID') || normalizeField(place, 'id');
      
      // Find matching rating by ID/id
      const rating = ratings?.find(r => {
        const ratingId = normalizeField(r, 'ID') || normalizeField(r, 'id');
        return ratingId === placeId;
      });
      
      // Extract place name with case insensitivity
      const placeName = normalizeField(place, 'Place_Name') || 
                       normalizeField(place, 'place_name') || 
                       normalizeField(place, 'Place_name');
      
      // Extract road address with case insensitivity
      const roadAddress = normalizeField(place, 'Road_Address') || 
                         normalizeField(place, 'road_address') || 
                         normalizeField(place, 'Road_address');
      
      // Extract coordinates with case insensitivity
      const longitude = normalizeField(place, 'Longitude') || normalizeField(place, 'longitude') || 0;
      const latitude = normalizeField(place, 'Latitude') || normalizeField(place, 'latitude') || 0;
      
      // Extract rating values with case insensitivity
      const ratingValue = rating ? normalizeField(rating, 'Rating') || normalizeField(rating, 'rating') || 0 : 0;
      const reviewCount = rating ? normalizeField(rating, 'visitor_review_count') || 0 : 0;
      
      // Simple weighting by rating and review count
      let weight = ratingValue * Math.log(1 + reviewCount);
      
      return {
        id: placeId.toString(),
        place_name: placeName,
        road_address: roadAddress,
        category: category,
        x: longitude,
        y: latitude,
        rating: ratingValue,
        visitor_review_count: reviewCount,
        weight
      };
    });

    // Sort by the calculated weight
    const sortedPlaces = placesWithRatings.sort((a, b) => b.weight - a.weight);
    
    // Return all places but without the temporary weight property
    return sortedPlaces.map(place => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { weight, ...rest } = place;
      return rest;
    });
  } catch (error) {
    console.error('Error in fetchWeightedResults:', error);
    return [];
  }
}
