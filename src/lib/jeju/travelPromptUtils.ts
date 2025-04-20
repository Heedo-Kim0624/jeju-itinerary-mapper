
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
      .select('ID, Place_Name, Road_Address, location, Longitude, Latitude');
    
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

    // Step 2: Fetch ratings for these places
    const placeIds = places.map(p => p.ID);
    
    const { data: ratings, error: ratingsError } = await supabase
      .from(ratingTable as any)
      .select('ID, Rating, visitor_review_count')
      .in('ID', placeIds);
    
    if (ratingsError) {
      console.error('Ratings fetch error:', ratingsError);
      return [];
    }

    // Step 3: Combine places with their ratings, apply keywords weighting in a simplified way
    const placesWithRatings = places.map(place => {
      const rating = ratings?.find(r => r.ID === place.ID);
      
      // Simple weighting by rating and review count
      // Actual keyword weighting would be more complex
      let weight = 0;
      if (rating) {
        weight = (rating.Rating || 0) * Math.log(1 + (rating.visitor_review_count || 0));
      }
      
      return {
        id: place.ID.toString(),
        place_name: place.Place_Name,
        road_address: place.Road_Address,
        category: category,
        x: place.Longitude ?? 0,
        y: place.Latitude ?? 0,
        rating: rating?.Rating ?? 0,
        visitor_review_count: rating?.visitor_review_count ?? 0,
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
