
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

  console.log(`🔍 [Supabase] 조회 시작: ${category} 카테고리`);
  console.log(`📊 [Supabase] 테이블 정보:`, { 
    정보: infoTable, 
    평점: ratingTable, 
    리뷰: reviewTable,
    링크: linkTable,
    분류: categoryDetailTable
  });

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
      console.log(`❌ [Supabase] ${category}: 검색 조건에 맞는 장소가 없습니다`);
      return { places: [], ratings: [], categories: [], links: [], reviews: [] };
    }

    console.log(`✅ [Supabase] ${category} 정보 로드 완료: ${places.length}개 장소`);
    console.log(`📝 [Supabase] ${category} 샘플 데이터:`, places[0]);

    // 2. id 리스트 만들기 (가공 없이 숫자형 그대로)
    const placeIds = places
      .map(p => normalizeField(p, 'id'))
      .filter(id => typeof id === 'number');
    
    console.log(`🔢 [Supabase] ${category} ID 목록: ${placeIds.length}개`);

    // 3. 추가 데이터 병렬로 가져오기
    console.log(`🔄 [Supabase] ${category} 관련 데이터 로딩 중...`);
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

    console.log(`✅ [Supabase] ${category} 관련 데이터 로드 완료:`, {
      평점: `${ratings.length}개`,
      링크: `${links.length}개`,
      분류: `${categories.length}개`,
      리뷰: `${reviews.length}개`
    });

    if (ratings.length > 0) console.log(`📊 [Supabase] ${category} 평점 샘플:`, ratings[0]);
    if (links.length > 0) console.log(`🔗 [Supabase] ${category} 링크 샘플:`, links[0]);
    if (categories.length > 0) console.log(`🏷️ [Supabase] ${category} 분류 샘플:`, categories[0]);
    if (reviews.length > 0) console.log(`📝 [Supabase] ${category} 리뷰 샘플:`, reviews[0]);

    // 4. 최종 데이터 반환
    return {
      places,
      ratings,
      categories,
      links,
      reviews
    };
  } catch (error) {
    console.error(`❌ [Supabase] ${category} 데이터 로딩 오류:`, error);
    return { places: [], ratings: [], categories: [], links: [], reviews: [] };
  }
}

// 데이터 처리 함수 추가
export function processPlaceData(info: any, ratings: any[], categories: any[], links: any[], reviews: any[]) {
  const id = parseInt(String(normalizeField(info, 'id')));

  const ratingInfo = ratings.find((r: any) => parseInt(String(normalizeField(r, 'id'))) === id);
  const categoryInfo = categories.find((c: any) => parseInt(String(normalizeField(c, 'id'))) === id);
  const linkInfo = links.find((l: any) => parseInt(String(normalizeField(l, 'id'))) === id);
  const reviewInfo = reviews.find((rev: any) => parseInt(String(normalizeField(rev, 'id'))) === id);

  const rating = ratingInfo ? parseFloat(String(normalizeField(ratingInfo, 'rating') || '0')) : 0;
  const reviewCount = ratingInfo ? parseInt(String(normalizeField(ratingInfo, 'visitor_review_count') || '0'), 10) : 0;
  const categoryDetail = categoryInfo ?
    (normalizeField(categoryInfo, 'categories_details') || '') : '';
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
