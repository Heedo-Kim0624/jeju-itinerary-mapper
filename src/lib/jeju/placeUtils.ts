
import { Place } from '@/types/supabase';
import { TravelCategory } from '@/types/travel';
import { fetchPlaceData } from '@/services/placeService';
import { calculateWeights, calculatePlaceScore } from './weightCalculator';

export interface PlaceResult {
  id: string;
  place_name: string;
  road_address: string;
  category: string;
  categoryDetail?: string;
  x: number;
  y: number;
  rating?: number;
  visitor_review_count?: number;
  naverLink?: string;
  instaLink?: string;
  weight?: number;
}

export function convertToPlace(pr: PlaceResult): Place {
  return {
    id: pr.id,
    name: pr.place_name,
    address: pr.road_address,
    category: pr.category,
    categoryDetail: pr.categoryDetail,
    x: pr.x,
    y: pr.y,
    naverLink: pr.naverLink || '',
    instaLink: pr.instaLink || '',
    rating: pr.rating,
    reviewCount: pr.visitor_review_count,
  };
}

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

export async function fetchWeightedResults(
  category: TravelCategory,
  locations: string[],
  keywords: string[]
): Promise<PlaceResult[]> {
  try {
    const { places, ratings, categories, links, reviews } = await fetchPlaceData(category, locations);
    
    if (!places || places.length === 0) {
      return [];
    }

    const rankedMatch = keywords.join(',').match(/\{([^}]+)\}/);
    const rankedKeywords = rankedMatch ? rankedMatch[1].split(',').map(k => k.trim()) : [];
    const unrankedKeywords = keywords
      .join(',')
      .replace(/\{[^}]+\}/, '')
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    const keywordWeights = calculateWeights(rankedKeywords, unrankedKeywords);

    const placesWithScores = places.map(place => {
      const placeId = normalizeField(place, 'ID') || normalizeField(place, 'id');
      
      const review = reviews?.find(r => {
        const reviewId = normalizeField(r, 'ID') || normalizeField(r, 'id');
        return reviewId === placeId;
      });

      const rating = ratings?.find(r => {
        const ratingId = normalizeField(r, 'ID') || normalizeField(r, 'id');
        return ratingId === placeId;
      });

      const reviewNorm = review?.visitor_norm || 1;
      const score = calculatePlaceScore(review || {}, keywordWeights, reviewNorm);

      return {
        ...place,
        score,
        rating,
        review
      };
    });

    const sortedPlaces = placesWithScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    return sortedPlaces.map(place => {
      const placeId = normalizeField(place, 'ID') || normalizeField(place, 'id');
      
      const link = links?.find(l => {
        const linkId = normalizeField(l, 'ID') || normalizeField(l, 'id');
        return linkId === placeId;
      });

      const placeName = normalizeField(place, 'Place_Name') || 
                       normalizeField(place, 'place_name');
      
      const roadAddress = normalizeField(place, 'Road_Address') || 
                         normalizeField(place, 'road_address');
      
      const longitude = parseFloat(normalizeField(place, 'Longitude') || normalizeField(place, 'longitude') || "0");
      const latitude = parseFloat(normalizeField(place, 'Latitude') || normalizeField(place, 'latitude') || "0");

      const rating = place.rating ? {
        rating: parseFloat(normalizeField(place.rating, 'rating') || "0"),
        visitorReviewCount: parseInt(normalizeField(place.rating, 'visitor_review_count') || "0")
      } : null;

      return {
        id: placeId.toString(),
        place_name: placeName,
        road_address: roadAddress,
        category,
        x: longitude,
        y: latitude,
        rating: rating?.rating || 0,
        visitor_review_count: rating?.visitorReviewCount || 0,
        naverLink: link?.link || "",
        instaLink: link?.instagram || "",
        weight: place.score
      };
    });

  } catch (error) {
    console.error('Error in fetchWeightedResults:', error);
    return [];
  }
}
