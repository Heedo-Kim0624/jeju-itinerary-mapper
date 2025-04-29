
import { Place } from '@/types/supabase';
import { supabase } from '@/lib/supabaseClient';
import { normalizeField } from '@/lib/jeju/placeNormalizer';

// 카테고리 타입 정의
type CategoryType = '숙소' | '관광지' | '음식점' | '카페' | 'accommodation' | 'landmark' | 'restaurant' | 'cafe';

// 카테고리를 영문 prefix로 변환
function mapCategoryToPrefix(category: CategoryType): string {
  const mapping: Record<CategoryType, string> = {
    '숙소': 'accommodation',
    '관광지': 'landmark',
    '음식점': 'restaurant',
    '카페': 'cafe',
    'accommodation': 'accommodation',
    'landmark': 'landmark',
    'restaurant': 'restaurant',
    'cafe': 'cafe'
  };
  return mapping[category];
}

/**
 * 장소 상세 정보 조회
 */
export async function fetchPlaceDetails(category: CategoryType, id: number | string): Promise<Place | null> {
  console.log(`🔍 [fetchPlaceDetails] 시작 - category: ${category}, id: ${id}`);
  
  try {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId)) {
      console.error('❌ ID가 숫자가 아닙니다:', id);
      return null;
    }

    const prefix = mapCategoryToPrefix(category);

    // 데이터 가져오기
    const [infoResult, ratingResult, linkResult, categoryResult, reviewResult] = await Promise.all([
      supabase.from(`${prefix}_information`).select('*').eq('id', numericId).maybeSingle(),
      supabase.from(`${prefix}_rating`).select('*').eq('id', numericId).maybeSingle(),
      supabase.from(`${prefix}_link`).select('*').eq('id', numericId).maybeSingle(),
      supabase.from(`${prefix}_categories`).select('*').eq('id', numericId).maybeSingle(),
      supabase.from(`${prefix}_review`).select('*').eq('id', numericId).maybeSingle(),
    ]);

    if (infoResult.error || !infoResult.data) {
      console.error('❌ 기본 정보 없음:', infoResult.error?.message || '정보 없음');
      return null;
    }

    // .data 속성 추출하여 변수에 저장
    const info = infoResult.data;
    const rating = ratingResult.data || null;
    const link = linkResult.data || null;
    const categories = categoryResult.data || null;
    const review = reviewResult.data || null;

    console.log('🧩 [fetchPlaceDetails] 쿼리 결과:', {
      info: JSON.stringify(info).substring(0, 100) + '...',
      rating: rating ? JSON.stringify(rating).substring(0, 100) + '...' : 'null',
      link: link ? JSON.stringify(link).substring(0, 100) + '...' : 'null',
      categories: categories ? JSON.stringify(categories).substring(0, 100) + '...' : 'null',
      review: review ? JSON.stringify(review).substring(0, 100) + '...' : 'null'
    });

    // 좌표 정보 추출
    const longitude = normalizeField(info, ['longitude', 'Longitude', 'x', 'X']) || 0;
    const latitude = normalizeField(info, ['latitude', 'Latitude', 'y', 'Y']) || 0;

    // 장소 이름 추출
    const name = normalizeField(info, ['place_name', 'Place_Name', 'name', 'Name']) || '';

    // 주소 추출
    const roadAddress = normalizeField(info, ['road_address', 'Road_Address', 'roadAddress', 'RoadAddress']) || '';
    const lotAddress = normalizeField(info, ['lot_address', 'Lot_Address', 'lotAddress', 'LotAddress']) || '';
    const address = roadAddress || lotAddress || '';

    // 평점 정보 추출
    const ratingValue = rating ? normalizeField(rating, ['rating', 'Rating', 'rate']) : 0;
    const reviewCount = rating ? normalizeField(rating, ['visitor_review_count', 'Visitor_Review_Count', 'review_count', 'Review_Count']) : 0;
    const parsedRating = typeof ratingValue === 'number' ? ratingValue : parseFloat(String(ratingValue || 0));
    const parsedReviewCount = typeof reviewCount === 'number' ? reviewCount : parseInt(String(reviewCount || 0), 10);

    // 카테고리 상세 정보 추출
    const categoryDetail = categories ? 
      normalizeField(categories, ['categories_details', 'Categories_Details', 'category_details', 'Category_Details']) || '' : '';

    // 링크 정보 추출
    const naverLink = link ? normalizeField(link, ['link', 'Link', 'naver_link', 'Naver_Link']) || '' : '';
    const instaLink = link ? normalizeField(link, ['instagram', 'Instagram', 'insta_link', 'Insta_Link']) || '' : '';

    // 가중치 정보 추출
    const weight = review ? normalizeField(review, ['visitor_norm', 'Visitor_Norm', 'weight', 'Weight']) || 0 : 0;
    const parsedWeight = typeof weight === 'number' ? weight : parseFloat(String(weight || 0));

    const place: Place = {
      id: id,
      name: name,
      address: address,
      category: prefix,
      categoryDetail: categoryDetail,
      rating: parsedRating,
      reviewCount: parsedReviewCount,
      weight: parsedWeight,
      naverLink: naverLink,
      instaLink: instaLink,
      x: typeof longitude === 'number' ? longitude : parseFloat(String(longitude)),
      y: typeof latitude === 'number' ? latitude : parseFloat(String(latitude)),
      operatingHours: '', // 운영시간 정보는 현재 Supabase에 없음
      raw: {
        info,
        rating,
        link,
        categories,
        review
      }
    };

    console.log('✅ [fetchPlaceDetails] 매핑 결과:', {
      id: place.id,
      name: place.name,
      address: place.address,
      rating: place.rating,
      reviewCount: place.reviewCount,
      naverLink: place.naverLink ? '있음' : '없음',
      instaLink: place.instaLink ? '있음' : '없음',
      categoryDetail: place.categoryDetail
    });

    return place;
  } catch (error) {
    console.error('❌ [fetchPlaceDetails] 에러:', error);
    return null;
  }
}
