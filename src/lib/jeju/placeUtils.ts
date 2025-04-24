
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
    weight: pr.weight,  // 가중치 추가
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
    console.log(`fetchWeightedResults 시작: 카테고리=${category}, 장소=${locations.join(',')}, 키워드=${keywords.join(',')}`);
    
    const { places, ratings, categories, links, reviews } = await fetchPlaceData(category, locations);
    
    console.log(`서버에서 데이터 조회 결과: 장소=${places?.length || 0}, 평점=${ratings?.length || 0}, 리뷰=${reviews?.length || 0}`);
    
    if (!places || places.length === 0) {
      return [];
    }

    // 순위가 있는 키워드와 일반 키워드 분리
    const rankedMatch = keywords.join(',').match(/\{([^}]+)\}/);
    const rankedKeywords = rankedMatch ? rankedMatch[1].split(',').map(k => k.trim()) : [];
    const unrankedKeywords = keywords
      .join(',')
      .replace(/\{[^}]+\}/, '')
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    console.log(`키워드 분리: 순위=${rankedKeywords.join(',')}, 일반=${unrankedKeywords.join(',')}`);
    
    // 가중치 계산
    const keywordWeights = calculateWeights(rankedKeywords, unrankedKeywords);
    console.log('키워드 가중치:', keywordWeights);

    const placesWithScores = places.map(place => {
      const placeId = normalizeField(place, 'ID') || normalizeField(place, 'id');
      
      // 해당 장소에 대한 리뷰 데이터 찾기
      const review = reviews?.find(r => {
        const reviewId = normalizeField(r, 'ID') || normalizeField(r, 'id');
        return reviewId === placeId;
      });
      
      // 디버깅 로그
      if (review) {
        console.log(`장소 ${placeId}의 리뷰 데이터:`, review);
      } else {
        console.log(`장소 ${placeId}에 리뷰 데이터 없음`);
      }

      const rating = ratings?.find(r => {
        const ratingId = normalizeField(r, 'ID') || normalizeField(r, 'id');
        return ratingId === placeId;
      });

      // 점수 계산
      const reviewNorm = review?.visitor_norm || 1;
      const score = calculatePlaceScore(review || {}, keywordWeights, reviewNorm);
      
      console.log(`장소 ${placeId} 점수 계산: ${score} (norm=${reviewNorm})`);

      return {
        ...place,
        score,
        rating,
        review
      };
    });

    // 점수 기준으로 정렬
    const sortedPlaces = placesWithScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 20); // 상위 20개만 반환

    console.log(`정렬된 장소 개수: ${sortedPlaces.length}`);

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

      // 최종 장소 객체 생성
      const result: PlaceResult = {
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
        weight: place.score // 가중치 점수 추가
      };

      console.log(`장소 ${placeId} 최종 결과:`, {
        name: result.place_name,
        weight: result.weight
      });

      return result;
    });

  } catch (error) {
    console.error('Error in fetchWeightedResults:', error);
    return [];
  }
}
