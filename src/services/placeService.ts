
import { supabase } from '@/lib/supabaseClient';
import { TravelCategory } from '@/types/travel';
import { categoryTableMap, categoryRatingMap } from '@/lib/jeju/dbMapping';

// 필드명을 유연하게 찾는 함수
export function normalizeField(obj: any, field: string): any {
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
  if (!categoryTableMap[category] || !categoryRatingMap[category]) {
    console.error(`Invalid category: ${category}`);
    return { places: [], ratings: [], categories: [], links: [], reviews: [] };
  }

  const infoTable = categoryTableMap[category];
  const ratingTable = categoryRatingMap[category];
  const reviewTable = `${category}_review`;
  const linkTable = `${category}_link`;
  const categoryDetailTable = `${category}_categories`;

  try {
    // 1. 장소 기본 정보 가져오기
    let query = supabase.from(infoTable).select('*');
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

    // 2. id 리스트 만들기 (가공 없이 숫자형 그대로)
    const placeIds = places
      .map(p => normalizeField(p, 'id'))
      .filter(id => typeof id === 'number');

    // 3. 추가 데이터 병렬로 가져오기
    const [ratingsResult, linksResult, categoriesResult, reviewsResult] = await Promise.all([
      supabase.from(ratingTable).select('*').in('id', placeIds),
      supabase.from(linkTable).select('*').in('id', placeIds),
      supabase.from(categoryDetailTable).select('*').in('id', placeIds),
      supabase.from(reviewTable).select('*').in('id', placeIds),
    ]);

    const ratings = ratingsResult.data || [];
    const links = linksResult.data || [];
    const categories = categoriesResult.data || [];
    const reviews = reviewsResult.data || [];

    // 4. 최종 데이터 반환
    return {
      places,
      ratings,
      categories,
      links,
      reviews
    };
  } catch (error) {
    console.error('Error in fetchPlaceData:', error);
    return { places: [], ratings: [], categories: [], links: [], reviews: [] };
  }
}

// 데이터 처리 함수 추가
export function processPlaceData(info: any, ratings: any[], categories: any[], links: any[], reviews: any[]) {
  const id = normalizeField(info, 'id');
  
  // 추가 데이터 매칭
  const ratingInfo = ratings.find((r: any) => normalizeField(r, 'id') === id);
  const categoryInfo = categories.find((c: any) => normalizeField(c, 'id') === id);
  const linkInfo = links.find((l: any) => normalizeField(l, 'id') === id);
  const reviewInfo = reviews.find((rev: any) => normalizeField(rev, 'id') === id);
  
  // 데이터 가공
  const rating = ratingInfo ? parseFloat(String(normalizeField(ratingInfo, 'rating') || '0')) : 0;
  const reviewCount = ratingInfo ? parseInt(String(normalizeField(ratingInfo, 'visitor_review_count') || '0'), 10) : 0;
  const categoryDetail = categoryInfo ? 
    (normalizeField(categoryInfo, 'categories_details') || 
     normalizeField(categoryInfo, 'Categories_Details') || 
     normalizeField(categoryInfo, 'categories') || 
     normalizeField(categoryInfo, 'Categories') || '') : '';
  const naverLink = linkInfo ? (normalizeField(linkInfo, 'link') || '') : '';
  const instaLink = linkInfo ? (normalizeField(linkInfo, 'instagram') || '') : '';
  const weight = reviewInfo ? parseFloat(String(normalizeField(reviewInfo, 'visitor_norm') || '0')) : 0;
  
  return {
    rating,
    reviewCount,
    categoryDetail,
    naverLink,
    instaLink,
    weight
  };
}
